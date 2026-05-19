#!/bin/bash
# =============================================================================
# Flatmates App - Azure Deployment Script
# Reads from .env file and deploys everything automatically
# Designed for GitHub Codespaces
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env"
TERRAFORM_DIR="${PROJECT_ROOT}/infrastructure/terraform-azure"

# Default values
PROJECT_NAME="${PROJECT_NAME:-flatmates}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AZURE_LOCATION="${AZURE_LOCATION:-eastus}"

# =============================================================================
# Load .env file
# =============================================================================

load_env() {
    info "Loading environment variables from .env..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        error ".env file not found at $ENV_FILE"
    fi
    
    # Export all variables from .env
    set -a
    source "$ENV_FILE"
    set +a
    
    success "Environment variables loaded"
}

# =============================================================================
# Validate required variables
# =============================================================================

validate_env() {
    info "Validating required environment variables..."
    
    local missing=()
    
    # Required variables
    [[ -z "$DATABASE_URL" ]] && missing+=("DATABASE_URL")
    [[ -z "$AZURE_SUBSCRIPTION_ID" ]] && missing+=("AZURE_SUBSCRIPTION_ID")
    
    # GitHub variables (auto-set in Codespaces)
    if [[ -z "$GITHUB_REPOSITORY" ]]; then
        # Try to get from git remote
        GITHUB_REPOSITORY=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's/.*github.com[:/]\(.*\)/\1/')
    fi
    [[ -z "$GITHUB_REPOSITORY" ]] && missing+=("GITHUB_REPOSITORY")
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        error "Missing required variables: ${missing[*]}\nPlease add them to your .env file"
    fi
    
    # Extract GitHub username from repository
    GITHUB_USER=$(echo "$GITHUB_REPOSITORY" | cut -d'/' -f1)
    
    success "All required variables present"
    info "  - Database: ${DATABASE_URL:0:50}..."
    info "  - Azure Subscription: $AZURE_SUBSCRIPTION_ID"
    info "  - GitHub Repo: $GITHUB_REPOSITORY"
}

# =============================================================================
# Install dependencies (for Codespaces)
# =============================================================================

install_deps() {
    info "Checking and installing dependencies..."
    
    # Check if running in Codespaces
    if [[ -n "$CODESPACES" ]]; then
        info "Running in GitHub Codespaces"
    fi
    
    # Install Terraform if not present
    if ! command -v terraform &> /dev/null; then
        info "Installing Terraform..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux (Codespaces)
            sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
            wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
            echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
            sudo apt-get update && sudo apt-get install -y terraform
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install terraform
        fi
    fi
    
    # Install Azure CLI if not present
    if ! command -v az &> /dev/null; then
        info "Installing Azure CLI..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install azure-cli
        fi
    fi
    
    success "Dependencies installed"
    terraform --version
    az --version | head -1
}

# =============================================================================
# Azure Login
# =============================================================================

azure_login() {
    info "Checking Azure login status..."
    
    # Check if already logged in
    if az account show &> /dev/null; then
        CURRENT_SUB=$(az account show --query id -o tsv)
        if [[ "$CURRENT_SUB" == "$AZURE_SUBSCRIPTION_ID" ]]; then
            success "Already logged in to correct subscription"
            return
        fi
    fi
    
    info "Logging into Azure..."
    
    # Use device code flow (works in Codespaces)
    az login --use-device-code
    
    # Set the correct subscription
    info "Setting subscription to $AZURE_SUBSCRIPTION_ID..."
    az account set --subscription "$AZURE_SUBSCRIPTION_ID"
    
    success "Azure login successful"
}

# =============================================================================
# Build and Push Docker Image to GHCR
# =============================================================================

