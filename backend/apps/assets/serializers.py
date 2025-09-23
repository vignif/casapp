from rest_framework import serializers
from .models import Asset, AssetDocument, MarketValue, Tenant, RentalContract


class AssetDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetDocument
        fields = ["id", "file", "description", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class MarketValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketValue
        fields = ["id", "date", "value"]
        read_only_fields = ["id"]


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "full_name", "email", "phone"]
        read_only_fields = ["id"]


class RentalContractSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = RentalContract
        fields = [
            "id",
            "tenant",
            "asset",
            "start_date",
            "end_date",
            "monthly_rent",
            "deposit",
            "notes",
            "is_active",
        ]
        read_only_fields = ["id", "is_active"]


class AssetSerializer(serializers.ModelSerializer):
    documents = AssetDocumentSerializer(many=True, read_only=True)
    values = MarketValueSerializer(many=True, read_only=True)
    tenants = TenantSerializer(many=True, read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "owner",
            "name",
            "address",
            "description",
            "created_at",
            "documents",
            "values",
            "tenants",
        ]
        read_only_fields = ["id", "created_at", "owner"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["owner"] = request.user
        return super().create(validated_data)
