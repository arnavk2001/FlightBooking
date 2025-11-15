@echo off
echo Starting Flight Booking Bot Backend (Production Mode)...

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Current directory: %CD%

REM Check if virtual environment exists and is valid
if exist "venv\Scripts\python.exe" (
    REM Test if the venv Python works
    "venv\Scripts\python.exe" --version >nul 2>&1
    if errorlevel 1 (
        echo Virtual environment is corrupted, recreating...
        rmdir /s /q venv
        goto :create_venv
    )
) else (
    :create_venv
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

REM Check if dependencies are installed
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    echo Upgrading pip, setuptools, and wheel first...
    python -m pip install --upgrade pip setuptools wheel
    echo Installing packages from requirements.txt...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Check if uvicorn is installed
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Installing uvicorn...
    python -m pip install uvicorn[standard]
)

REM Verify we're using the venv Python
echo Verifying Python location...
python -c "import sys; print('Python:', sys.executable)" 2>nul

REM Run the application in production mode (no reload)
echo.
echo Starting server in production mode...
echo Backend will be available at:
echo   - http://localhost:8000 (local)
echo   - http://0.0.0.0:8000 (network accessible)
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
pause

