from rest_framework import serializers
from .models import AgentActivity, AgentHistory

class AgentActivitySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AgentActivity
        fields = [
            'id',
            'user_message',
            'intent',
            'ai_response',
            'amount',
            'category',
            'reason',
            'status',
            'status_display',
            'channel',
            'channel_display',
            'employee_name',
            'reimbursement',
            'advance_payment',
            'created_at',
        ]

    def get_employee_name(self, obj):
        if obj.employee:
            first = obj.employee.first_name or (obj.employee.user.first_name if obj.employee.user else '')
            last = obj.employee.last_name or (obj.employee.user.last_name if obj.employee.user else '')
            full = f"{first} {last}".strip()
            return full if full else (obj.employee.user.email if obj.employee.user else "Employee")
        return "Unknown Employee"

class AgentHistorySerializer(serializers.ModelSerializer):
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = AgentHistory
        fields = [
            'id',
            'user_query',
            'ai_raw_response',
            'channel',
            'channel_display',
            'created_at',
        ]