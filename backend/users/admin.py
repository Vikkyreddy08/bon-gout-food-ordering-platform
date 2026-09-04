from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, OTP, EmailOTP, LoginHistory, OTPAttempt

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

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ('phone', 'is_verified', 'expires_at', 'last_sent_at')
    list_filter = ('is_verified',)
    search_fields = ('phone',)

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_verified', 'expires_at', 'last_sent_at')
    list_filter = ('is_verified',)
    search_fields = ('email',)

@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'login_method', 'login_time', 'ip_address', 'success')
    list_filter = ('login_method', 'success', 'login_time')
    search_fields = ('user__username', 'user__email', 'ip_address')

@admin.register(OTPAttempt)
class OTPAttemptAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'attempt_type', 'attempts', 'last_attempt_at', 'cooldown_until')
    list_filter = ('attempt_type',)
    search_fields = ('identifier',)
