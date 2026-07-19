
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
    
    # Write-only salary component fields
    basic_salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    special_allowence = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    house_rent_allowence = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    conveyance_allowence = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    phone_allowence = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    medical_allowence = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    deductions_EPF = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    deductions_ESI = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    deductions_TDS = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    deductions_professional_tax = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    deductions_other = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    employer_epf = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)
    employer_esi = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, write_only=True)

    # We keep all EmployeeProfile fields, but mark `tenant` and `user` as read-only.
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'tenant', 'user','first_name', 'middle_name', 'last_name', 'employment_type', 'role', 'phone_number', 'address',
            'date_of_joining', 'pan_number', 'aadhaar_number', 'bank_account_number',
            'ifsc_code', 'email', 'password',
            # Salary components write-only fields
            'basic_salary', 'special_allowence', 'house_rent_allowence',
            'conveyance_allowence', 'phone_allowence', 'medical_allowence',
            'deductions_EPF', 'deductions_ESI', 'deductions_TDS',
            'deductions_professional_tax', 'deductions_other', 'employer_epf', 'employer_esi'
        ]
        read_only_fields = ['id', 'tenant', 'user']  # tenant will be set from request

    # serializers.py – inside EmployeeCreateSerializer
    def validate(self, attrs):
        # Force the role to be 'EMPLOYEE' – ignore whatever the frontend sends
        attrs['role'] = 'EMPLOYEE'
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        from django.db import transaction
        from payroll.models import EmployeeCurrentSalaryComponents
        # Extract user fields
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        # Pop salary components
        salary_fields = [
            'basic_salary', 'special_allowence', 'house_rent_allowence',
            'conveyance_allowence', 'phone_allowence', 'medical_allowence',
            'deductions_EPF', 'deductions_ESI', 'deductions_TDS',
            'deductions_professional_tax', 'deductions_other', 'employer_epf', 'employer_esi'
        ]
        salary_data = {}
        for field in salary_fields:
            if field in validated_data:
                salary_data[field] = validated_data.pop(field)

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
            profile = super().create(validated_data)

            # Update the automatically created salary components via post_save receiver
            salary_component, _ = EmployeeCurrentSalaryComponents.objects.get_or_create(
                tenant=tenant,
                employee=profile
            )
            for key, val in salary_data.items():
                setattr(salary_component, key, val)
            salary_component.save()

            return profile


class EmployeeProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basic_salary = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'tenant', 'user','first_name', 'middle_name', 'last_name', 'employment_type', 'role', 'phone_number', 'address', 
            'date_of_joining', 'pan_number', 'aadhaar_number','bank_account_number', 
            'ifsc_code', 'basic_salary'
        ]

        read_only_fields = ['id', 'tenant','user']

    def get_basic_salary(self, obj):
        from payroll.models import EmployeeCurrentSalaryComponents
        salary = EmployeeCurrentSalaryComponents.objects.filter(employee=obj).first()
        return salary.basic_salary if salary else None

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
        # Import your RLS context manager if django_rls provides one, or manage it atomically:
        
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                registration_method='email'
            )
            user.save()

            new_org = Organisation.objects.create(
                name=f"{user.email.split('@')[0]}'s Organisation"
            )

            # Build the profile instance without running full_clean immediately if RLS blocks it,
            # or explicitly define your fields out-of-box.
            profile = EmployeeProfile(
                tenant=new_org,
                user=user,
                role='OWNER',
                phone_number=0,
                address="Please update address details"
            )
            
            # If full_clean() inside save() keeps triggering the missing attribute error:
            # You can temporarily bypass validation for the initial bootstrap OWNER account,
            # or ensure your RLS context manager is wrapping this block.
            profile.save()

        return user