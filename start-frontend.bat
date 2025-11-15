@echo off
echo Starting Flight Booking Bot Frontend...
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found in frontend directory.
    pause
    exit /b 1
)

echo Starting development server...
echo Frontend will be available at http://localhost:3000
echo.
call npm run dev
pause

