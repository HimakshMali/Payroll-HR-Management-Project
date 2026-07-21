from django.urls import path
from .views import AgentSearchBarView

urlpatterns = [
    path('search-command/', AgentSearchBarView.as_view(), name='agent-search-command'),
]