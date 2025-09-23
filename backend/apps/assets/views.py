from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Asset, AssetDocument, MarketValue, Tenant, RentalContract
from .serializers import (
    AssetSerializer,
    AssetDocumentSerializer,
    MarketValueSerializer,
    TenantSerializer,
    RentalContractSerializer,
)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "owner", None)
        if owner is None and hasattr(obj, "asset"):
            owner = getattr(obj.asset, "owner", None)
        return owner == request.user


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Asset.objects.filter(owner=self.request.user)

    @action(detail=True, methods=["get"]) 
    def performance(self, request, pk=None):
        asset = self.get_object()
        # Simple performance: annualized rent from active contracts / latest market value
        latest_value = asset.values.order_by("-date").first()
        active_contracts = asset.contracts.all()
        annual_income = sum([float(c.monthly_rent) * 12 for c in active_contracts])
        mv = float(latest_value.value) if latest_value else 0.0
        performance = (annual_income / mv) if mv > 0 else 0.0
        return Response({
            "annual_income": annual_income,
            "market_value": mv,
            "performance": performance,
        })


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class AdminOverviewViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def list(self, request):
        total_assets = Asset.objects.count()
        total_users = Asset.objects.values("owner").distinct().count()
        total_contracts = RentalContract.objects.count()
        occupied_assets = Asset.objects.filter(contracts__isnull=False).distinct().count()
        occupancy_rate = (occupied_assets / total_assets) if total_assets else 0
        return Response({
            "total_assets": total_assets,
            "total_users": total_users,
            "total_contracts": total_contracts,
            "occupancy_rate": occupancy_rate,
        })


class AssetDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = AssetDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return AssetDocument.objects.filter(asset__owner=self.request.user)


class MarketValueViewSet(viewsets.ModelViewSet):
    serializer_class = MarketValueSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return MarketValue.objects.filter(asset__owner=self.request.user)


class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Tenant.objects.filter(asset__owner=self.request.user)


class RentalContractViewSet(viewsets.ModelViewSet):
    serializer_class = RentalContractSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return RentalContract.objects.filter(asset__owner=self.request.user)
