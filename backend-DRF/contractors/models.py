from django.db import models
from django_rls.models import RLSModel
from accounts.models import Organisation
# Create your models here.

class ContractorProfile(RLSModel):
    WORK_TYPE_CHOICES = [
        ('HOURLY', 'Hourly'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('PROJECT_BASED', 'Project Based'),
        ('MILESTONE_BASED', 'Milestone Based'),
        ('RETAINER', 'Retainer'),
        ('PIECE_RATE', 'Piece / Unit Rate'),
        ('COMMISSION', 'Commission Based'),
        ('HYBRID', 'Hybrid'),
    ]

    
    work_type = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES, default='PROJECT_BASED')
    
    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    company_name = models.CharField(max_length=100, null = True, blank = True)

    first_name = models.CharField(max_length=100, null = True, blank = True)
    middle_name = models.CharField(max_length=100, null = True, blank = True)   
    last_name = models.CharField(max_length=100, null = True, blank = True)   
    email = models.EmailField(unique = True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    buisness_contact_number = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    pan_number = models.CharField(max_length=10, null=True, blank=True)
    tan_number = models.CharField(max_length=10, null=True, blank=True)
    bank_account_number = models.CharField(max_length=20, null=True, blank=True)
    ifsc_code = models.CharField(max_length=11, null=True, blank=True)

    upi_id = models.CharField(max_length=100, null=True, blank=True) 
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
class ContractorWork(RLSModel):
    WORK_TYPE_CHOICES = [
        ('HOURLY', 'Hourly'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('PROJECT_BASED', 'Project Based'),
        ('MILESTONE_BASED', 'Milestone Based'),
        ('RETAINER', 'Retainer'),
        ('PIECE_RATE', 'Piece / Unit Rate'),
        ('COMMISSION', 'Commission Based'),
        ('HYBRID', 'Hybrid'),
    ]

    WORK_STATUS = [
        ("COMPLETED","Completed"),
        ("IN_PROGRESS","In Progress"),
        ("PENDING","Pending"),
        ("CANCELLED","Cancelled")
    ]

    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    contractor = models.ForeignKey(ContractorProfile, on_delete=models.CASCADE)
    
    work_type = models.CharField(max_length=20, choices=ContractorProfile.WORK_TYPE_CHOICES, default='PROJECT_BASED')
    payment_type = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES, default='PROJECT_BASED')
    work_description = models.TextField(null=True, blank=True)
    work_status = models.CharField(max_length=20, choices=WORK_STATUS, default='PENDING')

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)    
    misc_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    units_worked = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    tds_percentage = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)    
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    @property
    def gross_amount(self):
        """Base work payment before misc fees or tax."""
        return (self.rate * self.units_worked)

    @property
    def tds_amount(self):
        """Calculated TDS deduction."""
        return (self.gross_amount * (self.tds_percentage / 100))

    @property
    def total_payment(self):
        """Final net amount payable to contractor."""
        return (self.gross_amount + self.misc_charges) - self.tds_amount

    def __str__(self):
        name = f"{self.contractor.first_name or ''} {self.contractor.last_name or ''}".strip()
        return f"{name or self.contractor.email} - {self.get_payment_type_display()} ({self.status})"