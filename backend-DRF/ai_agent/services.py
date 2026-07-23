from django.db.models import Q
from google.auth.credentials import CredentialsWithRegionalAccessBoundary
from django.http import response
import os
import json
from decimal import Decimal, InvalidOperation
from google import genai
from google.genai import types
from django.conf import settings
from accounts.models import EmployeeProfile
from payroll.models import Reimbursement , AdvancePayment

client = genai.Client(api_key = getattr(settings,'GEMINI_API_KEY', os.getenv("GEMINI_API_KEY")))

def safe_decimal(val, default="0.00") -> Decimal:
    if val is None:
        return Decimal(default)
    try:
        return Decimal(str(val))
    except (InvalidOperation, ValueError):
        return Decimal(default)

REIMBURSEMENT_PROMPT = """
You are an HR Payroll AI Agent. Extract reimbursement request details from the user text.

Available Categories:
- TRAVEL: Travel & Fuel Allowance
- FOOD: Food & Meals
- MEDICAL: Medical & Healthcare
- EQUIPMENT: Hardware & Equipment Procurement
- SOFTWARE: Software & SaaS Subscriptions
- RENT: Office Space & Storage Rent
- UTILITIES: Electricity & Water Utilities
- COMMUNICATION: Phone & Internet Allowance
- OFFICE_SUPPLIES: Office Stationery & Supplies
- LOGISTICS: Courier, Shipping & Delivery Costs
- MAINTENANCE: Office Repair & Maintenance
- CLIENT_MEETING: Client Entertainment & Hospitality
- MARKETING: Local Marketing & Business Ads
- TEAM_WELFARE: Team Celebrations & Snacks
- TRAINING: Courses, Books & Employee Training
- OTHER: Other Out-of-Pocket Expenses

Output ONLY a raw JSON object with keys:
1. "category": string matching one of the exact category keys above
2. "amount": decimal number representing total cost
3. "reason": concise summary string describing the claim
"""

COMMAND_PARSER_PROMPT = """
You are an HR Payroll AI Agent parsing search bar commands.

Task:
Extract intent, employee name, amount, reason, and reimbursement category from input text.

Intents allowed:
- "ADVANCE"
- "REIMBURSEMENT"

Available Categories (only if intent is REIMBURSEMENT):
- TRAVEL, FOOD, MEDICAL, EQUIPMENT, SOFTWARE, RENT, UTILITIES, COMMUNICATION, 
  OFFICE_SUPPLIES, LOGISTICS, MAINTENANCE, CLIENT_MEETING, MARKETING, TEAM_WELFARE, TRAINING, OTHER

Output format (MUST BE RAW JSON ONLY):
{
  "intent": "ADVANCE" | "REIMBURSEMENT",
  "employee_name": "extracted name string or null",
  "amount": number,
  "reason": "concise reason string",
  "category": "category string or null"
}
"""
def process_reimbursement_message(employee_id: int, user_text: str) -> Reimbursement:

     employee = EmployeeProfile.objects.get(id=employee_id)
     try:
         response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f"{REIMBURSEMENT_PROMPT}\n\nUser Input: \"{user_text}\"",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
         )
     except Exception:
         # Fallback to gemini-3.5-flash if gemini-2.0-flash has quota limits/issues
         response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=f"{REIMBURSEMENT_PROMPT}\n\nUser Input: \"{user_text}\"",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
         )

     data = json.loads(response.text)

     reimbursement = Reimbursement.objects.create(
        tenant=employee.tenant,
        employee=employee,
        category=data.get("category", "OTHER"),
        amount=safe_decimal(data.get("amount")),
        reason=data.get("reason", user_text),
        status='PENDING'
     )

     return reimbursement
     
ADVANCE_PAYMENT_PROMPT = """
You are an HR Payroll AI Agent. Extract salary advance request details from the user text.

Instructions:
1. "amount": Extract the total numerical advance salary amount requested (as a float/decimal).
2. "reason": Extract or summarize the purpose for the advance request (e.g., medical emergency, personal expense, rent payment, house repair, family event). If no reason is mentioned, provide a concise summary based on the text.

Output ONLY a raw JSON object with keys:
{
  "amount": number,
  "reason": "string"
}
"""

def process_advance_payment_message(employee_id: int, user_text: str) -> AdvancePayment:

    employee = EmployeeProfile.objects.get(id=employee_id)

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f"{ADVANCE_PAYMENT_PROMPT}\n\nUser Input: \"{user_text}\"",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )


        )
    
    except Exception:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=f"{ADVANCE_PAYMENT_PROMPT}\n\nUser Input: \"{user_text}\"",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

    data = json.loads(response.text)

    advance_payment = AdvancePayment.objects.create(
        tenant=employee.tenant,
        employee=employee,
        amount=safe_decimal(data.get("amount")),
        reason=data.get("reason", user_text),
        status='PENDING'
    )

    return advance_payment

    


