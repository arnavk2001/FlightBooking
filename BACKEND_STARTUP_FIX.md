# Backend Startup Script Fix

## Issue
Error when starting backend in production mode:
```
Fatal error in launcher: Unable to create process using '"C:\inetpub\wwwroot\bookingbot\bookingbot3\backend\venv\Scripts\python.exe"  "C:\inetpub\wwwroot\bookingbot\backend\venv\Scripts\uvicorn.exe" app:app --host 0.0.0.0 --port 8000 --workers 4': The system cannot find the file specified.
```

## Root Cause
The issue was caused by:
1. **Path mismatch**: Script was trying to use incorrect paths
2. **Direct uvicorn.exe call**: Using `uvicorn.exe` directly can cause path resolution issues
3. **Working directory**: Script wasn't ensuring it was in the correct directory

## Solution

### Changes Made

1. **Use Python module invocation**: Changed from `uvicorn.exe` to `python -m uvicorn` for better path resolution
2. **Fixed working directory**: Scripts now explicitly set and verify the working directory
3. **Added path checks**: Scripts verify virtual environment exists before use
4. **Added uvicorn installation check**: Scripts check if uvicorn is installed and install if needed

### Updated Scripts

#### Windows (`start-backend.bat` and `backend/start-production.bat`)
- Now uses `python.exe -m uvicorn` instead of `uvicorn.exe`
- Explicitly sets working directory
- Checks for uvicorn installation

#### Linux/Mac (`start-backend.sh` and `backend/start-production.sh`)
- Now uses `python -m uvicorn` instead of `uvicorn` command
- Gets script directory correctly
- Checks for uvicorn installation

## Usage

### Development Mode
```bash
# From project root
start-backend.bat    # Windows
./start-backend.sh   # Linux/Mac
```

### Production Mode
```bash
# From backend directory
cd backend
start-production.bat    # Windows
./start-production.sh   # Linux/Mac
```

## Why This Works

1. **Python module invocation** (`python -m uvicorn`) uses Python's module resolution, which handles paths correctly
2. **Explicit directory setting** ensures scripts run from the correct location
3. **Installation checks** ensure all dependencies are available

## Alternative: If Issues Persist

If you still encounter path issues, you can run directly:

```bash
# Windows
cd backend
venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000

# Linux/Mac
cd backend
source venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Still getting path errors?

1. **Verify virtual environment exists**:
   ```bash
   # Windows
   dir backend\venv\Scripts\python.exe
   
   # Linux/Mac
   ls backend/venv/bin/python
   ```

2. **Recreate virtual environment**:
   ```bash
   cd backend
   rmdir /s /q venv    # Windows
   rm -rf venv         # Linux/Mac
   python -m venv venv
   ```

3. **Install dependencies**:
   ```bash
   cd backend
   venv\Scripts\python.exe -m pip install -r requirements.txt    # Windows
   source venv/bin/activate && pip install -r requirements.txt    # Linux/Mac
   ```

4. **Check Python installation**:
   ```bash
   python --version
   python -m pip --version
   ```

