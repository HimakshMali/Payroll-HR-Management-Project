from django.core.management.base import BaseCommand
from accounts.models import EmployeeProfile
from ai_agent.services import process_reimbursement_message, process_advance_payment_message

EMPLOYEE_ID = 14
class Command(BaseCommand):
    help = "Tests AI Agent features specifically for Employee ID 14"

    def handle(self, *args, **kwargs):
        EMPLOYEE_ID = 14

        # 1. Look up Employee ID 14
        try:
            employee = EmployeeProfile.objects.get(id=EMPLOYEE_ID)
        except EmployeeProfile.DoesNotExist:
            self.stderr.write(f"Error: EmployeeProfile with ID {EMPLOYEE_ID} does not exist in the database.")
            return

        self.stdout.write(
            f"\n==================================================\n"
            f" Running AI Agent Test Suite for Employee ID: {employee.id}\n"
            f" Tenant: {employee.tenant}\n"
            f" Email : {getattr(employee.user, 'email', 'N/A')}\n"
            f"==================================================\n"
        )

        # 2. Test Advance Payment Requests
        advance_messages = [
            "Sir I urgently need 5000 rs advance for medical emergency.",
            "Need 3000 rupees advance salary for house rent this month.",
            "i wanna buy a lububu so please lend me 25000 rs",
            "i wanna fuck my wife so i need advance to buy lubricant and condoms",
            "my wife divorced me so i need money for masturebater and hire a brotherl boy so please guveem 1000 or 1500 rs"
        ]

        self.stdout.write(self.style.MIGRATE_HEADING("\n--- Testing ADVANCE PAYMENT Agent ---"))
        import time
        for idx, text in enumerate(advance_messages, start=1):
            self.stdout.write(f"\n[Advance Test #{idx}] Input: \"{text}\"")
            
            for attempt in range(5):
                try:
                    advance = process_advance_payment_message(employee_id=employee.id, user_text=text)
                    break
                except Exception as e:
                    if "RESOURCE_EXHAUSTED" in str(e) and attempt < 4:
                        self.stdout.write("Rate limit (RESOURCE_EXHAUSTED) hit. Sleeping for 15 seconds before retrying...")
                        time.sleep(15)
                    else:
                        raise e
            
            self.stdout.write(
                f"-> SUCCESS: Created Advance Payment Record [ID: {advance.id}]\n"
                f"   - Employee Email : {advance.employee.user.email}\n"
                f"   - Amount         : {advance.amount} INR\n"
                f"   - Reason         : {advance.reason}"
            )

        self.stdout.write(self.style.SUCCESS("\nAll tests executed successfully!\n"))