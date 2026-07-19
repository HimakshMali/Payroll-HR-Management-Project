from django.contrib import admin
from .models import EmployeeCurrentSalaryComponents,AdvancePayment,Reimbursement
# Register your models here.
admin.site.register(EmployeeCurrentSalaryComponents)
admin.site.register(AdvancePayment)
admin.site.register(Reimbursement)