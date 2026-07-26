from rest_framework import serializers
from .models import ContractorProfile, ContractorWork, ContractorPayments, ContractorWorkMilestone


class ContractorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractorProfile
        fields = [
            'id', 'tenant', 'work_type', 'company_name', 'first_name', 
            'middle_name', 'last_name', 'email', 'phone_number', 
            'buisness_contact_number', 'address', 'pan_number', 'tan_number', 
            'bank_account_number', 'ifsc_code', 'upi_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']

class ContractorWorkMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractorWorkMilestone
        fields = [
            'id', 'tenant', 'work', 'title', 'description', 'status', 
            'due_date', 'completed_at', 'amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']

class ContractorWorkSerializer(serializers.ModelSerializer):
    gross_amount = serializers.ReadOnlyField()
    tds_amount = serializers.ReadOnlyField()
    total_payment = serializers.ReadOnlyField()
    milestones = ContractorWorkMilestoneSerializer(many=True, read_only=True)
    contractor_name = serializers.ReadOnlyField(source='contractor.__str__')

    class Meta:
        model = ContractorWork
        fields = [
            'id', 'tenant', 'contractor', 'contractor_name', 'work_type', 'payment_type', 
            'work_description', 'work_status', 'start_date', 'end_date', 
            'rate', 'misc_charges', 'units_worked', 'tds_percentage', 
            'gross_amount', 'tds_amount', 'total_payment', 'milestones',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']

class ContractorPaymentsSerializer(serializers.ModelSerializer):
    contractor_name = serializers.ReadOnlyField(source='contractor.__str__')
    work_description = serializers.ReadOnlyField(source='work.work_description')

    class Meta:
        model = ContractorPayments
        fields = [
            'id', 'tenant', 'contractor', 'contractor_name', 'work', 'work_description', 
            'amount', 'payment_date', 'payment_method', 'payment_status', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']