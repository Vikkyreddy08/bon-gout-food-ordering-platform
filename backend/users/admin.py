from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Add custom fields to list view
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_staff')
    
    # Add filters
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    
    # Add custom fields to fieldsets (for detail view)
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Profile Info', {'fields': ('role', 'phone')}),
    )
    
    # Add custom fields to add user form
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Profile Info', {'fields': ('role', 'phone')}),
    )
    
    # Make role editable in list view
    list_editable = ('role',)
    
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('username',)

    def has_delete_permission(self, request, obj=None):
        return False
