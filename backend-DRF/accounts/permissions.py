from rest_framework import permissions

class IsOrganizationOwner(permissions.BasePermission):
    """
    Tactical security guard: Intercepts incoming requests at the controller layer.
    Allows standard users to READ information but strictly restricts 
    mutations (Create, Update, Delete) to the organization OWNER.
    """

    def has_permission(self, request, view):
        # 1. Ensure the user is authenticated in the first place
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. Extract the attached employment profile
        if not hasattr(request.user, 'employeeprofile'):
            return False
            
        active_profile = request.user.employeeprofile

        # 3. Safe methods (GET, HEAD, OPTIONS) are open to everyone in the tenant
        if request.method in permissions.SAFE_METHODS:
            return True

        # 4. Dangerous methods (POST, PUT, PATCH, DELETE) strictly demand OWNER role
        return active_profile.role == 'OWNER'