@echo off
REM Force reinstall script for Windows

echo ========================================
echo Flight Booking Bot - Force Reinstall
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo Python found:
python --version
echo.

REM Remove existing venv
if exist "venv" (
    echo Removing existing virtual environment...
    rmdir /s /q venv
)

REM Create new venv
echo Creating new virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Verify we're using venv Python
echo.
echo Using Python from:
python -c "import sys; print(sys.executable)"
echo.

REM Upgrade pip and build tools
echo Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel --quiet

REM Install dependencies
echo.
echo Installing dependencies from requirements.txt...
echo This may take a few minutes...
echo.
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check the error messages above
    pause
    exit /b 1
)

REM Verify installation
echo.
echo Verifying installation...
python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python -c "import uvicorn; print('Uvicorn:', uvicorn.__version__)"
python -c "import sqlalchemy; print('SQLAlchemy:', sqlalchemy.__version__)"

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo To run the server:
echo   1. Activate venv: venv\Scripts\activate
echo   2. Run: python app.py
echo.
pause

