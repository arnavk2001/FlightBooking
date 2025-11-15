# Fix for 404 Error (ERR_BAD_REQUEST)

## Problem
Frontend was getting `AxiosError: Request failed with status code 404` when trying to search for flights.

## Root Cause
The Vite proxy configuration was **removing the `/api` prefix** when forwarding requests to the backend:
- Frontend called: `/api/search-flights`
- Vite proxy forwarded to: `http://localhost:8000/search-flights` ❌ (missing `/api`)
- Backend endpoint is: `/api/search-flights` ✅
- Result: 404 Not Found

## Solution
Fixed the Vite proxy configuration to **keep the `/api` prefix** when forwarding:

**Before:**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '') // ❌ Removed /api
  }
}
```

**After:**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
    // ✅ Keeps /api prefix
  }
}
```

## Request Flow (Fixed)

1. **Frontend**: `POST /api/search-flights`
2. **Vite Proxy**: Forwards to `http://localhost:8000/api/search-flights`
3. **Backend**: Receives at `/api/search-flights` ✅
4. **Response**: Returns flight data

## Changes Made

1. ✅ Fixed `frontend/vite.config.js` - Removed `rewrite` function
2. ✅ Restarted frontend server to apply changes

## Testing

After restarting frontend:

1. **Open browser**: http://localhost:3000
2. **Open DevTools** (F12) → Console tab
3. **Try flight search**:
   - Origin: "LHR" or "London"
   - Destination: "JFK" or "New York"
   - Date: "2024-12-15"
4. **Check console**:
   - Should see successful API call
   - Should see flight data returned
   - No more 404 errors

## Verification

✅ Backend endpoint: `POST /api/search-flights` exists  
✅ Frontend calls: `/api/search-flights`  
✅ Vite proxy: Forwards correctly with `/api` prefix  
✅ Frontend server: Restarted with new configuration  

## If Still Getting Errors

1. **Check backend is running**: http://localhost:8000/health
2. **Check frontend is running**: http://localhost:3000
3. **Check browser console** for detailed error messages
4. **Verify proxy is working**: Check Network tab in DevTools
   - Look for request to `/api/search-flights`
   - Check if it's being proxied correctly

---

**Status**: ✅ Fixed - Frontend restarted with corrected proxy configuration

