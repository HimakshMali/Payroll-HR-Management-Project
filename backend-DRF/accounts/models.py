from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django_rls.models import RLSModel
from django_rls.policies import ModelPolicy, RLS

# Create your models here.


# this is our tenant 
class Organisation(models.Model):
    name = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class OrganisationProfile(RLSModel):
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    org_name = models.CharField(max_length=100, null = True, blank = True)   
    org_desc = models.TextField(null=True, blank=True)
    number_of_employees = models.IntegerField(default=0, null=True, blank=True)
    org_created_at = models.DateTimeField(auto_now_add=True) 
    org_updated_at = models.DateTimeField(auto_now=True)
    org_phone_number = models.IntegerField(null=True, blank=True)
    org_address = models.TextField(null=True, blank=True)
    org_date_of_joining = models.DateField(null=True, blank=True)
    # department = models.CharField(max_length=100, null=True, blank=True)
    org_pan_number = models.CharField(max_length=10, null=True, blank=True)
    org_bank_account_number = models.CharField(max_length=20, null=True, blank=True)
    org_base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    org_ifsc_code = models.CharField(max_length=11, null=True, blank=True)
    
    def __str__(self):
        return self.org_name
    

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




    def __str__(self):
        return self.email
    
    # todo: create the custome token pair obtain view to inject parameters like is_manager = true or not like that
    


class EmployeeProfile(RLSModel):
    ROLE_CHOICES = [
        ('OWNER', 'Owner / HR Administrator'),
        ('EMPLOYEE', 'Standard Employee'),
        ('CONTRACTOR', 'Contractor')
        
    ]
    EMPLOYMENT_TYPE_CHOICES = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Contract', 'Contract'),
        ('Internship', 'Internship'),
        ('Temporary', 'Temporary'),
    ]
    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employeeprofile')
    first_name = models.CharField(max_length=100, null = True, blank = True)
    middle_name = models.CharField(max_length=100, null = True, blank = True)   
    last_name = models.CharField(max_length=100, null = True, blank = True)   
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYEE')
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='Full-time')
    phone_number = models.IntegerField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    # department = models.CharField(max_length=100, null=True, blank=True)
    pan_number = models.CharField(max_length=10, null=True, blank=True)
    aadhaar_number = models.CharField(max_length=12, null=True, blank=True)
    bank_account_number = models.CharField(max_length=20, null=True, blank=True)
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
            if not self.ifsc_code:
                missing_fields.append("Ifsc Code")

            if missing_fields:
                raise ValidationError({
                    "role": f"Employee role requires the following fields: {', '.join(missing_fields)}"
                })

        elif self.role == 'OWNER':
            self.pan_number = None
            self.aadhaar_number = None
            self.bank_account_number = None
            self.ifsc_code = None

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.user.email} - {self.role} ({self.tenant_id})"


