#!/bin/bash
echo "Starting Flight Booking Bot Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if dependencies are installed
python -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# Check if uvicorn is installed
python -c "import uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing uvicorn..."
    pip install uvicorn[standard]
fi

# Run the application using uvicorn via Python module for better compatibility
echo "Starting server..."
echo "Backend will be available at:"
echo "  - http://localhost:8000 (local)"
echo "  - http://0.0.0.0:8000 (network)"
echo ""
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

