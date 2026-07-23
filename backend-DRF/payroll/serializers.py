from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import EmployeeCurrentSalaryComponents, AdvancePayment,Reimbursement,AttendanceLog,MonthlySalaryRecord





class EmployeeCurrentSalaryComponentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeCurrentSalaryComponents
        fields = '__all__'
        read_only_fields = [
            'tenant', 
            'employee', 
            'total_allowence', 
            'gross_salary', 
            'total_deductions', 
            'net_salary', 
            'cost_to_company',
            'created_at',
            'updated_at'
        ]

class AdvancePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvancePayment
        fields = '__all__'
        read_only_fields = [
            'tenant', 
            'created_at',
            'updated_at'
        ]

    def validate(self,attrs):
        request = self.context.get("request")
        user_profile = getattr(request.user , 'employeeprofile',None)

        if not user_profile:
            raise ValidationError({"detail": "User does not have an employee profile"})

        if user_profile.role not in ['OWNER',"HR"]:
            raise ValidationError("Unauthorized to request advance")

        if not self.instance:
            attrs['tenant'] = user_profile.tenant

        return attrs



        
        

class ReimbursementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reimbursement
        fields = '__all__'
        read_only_fields = [
            'tenant', 
            'created_at',
            'updated_at'
        ]
    def validate(self, attrs):
        request = self.context.get('request')
        user_profile = getattr(request.user, 'employeeprofile', None)

        if not user_profile:
            raise ValidationError("User profile context not found.")

        if not self.instance:
            attrs['tenant'] = user_profile.tenant
            if 'employee' in attrs and attrs['employee'] != user_profile:
                if user_profile.role not in ['OWNER', 'HR']:
                    raise ValidationError({"employee": "Permissions Denied: Standard employees cannot submit claims on behalf of other employees."})
            else:
                attrs['employee'] = user_profile

            if user_profile.role not in ['OWNER', 'HR']:
                attrs['status'] = 'PENDING'

        else:
            # Guard the status field against unauthorized changes
            if 'status' in attrs and attrs['status'] != self.instance.status:
                if user_profile.role not in ['OWNER', 'HR']:
                    raise ValidationError({
                        "status": "Permissions Denied: Regular employees cannot alter the approval state of a claim."
                    })

        return attrs


class MonthlySalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.email', read_only=True)
    class Meta:
        model = MonthlySalaryRecord
        fields = [
            'id', 'employee_name', 'month', 'year', 'status',
            'basic_salary', 'special_allowence', 'house_rent_allowence', 'conveyance_allowence', 'phone_allowence', 'medical_allowence',
            'deductions_EPF', 'deductions_ESI', 'deductions_TDS', 'deductions_professional_tax', 'deductions_other',
            'lop_days', 'lop_deductions', 'approved_reimbursements', 'advances_deducted',
            'employer_epf', 'employer_esi',
            'total_allowence', 'gross_salary', 'total_deductions', 'net_salary', 'cost_to_company',
            'payment_type', 'payment_date', 'created_at', 'updated_at'
        ]

class AttendenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = '__all__'
        read_only_fields = ['tenant','created_at','updated_at']