build_and_push_image() {
    info "Building and pushing Docker image to GitHub Container Registry..."
    
    IMAGE_NAME="ghcr.io/${GITHUB_REPOSITORY}/backend"
    IMAGE_TAG="latest"
    FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
    
    # Login to GHCR
    info "Logging into GitHub Container Registry..."
    if [[ -n "$GITHUB_TOKEN" ]]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
    elif [[ -n "$GH_TOKEN" ]]; then
        echo "$GH_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
    else
        error "No GitHub token found. Set GITHUB_TOKEN or GH_TOKEN in .env"
    fi
    
    # Build the image
    info "Building Docker image: $FULL_IMAGE"
    cd "${PROJECT_ROOT}/backend"
    docker build \
        -t "$FULL_IMAGE" \
        --target production \
        -f Dockerfile \
        .
    
    # Push to GHCR
    info "Pushing image to GHCR..."
    docker push "$FULL_IMAGE"
    
    cd "$PROJECT_ROOT"
    success "Image pushed: $FULL_IMAGE"
}

# =============================================================================
# Generate Terraform Variables
# =============================================================================

generate_tfvars() {
    info "Generating Terraform variables file..."
    
    TFVARS_FILE="${TERRAFORM_DIR}/terraform.tfvars"
    
    cat > "$TFVARS_FILE" << EOF
# Auto-generated by deploy-azure.sh on $(date)
# DO NOT COMMIT THIS FILE!

# Azure Configuration
azure_subscription_id = "$AZURE_SUBSCRIPTION_ID"

# Project Settings
project_name = "$PROJECT_NAME"
environment  = "$ENVIRONMENT"
location     = "$AZURE_LOCATION"

# GitHub Repository (for container image)
github_repo = "$GITHUB_REPOSITORY"

# Database (Neon - FREE!)
neon_database_url = "$DATABASE_URL"

# Monitoring (Sentry - FREE!)
sentry_dsn = "${SENTRY_DSN:-}"

# Optional: Google OAuth
google_client_id     = "${GOOGLE_CLIENT_ID:-}"
google_client_secret = "${GOOGLE_CLIENT_SECRET:-}"

# Optional: AI
gemini_api_key = "${GEMINI_API_KEY:-}"
EOF

    # Add to .gitignore if not already there
    if ! grep -q "terraform.tfvars" "${TERRAFORM_DIR}/.gitignore" 2>/dev/null; then
        echo "terraform.tfvars" >> "${TERRAFORM_DIR}/.gitignore"
    fi
    
    success "Terraform variables generated at $TFVARS_FILE"
}

# =============================================================================
# Deploy with Terraform
# =============================================================================

deploy_terraform() {
    info "Deploying infrastructure with Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    info "Initializing Terraform..."
    terraform init -upgrade
    
    # Plan
    info "Planning deployment..."
    terraform plan -out=tfplan
    
    # Apply
    info "Applying deployment..."
    terraform apply tfplan
    
    # Get outputs
    info "Deployment complete! Getting outputs..."
    echo ""
    echo "============================================="
    echo -e "${GREEN}🚀 DEPLOYMENT SUCCESSFUL!${NC}"
    echo "============================================="
    terraform output
    echo "============================================="
    
    # Get the app URL
    APP_URL=$(terraform output -raw app_url 2>/dev/null || echo "")
    if [[ -n "$APP_URL" ]]; then
        echo ""
        success "Your API is live at: $APP_URL"
        echo ""
        info "Testing health endpoint..."
        sleep 10  # Wait for app to start
        curl -s "$APP_URL/health" || warn "Health check pending - app may still be starting"
    fi
    
    cd "$PROJECT_ROOT"
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo "============================================="
    echo -e "${BLUE}🚀 Flatmates App - Azure Deployment${NC}"
    echo "============================================="
    echo ""
    
    # Step 1: Load environment
    load_env
    
    # Step 2: Validate
    validate_env
    
    # Step 3: Install dependencies
    install_deps
    
    # Step 4: Azure login
    azure_login
    
    # Step 5: Build and push Docker image
    build_and_push_image
    
    # Step 6: Generate Terraform vars
    generate_tfvars
    
    # Step 7: Deploy!
    deploy_terraform
    
    echo ""
    echo "============================================="
    echo -e "${GREEN}✅ ALL DONE!${NC}"
    echo "============================================="
    echo ""
    echo "Next steps:"
    echo "  1. Update mobile app with your new API URL"
    echo "  2. Set up GitHub Actions for auto-deploy (optional)"
    echo "  3. Monitor costs: az consumption usage list"
    echo ""
}

# Run main function
main "$@"
