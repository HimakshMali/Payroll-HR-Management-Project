from django.urls import re_path
from .views import WhatsAppWebhookView

urlpatterns = [
    # Matches both 'webhook' and 'webhook/' to handle Meta's exact callback URL format robustly
    re_path(r'^webhook/?$', WhatsAppWebhookView.as_view(), name='whatsapp_webhook'),
]
