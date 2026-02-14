"""make household invite email nullable for public invites

Revision ID: 006
Revises: 005
Create Date: 2026-02-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make email column nullable to support public invites
    op.alter_column('household_invites', 'email',
                    existing_type=sa.String(),
                    nullable=True)


def downgrade() -> None:
    # Revert email column to not nullable
    op.alter_column('household_invites', 'email',
                    existing_type=sa.String(),
                    nullable=False)
