# Troubleshooting "Network Error"

## Common Causes

1. **Backend server is not running**
2. **Backend not accessible on port 8000**
3. **CORS configuration issue**
4. **API URL misconfiguration**

## Quick Fixes

### Step 1: Check if Backend is Running

**Option A: Check Terminal**
- Look for a terminal window running `python app.py` or `uvicorn app:app`
- Backend should show: "Application startup complete" and "Uvicorn running on http://0.0.0.0:8000"

**Option B: Check in Browser**
- Open: http://localhost:8000/health
- Should return: `{"status":"healthy","timestamp":"..."}`

**Option C: Check Process**
```batch
netstat -ano | findstr :8000
```

If nothing is listening on port 8000, the backend is not running.

### Step 2: Start the Backend

```batch
cd backend
start-backend.bat
```

OR manually:
```batch
cd backend
venv\Scripts\activate
python app.py
```

### Step 3: Verify Backend is Accessible

1. Open browser: http://localhost:8000/health
2. Should see: `{"status":"healthy","timestamp":"..."}`
3. If you see connection refused, backend is not running

### Step 4: Check Frontend Configuration

**Check API URL in browser console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for diagnostic messages showing API URL
4. Should show: `API URL: http://localhost:8000`

**Check environment variables:**
- Frontend should use: `http://localhost:8000` in development
- If `VITE_API_URL` is set incorrectly, it might point to wrong URL

### Step 5: Check CORS Configuration

**Backend CORS should allow:**
- `http://localhost:3000` (Vite default port)
- `http://localhost:5173` (Vite alternate port)

Check `backend/app.py`:
```python
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,https://bookingbot.abovethewings.com").split(",")
```

### Step 6: Test API Connection

Open browser console and run:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this fails, backend is not accessible.

## Common Solutions

### Solution 1: Backend Not Running

**Fix:**
```batch
cd backend
start-backend.bat
```

Wait for: "Application startup complete"

### Solution 2: Port Conflict

**Check if port 8000 is in use:**
```batch
netstat -ano | findstr :8000
```

**If port is in use:**
- Kill the process using that port
- Or change backend port in `app.py`:
  ```python
  uvicorn.run(app, host="0.0.0.0", port=8001)
  ```
- Update frontend `VITE_API_URL` to match

### Solution 3: Firewall Blocking

**Windows Firewall might be blocking:**
1. Open Windows Defender Firewall
2. Allow Python through firewall
3. Or temporarily disable firewall for testing

### Solution 4: Wrong API URL

**Check frontend API URL:**
- In browser console, look for: `API URL: ...`
- Should be: `http://localhost:8000` in development
- If it's different, check `.env` file in frontend directory

**Create/update `frontend/.env`:**
```env
VITE_API_URL=http://localhost:8000
```

### Solution 5: CORS Error

**If you see CORS error in console:**
- Backend CORS might not include your frontend URL
- Check backend is running and CORS is configured
- Add your frontend URL to `ALLOWED_ORIGINS` in backend `.env`

## Debugging Steps

1. **Open browser DevTools (F12)**
2. **Go to Network tab**
3. **Try to use the app**
4. **Look for failed requests:**
   - Red requests indicate failures
   - Check the request URL
   - Check error message

5. **Check Console tab:**
   - Look for error messages
   - Diagnostic messages should show API URL

6. **Test backend directly:**
   - Open: http://localhost:8000/health
   - Should return JSON response

## Quick Test Script

Create `test-connection.bat`:
```batch
@echo off
echo Testing backend connection...
curl http://localhost:8000/health
if errorlevel 1 (
    echo Backend is NOT running!
    echo Start it with: cd backend && start-backend.bat
) else (
    echo Backend is running!
)
pause
```

## Still Having Issues?

1. Check backend terminal for error messages
2. Check browser console for detailed error messages
3. Verify both frontend and backend are running
4. Check firewall settings
5. Try accessing backend directly: http://localhost:8000/health

