from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

class WhatsAppWebhookView(APIView):
    """
    Handles Meta's validation handshake (GET) and incoming live message packets (POST).
    """
    permission_classes = [AllowAny]  # Open access for Meta's servers
    authentication_classes = []      # Bypasses global JWT authentication middleware layers

    def get(self, request, *args, **kwargs):
        # Extract the fields safely using Meta's explicit dot-notation string keys
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        # Check your verify token value against your .env / settings variable definition
        verify_token = getattr(settings, 'WHATSAPP_VERIFY_TOKEN', '')

        if mode == 'subscribe' and token == verify_token:
            # CRITICAL: Meta expects a raw, unquoted text string returned, NOT JSON format.
            return HttpResponse(str(challenge), content_type="text/plain", status=200)
            
        return HttpResponse("Verification failed", content_type="text/plain", status=403)

    def post(self, request, *args, **kwargs):
        # Handles webhook event notifications sent by WhatsApp (incoming messages, status updates, etc.)
        data = request.data
        return Response({"status": "received"}, status=status.HTTP_200_OK)