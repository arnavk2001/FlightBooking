# Backend Network Access Fix

## Issue
When starting the backend, you see the message: "Network: use --host to expose"

This warning appears when uvicorn detects that the server might not be accessible from other machines on the network.

## Solution

The backend has been updated to explicitly use `--host 0.0.0.0` which makes it accessible from:
- **Localhost**: `http://localhost:8000`
- **Network**: `http://<your-ip>:8000` or `http://0.0.0.0:8000`

## Changes Made

### 1. Updated Startup Scripts
- **`start-backend.bat`** (Windows): Now uses `uvicorn` command directly with `--host 0.0.0.0`
- **`start-backend.sh`** (Linux/Mac): Now uses `uvicorn` command directly with `--host 0.0.0.0`
- **`backend/start-production.bat`**: New script for production deployment with multiple workers
- **`backend/start-production.sh`**: New script for production deployment with multiple workers

### 2. Updated app.py
The `uvicorn.run()` call now explicitly sets `host="0.0.0.0"` to ensure network access.

## Usage

### Development Mode (with auto-reload)
```bash
# Windows
start-backend.bat

# Linux/Mac
./start-backend.sh
```

### Production Mode (no reload, multiple workers)
```bash
# Windows
cd backend
start-production.bat

# Linux/Mac
cd backend
./start-production.sh
```

## What This Fixes

1. **Network Access**: Backend is now accessible from other machines on the network
2. **Warning Suppression**: The "use --host to expose" warning no longer appears
3. **Production Ready**: Production scripts use multiple workers for better performance

## Testing Network Access

After starting the backend, you can test network access:

1. **From the same machine**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **From another machine on the network**:
   ```bash
   curl http://<server-ip>:8000/health
   ```

3. **Check if accessible**:
   - Open browser on another machine
   - Navigate to `http://<server-ip>:8000/docs` to see API documentation
   - Navigate to `http://<server-ip>:8000/health` for health check

## Security Note

⚠️ **Important**: Exposing the backend on `0.0.0.0` makes it accessible from any machine that can reach your server. For production:

1. **Use a firewall** to restrict access
2. **Use HTTPS** with proper SSL certificates
3. **Configure CORS** properly in `backend/app.py`
4. **Use a reverse proxy** (Nginx/Apache) in front of the backend
5. **Set up authentication** if the API should be protected

## Production Deployment

For production, it's recommended to:

1. **Use a reverse proxy** (Nginx/Apache) that:
   - Handles SSL/TLS termination
   - Routes `/api` requests to the backend
   - Provides additional security headers

2. **Run backend as a service**:
   - Windows: Use Windows Service or Task Scheduler
   - Linux: Use systemd service or supervisor

3. **Use environment variables** for configuration:
   - Database credentials
   - API keys
   - CORS origins
   - Frontend URL

## Troubleshooting

### Backend still not accessible?

1. **Check firewall**:
   - Windows: Check Windows Firewall settings
   - Linux: Check iptables or ufw rules
   - Ensure port 8000 is open

2. **Check if backend is running**:
   ```bash
   # Windows
   netstat -an | findstr :8000
   
   # Linux/Mac
   netstat -an | grep :8000
   # or
   lsof -i :8000
   ```

3. **Check backend logs**:
   - Look for any error messages
   - Verify it's listening on `0.0.0.0:8000`

4. **Test from command line**:
   ```bash
   curl http://localhost:8000/health
   ```

### Still seeing the warning?

If you still see the warning, it might be from an older uvicorn version. Update uvicorn:
```bash
pip install --upgrade uvicorn[standard]
```

