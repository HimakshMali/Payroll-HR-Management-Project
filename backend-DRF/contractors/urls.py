from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContractorProfileViewSet, 
    ContractorWorkViewSet, 
    ContractorPaymentsViewSet,
    ContractorWorkMilestoneViewSet
)

router = DefaultRouter()
router.register(r'contractors', ContractorProfileViewSet, basename='contractor-profile')
router.register(r'work', ContractorWorkViewSet, basename='contractor-work')
router.register(r'payments', ContractorPaymentsViewSet, basename='contractor-payments')
router.register(r'milestones', ContractorWorkMilestoneViewSet, basename='contractor-milestones')

urlpatterns = [
    path('', include(router.urls)),
]