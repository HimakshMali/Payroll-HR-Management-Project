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
                {"error": "The provided Google token is invalid or expired.", "status": False}, 
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
        refresh = RefreshToken.for_user(user)
        
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


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Traditional email/password login route using custom claims.
    """
    serializer_class = CustomTokenObtainPairSerializer


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    Unified CRUD interface for Employee Profiles.
    Leverages django-rls at the database tier to automate multi-tenant filtering.
    """
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        PostgreSQL Row-Level Security automatically captures this query
        and isolates records belonging to the logged-in user's tenant.
        """
        return EmployeeProfile.objects.all().select_related('user')

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