from .views import GoogleRegisterView
from .views import UserRegisterView
from django.urls import path, include
from .views import GoogleAuthenticationView, CustomTokenObtainPairView, EmployeeProfileViewSet
from rest_framework_simplejwt.views import (
    
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter


# urlpatterns = [
    
#     path('api/token/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
# ]

# 1. Initialize the DRF Router for standardized CRUD viewsets
router = DefaultRouter()
router.register(r'employees', EmployeeProfileViewSet, basename='employee')

# 2. Compile URL patterns
urlpatterns = [
    # Traditional API Endpoint Routes
    path('auth/google/', GoogleAuthenticationView.as_view(), name='auth_google'),
    path('auth/register/google/', GoogleRegisterView.as_view(), name='auth_register_google'), # 👈 Added this path!
    path('auth/register/', UserRegisterView.as_view(), name='auth_register'), 
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Include all the auto-generated CRUD routes from our router
    path('', include(router.urls)),
]