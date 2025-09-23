import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def user():
    return User.objects.create_user(username="user", password="pass")


def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


def test_create_and_retrieve_asset(api_client, user):
    client = auth_client(api_client, user)
    res = client.post(
        "/api/assets/",
        {"name": "House A", "address": "Via Roma 1", "description": "Nice"},
        format="json",
    )
    assert res.status_code == 201
    asset_id = res.data["id"]

    res = client.get("/api/assets/")
    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]["id"] == asset_id


def test_only_owner_can_access_assets(api_client, user):
    other = User.objects.create_user(username="other", password="pass")
    client = auth_client(api_client, user)
    res = client.post(
        "/api/assets/",
        {"name": "House B"},
        format="json",
    )
    assert res.status_code == 201

    client2 = auth_client(APIClient(), other)
    res2 = client2.get("/api/assets/")
    assert res2.status_code == 200
    assert len(res2.data) == 0


def test_healthcheck(api_client):
    res = api_client.get("/health/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
