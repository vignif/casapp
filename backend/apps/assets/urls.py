from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    AssetViewSet,
    AssetDocumentViewSet,
    MarketValueViewSet,
    TenantViewSet,
    RentalContractViewSet,
    AdminOverviewViewSet,
)

router = DefaultRouter()
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"documents", AssetDocumentViewSet, basename="document")
router.register(r"values", MarketValueViewSet, basename="value")
router.register(r"tenants", TenantViewSet, basename="tenant")
router.register(r"contracts", RentalContractViewSet, basename="contract")
router.register(r"admin/overview", AdminOverviewViewSet, basename="admin-overview")

urlpatterns = [
    path("", include(router.urls)),
]
