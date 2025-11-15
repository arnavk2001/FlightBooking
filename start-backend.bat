@echo off
echo Starting Flight Booking Bot Backend...
cd backend

REM Check if virtual environment exists and is valid
if exist "venv\Scripts\python.exe" (
    REM Test if the venv Python works
    venv\Scripts\python.exe --version >nul 2>&1
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
venv\Scripts\python.exe -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    echo Upgrading pip, setuptools, and wheel first...
    venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
    echo Installing packages from requirements.txt...
    venv\Scripts\python.exe -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies.
        echo This might be due to Python 3.14 compatibility issues.
        echo Try running: fix_install.bat
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if uvicorn is installed
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Installing uvicorn...
    python -m pip install uvicorn[standard]
)

REM Verify we're using the venv Python
echo Verifying Python location...
python -c "import sys; print('Python:', sys.executable)" 2>nul

REM Run the application using uvicorn via Python module for better compatibility
echo.
echo Starting server...
echo Backend will be available at:
echo   - http://localhost:8000 (local)
echo   - http://0.0.0.0:8000 (network)
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause

