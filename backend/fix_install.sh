#!/bin/bash
# Force reinstall script for Mac/Linux

echo "========================================"
echo "Flight Booking Bot - Force Reinstall"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from python.org"
    exit 1
fi

echo "Python found:"
python3 --version
echo ""

# Remove existing venv
if [ -d "venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf venv
fi

# Create new venv
echo "Creating new virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create virtual environment"
    exit 1
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi

# Verify we're using venv Python
echo ""
echo "Using Python from:"
python -c "import sys; print(sys.executable)"
echo ""

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip --quiet

# Install dependencies
echo ""
echo "Installing dependencies from requirements.txt..."
echo "This may take a few minutes..."
echo ""
python -m pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies"
    echo "Please check the error messages above"
    exit 1
fi

# Verify installation
echo ""
echo "Verifying installation..."
python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python -c "import uvicorn; print('Uvicorn:', uvicorn.__version__)"
python -c "import sqlalchemy; print('SQLAlchemy:', sqlalchemy.__version__)"

echo ""
echo "========================================"
echo "Installation complete!"
echo "========================================"
echo ""
echo "To run the server:"
echo "  1. Activate venv: source venv/bin/activate"
echo "  2. Run: python app.py"
echo ""

