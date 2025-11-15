@echo off
echo Installing/Updating Backend Dependencies...

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Current directory: %CD%

REM Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment. Please ensure Python is installed.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel

REM Install dependencies
echo Installing packages from requirements.txt...
python -m pip install -r requirements.txt

REM Install uvicorn if not already installed
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Installing uvicorn...
    python -m pip install uvicorn[standard]
)

echo.
echo Dependencies installed successfully!
echo.
echo To start the backend:
echo   Development: start-backend.bat (from project root)
echo   Production:  start-production.bat (from backend directory)
echo.
pause

