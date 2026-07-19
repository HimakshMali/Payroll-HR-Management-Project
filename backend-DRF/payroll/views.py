from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import EmployeeCurrentSalaryComponents
from .serializers import EmployeeCurrentSalaryComponentsSerializer
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

