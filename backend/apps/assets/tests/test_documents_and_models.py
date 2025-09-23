import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date, timedelta

from apps.assets.models import Asset, Tenant, RentalContract

pytestmark = pytest.mark.django_db


@pytest.fixture()
def client():
    return APIClient()


@pytest.fixture()
def user():
    return User.objects.create_user(username="u2", password="pass")


@pytest.fixture()
def asset(user):
    return Asset.objects.create(owner=user, name="DocAsset")


def test_upload_document(client, user, asset):
    client.force_authenticate(user)
    file = SimpleUploadedFile("test.txt", b"hello")
    res = client.post(
        "/api/documents/",
        {"asset": asset.id, "file": file, "description": "bill"},
        format="multipart",
    )
    assert res.status_code == 201
    res = client.get("/api/documents/")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_contract_is_active_property(asset):
    tenant = Tenant.objects.create(asset=asset, full_name="Jane")
    today = date.today()
    c1 = RentalContract.objects.create(
        tenant=tenant, asset=asset, start_date=today - timedelta(days=10), end_date=None, monthly_rent="1.00"
    )
    assert c1.is_active is True

    c2 = RentalContract(
        tenant=tenant, asset=asset, start_date=today - timedelta(days=10), end_date=today - timedelta(days=1), monthly_rent="1.00"
    )
    assert c2.is_active is False
