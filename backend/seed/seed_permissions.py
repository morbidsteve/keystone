"""Seed RBAC permissions into the permissions table."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rbac import Permission

PERMISSIONS = [
    # Dashboard
    {"code": "dashboard:view", "display_name": "View Dashboard", "category": "Dashboard"},
    # Map
    {"code": "map:view", "display_name": "View Map", "category": "Map"},
    # Supply
    {"code": "supply:view", "display_name": "View Supply", "category": "Supply"},
    {"code": "supply:edit", "display_name": "Edit Supply", "category": "Supply"},
    {"code": "supply:create", "display_name": "Create Supply", "category": "Supply"},
    # Equipment
    {"code": "equipment:view", "display_name": "View Equipment", "category": "Equipment"},
    {"code": "equipment:edit", "display_name": "Edit Equipment", "category": "Equipment"},
    {"code": "equipment:create", "display_name": "Create Equipment", "category": "Equipment"},
    # Maintenance
    {"code": "maintenance:view", "display_name": "View Maintenance", "category": "Maintenance"},
    {"code": "maintenance:create", "display_name": "Create Work Orders", "category": "Maintenance"},
    {"code": "maintenance:edit", "display_name": "Edit Work Orders", "category": "Maintenance"},
    # Requisitions
    {"code": "requisitions:view", "display_name": "View Requisitions", "category": "Requisitions"},
    {"code": "requisitions:create", "display_name": "Create Requisitions", "category": "Requisitions"},
    {"code": "requisitions:edit", "display_name": "Edit Requisitions", "category": "Requisitions"},
    {"code": "requisitions:approve", "display_name": "Approve Requisitions", "category": "Requisitions"},
    # Personnel
    {"code": "personnel:view", "display_name": "View Personnel", "category": "Personnel"},
    {"code": "personnel:edit", "display_name": "Edit Personnel", "category": "Personnel"},
    # Readiness
    {"code": "readiness:view", "display_name": "View Readiness", "category": "Readiness"},
    {"code": "readiness:edit", "display_name": "Edit Readiness", "category": "Readiness"},
    {"code": "readiness:create", "display_name": "Create Readiness", "category": "Readiness"},
    # Medical
    {"code": "medical:view", "display_name": "View Medical", "category": "Medical"},
    {"code": "medical:edit", "display_name": "Edit Medical", "category": "Medical"},
    # Fuel
    {"code": "fuel:view", "display_name": "View Fuel", "category": "Fuel"},
    {"code": "fuel:edit", "display_name": "Edit Fuel", "category": "Fuel"},
    # Custody
    {"code": "custody:view", "display_name": "View Chain of Custody", "category": "Custody"},
    {"code": "custody:edit", "display_name": "Edit Chain of Custody", "category": "Custody"},
    # Audit
    {"code": "audit:view", "display_name": "View Audit Log", "category": "Audit"},
    # Transportation
    {"code": "transportation:view", "display_name": "View Transportation", "category": "Transportation"},
    {"code": "transportation:edit", "display_name": "Edit Transportation", "category": "Transportation"},
    # Ingestion
    {"code": "ingestion:view", "display_name": "View Ingestion", "category": "Ingestion"},
    {"code": "ingestion:upload", "display_name": "Upload Data", "category": "Ingestion"},
    # Data Sources
    {"code": "data_sources:view", "display_name": "View Data Sources", "category": "Data Sources"},
    {"code": "data_sources:manage", "display_name": "Manage Data Sources", "category": "Data Sources"},
    # Reports
    {"code": "reports:view", "display_name": "View Reports", "category": "Reports"},
    {"code": "reports:generate", "display_name": "Generate Reports", "category": "Reports"},
    # Alerts
    {"code": "alerts:view", "display_name": "View Alerts", "category": "Alerts"},
    {"code": "alerts:acknowledge", "display_name": "Acknowledge Alerts", "category": "Alerts"},
    # Admin
    {"code": "admin:users", "display_name": "Manage Users", "category": "Admin"},
    {"code": "admin:settings", "display_name": "Manage Settings", "category": "Admin"},
    {"code": "admin:roles", "display_name": "Manage Roles", "category": "Admin"},
    # Docs
    {"code": "docs:view", "display_name": "View Documentation", "category": "Docs"},
    # Simulator
    {"code": "simulator:manage", "display_name": "Manage Simulator", "category": "Simulator"},
]


async def seed_permissions(db: AsyncSession) -> int:
    """Insert all permissions if the table is empty. Returns count of inserted rows."""
    existing = await db.execute(select(func.count(Permission.id)))
    if existing.scalar() > 0:
        return 0

    count = 0
    for perm_data in PERMISSIONS:
        perm = Permission(**perm_data)
        db.add(perm)
        count += 1

    await db.flush()
    return count
