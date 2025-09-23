import pytest
from types import SimpleNamespace
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.assets.models import Asset
from apps.assets.views import IsOwner

pytestmark = pytest.mark.django_db


def test_asset_str():
    u = User.objects.create_user(username="struser", password="pass")
    a = Asset.objects.create(owner=u, name="Villa")
    assert str(a) == "Villa"


def test_isowner_false_branch():
    user = User.objects.create_user(username="u", password="pass")
    other = User.objects.create_user(username="o", password="pass")
    obj = SimpleNamespace(owner=other)
    perm = IsOwner()
    req = SimpleNamespace(user=user)
    assert perm.has_object_permission(req, None, obj) is False


def test_isowner_true_branch():
    user = User.objects.create_user(username="owner", password="pass")
    asset = Asset.objects.create(owner=user, name="X")
    obj = SimpleNamespace(asset=asset)
    perm = IsOwner()
    req = SimpleNamespace(user=user)
    assert perm.has_object_permission(req, None, obj) is True
