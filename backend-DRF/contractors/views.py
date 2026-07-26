from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

# Import your custom permission class from accounts
from accounts.permissions import IsOrganizationOwner

from contractors.models import ContractorProfile, ContractorWork, ContractorPayments, ContractorWorkMilestone
from contractors.serializers import (
    ContractorProfileSerializer, ContractorWorkSerializer, 
    ContractorPaymentsSerializer, ContractorWorkMilestoneSerializer
)

class BaseTenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_tenant(self):
        user = self.request.user
        if hasattr(user, 'employeeprofile') and user.employeeprofile and user.employeeprofile.tenant:
            return user.employeeprofile.tenant
        return None

    def get_queryset(self):
        tenant = self.get_tenant()
        if tenant:
            return self.queryset.filter(tenant=tenant)
        return self.queryset.none()

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        if not tenant:
            raise serializers.ValidationError({"detail": "User is not associated with any active tenant organization."})
        serializer.save(tenant=tenant)


    
    
class ContractorProfileViewSet(BaseTenantViewSet):
    serializer_class = ContractorProfileSerializer
    queryset = ContractorProfile.objects.all()
    filterset_fields = ['work_type', 'email']
    search_fields = ['first_name', 'last_name','company_name','email']

class ContractorWorkViewSet(BaseTenantViewSet):
    queryset = ContractorWork.objects.all()
    serializer_class = ContractorWorkSerializer
    filterset_fields = ['contractor', 'work_status', 'work_type']

    @action(detail=True, methods=['post'], url_path='mark-completed')
    def mark_completed(self, request, pk=None):
        """Custom endpoint action: POST /api/work/{id}/mark-completed/"""
        work = self.get_object()
        work.work_status = 'COMPLETED'
        work.save()
        serializer = self.get_serializer(work)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContractorPaymentsViewSet(BaseTenantViewSet):
    queryset = ContractorPayments.objects.all()
    serializer_class = ContractorPaymentsSerializer
    filterset_fields = ['contractor', 'payment_status', 'payment_method', 'work']


class ContractorWorkMilestoneViewSet(BaseTenantViewSet):
    queryset = ContractorWorkMilestone.objects.all()
    serializer_class = ContractorWorkMilestoneSerializer
    filterset_fields = ['work', 'status']