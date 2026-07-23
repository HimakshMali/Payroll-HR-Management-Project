from .serializers import MonthlySalarySerializer
from .serializers import AttendenceSerializer
from .models import AttendanceLog
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from .models import MonthlySalaryRecord
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import EmployeeCurrentSalaryComponents,AdvancePayment,Reimbursement
from .serializers import EmployeeCurrentSalaryComponentsSerializer,AdvancePaymentSerializer,ReimbursementSerializer
from accounts.permissions import IsOrganizationOwner 

# Create your views here.
class EmployeeCurrentSalaryComponentsViewSet(viewsets.ModelViewSet):
    queryset = EmployeeCurrentSalaryComponents.objects.all()
    serializer_class = EmployeeCurrentSalaryComponentsSerializer
    
    # 1. Enforce authentication and your custom owner mutations rules
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        """
        Optional fallback: If django-rls doesn't automate this completely,
        restrict rows strictly to the user's tenant organization.
        """
        user_profile = self.request.user.employeeprofile
        queryset = self.queryset.filter(tenant=user_profile.tenant)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def perform_create(self, serializer):
        """
        Ensures that even if an Owner manually fires a POST request,
        the system forces the tenant context automatically.
        """
        user_profile = self.request.user.employeeprofile
        serializer.save(tenant=user_profile.tenant)

class AdvancePaymentViewSet(viewsets.ModelViewSet):
    queryset =AdvancePayment.objects.all()
    serializer_class = AdvancePaymentSerializer
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        user_profile = self.request.user.employeeprofile
        queryset = self.queryset.filter(tenant=user_profile.tenant)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def perform_create(self, serializer):
        user_profile = self.request.user.employeeprofile
        serializer.save(tenant=user_profile.tenant)

class ReimbursementViewSet(viewsets.ModelViewSet):
    queryset = Reimbursement.objects.all()
    serializer_class = ReimbursementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.employeeprofile
        queryset = self.queryset.filter(tenant=user_profile.tenant)

        if user_profile.role not in ["OWNER","HR"]:
            queryset = queryset.filter(employee=user_profile)

        else:
            employee_param = self.request.query_params.get('employee')
            if employee_param:
                queryset = queryset.filter(employee_id=employee_param)
        
        return queryset

    def perform_create(self, serializer):
        user_profile = self.request.user.employeeprofile
        serializer.save(tenant=user_profile.tenant)



class AttendanceLogViewSet(viewsets.ModelViewSet):
    serializer_class = AttendenceSerializer
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'employeeprofile', None)
        if not profile:
            return AttendanceLog.objects.none()
        
        if profile.role in ['OWNER', 'HR']:
            return AttendanceLog.objects.filter(tenant=profile.tenant)
        return AttendanceLog.objects.filter(tenant=profile.tenant, employee=profile)

    def perform_create(self, serializer):
        profile = self.request.user.employeeprofile
        serializer.save(tenant=profile.tenant)
   

class MonthlySalaryRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlySalarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'employeeprofile',None)
        if not profile:
            return MonthlySalaryRecord.objects.none()

        if profile.role in ['OWNER', 'HR']:
            return MonthlySalaryRecord.objects.filter(tenant = profile.tenant)
        return MonthlySalaryRecord.objects.filter(employee=profile,tenant = profile.tenant)


    def perform_create(self,serializer):
        profile = self.request.user.employeeprofile
        serializer.save(tenant= profile.tenant)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_as_paid(self, request, pk=None):
        """
        Custom action: POST /api/payroll/salary-records/{id}/mark-paid/
        Marks payroll status to PAID and closes pending advances & reimbursements.
        """
        salary_record = self.get_object()

        if salary_record.status == 'PAID':
            return Response({'error': 'This payroll record is already marked as PAID.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 1. Update salary record status
            salary_record.status = 'PAID'
            salary_record.payment_date = timezone.now().date()
            salary_record.save()

            # 2. Mark linked approved reimbursements as processed
            Reimbursement.objects.filter(
                tenant=salary_record.tenant,
                employee=salary_record.employee,
                status='APPROVED',
                is_processed_in_salary=False
            ).update(is_processed_in_salary=True, status='PAID_WITH_PAYROLL')

            # 3. Mark linked advance payments as fully recovered
            AdvancePayment.objects.filter(
                tenant=salary_record.tenant,
                employee=salary_record.employee,
                status='APPROVED'
            ).update(status='DEDUCTED')

        return Response({'message': 'Payroll successfully processed and marked as PAID.'}, status=status.HTTP_200_OK)