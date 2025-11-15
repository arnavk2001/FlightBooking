@echo off
echo Running Amadeus API Test...
echo.

cd /d %~dp0

REM Check if virtual environment exists and is valid
if exist "venv\Scripts\python.exe" (
    REM Test if the venv Python works
    venv\Scripts\python.exe --version >nul 2>&1
    if errorlevel 1 (
        echo Virtual environment is corrupted, recreating...
        rmdir /s /q venv
        goto :create_venv
    )
    goto :run_test
) else (
    :create_venv
    echo Virtual environment not found, creating...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment. Please ensure Python is installed.
        pause
        exit /b 1
    )
)

:run_test
echo Using virtual environment...
call venv\Scripts\activate.bat

REM Check if dependencies are installed
venv\Scripts\python.exe -c "import dotenv" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
    venv\Scripts\python.exe -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Running test_amadeus.py...
echo.
venv\Scripts\python.exe test_amadeus.py

pause

