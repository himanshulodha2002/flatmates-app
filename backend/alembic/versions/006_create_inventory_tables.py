"""create inventory tables

Revision ID: 006
Revises: 005
Create Date: 2025-11-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop types if they exist to avoid duplicates during re-runs
    op.execute("DROP TYPE IF EXISTS inventorycategory CASCADE")
    op.execute("DROP TYPE IF EXISTS inventorylocation CASCADE")

    # Create inventory_items table
    op.create_table(
        'inventory_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('category', sa.Enum(
            'dairy', 'vegetables', 'fruits', 'meat', 'seafood', 'grains',
            'pantry', 'beverages', 'frozen', 'snacks', 'condiments', 'other',
            name='inventorycategory'
        ), nullable=False),
        sa.Column('location', sa.Enum(
            'fridge', 'freezer', 'pantry', 'kitchen_cabinet', 'other',
            name='inventorylocation'
        ), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('low_stock_threshold', sa.Float(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('added_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_inventory_items_id'), 'inventory_items', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_items_household_id'), 'inventory_items', ['household_id'], unique=False)
    op.create_index(op.f('ix_inventory_items_category'), 'inventory_items', ['category'], unique=False)
    op.create_index(op.f('ix_inventory_items_location'), 'inventory_items', ['location'], unique=False)
    op.create_index(op.f('ix_inventory_items_expiry_date'), 'inventory_items', ['expiry_date'], unique=False)


def downgrade() -> None:
    # Drop inventory_items table
    op.drop_index(op.f('ix_inventory_items_expiry_date'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_location'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_category'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_household_id'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_id'), table_name='inventory_items')
    op.drop_table('inventory_items')

    # Drop enums
    op.execute('DROP TYPE inventorylocation')
    op.execute('DROP TYPE inventorycategory')
