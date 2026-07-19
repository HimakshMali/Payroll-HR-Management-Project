from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeCurrentSalaryComponentsViewSet
# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'salary-components', EmployeeCurrentSalaryComponentsViewSet, basename='salary-components')

urlpatterns = [

    path('', include(router.urls)),
]