"""Initial schema — creates all application tables.

This migration establishes the complete KEYSTONE database schema (76 tables).

For **existing databases** where tables were created by Base.metadata.create_all(),
run the following to mark this migration as already applied without executing it:

    alembic stamp 002_initial_schema

For **new/empty databases**, run normally:

    alembic upgrade head

Revision ID: 002_initial_schema
Revises: 001_add_echelons
Create Date: 2026-03-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = "002_initial_schema"
down_revision: Union[str, None] = "001_add_echelons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------------------------
    # Enum types (PostgreSQL native enums used by the models)
    # ---------------------------------------------------------------------------
    # NOTE: These are created implicitly by sa.Enum columns in create_table,
    # but we define them explicitly so they can be referenced and managed.

    # --- Independent / root tables (no foreign keys to other app tables) ---

    op.create_table(
        "units",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("abbreviation", sa.String(length=50), nullable=True),
        sa.Column("uic", sa.String(length=20), nullable=True),
        sa.Column("echelon", sa.String(length=50), nullable=True),
        sa.Column("unit_type", sa.String(length=100), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("commander_name", sa.String(length=200), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("mgrs", sa.String(length=30), nullable=True),
        sa.Column("mil_symbol_sidc", sa.String(length=30), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["parent_id"], ["units.id"]),
    )
    op.create_index("ix_units_uic", "units", ["uic"], unique=True)
    op.create_index("ix_units_parent_id", "units", ["parent_id"])

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=200), nullable=True),
        sa.Column("hashed_password", sa.String(length=200), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column("custom_role_id", sa.Integer(), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "custom_roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("base_role", sa.String(length=50), nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )
    op.create_index("ix_custom_roles_name", "custom_roles", ["name"], unique=True)

    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("resource", sa.String(length=100), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_permissions_name", "permissions", ["name"], unique=True)

    op.create_table(
        "role_permissions",
        sa.Column("custom_role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["custom_role_id"], ["custom_roles.id"]),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
        sa.PrimaryKeyConstraint("custom_role_id", "permission_id"),
    )

    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_system_settings_key", "system_settings", ["key"], unique=True)

    op.create_table(
        "readiness_thresholds",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("metric_name", sa.String(length=100), nullable=False),
        sa.Column("green_min", sa.Float(), nullable=False),
        sa.Column("amber_min", sa.Float(), nullable=False),
        sa.Column("red_min", sa.Float(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "canonical_fields",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("field_name", sa.String(length=100), nullable=False),
        sa.Column("display_name", sa.String(length=200), nullable=True),
        sa.Column("data_type", sa.String(length=50), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_required", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
        sa.Column("validation_regex", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_canonical_fields_field_name",
        "canonical_fields",
        ["field_name"],
        unique=True,
    )

    # --- Catalog tables ---

    op.create_table(
        "equipment_catalog",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tamcn", sa.String(length=20), nullable=False),
        sa.Column("niin", sa.String(length=20), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("subcategory", sa.String(length=100), nullable=True),
        sa.Column("equipment_type", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_equipment_catalog_tamcn", "equipment_catalog", ["tamcn"], unique=True
    )

    op.create_table(
        "supply_catalog",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nsn", sa.String(length=20), nullable=True),
        sa.Column("niin", sa.String(length=20), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=False),
        sa.Column("supply_class", sa.String(length=20), nullable=False),
        sa.Column("unit_of_issue", sa.String(length=20), nullable=True),
        sa.Column("unit_price", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "ammunition_catalog",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("dodic", sa.String(length=10), nullable=False),
        sa.Column("nomenclature", sa.String(length=300), nullable=False),
        sa.Column("caliber", sa.String(length=50), nullable=True),
        sa.Column("ammunition_type", sa.String(length=100), nullable=True),
        sa.Column("unit_of_issue", sa.String(length=20), nullable=True),
        sa.Column("weight_per_round_lbs", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ammunition_catalog_dodic", "ammunition_catalog", ["dodic"], unique=True
    )

    # --- Data management tables ---

    op.create_table(
        "data_templates",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_type", sa.String(length=50), nullable=True),
        sa.Column("field_mappings", sa.JSON(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    op.create_table(
        "data_sources",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("connection_config", sa.JSON(), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    op.create_table(
        "raw_data",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_name", sa.String(length=200), nullable=True),
        sa.Column("file_name", sa.String(length=500), nullable=True),
        sa.Column("raw_content", sa.JSON(), nullable=True),
        sa.Column("parse_status", sa.String(length=50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("uploaded_by_id", sa.Integer(), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "processed_files",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("data_source_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=500), nullable=False),
        sa.Column("file_hash", sa.String(length=64), nullable=True),
        sa.Column("records_processed", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "processed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"]),
    )

    op.create_table(
        "tak_connections",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("host", sa.String(length=200), nullable=False),
        sa.Column("port", sa.Integer(), nullable=False),
        sa.Column("protocol", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("last_connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    # --- Supply & logistics ---

    op.create_table(
        "supply_statuses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("supply_class", sa.String(length=20), nullable=False),
        sa.Column("item_name", sa.String(length=300), nullable=True),
        sa.Column("nsn", sa.String(length=20), nullable=True),
        sa.Column("on_hand_qty", sa.Float(), nullable=True),
        sa.Column("required_qty", sa.Float(), nullable=True),
        sa.Column("dos", sa.Float(), nullable=True),
        sa.Column("consumption_rate", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column(
            "reported_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )
    op.create_index("ix_supply_statuses_unit_id", "supply_statuses", ["unit_id"])

    op.create_table(
        "equipment",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("tamcn", sa.String(length=20), nullable=True),
        sa.Column("niin", sa.String(length=20), nullable=True),
        sa.Column("serial_number", sa.String(length=100), nullable=True),
        sa.Column("bumper_number", sa.String(length=50), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )
    op.create_index("ix_equipment_unit_id", "equipment", ["unit_id"])

    op.create_table(
        "equipment_statuses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=True),
        sa.Column("tamcn", sa.String(length=20), nullable=True),
        sa.Column(
            "total_possessed", sa.Integer(), nullable=True, server_default=sa.text("0")
        ),
        sa.Column(
            "total_required", sa.Integer(), nullable=True, server_default=sa.text("0")
        ),
        sa.Column(
            "mission_capable", sa.Integer(), nullable=True, server_default=sa.text("0")
        ),
        sa.Column(
            "not_mission_capable_maintenance",
            sa.Integer(),
            nullable=True,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "not_mission_capable_supply",
            sa.Integer(),
            nullable=True,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "reported_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
    )
    op.create_index("ix_equipment_statuses_unit_id", "equipment_statuses", ["unit_id"])

    op.create_table(
        "equipment_faults",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("fault_description", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=True),
        sa.Column("reported_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "resolved", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["reported_by_id"], ["users.id"]),
    )

    op.create_table(
        "equipment_driver_assignments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("unassigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["driver_id"], ["users.id"]),
    )

    # --- Transportation / movements ---

    op.create_table(
        "movements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("movement_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("origin", sa.String(length=200), nullable=True),
        sa.Column("destination", sa.String(length=200), nullable=True),
        sa.Column("departure_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("arrival_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("vehicle_count", sa.Integer(), nullable=True),
        sa.Column("personnel_count", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )
    op.create_index("ix_movements_unit_id", "movements", ["unit_id"])

    # --- Convoy planning ---

    op.create_table(
        "convoy_plans",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("movement_id", sa.Integer(), nullable=True),
        sa.Column("risk_level", sa.String(length=50), nullable=True),
        sa.Column("planned_departure", sa.DateTime(timezone=True), nullable=True),
        sa.Column("planned_arrival", sa.DateTime(timezone=True), nullable=True),
        sa.Column("route_description", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["movement_id"], ["movements.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    op.create_table(
        "convoy_serials",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("convoy_plan_id", sa.Integer(), nullable=False),
        sa.Column("serial_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=True),
        sa.Column("order_in_convoy", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["convoy_plan_id"], ["convoy_plans.id"]),
    )

    op.create_table(
        "lift_requests",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("convoy_plan_id", sa.Integer(), nullable=True),
        sa.Column("requesting_unit_id", sa.Integer(), nullable=False),
        sa.Column("priority", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("cargo_type", sa.String(length=50), nullable=True),
        sa.Column("cargo_description", sa.Text(), nullable=True),
        sa.Column("weight_lbs", sa.Float(), nullable=True),
        sa.Column("cube_ft3", sa.Float(), nullable=True),
        sa.Column("pax_count", sa.Integer(), nullable=True),
        sa.Column("origin", sa.String(length=200), nullable=True),
        sa.Column("destination", sa.String(length=200), nullable=True),
        sa.Column("required_delivery_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["convoy_plan_id"], ["convoy_plans.id"]),
        sa.ForeignKeyConstraint(["requesting_unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    op.create_table(
        "convoy_vehicles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("convoy_serial_id", sa.Integer(), nullable=True),
        sa.Column("equipment_id", sa.Integer(), nullable=True),
        sa.Column("movement_id", sa.Integer(), nullable=True),
        sa.Column("position_in_serial", sa.Integer(), nullable=True),
        sa.Column("callsign", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["convoy_serial_id"], ["convoy_serials.id"]),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["movement_id"], ["movements.id"]),
    )

    op.create_table(
        "convoy_cargo",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("convoy_vehicle_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("weight_lbs", sa.Float(), nullable=True),
        sa.Column("cube_ft3", sa.Float(), nullable=True),
        sa.Column(
            "hazmat", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["convoy_vehicle_id"], ["convoy_vehicles.id"]),
    )

    # --- Personnel ---

    op.create_table(
        "personnel",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("edipi", sa.String(length=20), nullable=True),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("middle_initial", sa.String(length=5), nullable=True),
        sa.Column("rank", sa.String(length=20), nullable=True),
        sa.Column("pay_grade", sa.String(length=10), nullable=True),
        sa.Column("mos", sa.String(length=10), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("duty_status", sa.String(length=50), nullable=True),
        sa.Column("blood_type", sa.String(length=10), nullable=True),
        sa.Column("security_clearance", sa.String(length=50), nullable=True),
        sa.Column("rifle_qualification", sa.String(length=50), nullable=True),
        sa.Column("swim_qualification", sa.String(length=50), nullable=True),
        sa.Column("current_movement_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["current_movement_id"], ["movements.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_personnel_edipi", "personnel", ["edipi"], unique=True)
    op.create_index("ix_personnel_unit_id", "personnel", ["unit_id"])

    op.create_table(
        "weapons",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("personnel_id", sa.Integer(), nullable=False),
        sa.Column("weapon_type", sa.String(length=100), nullable=False),
        sa.Column("serial_number", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["personnel_id"], ["personnel.id"]),
    )

    op.create_table(
        "ammo_loads",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("personnel_id", sa.Integer(), nullable=False),
        sa.Column("ammunition_type", sa.String(length=100), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["personnel_id"], ["personnel.id"]),
    )

    op.create_table(
        "convoy_personnel",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("convoy_vehicle_id", sa.Integer(), nullable=False),
        sa.Column("personnel_id", sa.Integer(), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["convoy_vehicle_id"], ["convoy_vehicles.id"]),
        sa.ForeignKeyConstraint(["personnel_id"], ["personnel.id"]),
    )

    # --- Manning ---

    op.create_table(
        "billet_structures",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("mos", sa.String(length=10), nullable=False),
        sa.Column("pay_grade", sa.String(length=10), nullable=False),
        sa.Column("billet_count", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "manning_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("authorized", sa.Integer(), nullable=False),
        sa.Column("assigned", sa.Integer(), nullable=False),
        sa.Column("present_for_duty", sa.Integer(), nullable=True),
        sa.Column("snapshot_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "qualifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("personnel_id", sa.Integer(), nullable=False),
        sa.Column("qualification_type", sa.String(length=100), nullable=False),
        sa.Column("qualification_name", sa.String(length=200), nullable=False),
        sa.Column("expiration_date", sa.Date(), nullable=True),
        sa.Column(
            "is_current", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["personnel_id"], ["personnel.id"]),
    )

    # --- Alerts & notifications ---

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("alert_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column(
            "acknowledged", sa.Boolean(), nullable=True, server_default=sa.text("false")
        ),
        sa.Column("acknowledged_by_id", sa.Integer(), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rule_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["acknowledged_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["rule_id"], ["alert_rules.id"]),
    )
    op.create_index("ix_alerts_unit_id", "alerts", ["unit_id"])
    op.create_index("ix_alerts_severity", "alerts", ["severity"])

    op.create_table(
        "alert_rules",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("alert_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("field", sa.String(length=100), nullable=True),
        sa.Column("operator", sa.String(length=50), nullable=True),
        sa.Column("threshold", sa.Float(), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column("scope_type", sa.String(length=50), nullable=True),
        sa.Column("scope_echelon", sa.String(length=50), nullable=True),
        sa.Column(
            "include_subordinates",
            sa.Boolean(),
            nullable=True,
            server_default=sa.text("true"),
        ),
        sa.Column("metric_type", sa.String(length=50), nullable=True),
        sa.Column("metric_item_filter", sa.String(length=200), nullable=True),
        sa.Column("notify_roles", sa.JSON(), nullable=True),
        sa.Column("check_interval_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "auto_recommend",
            sa.Boolean(),
            nullable=True,
            server_default=sa.text("false"),
        ),
        sa.Column("recommend_type", sa.String(length=50), nullable=True),
        sa.Column("recommend_source_unit_id", sa.Integer(), nullable=True),
        sa.Column("recommend_assign_to_role", sa.String(length=50), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["recommend_source_unit_id"], ["units.id"]),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("alert_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("channel", sa.String(length=50), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["alert_id"], ["alerts.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("alert_type", sa.String(length=50), nullable=True),
        sa.Column("channel", sa.String(length=50), nullable=True),
        sa.Column(
            "is_enabled", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    # --- Maintenance ---

    op.create_table(
        "maintenance_work_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("work_order_number", sa.String(length=50), nullable=True),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("echelon_of_maintenance", sa.String(length=50), nullable=True),
        sa.Column("maintenance_level", sa.String(length=50), nullable=True),
        sa.Column("assigned_to_id", sa.Integer(), nullable=True),
        sa.Column(
            "opened_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("estimated_completion", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"]),
    )
    op.create_index(
        "ix_maintenance_work_orders_work_order_number",
        "maintenance_work_orders",
        ["work_order_number"],
        unique=True,
    )
    op.create_index(
        "ix_maintenance_work_orders_assigned_to_id",
        "maintenance_work_orders",
        ["assigned_to_id"],
    )

    op.create_table(
        "maintenance_parts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("work_order_id", sa.Integer(), nullable=False),
        sa.Column("part_number", sa.String(length=50), nullable=True),
        sa.Column("nsn", sa.String(length=20), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=True),
        sa.Column("quantity_needed", sa.Integer(), nullable=True),
        sa.Column("quantity_on_hand", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["work_order_id"], ["maintenance_work_orders.id"]),
    )

    op.create_table(
        "maintenance_labor",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("work_order_id", sa.Integer(), nullable=False),
        sa.Column("labor_type", sa.String(length=50), nullable=True),
        sa.Column("technician_id", sa.Integer(), nullable=True),
        sa.Column("hours", sa.Float(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("performed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["work_order_id"], ["maintenance_work_orders.id"]),
        sa.ForeignKeyConstraint(["technician_id"], ["users.id"]),
    )

    op.create_table(
        "work_order_assignments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("work_order_id", sa.Integer(), nullable=False),
        sa.Column("assigned_to_id", sa.Integer(), nullable=False),
        sa.Column("assigned_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("unassigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["work_order_id"], ["maintenance_work_orders.id"]),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["assigned_by_id"], ["users.id"]),
    )

    # --- Maintenance scheduling ---

    op.create_table(
        "preventive_maintenance_schedules",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("pm_type", sa.String(length=50), nullable=True),
        sa.Column("interval_hours", sa.Float(), nullable=True),
        sa.Column("interval_miles", sa.Float(), nullable=True),
        sa.Column("interval_days", sa.Integer(), nullable=True),
        sa.Column("last_performed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
    )

    op.create_table(
        "maintenance_deadlines",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "deadlined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("restored_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("work_order_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["work_order_id"], ["maintenance_work_orders.id"]),
    )

    op.create_table(
        "equipment_repair_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=False),
        sa.Column("work_order_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["work_order_id"], ["maintenance_work_orders.id"]),
    )

    # --- Reports ---

    op.create_table(
        "report_templates",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("template_config", sa.JSON(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("classification", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("template_id", sa.Integer(), nullable=True),
        sa.Column("parameters", sa.JSON(), nullable=True),
        sa.Column("content", sa.JSON(), nullable=True),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("generated_by_id", sa.Integer(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["template_id"], ["report_templates.id"]),
        sa.ForeignKeyConstraint(["generated_by_id"], ["users.id"]),
    )

    op.create_table(
        "report_export_destinations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("destination_type", sa.String(length=50), nullable=False),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("auth_type", sa.String(length=50), nullable=True),
        sa.Column("auth_config", sa.JSON(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "report_schedules",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("frequency", sa.String(length=50), nullable=False),
        sa.Column("cron_expression", sa.String(length=100), nullable=True),
        sa.Column("destination_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")
        ),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["template_id"], ["report_templates.id"]),
        sa.ForeignKeyConstraint(["destination_id"], ["report_export_destinations.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
    )

    # --- Locations & routes ---

    op.create_table(
        "locations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("altitude_ft", sa.Float(), nullable=True),
        sa.Column("mgrs", sa.String(length=30), nullable=True),
        sa.Column("heading", sa.Float(), nullable=True),
        sa.Column("speed_knots", sa.Float(), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column(
            "reported_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_locations_entity", "locations", ["entity_type", "entity_id"])

    op.create_table(
        "supply_points",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("point_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("mgrs", sa.String(length=30), nullable=True),
        sa.Column("capacity_tons", sa.Float(), nullable=True),
        sa.Column("current_stock_tons", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "routes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("route_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("origin_id", sa.Integer(), nullable=True),
        sa.Column("destination_id", sa.Integer(), nullable=True),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("estimated_time_hours", sa.Float(), nullable=True),
        sa.Column("waypoints", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["origin_id"], ["supply_points.id"]),
        sa.ForeignKeyConstraint(["destination_id"], ["supply_points.id"]),
    )

    # --- Readiness snapshots ---

    op.create_table(
        "unit_readiness_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("overall_readiness_pct", sa.Float(), nullable=True),
        sa.Column("equipment_readiness_pct", sa.Float(), nullable=True),
        sa.Column("supply_readiness_pct", sa.Float(), nullable=True),
        sa.Column("personnel_readiness_pct", sa.Float(), nullable=True),
        sa.Column("snapshot_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "unit_strengths",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("authorized", sa.Integer(), nullable=True),
        sa.Column("assigned", sa.Integer(), nullable=True),
        sa.Column("present", sa.Integer(), nullable=True),
        sa.Column("deployable", sa.Integer(), nullable=True),
        sa.Column("snapshot_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    # --- Requisitions ---

    op.create_table(
        "requisitions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("document_number", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=True),
        sa.Column("submitted_by_id", sa.Integer(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["submitted_by_id"], ["users.id"]),
    )
    op.create_index(
        "ix_requisitions_document_number",
        "requisitions",
        ["document_number"],
        unique=True,
    )

    op.create_table(
        "requisition_line_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("requisition_id", sa.Integer(), nullable=False),
        sa.Column("nsn", sa.String(length=20), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=True),
        sa.Column("quantity_requested", sa.Integer(), nullable=True),
        sa.Column("quantity_issued", sa.Integer(), nullable=True),
        sa.Column("unit_price", sa.Float(), nullable=True),
        sa.Column("condition_code", sa.String(length=10), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
    )

    op.create_table(
        "requisition_approvals",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("requisition_id", sa.Integer(), nullable=False),
        sa.Column("approver_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=True),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column(
            "acted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
        sa.ForeignKeyConstraint(["approver_id"], ["users.id"]),
    )

    op.create_table(
        "requisition_status_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("requisition_id", sa.Integer(), nullable=False),
        sa.Column("old_status", sa.String(length=50), nullable=True),
        sa.Column("new_status", sa.String(length=50), nullable=False),
        sa.Column("changed_by_id", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["requisition_id"], ["requisitions.id"]),
        sa.ForeignKeyConstraint(["changed_by_id"], ["users.id"]),
    )

    # --- Inventory ---

    op.create_table(
        "inventory_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("nsn", sa.String(length=20), nullable=True),
        sa.Column("nomenclature", sa.String(length=300), nullable=True),
        sa.Column("quantity_on_hand", sa.Integer(), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("last_inventoried_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "inventory_transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("inventory_record_id", sa.Integer(), nullable=False),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("reference_number", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("performed_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["inventory_record_id"], ["inventory_records.id"]),
        sa.ForeignKeyConstraint(["performed_by_id"], ["users.id"]),
    )

    # --- Medical ---

    op.create_table(
        "medical_treatment_facilities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("facility_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("bed_capacity", sa.Integer(), nullable=True),
        sa.Column("beds_available", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "casualty_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("personnel_id", sa.Integer(), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("precedence", sa.String(length=50), nullable=True),
        sa.Column("triage_category", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("evacuation_status", sa.String(length=50), nullable=True),
        sa.Column("transport_method", sa.String(length=50), nullable=True),
        sa.Column("mtf_id", sa.Integer(), nullable=True),
        sa.Column("injury_description", sa.Text(), nullable=True),
        sa.Column("reported_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "reported_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["personnel_id"], ["personnel.id"]),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["mtf_id"], ["medical_treatment_facilities.id"]),
        sa.ForeignKeyConstraint(["reported_by_id"], ["users.id"]),
    )

    op.create_table(
        "casualty_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("casualty_report_id", sa.Integer(), nullable=False),
        sa.Column("log_entry", sa.Text(), nullable=False),
        sa.Column("logged_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["casualty_report_id"], ["casualty_reports.id"]),
        sa.ForeignKeyConstraint(["logged_by_id"], ["users.id"]),
    )

    op.create_table(
        "medical_supply_burn_rates",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("item_name", sa.String(length=200), nullable=False),
        sa.Column("daily_usage_rate", sa.Float(), nullable=True),
        sa.Column("on_hand_qty", sa.Float(), nullable=True),
        sa.Column("dos", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "blood_products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("mtf_id", sa.Integer(), nullable=True),
        sa.Column("product_type", sa.String(length=50), nullable=False),
        sa.Column("blood_type", sa.String(length=10), nullable=True),
        sa.Column("units_available", sa.Integer(), nullable=True),
        sa.Column("expiration_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["mtf_id"], ["medical_treatment_facilities.id"]),
    )

    # --- Fuel ---

    op.create_table(
        "fuel_storage_points",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("facility_type", sa.String(length=50), nullable=True),
        sa.Column("fuel_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("capacity_gallons", sa.Float(), nullable=True),
        sa.Column("current_level_gallons", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "fuel_transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("storage_point_id", sa.Integer(), nullable=True),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("fuel_type", sa.String(length=50), nullable=True),
        sa.Column("quantity_gallons", sa.Float(), nullable=False),
        sa.Column("equipment_id", sa.Integer(), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("performed_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["storage_point_id"], ["fuel_storage_points.id"]),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"]),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["performed_by_id"], ["users.id"]),
    )

    op.create_table(
        "fuel_consumption_rates",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("fuel_type", sa.String(length=50), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column("operational_tempo", sa.String(length=50), nullable=True),
        sa.Column("gallons_per_day", sa.Float(), nullable=True),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    op.create_table(
        "fuel_forecasts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("fuel_type", sa.String(length=50), nullable=True),
        sa.Column("forecast_date", sa.Date(), nullable=True),
        sa.Column("projected_demand_gallons", sa.Float(), nullable=True),
        sa.Column("projected_supply_gallons", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )

    # --- Predictions / recommendations ---

    op.create_table(
        "logistics_recommendations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("alert_id", sa.Integer(), nullable=True),
        sa.Column("recommendation_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("title", sa.String(length=300), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_unit_id", sa.Integer(), nullable=True),
        sa.Column("target_unit_id", sa.Integer(), nullable=True),
        sa.Column("assigned_to_role", sa.String(length=50), nullable=True),
        sa.Column("acted_on_by_id", sa.Integer(), nullable=True),
        sa.Column("acted_on_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["alert_id"], ["alerts.id"]),
        sa.ForeignKeyConstraint(["source_unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["target_unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["acted_on_by_id"], ["users.id"]),
    )

    # --- Custody / sensitive items ---

    op.create_table(
        "sensitive_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("serial_number", sa.String(length=100), nullable=False),
        sa.Column("nomenclature", sa.String(length=300), nullable=False),
        sa.Column("item_type", sa.String(length=50), nullable=True),
        sa.Column("classification", sa.String(length=50), nullable=True),
        sa.Column("condition_code", sa.String(length=10), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("custodian_id", sa.Integer(), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("nsn", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["custodian_id"], ["users.id"]),
    )
    op.create_index(
        "ix_sensitive_items_serial_number",
        "sensitive_items",
        ["serial_number"],
        unique=True,
    )

    op.create_table(
        "custody_transfers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("sensitive_item_id", sa.Integer(), nullable=False),
        sa.Column("from_custodian_id", sa.Integer(), nullable=True),
        sa.Column("to_custodian_id", sa.Integer(), nullable=True),
        sa.Column("transfer_type", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "transferred_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["sensitive_item_id"], ["sensitive_items.id"]),
        sa.ForeignKeyConstraint(["from_custodian_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["to_custodian_id"], ["users.id"]),
    )

    op.create_table(
        "inventory_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("inventory_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("conducted_by_id", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["conducted_by_id"], ["users.id"]),
    )

    op.create_table(
        "inventory_line_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("inventory_event_id", sa.Integer(), nullable=False),
        sa.Column("sensitive_item_id", sa.Integer(), nullable=False),
        sa.Column("found", sa.Boolean(), nullable=True, server_default=sa.text("true")),
        sa.Column("discrepancy_type", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["inventory_event_id"], ["inventory_events.id"]),
        sa.ForeignKeyConstraint(["sensitive_item_id"], ["sensitive_items.id"]),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    # --- Activity log ---

    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
    )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("activities")
    op.drop_table("audit_logs")
    op.drop_table("inventory_line_items")
    op.drop_table("inventory_events")
    op.drop_table("custody_transfers")
    op.drop_table("sensitive_items")
    op.drop_table("logistics_recommendations")
    op.drop_table("fuel_forecasts")
    op.drop_table("fuel_consumption_rates")
    op.drop_table("fuel_transactions")
    op.drop_table("fuel_storage_points")
    op.drop_table("blood_products")
    op.drop_table("medical_supply_burn_rates")
    op.drop_table("casualty_logs")
    op.drop_table("casualty_reports")
    op.drop_table("medical_treatment_facilities")
    op.drop_table("inventory_transactions")
    op.drop_table("inventory_records")
    op.drop_table("requisition_status_history")
    op.drop_table("requisition_approvals")
    op.drop_table("requisition_line_items")
    op.drop_table("requisitions")
    op.drop_table("unit_strengths")
    op.drop_table("unit_readiness_snapshots")
    op.drop_table("routes")
    op.drop_table("supply_points")
    op.drop_table("locations")
    op.drop_table("report_schedules")
    op.drop_table("reports")
    op.drop_table("report_templates")
    op.drop_table("report_export_destinations")
    op.drop_table("equipment_repair_orders")
    op.drop_table("maintenance_deadlines")
    op.drop_table("preventive_maintenance_schedules")
    op.drop_table("work_order_assignments")
    op.drop_table("maintenance_labor")
    op.drop_table("maintenance_parts")
    op.drop_table("maintenance_work_orders")
    op.drop_table("notification_preferences")
    op.drop_table("notifications")
    op.drop_table("alert_rules")
    op.drop_table("alerts")
    op.drop_table("convoy_personnel")
    op.drop_table("convoy_cargo")
    op.drop_table("convoy_vehicles")
    op.drop_table("lift_requests")
    op.drop_table("convoy_serials")
    op.drop_table("convoy_plans")
    op.drop_table("qualifications")
    op.drop_table("manning_snapshots")
    op.drop_table("billet_structures")
    op.drop_table("ammo_loads")
    op.drop_table("weapons")
    op.drop_table("personnel")
    op.drop_table("movements")
    op.drop_table("equipment_driver_assignments")
    op.drop_table("equipment_faults")
    op.drop_table("equipment_statuses")
    op.drop_table("equipment")
    op.drop_table("supply_statuses")
    op.drop_table("tak_connections")
    op.drop_table("processed_files")
    op.drop_table("raw_data")
    op.drop_table("data_sources")
    op.drop_table("data_templates")
    op.drop_table("supply_catalog")
    op.drop_table("ammunition_catalog")
    op.drop_table("equipment_catalog")
    op.drop_table("canonical_fields")
    op.drop_table("readiness_thresholds")
    op.drop_table("system_settings")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("custom_roles")
    op.drop_table("users")
    op.drop_table("units")
