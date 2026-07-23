from django.db.models import Sum
from decimal import Decimal
from django.db import models
from django.conf import settings
from django_rls.models import RLSModel
from accounts.models import EmployeeProfile,User,Organisation

from django.db.models.signals import post_save
from django.dispatch import receiver
# Create your models here.

@receiver(post_save, sender=EmployeeProfile)
def create_employee_salary_components(sender, instance, created, **kwargs):
    """
    Automatically creates a blank EmployeeCurrentSalaryComponents instance 
    whenever a new EmployeeProfile is generated.
    """
    if created:
        EmployeeCurrentSalaryComponents.objects.create(
            tenant=instance.tenant, # Using tenant field name on profile
            employee=instance
        )

class EmployeeCurrentSalaryComponents(RLSModel):
    tenant = models.ForeignKey(Organisation,on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    special_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    house_rent_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    conveyance_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    phone_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    medical_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    #deductions 
    deductions_EPF = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_ESI = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_TDS = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_professional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_other = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    employer_epf = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    employer_esi = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    total_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    cost_to_company = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee} - {self.tenant}"

    #  functions

    def calculate_totals(self):
        self.total_allowence = (
            (self.house_rent_allowence or Decimal('0.00')) +
            (self.conveyance_allowence or Decimal('0.00')) +
            (self.phone_allowence or Decimal('0.00')) +
            (self.medical_allowence or Decimal('0.00'))+
            (self.special_allowence or Decimal('0.00'))
        )
        self.total_deductions = (
            (self.deductions_EPF or Decimal('0.00')) +
            (self.deductions_ESI or Decimal('0.00')) +
            (self.deductions_TDS or Decimal('0.00')) +
            (self.deductions_professional_tax or Decimal('0.00'))+
            (self.deductions_other or Decimal('0.00'))
        )
        self.gross_salary = (
            (self.basic_salary or Decimal('0.00')) +
            (self.special_allowence or Decimal('0.00')) +
            (self.house_rent_allowence or Decimal('0.00')) +
            (self.conveyance_allowence or Decimal('0.00')) +
            (self.phone_allowence or Decimal('0.00')) +
            (self.medical_allowence or Decimal('0.00'))
        )
        self.net_salary = (
            (self.gross_salary or Decimal('0.00')) -
            (self.total_deductions or Decimal('0.00'))
        )
        self.cost_to_company = (
            (self.gross_salary or Decimal('0.00')) +
            (self.employer_epf or Decimal('0.00')) +
            (self.employer_esi or Decimal('0.00'))
        )

    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)
    
    
    def passes_wage_code_compliance(self):

        if not self.gross_salary or self.gross_salary == 0:
            return True
        return (self.basic_salary / self.gross_salary) >= Decimal('0.50')




class AdvancePayment(RLSModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved (Awaiting Payout)'),
        ('PAID', 'Disbursed to Employee'),
        ('REJECTED', 'Rejected'),
        ('DEDUCTED', 'Fully Recovered from Salary'),
    ]

    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reason = models.TextField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    disbursement_date = models.DateField(null=True, blank=True, help_text="When the owner gave the cash/transfer")
    recovery_month = models.DateField(null=True, blank=True, help_text="The salary cycle month this should be deducted from (e.g., 2026-08-01)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee.user.email} - Advance: {self.amount} ({self.status})"


class Reimbursement(RLSModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('PAID_WITH_PAYROLL', 'Settled via Monthly Salary Payout'),
        ('PAID_DIRECT', 'Paid Out Cache/Direct Transfer'),
        ('REJECTED', 'Rejected'),
    ]
    
    CATEGORY_CHOICES = [
    # --- Existing & Core Categories ---
    ('TRAVEL', 'Travel & Fuel Allowance'),
    ('FOOD', 'Food & Meals'),
    ('MEDICAL', 'Medical & Healthcare'),
    ('EQUIPMENT', 'Hardware & Equipment Procurement'),
    ('SOFTWARE', 'Software & SaaS Subscriptions'),
    ('RENT', 'Office Space & Storage Rent'),
    
    # --- Utility & Communication Enhancements ---
    ('UTILITIES', 'Electricity & Water Utilities'),
    ('COMMUNICATION', 'Phone & Internet Allowance'),
    
    # --- Operations & Logistics ---
    ('OFFICE_SUPPLIES', 'Office Stationery & Supplies'),
    ('LOGISTICS', 'Courier, Shipping & Delivery Costs'),
    ('MAINTENANCE', 'Office Repair & Maintenance'),
    
    # --- Client & Team Growth ---
    ('CLIENT_MEETING', 'Client Entertainment & Hospitality'),
    ('MARKETING', 'Local Marketing & Business Ads'),
    ('TEAM_WELFARE', 'Team Celebrations & Snacks'),
    ('TRAINING', 'Courses, Books & Employee Training'),
    
    # --- Ad-hoc Payroll Incentives (For Reimbursements engine hooks) ---
    ('BONUS', 'Performance Bonus'),
    ('FESTIVAL_GIFT', 'Festival Incentive Token'),
    
    # --- Fallback ---
    ('OTHER', 'Other Out-of-Pocket Expenses'),
]

    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reason = models.TextField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Crucial for expenses
    # receipt_image = models.URLField(max_length=500, null=True, blank=True, help_text="S3 / Cloud Storage secure asset link parsed by OCR")
    
    is_processed_in_salary = models.BooleanField(default=False, help_text="Tells the payroll engine if this money was already returned to the employee")
    payment_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.employee.user.email} - Claim: {self.amount} ({self.status})"
# [Duplicate MonthlySalaryRecord definition removed to avoid conflict]



