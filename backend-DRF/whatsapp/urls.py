from django.urls import re_path, path
from .views import WhatsAppWebhookView

urlpatterns = [
    re_path(r'^webhook/?$', WhatsAppWebhookView.as_view(), name='whatsapp_webhook'),
]
