"""
Prometheus metrics for Flatmates App.
Exposes application metrics for monitoring and alerting.
"""

from prometheus_client import Counter, Histogram, Gauge, Info
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# =============================================================================
# Application Info
# =============================================================================

APP_INFO = Info(
    "flatmates_app",
    "Flatmates App information"
)

# =============================================================================
# HTTP Request Metrics
# =============================================================================

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "Number of HTTP requests currently in progress",
    ["method", "endpoint"]
)

# =============================================================================
# Database Metrics
# =============================================================================

DB_QUERY_DURATION_SECONDS = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation", "table"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

DB_CONNECTIONS_ACTIVE = Gauge(
    "db_connections_active",
    "Number of active database connections"
)

# =============================================================================
# Business Metrics
# =============================================================================

USERS_TOTAL = Gauge(
    "users_total",
    "Total number of registered users"
)

HOUSEHOLDS_TOTAL = Gauge(
    "households_total",
    "Total number of households"
)

EXPENSES_TOTAL = Counter(
    "expenses_total",
    "Total number of expenses created",
    ["category"]
)

EXPENSE_AMOUNT_TOTAL = Counter(
    "expense_amount_total",
    "Total amount of expenses",
    ["category", "currency"]
)

TODOS_TOTAL = Counter(
    "todos_total",
    "Total number of todos created"
)

SHOPPING_ITEMS_TOTAL = Counter(
    "shopping_items_total",
    "Total number of shopping items created"
)

# =============================================================================
# AI Service Metrics
# =============================================================================

AI_REQUESTS_TOTAL = Counter(
    "ai_requests_total",
    "Total number of AI service requests",
    ["provider", "operation", "status"]
)

AI_REQUEST_DURATION_SECONDS = Histogram(
    "ai_request_duration_seconds",
    "AI service request duration in seconds",
    ["provider", "operation"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

# =============================================================================
# Authentication Metrics
# =============================================================================

AUTH_ATTEMPTS_TOTAL = Counter(
    "auth_attempts_total",
    "Total number of authentication attempts",
    ["method", "status"]
)

ACTIVE_SESSIONS = Gauge(
    "active_sessions_total",
    "Number of active user sessions"
)


# =============================================================================
# Metrics Endpoint
# =============================================================================

def get_metrics() -> Response:
    """
    Generate Prometheus metrics response.
    
    Returns:
        Response with Prometheus metrics in text format
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


def initialize_metrics(app_version: str = "1.0.0") -> None:
    """
    Initialize application metrics with static info.
    
    Args:
        app_version: Current application version
    """
    APP_INFO.info({
        "version": app_version,
        "name": "flatmates-backend",
        "python_version": "3.11"
    })
