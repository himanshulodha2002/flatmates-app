#!/usr/bin/env bash
# =============================================================================
# Flatmates App - Setup Verification Script
# Checks that all components are properly configured
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Flatmates App - Setup Verification                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "  ${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 is missing"
        return 1
    fi
}

# =============================================================================
# System Requirements
# =============================================================================

echo -e "${YELLOW}Checking system requirements...${NC}"
echo ""

check_command "python3" || ((ERRORS++))
check_command "node" || ((ERRORS++))
check_command "npm" || ((ERRORS++))
check_command "docker" || ((WARNINGS++))
check_command "git" || ((ERRORS++))

echo ""

# Python version check
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 11 ]; then
        echo -e "  ${GREEN}✓${NC} Python $PYTHON_VERSION (>= 3.11 required)"
    else
        echo -e "  ${RED}✗${NC} Python $PYTHON_VERSION (>= 3.11 required)"
        ((ERRORS++))
    fi
fi

# Node version check
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | tr -d 'v')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "  ${GREEN}✓${NC} Node.js $NODE_VERSION (>= 18 required)"
    else
        echo -e "  ${YELLOW}!${NC} Node.js $NODE_VERSION (>= 18 recommended)"
        ((WARNINGS++))
    fi
fi

echo ""

# =============================================================================
# Project Structure
# =============================================================================

echo -e "${YELLOW}Checking project structure...${NC}"
echo ""

check_file "backend/pyproject.toml" || ((ERRORS++))
check_file "backend/requirements.txt" || ((ERRORS++))
check_file "backend/Dockerfile" || ((ERRORS++))
check_file "backend/docker-compose.yml" || ((ERRORS++))
check_file "mobile/package.json" || ((ERRORS++))
check_file "Makefile" || ((WARNINGS++))
check_file "infrastructure/terraform/main.tf" || ((WARNINGS++))
check_file ".pre-commit-config.yaml" || ((WARNINGS++))

echo ""

# =============================================================================
# Environment Configuration
# =============================================================================

echo -e "${YELLOW}Checking environment configuration...${NC}"
echo ""

if [ -f "backend/.env" ]; then
    echo -e "  ${GREEN}✓${NC} backend/.env exists"
else
    echo -e "  ${YELLOW}!${NC} backend/.env missing - copy from .env.example"
    ((WARNINGS++))
fi

if [ -f "mobile/.env.development" ] || [ -f "mobile/.env" ]; then
    echo -e "  ${GREEN}✓${NC} mobile/.env exists"
else
    echo -e "  ${YELLOW}!${NC} mobile/.env missing - copy from .env.example"
    ((WARNINGS++))
fi

echo ""

# =============================================================================
# Backend Dependencies
# =============================================================================

echo -e "${YELLOW}Checking backend setup...${NC}"
echo ""

if [ -d "backend/.venv" ]; then
    echo -e "  ${GREEN}✓${NC} Python virtual environment exists"
else
    echo -e "  ${YELLOW}!${NC} Python virtual environment not found"
    echo -e "      Run: ${BLUE}cd backend && python -m venv .venv${NC}"
    ((WARNINGS++))
fi

echo ""

# =============================================================================
# Mobile Dependencies
# =============================================================================

echo -e "${YELLOW}Checking mobile setup...${NC}"
echo ""

if [ -d "mobile/node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Node modules installed"
else
    echo -e "  ${YELLOW}!${NC} Node modules not installed"
    echo -e "      Run: ${BLUE}cd mobile && npm install${NC}"
    ((WARNINGS++))
fi

echo ""

# =============================================================================
# Docker Setup
# =============================================================================

echo -e "${YELLOW}Checking Docker setup...${NC}"
echo ""

if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Docker daemon is running"
    else
        echo -e "  ${YELLOW}!${NC} Docker daemon is not running"
        ((WARNINGS++))
    fi
fi

echo ""

# =============================================================================
# Summary
# =============================================================================

echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Your environment is ready.${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}! Setup complete with $WARNINGS warning(s).${NC}"
else
    echo -e "${RED}✗ Setup incomplete: $ERRORS error(s), $WARNINGS warning(s).${NC}"
fi

echo ""
echo -e "${BLUE}Quick Start Commands:${NC}"
echo ""
echo -e "  ${YELLOW}Backend:${NC}"
echo -e "    make install-backend    # Install Python dependencies"
echo -e "    make docker-dev-up      # Start PostgreSQL & Redis"
echo -e "    make backend-dev-local  # Run API with hot-reload"
echo ""
echo -e "  ${YELLOW}Mobile:${NC}"
echo -e "    make install-mobile     # Install npm dependencies"
echo -e "    make mobile-dev         # Start Expo development server"
echo ""
echo -e "  ${YELLOW}Full Stack:${NC}"
echo -e "    make setup              # Install all dependencies"
echo -e "    make docker-dev-up      # Start services"
echo -e "    make check              # Run lint + tests"
echo ""

exit $ERRORS
