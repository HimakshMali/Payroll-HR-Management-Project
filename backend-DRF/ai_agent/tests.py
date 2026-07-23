from django.test import TestCase
from unittest.mock import patch, MagicMock
from decimal import Decimal
from accounts.models import Organisation, EmployeeProfile, User
from payroll.models import Reimbursement, AdvancePayment
from ai_agent.services import process_search_command

class AIAgentServicesTestCase(TestCase):
    def setUp(self):
        # Create tenant
        self.tenant = Organisation.objects.create(name="Test Org")
        # Create user
        self.user = User.objects.create_user(email="ravi@test.com", password="password")
        # Create employee profile
        self.employee = EmployeeProfile.objects.create(
            tenant=self.tenant,
            user=self.user,
            first_name="Ravi",
            last_name="Sharma",
            role="OWNER" # Owner role has fewer required fields in clean()
        )

    @patch('ai_agent.services.client.models.generate_content')
    def test_search_command_requires_confirmation(self, mock_generate_content):
        # Mock Gemini response
        mock_response = MagicMock()
        mock_response.text = '{"intent": "ADVANCE", "employee_name": "Ravi", "amount": 10000.00, "reason": "personal emergency", "category": null}'
        mock_generate_content.return_value = mock_response

        # Execute unconfirmed flow
        res = process_search_command(self.tenant, promt_text="Give 10000 advance to Ravi for personal emergency", confirmed=False)

        # Assertions
        self.assertEqual(res["status"], "requires_confirmation")
        self.assertEqual(res["intent"], "ADVANCE")
        self.assertEqual(res["employee_id"], self.employee.id)
        self.assertEqual(res["amount"], 10000.00)
        self.assertEqual(res["reason"], "personal emergency")
        
        # Verify no database record was created yet
        self.assertFalse(AdvancePayment.objects.filter(employee=self.employee).exists())

    def test_search_command_confirmed_execution(self):
        # Execute confirmed flow directly
        parsed_data = {
            "intent": "ADVANCE",
            "employee_id": self.employee.id,
            "amount": 10000.00,
            "reason": "personal emergency",
            "category": None
        }
        res = process_search_command(self.tenant, confirmed=True, parsed_data=parsed_data)

        # Assertions
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["type"], "ADVANCE")
        
        # Verify database record was created
        record = AdvancePayment.objects.get(employee=self.employee)
        self.assertEqual(record.amount, Decimal("10000.00"))
        self.assertEqual(record.reason, "personal emergency")

