from django.urls import path
from .views import AgentSearchBarView, AgentActivityListView, AgentActivityRejectView

urlpatterns = [
    path('search-command/', AgentSearchBarView.as_view(), name='agent-search-command'),
    path('activities/', AgentActivityListView.as_view(), name='agent-activities'),
    path('activities/<int:pk>/reject/', AgentActivityRejectView.as_view(), name='agent-activity-reject'),
]