from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsOrganizationOwner
from accounts.models import Organisation
from ai_agent.services import process_search_command
from ai_agent.models import AgentActivity, AgentHistory
from ai_agent.serializers import AgentActivitySerializer, AgentHistorySerializer

class AgentSearchBarView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def post(self, request):
        prompt = request.data.get("prompt")
        confirmed = request.data.get("confirmed", False)
        parsed_data = request.data.get("parsed_data", None)

        user_profile = getattr(request.user, 'employeeprofile', None)
        if not user_profile:
            return Response({"error": "No associated employee profile/tenant found."}, status=status.HTTP_400_BAD_REQUEST)

        result = process_search_command(
            tenant=user_profile.tenant,
            promt_text=prompt,
            confirmed=confirmed,
            parsed_data=parsed_data,
            channel='SEARCH_BAR'
        )

        if result.get("status") == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)


class AgentActivityListView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def get(self, request):
        user_profile = getattr(request.user, 'employeeprofile', None)
        tenant = user_profile.tenant if user_profile else Organisation.objects.first()

        if not tenant:
            return Response([], status=status.HTTP_200_OK)

        activities = AgentActivity.objects.filter(tenant=tenant)[:15]
        serializer = AgentActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentActivityRejectView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def post(self, request, pk):
        user_profile = getattr(request.user, 'employeeprofile', None)
        tenant = user_profile.tenant if user_profile else Organisation.objects.first()

        activity = get_object_or_404(AgentActivity, pk=pk, tenant=tenant)

        # Permanently delete original database object (Reimbursement or AdvancePayment)
        if activity.reimbursement:
            activity.reimbursement.delete()
            activity.reimbursement = None
        elif activity.advance_payment:
            activity.advance_payment.delete()
            activity.advance_payment = None

        activity.status = 'REJECTED'
        activity.save()

        serializer = AgentActivitySerializer(activity)
        return Response({
            "message": "Activity rejected and associated payroll record deleted successfully.",
            "activity": serializer.data
        }, status=status.HTTP_200_OK)