"""add monthly_checklist_snapshots table

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-26 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "monthly_checklist_snapshots",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("item_name", sa.String(200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    # Index for fast per-user/month lookups
    op.create_index(
        "ix_monthly_checklist_user_month",
        "monthly_checklist_snapshots",
        ["user_id", "year", "month"],
    )


def downgrade() -> None:
    op.drop_index("ix_monthly_checklist_user_month", "monthly_checklist_snapshots")
    op.drop_table("monthly_checklist_snapshots")