class AttendanceLog(RLSModel):

    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Holiday', 'Holiday'),
        ('Leave', 'Leave'),
    ]

    tenant= models.ForeignKey(Organisation,on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    date = models.DateField(null=True, blank=True)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    is_lop = models.BooleanField(default=False, help_text="Triggers salary deduction if True")
    lop_override_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    class Meta:
        # Prevents duplicate entries for the same employee on the same date
        unique_together = ('tenant', 'employee', 'date')

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.date} ({self.status})"







class MonthlySalaryRecord(RLSModel):
    MONTH_CHOICES =[
        (1,'JANUARY'),
        (2,'FEBUARY'),
        (3,'MARCH'),
        (4,'APRIL'),
        (5,'MAY'),
        (6,'JUNE'),
        (7,'JULY'),
        (8,'AUGUST'),
        (9,'SEPTEMBER'),
        (10,'OCTOBER'),
        (11,'NOVEMBER'),
        (12,'DECEMBER')
    ]
    

    STATUS_CHOICES =[
        ('DRAFT', 'Draft'),
        ('GENERATED', 'Generated'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('UPI', 'UPI'),
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('BANK_TRANSFER', 'Bank Transfer'),
    ]

    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE)
    month = models.IntegerField(choices=MONTH_CHOICES, null=True, blank=True, default=1)
    year = models.IntegerField(null=True, blank=True, default=2026)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, null=True, blank=True, default='BANK_TRANSFER')
    payment_date = models.DateField(null=True, blank=True)

    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    special_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    house_rent_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    conveyance_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    phone_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    medical_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    #deductions 
    deductions_EPF = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_ESI = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_TDS = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_professional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    deductions_other = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    lop_days = models.IntegerField(default=0)
    lop_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    approved_reimbursements = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    advances_deducted = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    employer_epf = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    employer_esi = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    total_allowence = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)
    cost_to_company = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tenant', 'employee', 'month', 'year')

    def __str__(self):
        return f"{self.employee} - {self.month} - {self.year} - {self.status}"

    def copy_base_components(self):
        try:
            comp = EmployeeCurrentSalaryComponents.objects.get(
                tenant = self.tenant,
                employee = self.employee
            )

            self.basic_salary = comp.basic_salary
            self.special_allowence = comp.special_allowence
            self.house_rent_allowence = comp.house_rent_allowence
            self.conveyance_allowence = comp.conveyance_allowence
            self.phone_allowence = comp.phone_allowence
            self.medical_allowence = comp.medical_allowence
            self.deductions_EPF = comp.deductions_EPF
            self.deductions_ESI = comp.deductions_ESI
            self.deductions_TDS = comp.deductions_TDS
            self.deductions_professional_tax = comp.deductions_professional_tax
            self.deductions_other = comp.deductions_other
            self.employer_epf = comp.employer_epf
            self.employer_esi = comp.employer_esi

        except EmployeeCurrentSalaryComponents.DoesNotExist:
            pass
        
    def calculate_totals(self):
        if not hasattr(self, 'employee_id') or not self.employee_id:
            return

        if not self.basic_salary:
            self.copy_base_components()

        self.total_allowence = (
            (self.house_rent_allowence or Decimal('0.00')) +
            (self.conveyance_allowence or Decimal('0.00')) +
            (self.phone_allowence or Decimal('0.00')) +
            (self.medical_allowence or Decimal('0.00')) +
            (self.special_allowence or Decimal('0.00'))
        )

        # fetching lop from attendance for given month and period
        lop_logs = AttendanceLog.objects.filter(
            tenant=self.tenant,
            employee_id=self.employee_id,
            date__month=self.month,
            date__year=self.year,
            is_lop=True
        )

        self.lop_days = lop_logs.count()
        daily_rate = (self.basic_salary or Decimal('0.00')) / Decimal('30.00')
        calculated_lop = daily_rate * Decimal(self.lop_days)

        override_sum = lop_logs.aggregate(total=Sum('lop_override_amount'))['total'] or Decimal('0.00')
        if override_sum > Decimal('0.00'):
            self.lop_deductions = override_sum
        else:
            self.lop_deductions = calculated_lop

        reimb_sum = Reimbursement.objects.filter(
            tenant=self.tenant,
            employee_id=self.employee_id,
            status='APPROVED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if reimb_sum > Decimal('0.00') or not self.approved_reimbursements:
            self.approved_reimbursements = reimb_sum

        adv_sum = AdvancePayment.objects.filter(
            tenant=self.tenant,
            employee_id=self.employee_id,
            status='APPROVED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if adv_sum > Decimal('0.00') or not self.advances_deducted:
            self.advances_deducted = adv_sum 

        self.gross_salary = (
            (self.basic_salary or Decimal('0.00')) +
            (self.total_allowence or Decimal('0.00')) +
            (self.approved_reimbursements or Decimal('0.00'))
        )

        standard_deductions = (
            (self.deductions_EPF or Decimal('0.00')) +
            (self.deductions_ESI or Decimal('0.00')) +
            (self.deductions_TDS or Decimal('0.00')) +
            (self.deductions_professional_tax or Decimal('0.00')) +
            (self.deductions_other or Decimal('0.00'))
        )

        self.total_deductions = (
            standard_deductions + 
            (self.lop_deductions or Decimal('0.00')) + 
            (self.advances_deducted or Decimal('0.00'))
        )
        self.net_salary = self.gross_salary - self.total_deductions
        
        self.cost_to_company = (
            self.gross_salary +
            (self.employer_epf or Decimal('0.00')) +
            (self.employer_esi or Decimal('0.00'))
        )
    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)