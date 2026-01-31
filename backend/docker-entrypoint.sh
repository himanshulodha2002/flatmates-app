#!/bin/bash
set -e

echo "🚀 Starting Flatmates Backend..."

# Run database migrations
echo "📦 Running database migrations..."
alembic upgrade head

echo "✅ Migrations complete!"

# Start the application
echo "🌐 Starting server..."
exec "$@"
