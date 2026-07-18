from dataclasses import fields
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import EmployeeProfile, Organisation

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'registration_method']
        read_only_fields = ['id', 'registration_method']

class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'tenant', 'user', 'role', 'phone_number', 'address', 
            'date_of_joining', 'pan_number', 'bank_account_number', 
            'base_salary', 'ifsc_code'
        ]

        read_only_fields = ['id', 'tenant']
        #  the function below perevents passing tenant_id manually in the json pyload from frontend 
        # Because the tenant field is missing from the raw incoming data, 
        # Django needs a way to figure out which company this new worker belongs to before saving the row.
        def create(self, validated_data):
            request = self.context.get('request')
            if request and hasattr(request.user, 'employeeprofile'):
                validated_data['tenant'] = request.user.employeeprofile.tenant

            return super().create(validated_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(User)
        token['email'] = user.email

        if hasattr(user, 'employeeprofile'):
            profile = user.employeeprofile
            token['tenant_id'] = str(profile.tenant.id)
            token['role'] = profile.role
            token['is_hr'] = (profile.role == 'OWNER')

        else:
            token['tenant_id'] = None
            token['role'] = None
            token['is_hr'] = False

        return token

class GoogleAuthInputSerializer(serializers.Serializer):
    """
    Validates that incoming Google OAuth token payloads are structurally correct.
    """
    token = serializers.CharField(required=True, help_text="Google OAuth2 ID Token string.")
            
   