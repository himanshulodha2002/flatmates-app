#!/bin/bash

# Startup script for FastAPI backend
# This script activates the virtual environment and starts the development server

set -e

echo "🚀 Starting Flatmates App Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found."
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo ""
    echo "⚠️  Dependencies not installed."
    echo "Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found."
    echo "Please create a .env file based on .env.example:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your database credentials"
    exit 1
fi

echo ""
echo "✓ Environment ready"
echo ""
echo "Starting development server..."
echo "API will be available at: http://localhost:8000"
echo "API docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
