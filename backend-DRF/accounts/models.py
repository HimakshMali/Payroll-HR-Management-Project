from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django_rls.models import RLSModel
from django_rls.policies import ModelPolicy, RLS





"""
    Generates a unique, non-sequential string ID.
    Example output: USR-2026-A1B2C3D4
""" 

def generate_custom_id(prefix):
    current_year = timezone.now().year
    random_hash = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{current_year}-{random_hash}"

# Create your models here.

# this is our tenant 
class Organisation(models.Model):
    name = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class OrganisationProfile():    
    pass

# we create baseusermaanager because django use the default Usermanager 
# so to override it and to add customisation like here username is email as we dont need username here
# we creates CustomUsermanager
class CustomUserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided to create user")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email = email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)

        return user
        
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

    

REGISTRATION_CHOICES = [
    ('email', 'Email'),
    ('google', 'Google')
]
class User(AbstractUser):
    id = models.CharField(
        primary_key=True, 
        max_length=50, 
        editable=False
    )

    email = models.EmailField(unique = True)
    google_id = models.CharField(
        max_length = 255,
        unique = True,
        null = True,
        blank = True,
        help_text = "this is a unique google id"
    )
    registration_method = models.CharField(max_length=20, choices=REGISTRATION_CHOICES, default='email')

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def save(self, *args, **kwargs):
        # Auto-generate our custom obfuscated ID right before saving to PostgreSQL
        if not self.id:
            self.id = generate_custom_id("USR")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
    
    # todo: create the custome token pair obtain view to inject parameters like is_manager = true or not like that
    


class EmployeeProfile(RLSModel):
    ROLE_CHOICES = [
        ('OWNER', 'Owner / HR Administrator'),
        ('EMPLOYEE', 'Standard Employee'),
    ]
    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employeeprofile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE')
    phone_number = models.BigIntegerField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    # department = models.CharField(max_length=100, null=True, blank=True)
    pan_number = models.CharField(max_length=10, null=True, blank=True)
    bank_account_number = models.CharField(max_length=20, null=True, blank=True)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    ifsc_code = models.CharField(max_length=11, null=True, blank=True)

    def clean(self):
        super().clean()

        if self.role == 'EMPLOYEE':
            missing_fields = []

            if not self.phone_number:
                missing_fields.append("Phone Number")
            if not self.address:
                missing_fields.append("Address")
            if not self.date_of_joining:
                missing_fields.append("Date of Joining")
            if not self.pan_number:
                missing_fields.append("Pan Number")
            if not self.bank_account_number:
                missing_fields.append("Bank Account Number")
            if not self.base_salary:
                missing_fields.append("Base Salary")
            if not self.ifsc_code:
                missing_fields.append("Ifsc Code")

            if missing_fields:
                raise ValidationError({
                    "role": f"Employee role requires the following fields: {', '.join(missing_fields)}"
                })

        elif self.role == 'OWNER':
            self.base_salary = None
            self.pan_number = None
            self.aadhaar_number = None
            self.bank_account_number = None
            self.ifsc_code = None

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.id:
            self.id = generate_custom_id("EMP")
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.role} ({self.tenant_id})"