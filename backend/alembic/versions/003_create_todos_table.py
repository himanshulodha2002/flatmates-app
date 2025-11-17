"""create todos table

Revision ID: 003
Revises: 002
Create Date: 2025-11-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create todos table
    op.create_table(
        'todos',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'in_progress', 'completed', name='todostatus'), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Enum('low', 'medium', 'high', name='todopriority'), nullable=False, server_default='medium'),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('assigned_to_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recurring_pattern', sa.String(), nullable=True),
        sa.Column('recurring_until', sa.DateTime(), nullable=True),
        sa.Column('parent_todo_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_todo_id'], ['todos.id'], ondelete='SET NULL')
    )
    op.create_index(op.f('ix_todos_id'), 'todos', ['id'], unique=False)
    op.create_index(op.f('ix_todos_household_id'), 'todos', ['household_id'], unique=False)
    op.create_index(op.f('ix_todos_assigned_to_id'), 'todos', ['assigned_to_id'], unique=False)
    op.create_index(op.f('ix_todos_due_date'), 'todos', ['due_date'], unique=False)
    op.create_index(op.f('ix_todos_status'), 'todos', ['status'], unique=False)


def downgrade() -> None:
    # Drop todos table
    op.drop_index(op.f('ix_todos_status'), table_name='todos')
    op.drop_index(op.f('ix_todos_due_date'), table_name='todos')
    op.drop_index(op.f('ix_todos_assigned_to_id'), table_name='todos')
    op.drop_index(op.f('ix_todos_household_id'), table_name='todos')
    op.drop_index(op.f('ix_todos_id'), table_name='todos')
    op.drop_table('todos')
    op.execute('DROP TYPE todostatus')
    op.execute('DROP TYPE todopriority')
