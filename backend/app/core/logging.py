"""
Structured logging configuration for Flatmates App.
Uses structlog for structured JSON logging with context.
"""

import logging
import sys
from typing import Any

import structlog
from structlog.types import Processor

from app.core.config import settings


def setup_logging() -> None:
    """
    Configure structured logging for the application.
    
    In production: JSON output for log aggregation
    In development: Pretty colored console output
    """
    # Determine if we're in development mode
    is_dev = settings.ENVIRONMENT == "development"
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Shared processors for all environments
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if is_dev:
        # Development: Pretty console output
        processors: list[Processor] = [
            *shared_processors,
            structlog.processors.ExceptionPrettyPrinter(),
            structlog.dev.ConsoleRenderer(colors=True),
        ]
    else:
        # Production: JSON output for log aggregation
        processors = [
            *shared_processors,
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]

    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Optional logger name. Defaults to calling module.
        
    Returns:
        Configured structlog logger
        
    Example:
        logger = get_logger(__name__)
        logger.info("User logged in", user_id="123", ip="192.168.1.1")
    """
    return structlog.get_logger(name)


def log_context(**kwargs: Any) -> None:
    """
    Add context to all subsequent log messages in the current request.
    
    Args:
        **kwargs: Key-value pairs to add to log context
        
    Example:
        log_context(user_id="123", request_id="abc")
        logger.info("Processing request")  # Will include user_id and request_id
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_log_context() -> None:
    """Clear all context variables from the current context."""
    structlog.contextvars.clear_contextvars()
