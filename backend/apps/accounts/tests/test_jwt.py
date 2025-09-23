import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_jwt_token_obtain():
    User.objects.create_user(username="jwtuser", password="pass")
    client = APIClient()
    res = client.post(
        "/api/auth/token/",
        {"username": "jwtuser", "password": "pass"},
        format="json",
    )
    assert res.status_code == 200
    body = res.json()
    assert "access" in body and "refresh" in body
