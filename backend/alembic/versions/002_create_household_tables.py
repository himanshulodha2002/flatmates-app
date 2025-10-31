"""create household tables

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
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_households_id'), 'households', ['id'], unique=False)
    
    # Create household_members table
    op.create_table(
        'household_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Enum('owner', 'member', name='memberrole'), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ),
        sa.UniqueConstraint('user_id', 'household_id', name='uix_user_household')
    )
    op.create_index(op.f('ix_household_members_id'), 'household_members', ['id'], unique=False)
    
    # Create household_invites table
    op.create_table(
        'household_invites',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('household_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', 'expired', name='invitestatus'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_household_invites_id'), 'household_invites', ['id'], unique=False)
    op.create_index(op.f('ix_household_invites_token'), 'household_invites', ['token'], unique=True)


def downgrade() -> None:
    # Drop household_invites table
    op.drop_index(op.f('ix_household_invites_token'), table_name='household_invites')
    op.drop_index(op.f('ix_household_invites_id'), table_name='household_invites')
    op.drop_table('household_invites')
    op.execute('DROP TYPE invitestatus')
    
    # Drop household_members table
    op.drop_index(op.f('ix_household_members_id'), table_name='household_members')
    op.drop_table('household_members')
    op.execute('DROP TYPE memberrole')
    
    # Drop households table
    op.drop_index(op.f('ix_households_id'), table_name='households')
    op.drop_table('households')
