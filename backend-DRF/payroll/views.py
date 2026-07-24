from .serializers import MonthlySalarySerializer
from .serializers import AttendenceSerializer
from .models import AttendanceLog
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from .models import MonthlySalaryRecord
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import EmployeeCurrentSalaryComponents,AdvancePayment,Reimbursement
from .serializers import EmployeeCurrentSalaryComponentsSerializer,AdvancePaymentSerializer,ReimbursementSerializer
from accounts.permissions import IsOrganizationOwner 

# Create your views here.
class EmployeeCurrentSalaryComponentsViewSet(viewsets.ModelViewSet):
    queryset = EmployeeCurrentSalaryComponents.objects.all()
    serializer_class = EmployeeCurrentSalaryComponentsSerializer
    
    # 1. Enforce authentication and your custom owner mutations rules
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        """
        Optional fallback: If django-rls doesn't automate this completely,
        restrict rows strictly to the user's tenant organization.
        """
        user_profile = self.request.user.employeeprofile
        queryset = self.queryset.filter(tenant=user_profile.tenant)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def perform_create(self, serializer):
        """
        Ensures that even if an Owner manually fires a POST request,
        the system forces the tenant context automatically.
        """
        user_profile = self.request.user.employeeprofile
        serializer.save(tenant=user_profile.tenant)

class AdvancePaymentViewSet(viewsets.ModelViewSet):
    queryset =AdvancePayment.objects.all()
    serializer_class = AdvancePaymentSerializer
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        user_profile = self.request.user.employeeprofile
        queryset = self.queryset.filter(tenant=user_profile.tenant)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def perform_create(self, serializer):
        user_profile = self.request.user.employeeprofile
        serializer.save(tenant=user_profile.tenant)

class ReimbursementViewSet(viewsets.ModelViewSet):
    queryset = Reimbursement.objects.all()
    serializer_class = ReimbursementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.employeeprofile
        queryset = self.queryset.filter(tenant=user_profile.tenant)

        if user_profile.role not in ["OWNER","HR"]:
            queryset = queryset.filter(employee=user_profile)

        else:
            employee_param = self.request.query_params.get('employee')
            if employee_param:
                queryset = queryset.filter(employee_id=employee_param)
        
        return queryset

    def perform_create(self, serializer):
        user_profile = self.request.user.employeeprofile
        serializer.save(tenant=user_profile.tenant)



class AttendanceLogViewSet(viewsets.ModelViewSet):
    serializer_class = AttendenceSerializer
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'employeeprofile', None)
        if not profile:
            return AttendanceLog.objects.none()
        
        if profile.role in ['OWNER', 'HR']:
            queryset = AttendanceLog.objects.filter(tenant=profile.tenant)
        else:
            queryset = AttendanceLog.objects.filter(tenant=profile.tenant, employee=profile)

        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)

        employee_param = self.request.query_params.get('employee')
        if employee_param:
            queryset = queryset.filter(employee_id=employee_param)

        month_param = self.request.query_params.get('month')
        year_param = self.request.query_params.get('year')
        if month_param:
            queryset = queryset.filter(date__month=month_param)
        if year_param:
            queryset = queryset.filter(date__year=year_param)

        return queryset

    def perform_create(self, serializer):
        profile = self.request.user.employeeprofile
        serializer.save(tenant=profile.tenant)
   

class MonthlySalaryRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlySalarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'employeeprofile',None)
        if not profile:
            return MonthlySalaryRecord.objects.none()

        if profile.role in ['OWNER', 'HR']:
            queryset = MonthlySalaryRecord.objects.filter(tenant=profile.tenant)
        else:
            queryset = MonthlySalaryRecord.objects.filter(employee=profile, tenant=profile.tenant)

        employee_param = self.request.query_params.get('employee')
        if employee_param:
            queryset = queryset.filter(employee_id=employee_param)

        return queryset


    def perform_create(self,serializer):
        profile = self.request.user.employeeprofile
        serializer.save(tenant= profile.tenant)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_as_paid(self, request, pk=None):
        """
        Custom action: POST /api/payroll/salary-records/{id}/mark-paid/
        Marks payroll status to PAID and closes pending advances & reimbursements.
        """
        salary_record = self.get_object()

        if salary_record.status == 'PAID':
            return Response({'error': 'This payroll record is already marked as PAID.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 1. Update salary record status
            salary_record.status = 'PAID'
            salary_record.payment_date = timezone.now().date()
            salary_record.save()

            # 2. Mark linked approved reimbursements as processed
            Reimbursement.objects.filter(
                tenant=salary_record.tenant,
                employee=salary_record.employee,
                status='APPROVED',
                is_processed_in_salary=False
            ).update(is_processed_in_salary=True, status='PAID_WITH_PAYROLL')

            # 3. Mark linked advance payments as fully recovered
            AdvancePayment.objects.filter(
                tenant=salary_record.tenant,
                employee=salary_record.employee,
                status='APPROVED'
            ).update(status='DEDUCTED')

        return Response({'message': 'Payroll successfully processed and marked as PAID.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='pdf-stream')
    def pdf_stream(self, request, pk=None):
        """
        Custom action: GET /api/payroll/salary-records/{id}/pdf-stream/
        Renders HTML template into an in-memory PDF buffer using WeasyPrint (or xhtml2pdf fallback)
        and streams it back inline.
        """
        import base64
        import calendar
        import os
        from io import BytesIO
        from decimal import Decimal
        from django.conf import settings
        from django.http import HttpResponse
        from django.template.loader import render_to_string

        salary_record = self.get_object()
        employee = salary_record.employee
        tenant = salary_record.tenant

        # Load company logo from backend-DRF/assets/logo.png
        logo_base64 = ""
        logo_path = os.path.join(settings.BASE_DIR, 'assets', 'logo.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as logo_file:
                logo_base64 = base64.b64encode(logo_file.read()).decode('utf-8')

        month_name = dict(MonthlySalaryRecord.MONTH_CHOICES).get(salary_record.month, f"Month {salary_record.month}")

        # Fetch attendance logs for this employee & pay cycle
        attendance_logs = AttendanceLog.objects.filter(
            tenant=tenant,
            employee=employee,
            date__month=salary_record.month,
            date__year=salary_record.year
        )
        
        # Build attendance lookup map: { day_number: log }
        att_map = {}
        for log in attendance_logs:
            if log.date:
                att_map[log.date.day] = log

        year_val = salary_record.year or 2026
        month_val = salary_record.month or 1
        first_weekday, num_days = calendar.monthrange(year_val, month_val)
        
        grid_items = []
        counts = {'Present': 0, 'LOP': 0, 'Absent': 0, 'Holiday': 0, 'Leave': 0}
        
        for _ in range(first_weekday):
            grid_items.append({'day': '', 'code': 'EMPTY', 'is_empty': True})

        for d in range(1, num_days + 1):
            log = att_map.get(d)
            if log:
                status_str = log.status
                if log.is_lop:
                    code = 'LOP'
                    counts['LOP'] += 1
                elif status_str in ('Present', 'Late'):
                    code = 'P'
                    counts['Present'] += 1
                elif status_str == 'Absent':
                    code = 'A'
                    counts['Absent'] += 1
                elif status_str == 'Holiday':
                    code = 'H'
                    counts['Holiday'] += 1
                elif status_str == 'Leave':
                    code = 'L'
                    counts['Leave'] += 1
                else:
                    code = 'P'
                    counts['Present'] += 1
            else:
                code = 'P'
                counts['Present'] += 1

            grid_items.append({'day': d, 'code': code, 'is_empty': False})

        while len(grid_items) % 7 != 0:
            grid_items.append({'day': '', 'code': 'EMPTY', 'is_empty': True})

        calendar_weeks = [grid_items[i:i + 7] for i in range(0, len(grid_items), 7)]
        calendar_grid = [item for item in grid_items if not item['is_empty']]

        # Format currency helper function
        def fmt(val):
            if val is None:
                return "0.00"
            try:
                return f"{Decimal(str(val)):,.2f}"
            except Exception:
                return f"{val}"

        formatted_record = {
            'basic_salary': fmt(salary_record.basic_salary),
            'house_rent_allowence': fmt(salary_record.house_rent_allowence),
            'conveyance_allowence': fmt(salary_record.conveyance_allowence),
            'phone_allowence': fmt(salary_record.phone_allowence),
            'medical_allowence': fmt(salary_record.medical_allowence),
            'special_allowence': fmt(salary_record.special_allowence),
            'approved_reimbursements': fmt(salary_record.approved_reimbursements),
            'gross_salary': fmt(salary_record.gross_salary),

            'deductions_EPF': fmt(salary_record.deductions_EPF),
            'deductions_ESI': fmt(salary_record.deductions_ESI),
            'deductions_TDS': fmt(salary_record.deductions_TDS),
            'deductions_professional_tax': fmt(salary_record.deductions_professional_tax),
            'deductions_other': fmt(salary_record.deductions_other),
            'lop_days': salary_record.lop_days or counts['LOP'],
            'lop_deductions': fmt(salary_record.lop_deductions),
            'advances_deducted': fmt(salary_record.advances_deducted),
            'total_deductions': fmt(salary_record.total_deductions),

            'net_salary': fmt(salary_record.net_salary),
            'employer_epf': fmt(salary_record.employer_epf),
            'employer_esi': fmt(salary_record.employer_esi),
            'cost_to_company': fmt(salary_record.cost_to_company),

            'status': salary_record.status,
            'payment_type': salary_record.payment_type or 'BANK_TRANSFER',
            'payment_date': salary_record.payment_date or 'N/A',
            'year': salary_record.year,
            'month': salary_record.month,
        }

        context = {
            'record': salary_record,
            'fmt_rec': formatted_record,
            'employee': employee,
            'tenant': tenant,
            'logo_base64': logo_base64,
            'month_name': month_name,
            'calendar_weeks': calendar_weeks,
            'calendar_grid': calendar_grid,
            'att_counts': counts,
        }

        template_name = 'payslip_minimal_corporate.html'
        html_string = render_to_string(template_name, context)

        pdf_buffer = None

        # 1. Try WeasyPrint first
        try:
            import weasyprint
            pdf_buffer = weasyprint.HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()
        except Exception:
            # 2. Fallback to xhtml2pdf (works natively on Windows without C-library dependencies)
            from xhtml2pdf import pisa
            result_stream = BytesIO()
            pisa_status = pisa.pisaDocument(BytesIO(html_string.encode('utf-8')), result_stream)
            if not pisa_status.err:
                pdf_buffer = result_stream.getvalue()
            else:
                return HttpResponse("HTML to PDF rendering failed.", status=500)

        emp_email = employee.user.email.split('@')[0] if employee.user and employee.user.email else 'employee'
        filename = f"Payslip_{emp_email}_{salary_record.month}_{salary_record.year}.pdf"

        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response