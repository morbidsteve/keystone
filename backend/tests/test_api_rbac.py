"""Tests for RBAC permission API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rbac import CustomRole, Permission
from app.models.user import User


@pytest.mark.asyncio
class TestPermissionEndpoints:
    """Tests for /api/v1/rbac/permissions endpoints."""

    async def test_list_permissions(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/rbac/permissions returns list for authenticated user."""
        resp = await client.get(
            "/api/v1/rbac/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_permissions_unauthenticated(self, client: AsyncClient):
        """GET /api/v1/rbac/permissions without token returns 401/403."""
        resp = await client.get("/api/v1/rbac/permissions")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestCustomRoleEndpoints:
    """Tests for /api/v1/rbac/roles endpoints."""

    async def test_list_roles_admin(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/rbac/roles as admin returns 200."""
        resp = await client.get(
            "/api/v1/rbac/roles",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_roles_operator_forbidden(
        self, client: AsyncClient, operator_token: str, operator_user: User
    ):
        """GET /api/v1/rbac/roles as operator returns 403."""
        resp = await client.get(
            "/api/v1/rbac/roles",
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert resp.status_code == 403

    async def test_create_role(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """POST /api/v1/rbac/roles creates a custom role."""
        # Create a permission first
        perm = Permission(
            code="test:action",
            display_name="Test Action",
            category="test",
            description="A test permission",
        )
        db_session.add(perm)
        await db_session.flush()
        await db_session.refresh(perm)

        resp = await client.post(
            "/api/v1/rbac/roles",
            json={
                "name": "Test Custom Role",
                "description": "A role for testing",
                "permission_ids": [perm.id],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Custom Role"

    async def test_create_role_duplicate_name(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """POST /api/v1/rbac/roles with duplicate name returns 409."""
        role = CustomRole(
            name="Existing Role",
            description="Already exists",
            is_system=False,
            created_by_user_id=admin_user.id,
        )
        db_session.add(role)
        await db_session.flush()

        resp = await client.post(
            "/api/v1/rbac/roles",
            json={
                "name": "Existing Role",
                "description": "Duplicate",
                "permission_ids": [],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 409

    async def test_get_role(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """GET /api/v1/rbac/roles/{id} returns the custom role."""
        role = CustomRole(
            name="Fetch Me Role",
            description="Fetchable",
            is_system=False,
            created_by_user_id=admin_user.id,
        )
        db_session.add(role)
        await db_session.flush()
        await db_session.refresh(role)

        resp = await client.get(
            f"/api/v1/rbac/roles/{role.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Fetch Me Role"

    async def test_get_role_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/rbac/roles/99999 returns 404."""
        resp = await client.get(
            "/api/v1/rbac/roles/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404

    async def test_update_role(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """PUT /api/v1/rbac/roles/{id} updates the role."""
        role = CustomRole(
            name="Update Me",
            description="Before update",
            is_system=False,
            created_by_user_id=admin_user.id,
        )
        db_session.add(role)
        await db_session.flush()
        await db_session.refresh(role)

        resp = await client.put(
            f"/api/v1/rbac/roles/{role.id}",
            json={"name": "Updated Name", "description": "After update"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    async def test_update_system_role_forbidden(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """PUT /api/v1/rbac/roles/{id} for system role returns 403."""
        role = CustomRole(
            name="System Role",
            description="Immutable",
            is_system=True,
            created_by_user_id=admin_user.id,
        )
        db_session.add(role)
        await db_session.flush()
        await db_session.refresh(role)

        resp = await client.put(
            f"/api/v1/rbac/roles/{role.id}",
            json={"name": "Hacked Name"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 403

    async def test_delete_role(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """DELETE /api/v1/rbac/roles/{id} removes a non-system role."""
        role = CustomRole(
            name="Delete Me Role",
            description="Ephemeral",
            is_system=False,
            created_by_user_id=admin_user.id,
        )
        db_session.add(role)
        await db_session.flush()
        await db_session.refresh(role)

        resp = await client.delete(
            f"/api/v1/rbac/roles/{role.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 204

    async def test_delete_system_role_forbidden(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        db_session: AsyncSession,
    ):
        """DELETE /api/v1/rbac/roles/{id} for system role returns 403."""
        role = CustomRole(
            name="Protected System Role",
            description="Cannot delete",
            is_system=True,
            created_by_user_id=admin_user.id,
        )
        db_session.add(role)
        await db_session.flush()
        await db_session.refresh(role)

        resp = await client.delete(
            f"/api/v1/rbac/roles/{role.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestUserPermissionEndpoints:
    """Tests for /api/v1/rbac/users/{id}/permissions endpoints."""

    async def test_get_own_permissions(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/rbac/users/{id}/permissions for self returns 200."""
        resp = await client.get(
            f"/api/v1/rbac/users/{admin_user.id}/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "role_name" in data
        assert "permissions" in data
        assert isinstance(data["permissions"], list)

    async def test_get_other_user_permissions_as_admin(
        self,
        client: AsyncClient,
        admin_token: str,
        admin_user: User,
        operator_user: User,
    ):
        """Admin can view another user's permissions."""
        resp = await client.get(
            f"/api/v1/rbac/users/{operator_user.id}/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200

    async def test_get_other_user_permissions_as_operator_forbidden(
        self,
        client: AsyncClient,
        operator_token: str,
        operator_user: User,
        admin_user: User,
    ):
        """Operator cannot view admin's permissions."""
        resp = await client.get(
            f"/api/v1/rbac/users/{admin_user.id}/permissions",
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert resp.status_code == 403

    async def test_get_permissions_user_not_found(
        self, client: AsyncClient, admin_token: str, admin_user: User
    ):
        """GET /api/v1/rbac/users/99999/permissions returns 404."""
        resp = await client.get(
            "/api/v1/rbac/users/99999/permissions",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 404
