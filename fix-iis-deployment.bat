@echo off
REM Quick fix script for IIS deployment
echo ========================================
echo IIS Deployment Fix for Booking Bot
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo ERROR: frontend folder not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if dist folder exists
if not exist "frontend\dist" (
    echo Building frontend...
    cd frontend
    call npm run build
    cd ..
    if errorlevel 1 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
)

REM Step 1: Copy web.config
echo.
echo [1/4] Copying web.config...
if exist "frontend\public\web.config" (
    copy /Y "frontend\public\web.config" "C:\inetpub\wwwroot\bookingbot\web.config"
    if errorlevel 1 (
        echo WARNING: Could not copy web.config
        echo Please copy manually: frontend\public\web.config to C:\inetpub\wwwroot\bookingbot\web.config
    ) else (
        echo OK: web.config copied
    )
) else (
    echo ERROR: web.config not found in frontend\public\
    pause
    exit /b 1
)

REM Step 2: Copy dist files
echo.
echo [2/4] Copying frontend files...
if exist "C:\inetpub\wwwroot\bookingbot" (
    xcopy /E /I /Y "frontend\dist\*" "C:\inetpub\wwwroot\bookingbot\"
    if errorlevel 1 (
        echo WARNING: Some files may not have copied
    ) else (
        echo OK: Files copied
    )
) else (
    echo Creating bookingbot directory...
    mkdir "C:\inetpub\wwwroot\bookingbot"
    xcopy /E /I /Y "frontend\dist\*" "C:\inetpub\wwwroot\bookingbot\"
)

REM Step 3: Set permissions
echo.
echo [3/4] Setting permissions...
icacls "C:\inetpub\wwwroot\bookingbot" /grant "IIS_IUSRS:(OI)(CI)R" /T >nul 2>&1
if errorlevel 1 (
    echo WARNING: Could not set permissions (may need admin rights)
    echo Please run: icacls "C:\inetpub\wwwroot\bookingbot" /grant "IIS_IUSRS:(OI)(CI)R" /T
) else (
    echo OK: Permissions set
)

REM Step 4: Restart IIS
echo.
echo [4/4] Restarting IIS...
iisreset
if errorlevel 1 (
    echo WARNING: Could not restart IIS (may need admin rights)
    echo Please restart IIS manually or run this script as Administrator
) else (
    echo OK: IIS restarted
)

echo.
echo ========================================
echo Deployment complete!
echo ========================================
echo.
echo IMPORTANT: Make sure URL Rewrite module is installed:
echo   Download: https://www.iis.net/downloads/microsoft/url-rewrite
echo.
echo Test the deployment:
echo   https://bookingbot.abovethewings.com/bookingbot/
echo.
pause

