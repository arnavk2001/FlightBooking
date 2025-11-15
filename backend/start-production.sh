#!/bin/bash
echo "Starting Flight Booking Bot Backend (Production Mode)..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Current directory: $PWD"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if uvicorn is installed
python -c "import uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing uvicorn..."
    pip install uvicorn[standard]
fi

# Run the application in production mode (no reload, multiple workers)
echo "Starting server in production mode..."
echo "Backend will be available at:"
echo "  - http://localhost:8000 (local)"
echo "  - http://0.0.0.0:8000 (network accessible)"
echo ""
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4

