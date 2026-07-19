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

   