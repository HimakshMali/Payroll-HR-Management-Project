from accounts.models import User
from django.contrib import admin
from .models import OrganisationProfile, EmployeeProfile, Organisation

# Register your models here.
admin.site.register(OrganisationProfile)
admin.site.register(EmployeeProfile)
admin.site.register(Organisation)
admin.site.register(User)