from django.http import HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import logging
import json

from .utils import send_whatsapp_message
from ai_agent.services import process_search_command
from accounts.models import Organisation, EmployeeProfile

logger = logging.getLogger(__name__)

class WhatsAppWebhookView(APIView):
    """
    Handles Meta WhatsApp Webhook:
    - GET: Meta verification handshake
    - POST: Incoming WhatsApp message packets & status updates
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        verify_token = getattr(settings, 'WHATSAPP_VERIFY_TOKEN', '')

        if mode == 'subscribe' and token == verify_token:
            print("✅ WhatsApp Webhook Handshake Verified!")
            return HttpResponse(str(challenge), content_type="text/plain", status=200)

        print(f"❌ Handshake failed. Expected token '{verify_token}', got '{token}'")
        return HttpResponse("Verification failed", content_type="text/plain", status=403)

    def post(self, request, *args, **kwargs):
        data = request.data
        print(f"\n📩 INCOMING WEBHOOK POST PAYLOAD:\n{json.dumps(data, indent=2)}")
        
        try:
            entries = data.get('entry', [])
            for entry in entries:
                changes = entry.get('changes', [])
                for change in changes:
                    value = change.get('value', {})
                    messages = value.get('messages', [])
                    statuses = value.get('statuses', [])
                    
                    if statuses:
                        for status_item in statuses:
                            msg_id = status_item.get('id')
                            curr_status = status_item.get('status')
                            recipient = status_item.get('recipient_id')
                            errors = status_item.get('errors')
                            
                            print(f"ℹ️ Status Update for {msg_id}: Status='{curr_status}' Recipient={recipient}")
                            if errors:
                                print(f"❌ Delivery Error Details: {json.dumps(errors, indent=2)}")
                    
                    if messages:
                        for message in messages:
                            sender_phone = message.get('from')
                            msg_type = message.get('type')
                            
                            print(f"💬 Incoming Message from {sender_phone} of type '{msg_type}'")
                            
                            if msg_type == 'text':
                                text_body = message.get('text', {}).get('body', '').strip()
                                print(f"  Text Body: '{text_body}'")
                                
                                # Check greeting or pass to AI Agent
                                if text_body.lower() in ['hi', 'hello', 'hey', 'start']:
                                    reply_text = f"Welcome to Salz HR & Payroll AI! 🚀 Send commands like:\n'Added reimbursement of Rs 4000 into Ravi Sharma account for software purchase' or 'Give advance salary of 5000 to Pooja'."
                                else:
                                    # Find matching organisation tenant
                                    tenant = None
                                    emp = EmployeeProfile.objects.filter(phone_number__icontains=sender_phone[-10:]).first() if sender_phone else None
                                    if emp and emp.tenant:
                                        tenant = emp.tenant
                                    else:
                                        tenant = Organisation.objects.first()

                                    if not tenant:
                                        reply_text = "No active organization tenant found in system."
                                    else:
                                        # Process message through AI Agent
                                        ai_res = process_search_command(tenant, promt_text=text_body, channel='WHATSAPP')
                                        print(f"🤖 AI Agent Parsing Result: {ai_res}")

                                        if ai_res.get("status") == "requires_confirmation":
                                            # Automatically confirm and execute reimbursement/advance creation
                                            confirm_res = process_search_command(tenant, confirmed=True, parsed_data=ai_res, channel='WHATSAPP')
                                            print(f"✅ AI Agent Execution Result: {confirm_res}")
                                            reply_text = confirm_res.get("message", "Transaction processed successfully.")
                                        else:
                                            reply_text = ai_res.get("message", "Processed request.")

                                print(f"  Replying via WhatsApp: '{reply_text}'")
                                
                                # Dispatch reply via Meta Graph API
                                res = send_whatsapp_message(sender_phone, reply_text)
                                print(f"  Dispatch Result: {res}")
                            else:
                                print(f"  Ignored non-text message type: {msg_type}")
                    elif not statuses:
                        print("⚠️ Payload did not contain 'messages' or 'statuses'.")
                            
        except Exception as e:
            print(f"❌ Error parsing payload: {e}")
            logger.exception(f"Error processing WhatsApp webhook payload: {e}")

        return Response({"status": "received"}, status=status.HTTP_200_OK)