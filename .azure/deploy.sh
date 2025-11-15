#!/bin/bash
# Azure Web App deployment script
# This script can be used for manual deployment or in CI/CD pipelines

set -e

echo "=========================================="
echo "Azure Web App Deployment Script"
echo "=========================================="

# Navigate to backend directory
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Install additional dependencies for Azure
echo "Installing Azure-specific dependencies..."
pip install gunicorn  # Alternative to uvicorn for production

# Run database migrations if needed
echo "Checking database connection..."
python -c "from database import init_db; init_db()" || echo "Database initialization skipped"

echo "=========================================="
echo "Deployment preparation complete!"
echo "=========================================="

