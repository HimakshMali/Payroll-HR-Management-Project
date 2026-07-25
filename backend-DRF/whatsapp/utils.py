import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def send_whatsapp_message(recipient_phone: str, message_body: str) -> dict:
    """
    Dispatches an outbound text message to Meta's WhatsApp Business Cloud API.
    """
    phone_number_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '')
    access_token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', '')
    api_version = getattr(settings, 'WHATSAPP_API_VERSION', 'v19.0')

    url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_body
        }
    }

    print(f"\n--- DISPATCHING OUTBOUND WHATSAPP MESSAGE ---")
    print(f"Target URL: {url}")
    print(f"Recipient: {recipient_phone}")
    print(f"Body: {message_body}")
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        
        print(f"Meta Graph API HTTP Status: {response.status_code}")
        print(f"Meta Graph API Response: {response_data}\n")
        
        if response.status_code in [200, 201]:
            logger.info(f"WhatsApp message sent successfully to {recipient_phone}.")
        else:
            logger.error(f"WhatsApp API Error ({response.status_code}): {response_data}")
            
        return response_data
    except Exception as e:
        print(f"❌ Exception in send_whatsapp_message: {e}\n")
        logger.exception(f"Failed to dispatch WhatsApp message to {recipient_phone}: {e}")
        return {"error": str(e)}
