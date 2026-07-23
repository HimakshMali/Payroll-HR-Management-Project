from .views import MonthlySalaryRecordViewSet
from .views import AttendanceLogViewSet
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeCurrentSalaryComponentsViewSet,AdvancePaymentViewSet,ReimbursementViewSet
# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'salary-components', EmployeeCurrentSalaryComponentsViewSet, basename='salary-components')
router.register(r'advances', AdvancePaymentViewSet, basename='advances')
router.register(r'reimbursements', ReimbursementViewSet, basename='reimbursements')
router.register(r'attendance', AttendanceLogViewSet, basename='attendance')
router.register(r'attendance-logs', AttendanceLogViewSet, basename='attendance-logs')
router.register(r'salary-records', MonthlySalaryRecordViewSet, basename='salary-record')
urlpatterns = [

    path('', include(router.urls)),
]