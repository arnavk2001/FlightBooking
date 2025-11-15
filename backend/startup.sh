#!/bin/bash
# Azure Web App startup script for Linux
# This script is used by Azure App Service to start the application

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set environment variables if not already set
export PYTHONUNBUFFERED=1
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Start the FastAPI application with uvicorn
# Azure App Service will set PORT environment variable
exec python -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2

