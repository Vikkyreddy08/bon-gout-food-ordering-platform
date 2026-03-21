from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from django.db import connection
from django.db.utils import OperationalError

def health_check(request):
    db_status = "ok"
    try:
        connection.ensure_connection()
    except OperationalError:
        db_status = "disconnected"
    
    return JsonResponse({
        "status": "ok", 
        "message": "Backend is running",
        "database": db_status
    })

urlpatterns = [
    path('health/', health_check),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),  # ✅ Added users app
    path('api/restaurant/', include('restaurant.urls')),  # ✅ restaurant app APIs
]

# ✅ Serve media files in development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
