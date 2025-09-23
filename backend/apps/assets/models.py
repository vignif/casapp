from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class Asset(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assets")
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class AssetDocument(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="documents")
    file = models.FileField(upload_to="asset_docs/")
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class MarketValue(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="values")
    date = models.DateField()
    value = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ("asset", "date")
        ordering = ["-date"]


class Tenant(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="tenants")
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)


class RentalContract(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="contracts")
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="contracts")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-start_date"]

    @property
    def is_active(self) -> bool:
        from datetime import date

        return self.start_date <= date.today() and (self.end_date is None or self.end_date >= date.today())
