"""
Sentry integration for error tracking and performance monitoring.
FREE with GitHub Student Developer Pack (500K events/month)!
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

from app.core.config import settings


def init_sentry() -> bool:
    """
    Initialize Sentry SDK for error tracking.
    
    Returns:
        bool: True if Sentry was initialized, False otherwise
    """
    
    if not settings.SENTRY_DSN:
        return False
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        
        # Performance monitoring
        traces_sample_rate=0.1 if settings.is_production else 1.0,
        
        # Profile sampling (for performance)
        profiles_sample_rate=0.1 if settings.is_production else 1.0,
        
        # Release tracking
        release=f"flatmates-backend@{settings.VERSION}",
        
        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR,
            ),
        ],
        
        # Don't send PII
        send_default_pii=False,
        
        # Filter out health checks
        before_send=_before_send,
        before_send_transaction=_before_send_transaction,
    )
    
    return True


def _before_send(event, hint):
    """Filter events before sending to Sentry."""
    # Don't send expected errors
    if "exc_info" in hint:
        exc_type, exc_value, _ = hint["exc_info"]
        
        # Skip 4xx client errors
        if hasattr(exc_value, "status_code"):
            if 400 <= exc_value.status_code < 500:
                return None
    
    return event


def _before_send_transaction(event, hint):
    """Filter transactions before sending to Sentry."""
    # Skip health check endpoints
    transaction_name = event.get("transaction", "")
    
    skip_transactions = [
        "/health",
        "/healthz", 
        "/ready",
        "/metrics",
        "/docs",
        "/openapi.json",
    ]
    
    if any(skip in transaction_name for skip in skip_transactions):
        return None
    
    return event


def capture_exception(exception: Exception, **extra):
    """Capture an exception and send to Sentry with extra context."""
    with sentry_sdk.push_scope() as scope:
        for key, value in extra.items():
            scope.set_extra(key, value)
        sentry_sdk.capture_exception(exception)


def capture_message(message: str, level: str = "info", **extra):
    """Capture a message and send to Sentry."""
    with sentry_sdk.push_scope() as scope:
        for key, value in extra.items():
            scope.set_extra(key, value)
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: str = None, username: str = None):
    """Set user context for Sentry events."""
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def add_breadcrumb(message: str, category: str = "custom", level: str = "info", **data):
    """Add a breadcrumb for debugging context."""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data,
    )
