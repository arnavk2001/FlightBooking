# Production 500 Error Fix

## Issue
The bot works on `http://localhost:3000/bookingbot/` but gives 500 Internal Server Error on `https://bookingbot.abovethewings.com/bookingbot`.

## Root Causes

1. **API URL Configuration**: In production, `VITE_API_URL` may not be set, causing API calls to fail
2. **Backend Accessibility**: Backend may not be accessible at the expected URL
3. **CORS Configuration**: CORS may not be properly configured for production domain
4. **Error Handling**: Errors are not being caught and displayed properly

## Fixes Applied

### 1. Enhanced API URL Configuration
Updated `ChatBot.jsx` to better handle API URL in production:
- Uses `VITE_API_URL` if set
- Falls back to relative path `/api` in production (assumes backend is proxied)
- Uses Vite proxy in development

### 2. Improved Error Handling
- Added detailed error messages for different error types
- Better logging of API URLs and errors
- User-friendly error messages

### 3. Diagnostic Checks
- Diagnostic checks now run in production too
- Logs API connection status to console

## Steps to Fix Production

### Step 1: Verify Backend is Running
Check if backend is accessible:
```bash
curl https://bookingbot.abovethewings.com/api/health
```

Expected response:
```json
{"status": "healthy", "timestamp": "..."}
```

### Step 2: Configure Frontend Environment Variables

Create or update `frontend/.env.production`:
```env
VITE_API_URL=https://bookingbot.abovethewings.com/api
VITE_BASE_PATH=/bookingbot
```

**OR** if backend is on the same domain and proxied:
```env
VITE_API_URL=
VITE_BASE_PATH=/bookingbot
```

### Step 3: Rebuild Frontend
```bash
cd frontend
npm run build
```

### Step 4: Verify Backend CORS Configuration

Check `backend/app.py` - ensure production domain is in `ALLOWED_ORIGINS`:
```python
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,https://bookingbot.abovethewings.com")
```

Or set environment variable:
```env
ALLOWED_ORIGINS=https://bookingbot.abovethewings.com
```

### Step 5: Check IIS/Web Server Configuration

Ensure:
1. Backend is accessible at `/api` path (via reverse proxy or separate deployment)
2. Frontend files are in `/bookingbot/` directory
3. `web.config` is present and configured correctly
4. URL Rewrite module is installed (for IIS)

### Step 6: Test Production

1. Open browser console (F12)
2. Navigate to `https://bookingbot.abovethewings.com/bookingbot`
3. Check console for:
   - API connection test results
   - Any error messages
   - Network tab for failed requests

## Troubleshooting

### If 500 error persists:

1. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed API calls
   - Note the exact error message

2. **Check Backend Logs**:
   - Look for backend application logs
   - Check for Python errors
   - Verify backend is actually running

3. **Test API Directly**:
   ```bash
   curl https://bookingbot.abovethewings.com/api/health
   curl -X POST https://bookingbot.abovethewings.com/api/search-flights \
     -H "Content-Type: application/json" \
     -d '{"origin":"LHR","destination":"JFK","departure_date":"2025-06-01","adults":1}'
   ```

4. **Verify Environment Variables**:
   - Check if `VITE_API_URL` is set in production build
   - Check backend environment variables
   - Verify CORS origins

5. **Check IIS Configuration**:
   - Verify URL Rewrite rules
   - Check application pool is running
   - Verify permissions on files

## Common Issues

### Issue: "Network Error" or "Failed to fetch"
**Cause**: Backend not accessible or CORS issue
**Fix**: 
- Verify backend is running
- Check CORS configuration
- Verify API URL is correct

### Issue: "404 Not Found" on API calls
**Cause**: Backend not deployed or wrong URL
**Fix**:
- Verify backend deployment
- Check API URL configuration
- Verify reverse proxy configuration

### Issue: "500 Internal Server Error" from backend
**Cause**: Backend application error
**Fix**:
- Check backend logs
- Verify environment variables
- Check database connection
- Verify API keys are set

## Next Steps

1. Deploy updated frontend build
2. Verify backend is running and accessible
3. Test the application
4. Monitor logs for any errors

