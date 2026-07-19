from rest_framework import serializers
from .models import EmployeeCurrentSalaryComponents





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
