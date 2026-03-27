"""add category_type to categories

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-26 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column(
            "category_type",
            sa.String(10),
            nullable=False,
            server_default="EXPENSE",
        ),
    )


def downgrade() -> None:
    op.drop_column("categories", "category_type")
