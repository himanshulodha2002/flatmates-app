"""
Tests for database connection and configuration.
"""
import pytest
from sqlalchemy import text


@pytest.mark.integration
def test_database_connection(db_session):
    """
    Test that database connection works.
    """
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1


@pytest.mark.integration
def test_database_session_creation(db_session):
    """
    Test that database session is created properly.
    """
    assert db_session is not None
    assert hasattr(db_session, 'execute')
    assert hasattr(db_session, 'commit')
    assert hasattr(db_session, 'rollback')


@pytest.mark.integration
def test_database_transaction_rollback(db_session):
    """
    Test that database transactions can be rolled back.
    """
    # Start a transaction
    result_before = db_session.execute(text("SELECT 1")).scalar()
    assert result_before == 1
    
    # Rollback should work without errors
    db_session.rollback()
    
    # Should still be able to query after rollback
    result_after = db_session.execute(text("SELECT 1")).scalar()
    assert result_after == 1
