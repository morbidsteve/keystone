"""Add new echelon enum values (HQMC, WING, GRP, SQDN).

Revision ID: 001_add_echelons
Revises:
Create Date: 2026-03-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision: str = "001_add_echelons"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Only alter the echelon type if it exists (for databases created by create_all())
    # On fresh databases where alembic runs from scratch, the echelon column is
    # a VARCHAR, not a native PostgreSQL enum, so this is a no-op.
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = 'echelon'")
    )
    if result.fetchone():
        op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'HQMC'")
        op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'WING'")
        op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'GRP'")
        op.execute("ALTER TYPE echelon ADD VALUE IF NOT EXISTS 'SQDN'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values
    # To truly downgrade, you'd need to create a new enum type, migrate data, and swap
    pass
