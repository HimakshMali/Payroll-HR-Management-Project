from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ai_agent.services import process_search_command
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsOrganizationOwner
# Create your views here.

class AgentSearchBarView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def post(self, request):
        prompt = request.data.get("prompt")
        confirmed = request.data.get("confirmed", False)
        parsed_data = request.data.get("parsed_data", None)

        # Extract current logged-in user's tenant
        user_profile = getattr(request.user, 'employeeprofile', None)
        if not user_profile:
            return Response({"error": "No associated employee profile/tenant found."}, status=status.HTTP_400_BAD_REQUEST)

        # Process command using service
        result = process_search_command(
            tenant=user_profile.tenant,
            promt_text=prompt,
            confirmed=confirmed,
            parsed_data=parsed_data
        )

        if result.get("status") == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)