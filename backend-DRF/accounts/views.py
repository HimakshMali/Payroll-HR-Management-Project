
from .models import Organisation
from .serializers import UserRegisterSerializer
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .models import EmployeeProfile
from .serializers import EmployeeProfileSerializer, CustomTokenObtainPairSerializer


import urllib.request
import json

from .permissions import IsOrganizationOwner
User = get_user_model()

class GoogleAuthenticationView(APIView):
    """
    Handles secure, decoupled Google OAuth2 identity verification.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            return Response(
                {"error": "Google OAuth authentication token not provided.", "status": False}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        import urllib.request
        import json

        google_sub_id = None
        email = None
        first_name = ""
        last_name = ""

        # 1. Attempt to verify token as an OAuth2 Access Token by calling Google's userinfo API
        try:
            req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                user_info = json.loads(response.read().decode('utf-8'))
                google_sub_id = user_info.get('sub')
                email = user_info.get('email')
                first_name = user_info.get('given_name', '')
                last_name = user_info.get('family_name', '')
        except Exception:
            pass

        # 2. Fallback: attempt to verify token as an OIDC ID Token
        if not google_sub_id or not email:
            try:
                id_info = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request(), 
                    settings.GOOGLE_OAUTH_CLIENT_ID
                )
                google_sub_id = id_info['sub']
                email = id_info['email']
                first_name = id_info.get('given_name', '')
                last_name = id_info.get('family_name', '')
            except ValueError:
                return Response(
                    {"error": "The provided Google token     is invalid or expired.", "status": False}, 
                    status=status.HTTP_400_BAD_REQUEST
                )


        # Lookup by unique Google subject ID
        user = User.objects.filter(google_id=google_sub_id).first()

        if not user:
            # Fallback lookup by email to link account
            user = User.objects.filter(email=email).first()
            
            if user:
                user.google_id = google_sub_id
                user.save()
            else:
                # MSME Gatekeeper protection
                return Response(
                    {"error": "Access Denied. Your email has not been provisioned by an HR Administrator.", "status": False},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Multi-tenancy check
        if not hasattr(user, 'employeeprofile'):
            return Response(
                {"error": "Authentication complete, but no active employment record was found for this profile.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens (Triggers our custom serializer context injection)
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        
        return Response(
            {
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "status": True,
                "user": {
                    "email": user.email,
                    "id": user.id,
                }
            }, 
            status=status.HTTP_200_OK
        )

# Add this to views.py
class GoogleRegisterView(APIView):
    """
    Allows any external user to register a brand new Organisation 
    and Owner account simultaneously using a Google OAuth token.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        if not token:
            return Response(
                {"error": "Google token required.", "status": False}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        google_sub_id = None
        email = None
        first_name = "Google"
        last_name = "User"

        # 1. Attempt to verify token as an OAuth2 Access Token by calling Google's userinfo API
        try:
            req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                user_info = json.loads(response.read().decode('utf-8'))
                google_sub_id = user_info.get('sub')
                email = user_info.get('email')
                first_name = user_info.get('given_name', 'Google')
                last_name = user_info.get('family_name', 'User')
        except Exception:
            pass

        # 2. Fallback: attempt to verify token as an OIDC ID Token
        if not google_sub_id or not email:
            try:
                id_info = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request(), 
                    settings.GOOGLE_OAUTH_CLIENT_ID
                )
                email = id_info['email']
                google_sub_id = id_info['sub']
                first_name = id_info.get('given_name', 'Google')
                last_name = id_info.get('family_name', 'User')
            except ValueError:
                return Response({"error": "Invalid Google OAuth token signature.", "status": False}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": str(e), "status": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Registration Logic
        try:
            # Check if the user already exists to prevent duplicate rows
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "An account with this email already exists. Please login instead.", "status": False},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Execution Safety Wrap: Create the complete organization structure
            from django.db import transaction
            from .models import Organisation, EmployeeProfile

            with transaction.atomic():
                # Create the Tenant organization row
                new_org = Organisation.objects.create(
                    name=f"{first_name}'s Organisation"
                )

                # Create the core authenticated User account    
                new_user = User.objects.create_user(
                    email=email,
                    password=None, # Google accounts don't use raw database passwords
                    registration_method='google',
                    google_id=google_sub_id
                )
                
                # 🧠 CRITICAL FIX: Explicitly save the user object to the database first
                # This guarantees that a real database ID exists before EmployeeProfile runs its validation checks!
                new_user.save()

                # Create the EmployeeProfile ledger anchoring them as the OWNER of this tenant
                EmployeeProfile.objects.create(
                    tenant=new_org,
                    user=new_user, # Passing the validated, saved user instance object
                    role='OWNER',
                    phone_number=0,
                    address="Please update address details"
                )

            return Response(
                {"message": "Organisation and Owner account registered successfully!", "status": True},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({"error": str(e), "status": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Traditional email/password login route using custom claims.
    """
    serializer_class = CustomTokenObtainPairSerializer

class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    Unified CRUD interface for Employee Profiles.
    Enforces absolute application-level tenant isolation as the primary security layer,
    backed up by database-tier RLS.
    """
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        """
        HARD-LOCKED TENANT ISOLATION: Explicitly filters the queryset at the Django ORM 
        layer using the authenticated operator's tenant relationship context.
        """
        user = self.request.user
        
        # Defensive check: If the user doesn't have an employment profile, return nothing.
        if not hasattr(user, 'employeeprofile'):
            return EmployeeProfile.objects.none()
            
        # Extract the exact tenant UUID/ID of the logged-in operator
        active_tenant = user.employeeprofile.tenant

        # Force all SQL reads to include a strict 'WHERE tenant_id = ...' constraint
        return EmployeeProfile.objects.filter(tenant=active_tenant).select_related('user')

    def destroy(self, request, *args, **kwargs):
        """
        Blocks accidental deletion of administrative Owners.
        """
        profile = self.get_object()
        if profile.role == 'OWNER':
            return Response(
                {"error": "The primary organization Owner profile cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

class UserRegisterView(APIView):
    """
    Handles initialization of new core user authentication credentials.
    """
    permission_classes = [AllowAny] # Anyone can sign up

    def post(self, request, *args, **kwargs):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User account created successfully.", "status": True},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)