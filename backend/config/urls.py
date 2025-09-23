from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(_):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.assets.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("health/", health, name="health"),
]
