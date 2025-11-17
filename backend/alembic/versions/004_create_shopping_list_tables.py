"""create shopping list tables

Revision ID: 004
Revises: 003
Create Date: 2025-11-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create item_categories table
    op.create_table(
        'item_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('name', 'household_id', name='uq_category_name_household')
    )
    op.create_index(op.f('ix_item_categories_id'), 'item_categories', ['id'], unique=False)
    op.create_index(op.f('ix_item_categories_household_id'), 'item_categories', ['household_id'], unique=False)

    # Create shopping_lists table
    op.create_table(
        'shopping_lists',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('active', 'archived', name='shoppingliststatus'), nullable=False, server_default='active'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'])
    )
    op.create_index(op.f('ix_shopping_lists_id'), 'shopping_lists', ['id'], unique=False)
    op.create_index(op.f('ix_shopping_lists_household_id'), 'shopping_lists', ['household_id'], unique=False)
    op.create_index(op.f('ix_shopping_lists_status'), 'shopping_lists', ['status'], unique=False)

    # Create shopping_list_items table
    op.create_table(
        'shopping_list_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shopping_list_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('unit', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('is_purchased', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('assigned_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('price', sa.Numeric(10, 2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('recurring_pattern', sa.String(), nullable=True),
        sa.Column('recurring_until', sa.DateTime(), nullable=True),
        sa.Column('last_recurring_date', sa.DateTime(), nullable=True),
        sa.Column('checked_off_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('checked_off_at', sa.DateTime(), nullable=True),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['shopping_list_id'], ['shopping_lists.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['checked_off_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'])
    )
    op.create_index(op.f('ix_shopping_list_items_id'), 'shopping_list_items', ['id'], unique=False)
    op.create_index(op.f('ix_shopping_list_items_shopping_list_id'), 'shopping_list_items', ['shopping_list_id'], unique=False)
    op.create_index(op.f('ix_shopping_list_items_category'), 'shopping_list_items', ['category'], unique=False)
    op.create_index(op.f('ix_shopping_list_items_is_purchased'), 'shopping_list_items', ['is_purchased'], unique=False)
    op.create_index(op.f('ix_shopping_list_items_position'), 'shopping_list_items', ['position'], unique=False)

    # Insert default global categories
    op.execute("""
        INSERT INTO item_categories (id, name, icon, color, household_id) VALUES
        (gen_random_uuid(), 'Produce', '🥬', '#4CAF50', NULL),
        (gen_random_uuid(), 'Dairy', '🥛', '#2196F3', NULL),
        (gen_random_uuid(), 'Meat & Seafood', '🥩', '#F44336', NULL),
        (gen_random_uuid(), 'Bakery', '🥖', '#FF9800', NULL),
        (gen_random_uuid(), 'Pantry', '🥫', '#795548', NULL),
        (gen_random_uuid(), 'Frozen', '❄️', '#00BCD4', NULL),
        (gen_random_uuid(), 'Snacks', '🍿', '#FFC107', NULL),
        (gen_random_uuid(), 'Beverages', '🥤', '#9C27B0', NULL),
        (gen_random_uuid(), 'Health & Beauty', '🧴', '#E91E63', NULL),
        (gen_random_uuid(), 'Household', '🧹', '#607D8B', NULL),
        (gen_random_uuid(), 'Other', '📦', '#9E9E9E', NULL)
    """)


def downgrade() -> None:
    # Drop shopping_list_items table
    op.drop_index(op.f('ix_shopping_list_items_position'), table_name='shopping_list_items')
    op.drop_index(op.f('ix_shopping_list_items_is_purchased'), table_name='shopping_list_items')
    op.drop_index(op.f('ix_shopping_list_items_category'), table_name='shopping_list_items')
    op.drop_index(op.f('ix_shopping_list_items_shopping_list_id'), table_name='shopping_list_items')
    op.drop_index(op.f('ix_shopping_list_items_id'), table_name='shopping_list_items')
    op.drop_table('shopping_list_items')

    # Drop shopping_lists table
    op.drop_index(op.f('ix_shopping_lists_status'), table_name='shopping_lists')
    op.drop_index(op.f('ix_shopping_lists_household_id'), table_name='shopping_lists')
    op.drop_index(op.f('ix_shopping_lists_id'), table_name='shopping_lists')
    op.drop_table('shopping_lists')
    op.execute('DROP TYPE shoppingliststatus')

    # Drop item_categories table
    op.drop_index(op.f('ix_item_categories_household_id'), table_name='item_categories')
    op.drop_index(op.f('ix_item_categories_id'), table_name='item_categories')
    op.drop_table('item_categories')