def process_search_command(tenant, promt_text : str = None, confirmed : bool = False, parsed_data : dict = None):
    if confirmed and parsed_data:
        intent = parsed_data.get("intent")
        employee_id = parsed_data.get("employee_id")
        amount = Decimal(str(parsed_data.get("amount", "0.00")))
        reason = parsed_data.get("reason", "")
        category = parsed_data.get("category", "OTHER")

        try:
            employee = EmployeeProfile.objects.get(id=employee_id, tenant=tenant)
        except EmployeeProfile.DoesNotExist:
            return {"status": "error", "message": "Employee not found."}

        emp_name = f"{employee.first_name or employee.user.first_name or ''} {employee.last_name or employee.user.last_name or ''}".strip() or employee.user.email

        if intent == 'ADVANCE':
            record = AdvancePayment.objects.create(
                tenant=employee.tenant,
                employee=employee,
                amount=amount,
                reason=reason,
            )
            return {
                "status": "success",
                "type": "ADVANCE",
                "message": f"Successfully created Advance Payment request of ₹{amount} for {emp_name}.",
                "record_id": record.id
            }
        elif intent == "REIMBURSEMENT":
            record = Reimbursement.objects.create(
                tenant=tenant,
                employee=employee,
                amount=amount,
                reason=reason,
                category=category,
                status='PENDING'
            )
            return {
                "status": "success",
                "type": "REIMBURSEMENT",
                "message": f"Successfully logged Reimbursement claim of ₹{amount} under {category} for {emp_name}.",
                "record_id": record.id
            }
        return {"status": "error", "message": "Could not determine transaction intent."}

    if not promt_text:
        return {"status": "error", "message": "Prompt is required."}

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f"{COMMAND_PARSER_PROMPT}\n\nUser Input: \"{promt_text}\"",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
    except Exception:
        # Fallback to gemini-3.5-flash if gemini-2.0-flash has quota limits/issues
        try:
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=f"{COMMAND_PARSER_PROMPT}\n\nUser Input: \"{promt_text}\"",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
        except Exception as e:
            return {
                "status": "error",
                "message": f"AI service is currently unavailable or quota is exhausted. Details: {str(e)}"
            }

    try:
        parsed = json.loads(response.text)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to parse AI response. Details: {str(e)}"
        }
    employee_name = parsed.get('employee_name')
    intent = parsed.get("intent")
    amount = Decimal(str(parsed.get("amount", "0.00")))
    category = parsed.get("category","OTHER")
    reason = parsed.get("reason",promt_text)

    if not employee_name:
        return {"status":"error","message":"Could not identify employee. Please try again"}
    
    from django.db.models import Value
    from django.db.models.functions import Concat

    employees = EmployeeProfile.objects.filter(tenant=tenant).annotate(
        profile_full_name=Concat('first_name', Value(' '), 'last_name'),
        user_full_name=Concat('user__first_name', Value(' '), 'user__last_name')
    ).filter(
        Q(profile_full_name__icontains=employee_name) |
        Q(first_name__icontains=employee_name) |
        Q(last_name__icontains=employee_name) |
        Q(user_full_name__icontains=employee_name) |
        Q(user__first_name__icontains=employee_name) |
        Q(user__last_name__icontains=employee_name) |
        Q(user__email__icontains=employee_name)
    )
    
    if not employees.exists():
        return {"status": "error", "message": f"No employee found with name matching '{employee_name}'."}

    if employees.count() > 1:
        matched_names = ", ".join([
            f"{e.first_name or e.user.first_name} {e.last_name or e.user.last_name} (ID: {e.id})".strip()
            if (e.first_name or e.last_name or e.user.first_name or e.user.last_name)
            else f"{e.user.email} (ID: {e.id})"
            for e in employees
        ])
        return {
            "status": "ambiguous",
            "message": f"Multiple employees matched '{employee_name}': {matched_names}. Please specify full name."
        }

    employee = employees.first()
    emp_name = f"{employee.first_name or employee.user.first_name or ''} {employee.last_name or employee.user.last_name or ''}".strip() or employee.user.email

    if intent in ['ADVANCE', 'REIMBURSEMENT']:
        return {
            "status": "requires_confirmation",
            "intent": intent,
            "employee_id": employee.id,
            "employee_name": emp_name,
            "amount": float(amount),
            "reason": reason,
            "category": category,
            "message": f"Please confirm creating {intent.lower()} request of ₹{amount} for {emp_name}."
        }

    return {"status": "error", "message": "Could not determine transaction intent (ADVANCE or REIMBURSEMENT)."}
    
