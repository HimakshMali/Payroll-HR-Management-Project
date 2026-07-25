from django.db import models
from accounts.models import Organisation, EmployeeProfile
from payroll.models import Reimbursement, AdvancePayment

class AgentHistory(models.Model):
    CHANNEL_CHOICES = (
        ('WHATSAPP', 'WhatsApp Agent'),
        ('SEARCH_BAR', 'Search Bar Agent'),
    )
    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='agent_histories')
    user_query = models.TextField()
    ai_raw_response = models.TextField(null=True, blank=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='SEARCH_BAR')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.channel}] {self.user_query[:30]}..."

class AgentActivity(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('REJECTED', 'Rejected'),
    )
    CHANNEL_CHOICES = (
        ('WHATSAPP', 'WhatsApp Agent'),
        ('SEARCH_BAR', 'Search Bar Agent'),
    )
    tenant = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='agent_activities')
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_activities')
    user_message = models.TextField()
    intent = models.CharField(max_length=20)  # REIMBURSEMENT or ADVANCE
    ai_response = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    category = models.CharField(max_length=50, default='OTHER')
    reason = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    reimbursement = models.ForeignKey(Reimbursement, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    advance_payment = models.ForeignKey(AdvancePayment, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='SEARCH_BAR')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.intent} - ₹{self.amount} for {self.employee}"
