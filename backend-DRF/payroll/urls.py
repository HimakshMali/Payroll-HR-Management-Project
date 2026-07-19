from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeCurrentSalaryComponentsViewSet,AdvancePaymentViewSet,ReimbursementViewSet
# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'salary-components', EmployeeCurrentSalaryComponentsViewSet, basename='salary-components')
router.register(r'advances', AdvancePaymentViewSet, basename='advances')
router.register(r'reimbursements', ReimbursementViewSet, basename='reimbursements')

urlpatterns = [

    path('', include(router.urls)),
]