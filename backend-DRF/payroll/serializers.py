from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import EmployeeCurrentSalaryComponents, AdvancePayment,Reimbursement





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