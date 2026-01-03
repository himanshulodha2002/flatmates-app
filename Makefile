# =============================================================================
# Flatmates App - Development Makefile
# =============================================================================

.PHONY: help install dev test lint format clean docker-up docker-down docker-build \
        backend-dev backend-test mobile-dev db-migrate db-reset setup check all

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# =============================================================================
# Help
# =============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)Flatmates App - Development Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Setup:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(install|setup)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(dev|run)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Testing:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(test|lint|format|check)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E 'docker' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E 'db-' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Infrastructure:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(tf-|infra)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Setup Commands
# =============================================================================

setup: ## Initial project setup (install all dependencies)
	@echo "$(BLUE)Setting up Flatmates App...$(NC)"
	@$(MAKE) install-backend
	@$(MAKE) install-mobile
	@echo "$(GREEN)✓ Setup complete!$(NC)"

install: setup ## Alias for setup

install-backend: ## Install backend dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && python -m venv .venv && \
		. .venv/bin/activate && \
		pip install --upgrade pip && \
		pip install uv && \
		uv pip install -r requirements.txt && \
		uv pip install -e ".[dev]"
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

install-mobile: ## Install mobile dependencies
	@echo "$(BLUE)Installing mobile dependencies...$(NC)"
	cd mobile && npm install
	@echo "$(GREEN)✓ Mobile dependencies installed$(NC)"

# =============================================================================
# Development Commands
# =============================================================================

dev: docker-dev-up backend-dev-local ## Start full development environment

backend-dev: ## Start backend with Docker (hot-reload)
	@echo "$(BLUE)Starting backend with hot-reload...$(NC)"
	cd backend && docker compose --profile dev-hot up backend-dev postgres redis

backend-dev-local: ## Start backend locally (requires postgres running)
	@echo "$(BLUE)Starting backend locally...$(NC)"
	cd backend && . .venv/bin/activate && \
		uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-run: ## Start backend in production mode locally
	@echo "$(BLUE)Starting backend in production mode...$(NC)"
	cd backend && . .venv/bin/activate && \
		uvicorn app.main:app --host 0.0.0.0 --port 8000

mobile-dev: ## Start mobile Expo development server
	@echo "$(BLUE)Starting mobile development server...$(NC)"
	cd mobile && npm start

mobile-ios: ## Start mobile on iOS simulator
	cd mobile && npm run ios

mobile-android: ## Start mobile on Android emulator
	cd mobile && npm run android

# =============================================================================
# Testing Commands
# =============================================================================

test: backend-test mobile-test ## Run all tests

backend-test: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && . .venv/bin/activate && \
		pytest -v --cov=app --cov-report=term-missing

backend-test-fast: ## Run backend tests without coverage
	@echo "$(BLUE)Running backend tests (fast mode)...$(NC)"
	cd backend && . .venv/bin/activate && pytest -v -x

backend-test-docker: ## Run backend tests in Docker
	@echo "$(BLUE)Running backend tests in Docker...$(NC)"
	cd backend && docker compose --profile test up --build --abort-on-container-exit

mobile-test: ## Run mobile tests
	@echo "$(BLUE)Running mobile tests...$(NC)"
	cd mobile && npm test

mobile-test-coverage: ## Run mobile tests with coverage
	cd mobile && npm run test:coverage

# =============================================================================
# Linting & Formatting
# =============================================================================

lint: backend-lint mobile-lint ## Run all linters

backend-lint: ## Run backend linting
	@echo "$(BLUE)Linting backend...$(NC)"
	cd backend && . .venv/bin/activate && \
		ruff check app && \
		ruff format --check app

backend-lint-fix: ## Fix backend linting issues
	@echo "$(BLUE)Fixing backend linting issues...$(NC)"
	cd backend && . .venv/bin/activate && \
		ruff check --fix app && \
		ruff format app

mobile-lint: ## Run mobile linting
	@echo "$(BLUE)Linting mobile...$(NC)"
	cd mobile && npm run lint

mobile-lint-fix: ## Fix mobile linting issues
	cd mobile && npm run lint:fix

format: backend-lint-fix mobile-lint-fix ## Format all code

check: lint test ## Run all checks (lint + test)

typecheck: ## Run type checking
	@echo "$(BLUE)Running type checks...$(NC)"
	cd backend && . .venv/bin/activate && mypy app --ignore-missing-imports
	cd mobile && npm run type-check

# =============================================================================
# Docker Commands
# =============================================================================

docker-build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	cd backend && docker compose build

docker-up: ## Start all services (production profile)
	@echo "$(BLUE)Starting production services...$(NC)"
	cd backend && docker compose --profile prod up -d

