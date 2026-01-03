# =============================================================================
# Flatmates App Backend - Multi-stage Docker Build
# Using uv for fast Python package management
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - Python runtime with uv
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS base

# Install uv - fast Python package installer
COPY --from=ghcr.io/astral-sh/uv:0.5.9 /uv /uvx /bin/

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Dependencies stage - Install all dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy dependency files
COPY pyproject.toml ./
COPY requirements.txt ./

# Create virtual environment and install dependencies using uv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv venv /opt/venv && \
    . /opt/venv/bin/activate && \
    uv pip install -r requirements.txt

# -----------------------------------------------------------------------------
# Development stage - For local development with hot-reload
# -----------------------------------------------------------------------------
FROM base AS development

# Copy virtual environment from dependencies stage
COPY --from=dependencies /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install development dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install pytest pytest-asyncio pytest-cov httpx faker ruff

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Development command with hot-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------------------------------------------------------
# Test stage - For running tests
# -----------------------------------------------------------------------------
FROM development AS test

USER root
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install pytest pytest-asyncio pytest-cov httpx faker

USER appuser

CMD ["pytest", "-v", "--cov=app", "--cov-report=term-missing"]

# -----------------------------------------------------------------------------
# Production stage - Optimized for production deployment
# -----------------------------------------------------------------------------
FROM base AS production

# Copy virtual environment from dependencies stage
COPY --from=dependencies /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code only (no dev dependencies or tests)
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

# Production command with optimized settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--loop", "uvloop", "--http", "httptools"]
