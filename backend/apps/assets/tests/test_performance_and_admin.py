import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from datetime import date

from apps.assets.models import Asset, Tenant, RentalContract

pytestmark = pytest.mark.django_db


@pytest.fixture()
def client():
    return APIClient()


@pytest.fixture()
def user():
    return User.objects.create_user(username="u1", password="pass")


@pytest.fixture()
def admin_user():
    return User.objects.create_user(username="admin", password="pass", is_staff=True)


@pytest.fixture()
def owned_asset(user):
    return Asset.objects.create(owner=user, name="A1")


def test_market_values_and_performance(client, user, owned_asset):
    client.force_authenticate(user)
    # create a market value
    res = client.post(
        "/api/values/",
        {"asset": owned_asset.id, "date": date.today().isoformat(), "value": "100000.00"},
        format="json",
    )
    assert res.status_code == 201
    # list to hit get_queryset
    res_list = client.get("/api/values/")
    assert res_list.status_code == 200

    # add a contract (monthly 1000 => annual 12000; perf = 12000/100000=0.12)
    tenant = Tenant.objects.create(asset=owned_asset, full_name="John Doe")
    RentalContract.objects.create(
        tenant=tenant,
        asset=owned_asset,
        start_date=date.today(),
        monthly_rent="1000.00",
    )

    res = client.get(f"/api/assets/{owned_asset.id}/performance/")
    assert res.status_code == 200
    body = res.json()
    assert body["annual_income"] == 12000.0
    assert body["market_value"] == 100000.0
    assert round(body["performance"], 2) == 0.12


def test_admin_overview_requires_staff(client, user, admin_user):
    client.force_authenticate(user)
    res = client.get("/api/admin/overview/")
    assert res.status_code in (401, 403)

    client.force_authenticate(admin_user)
    res = client.get("/api/admin/overview/")
    assert res.status_code == 200
    data = res.json()
    assert set(data.keys()) == {"total_assets", "total_users", "total_contracts", "occupancy_rate"}


def test_tenants_and_contracts_list_endpoints(client, user, owned_asset):
    client.force_authenticate(user)
    # empty lists
    res = client.get("/api/tenants/")
    assert res.status_code == 200 and res.json() == []
    res = client.get("/api/contracts/")
    assert res.status_code == 200 and res.json() == []
