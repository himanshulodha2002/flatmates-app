"""create expense tables

Revision ID: 004
Revises: 003
Create Date: 2025-11-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop types if they exist to avoid duplicates during re-runs
    op.execute("DROP TYPE IF EXISTS expensecategory CASCADE")
    op.execute("DROP TYPE IF EXISTS splittype CASCADE")
    op.execute("DROP TYPE IF EXISTS paymentmethod CASCADE")

    # Create expenses table
    op.create_table(
        'expenses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('category', sa.Enum(
            'groceries', 'utilities', 'rent', 'internet', 'cleaning',
            'maintenance', 'entertainment', 'food', 'transportation', 'other',
            name='expensecategory'
        ), nullable=False),
        sa.Column('payment_method', sa.Enum(
            'cash', 'card', 'bank_transfer', 'digital_wallet', 'other',
            name='paymentmethod'
        ), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('split_type', sa.Enum(
            'equal', 'custom', 'percentage',
            name='splittype'
        ), nullable=False),
        sa.Column('is_personal', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_household_id'), 'expenses', ['household_id'], unique=False)

    # Create expense_splits table
    op.create_table(
        'expense_splits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expense_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount_owed', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('is_settled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('settled_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_expense_splits_id'), 'expense_splits', ['id'], unique=False)
    op.create_index(op.f('ix_expense_splits_expense_id'), 'expense_splits', ['expense_id'], unique=False)
    op.create_index(op.f('ix_expense_splits_user_id'), 'expense_splits', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop expense_splits table
    op.drop_index(op.f('ix_expense_splits_user_id'), table_name='expense_splits')
    op.drop_index(op.f('ix_expense_splits_expense_id'), table_name='expense_splits')
    op.drop_index(op.f('ix_expense_splits_id'), table_name='expense_splits')
    op.drop_table('expense_splits')

    # Drop expenses table
    op.drop_index(op.f('ix_expenses_household_id'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_id'), table_name='expenses')
    op.drop_table('expenses')

    # Drop enums
    op.execute('DROP TYPE paymentmethod')
    op.execute('DROP TYPE splittype')
    op.execute('DROP TYPE expensecategory')
