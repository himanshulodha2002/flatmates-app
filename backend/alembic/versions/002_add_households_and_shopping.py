"""add households and shopping tables

Revision ID: 002
Revises: 001
Create Date: 2025-10-31 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create households table
    op.create_table(
        'households',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_households_id'), 'households', ['id'], unique=False)

    # Create household_members table
    op.create_table(
        'household_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_household_members_id'), 'household_members', ['id'], unique=False)

    # Create shopping_lists table
    op.create_table(
        'shopping_lists',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_shopping_lists_id'), 'shopping_lists', ['id'], unique=False)

    # Create shopping_items table
    op.create_table(
        'shopping_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('list_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('quantity', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('is_purchased', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('purchased_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('purchased_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['list_id'], ['shopping_lists.id'], ),
        sa.ForeignKeyConstraint(['purchased_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_shopping_items_id'), 'shopping_items', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_shopping_items_id'), table_name='shopping_items')
    op.drop_table('shopping_items')
    
    op.drop_index(op.f('ix_shopping_lists_id'), table_name='shopping_lists')
    op.drop_table('shopping_lists')
    
    op.drop_index(op.f('ix_household_members_id'), table_name='household_members')
    op.drop_table('household_members')
    
    op.drop_index(op.f('ix_households_id'), table_name='households')
    op.drop_table('households')