docker-dev-up: ## Start development services
	@echo "$(BLUE)Starting development services...$(NC)"
	cd backend && docker compose --profile dev up -d postgres redis

docker-down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(NC)"
	cd backend && docker compose --profile dev --profile prod --profile dev-hot down

docker-logs: ## View Docker logs
	cd backend && docker compose logs -f

docker-clean: ## Remove all containers and volumes
	@echo "$(RED)Removing all containers and volumes...$(NC)"
	cd backend && docker compose down -v --remove-orphans

docker-observability: ## Start observability stack (Prometheus, Grafana, Loki)
	@echo "$(BLUE)Starting observability stack...$(NC)"
	cd backend && docker compose --profile observability up -d prometheus grafana loki

docker-tools: ## Start database tools (pgAdmin)
	@echo "$(BLUE)Starting database tools...$(NC)"
	cd backend && docker compose --profile tools up -d pgadmin

# =============================================================================
# Database Commands
# =============================================================================

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	cd backend && . .venv/bin/activate && alembic upgrade head

db-migration: ## Create a new migration (use: make db-migration msg="migration message")
	@echo "$(BLUE)Creating new migration...$(NC)"
	cd backend && . .venv/bin/activate && alembic revision --autogenerate -m "$(msg)"

db-downgrade: ## Downgrade one migration
	@echo "$(YELLOW)Downgrading database...$(NC)"
	cd backend && . .venv/bin/activate && alembic downgrade -1

db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)Resetting database...$(NC)"
	cd backend && docker compose exec postgres psql -U flatmates -c "DROP DATABASE IF EXISTS flatmates; CREATE DATABASE flatmates;"
	@$(MAKE) db-migrate

db-shell: ## Open PostgreSQL shell
	cd backend && docker compose exec postgres psql -U flatmates flatmates

# =============================================================================
# Infrastructure Commands
# =============================================================================

tf-init: ## Initialize Terraform
	@echo "$(BLUE)Initializing Terraform...$(NC)"
	cd infrastructure/terraform && terraform init

tf-plan: ## Plan Terraform changes
	@echo "$(BLUE)Planning infrastructure changes...$(NC)"
	cd infrastructure/terraform && terraform plan

tf-apply: ## Apply Terraform changes
	@echo "$(BLUE)Applying infrastructure changes...$(NC)"
	cd infrastructure/terraform && terraform apply

tf-destroy: ## Destroy Terraform infrastructure
	@echo "$(RED)Destroying infrastructure...$(NC)"
	cd infrastructure/terraform && terraform destroy

infra-dev: tf-init ## Deploy development infrastructure
	cd infrastructure/terraform && terraform workspace select dev || terraform workspace new dev
	cd infrastructure/terraform && terraform apply -var-file=terraform.tfvars.example

infra-prod: tf-init ## Deploy production infrastructure
	cd infrastructure/terraform && terraform workspace select production || terraform workspace new production
	cd infrastructure/terraform && terraform apply -var-file=environments/production.tfvars

# =============================================================================
# Utility Commands
# =============================================================================

clean: ## Clean up generated files
	@echo "$(BLUE)Cleaning up...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	cd mobile && rm -rf node_modules/.cache 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

env-check: ## Check environment configuration
	@echo "$(BLUE)Checking environment...$(NC)"
	@echo ""
	@echo "Backend .env:"
	@test -f backend/.env && echo "  $(GREEN)✓ Found$(NC)" || echo "  $(RED)✗ Missing (copy from .env.example)$(NC)"
	@echo ""
	@echo "Mobile .env:"
	@test -f mobile/.env.development && echo "  $(GREEN)✓ Found$(NC)" || echo "  $(RED)✗ Missing (copy from .env.example)$(NC)"
	@echo ""
	@echo "Docker:"
	@command -v docker >/dev/null 2>&1 && echo "  $(GREEN)✓ Docker installed$(NC)" || echo "  $(RED)✗ Docker not installed$(NC)"
	@echo ""
	@echo "Python:"
	@command -v python3 >/dev/null 2>&1 && echo "  $(GREEN)✓ Python $(shell python3 --version)$(NC)" || echo "  $(RED)✗ Python not installed$(NC)"
	@echo ""
	@echo "Node.js:"
	@command -v node >/dev/null 2>&1 && echo "  $(GREEN)✓ Node $(shell node --version)$(NC)" || echo "  $(RED)✗ Node.js not installed$(NC)"

docs: ## Generate API documentation
	@echo "$(BLUE)API documentation available at:$(NC)"
	@echo "  http://localhost:8000/docs    (Swagger UI)"
	@echo "  http://localhost:8000/redoc   (ReDoc)"

all: setup lint test ## Full setup and verification
