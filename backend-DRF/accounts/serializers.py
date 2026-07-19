
from rest_framework import status
from google.auth.transport import Response
from django.core.exceptions import ValidationError
from dataclasses import fields
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import EmployeeProfile, Organisation,OrganisationProfile


from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'registration_method']
        read_only_fields = ['id', 'registration_method']

class OrganisationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganisationProfile
        fields = ['id', 'org_name', 'org_desc', 'org_created_at', 'org_updated_at', 'org_phone_number', 'org_address', 'org_date_of_joining', 'org_pan_number', 'org_bank_account_number', 'org_base_salary', 'org_ifsc_code']
        read_only_fields = ['id', 'org_created_at', 'organisation']


class EmployeeCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[])
    # We keep all EmployeeProfile fields, but mark `tenant` and `user` as read-only.
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'tenant', 'user', 'role', 'phone_number', 'address',
            'date_of_joining', 'pan_number', 'aadhaar_number', 'bank_account_number',
            'base_salary', 'ifsc_code', 'email', 'password'
        ]
        read_only_fields = ['id', 'tenant', 'user']  # tenant will be set from request

    # serializers.py – inside EmployeeCreateSerializer
    def validate(self, attrs):
        # Force the role to be 'EMPLOYEE' – ignore whatever the frontend sends
        attrs['role'] = 'EMPLOYEE'
        # Optional: if you want to be strict, raise an error if role != 'EMPLOYEE'
        # if attrs.get('role') != 'EMPLOYEE':
        #     raise serializers.ValidationError("Only 'EMPLOYEE' role can be created via this endpoint.")
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        from django.db import transaction
        # Extract user fields
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        with transaction.atomic():
            # Create User (using your CustomUserManager)
            user = User.objects.create_user(
                email=email,
                password=password,
                registration_method='email'
            )

            # Set tenant from request context
            request = self.context.get('request')
            tenant = request.user.employeeprofile.tenant
            validated_data['tenant'] = tenant
            validated_data['user'] = user

            # Create EmployeeProfile
            return super().create(validated_data)


class EmployeeProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'tenant', 'user', 'role', 'phone_number', 'address', 
            'date_of_joining', 'pan_number', 'bank_account_number', 
            'base_salary', 'ifsc_code'
        ]

        read_only_fields = ['id', 'tenant','user']

    def validate(self, attrs):
        request = self.context.get('request')

        if not request or not hasattr(request.user, 'employeeprofile'):
            raise ValueError("User is not authenticated or does not have an employee profile.")
        
        active_operator = request.user.employeeprofile

        if self.instance:
            # If the logged-in user is not an OWNER, completely halt execution
            if active_operator.role != 'OWNER':
                raise serializers.ValidationError("Access Denied: Employees do not possess edit permissions.")

        return attrs

    #  the function below prevents passing tenant_id manually in the json payload from frontend 
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
        token = super().get_token(user)
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
            

# Add this to serializers.py

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'password']

    def create(self, validated_data):
        from django.db import transaction
        from .models import Organisation, EmployeeProfile

        with transaction.atomic():
            # We leverage your CustomUserManager's create_user method to handle password hashing automatically
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                registration_method='email'
            )
            user.save()

            # Create the Tenant organization row
            new_org = Organisation.objects.create(
                name=f"{user.email.split('@')[0]}'s Organisation"
            )

            # Create the EmployeeProfile ledger anchoring them as the OWNER of this tenant
            EmployeeProfile.objects.create(
                tenant=new_org,
                user=user,
                role='OWNER',
                phone_number=0,
                address="Please update address details"
            )

        return user