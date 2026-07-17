from rest_framework.views import APIView
from django.shortcuts import render


from django.conf import settings
    
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from .models import CustomUser
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
# Create your views here.



User = get_user_model()

class GoogleAuthenticationView(APIView):
    # This route must remain public so users without access keys can reach it
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # 1. Grab and validate the presence of the incoming Google token
        token = request.data.get("token")
        if not token:
            return Response(
                {"error": "Google OAuth authentication token not provided.", "status": False}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 2. Fire the outbound security request validation directly to Google's backend infrastructure
            id_info = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            # 3. Extract core identity fields out of the verified payload structure
            google_sub_id = id_info['sub']  # The unchangeable unique identifier
            email = id_info['email']
            first_name = id_info.get('given_name', '')
            last_name = id_info.get('family_name', '')

        except ValueError:
            return Response(
                {"error": "The provided Google token is invalid or expired.", "status": False}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. FIRST LOOKUP PAIR: Check if this explicit Google account identity profile already exists
        user = User.objects.filter(google_id=google_sub_id).first()

        if not user:
            # 5. SECOND LOOKUP PAIR: If google_id isn't bound yet, check if the email exists
            user = User.objects.filter(email=email).first()
            
            if user:
                # Account link workflow: User existed via email, link their Google login profile now!
                user.google_id = google_sub_id
                if user.registration_method == 'email':
                    # Allow them to use both entry paths going forward
                    pass 
                user.save()
            else:
                # 6. MSME GATEKEEPER RULE: This is a completely unknown user.
                # In your system, an employee cannot self-register out of nowhere.
                # The shop owner must invite/onboard them first via the dashboard.
                return Response(
                    {"error": "Access Denied. Your email has not been provisioned by an HR Administrator.", "status": False},
                    status=status.HTTP_403_FORBIDDEN
                )

        # 7. MULTI-TENANCY SANITY CHECK: Double check that they have an active corporate employment profile
        # This prevents detached superusers or broken models from logging into standard tenant endpoints.
        if not hasattr(user, 'employeeprofile'):
            return Response(
                {"error": "Authentication complete, but no active employment record was found for this profile.", "status": False},
                status=status.HTTP_403_FORBIDDEN
            )

        # 8. TOKEN LIFECYCLE GENERATION
        # RefreshToken.for_user pulls structural data from the model instance.
        # This will trigger your custom serializer loop and automatically stamp tenant_id, role, and email
        # right into the token payload for your React dashboard and django-rls context variables!
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