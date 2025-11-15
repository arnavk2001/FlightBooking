# Production 500 Error Fix

## Issue
Production site at `https://bookingbot.abovethewings.com/` was returning 500 Internal Server Error due to:
1. **Outdated frontend build** - Old asset files referenced in index.html
2. **Incorrect API URL** - `.env.production` had wrong backend URL
3. **Missing production files** - New build not deployed to production location

## Fixes Applied

### 1. Fixed API URL in `.env.production`
**Location**: `frontend/.env.production`

**Changed from**:
```
VITE_API_URL=https://bookingbot.abovethewings.com/backend
```

**Changed to**:
```
VITE_API_URL=https://bookingbot.abovethewings.com/api
```

### 2. Rebuilt Frontend
Rebuilt the frontend with correct production settings:
```bash
cd frontend
npm run build
```

### 3. Deployed to Production Location
Copied new build files from `frontend/dist/` to `C:\inetpub\wwwroot\bookingbot\`

## Next Steps

### 1. Update `.env.production` Manually
Since `.env.production` is in `.gitignore`, you need to update it manually:

**File**: `frontend/.env.production`
```env
VITE_API_URL=https://bookingbot.abovethewings.com/api
VITE_BASE_PATH=/bookingbot
```

### 2. Verify Backend is Running
Ensure the backend is running and accessible at:
- `https://bookingbot.abovethewings.com/api/health`

### 3. Test Production Site
1. Clear browser cache
2. Visit: `https://bookingbot.abovethewings.com/`
3. Check browser console (F12) for any errors
4. Try a flight search

### 4. Check IIS Configuration
Ensure:
- URL Rewrite module is installed
- `web.config` is in the production directory
- IIS application pool is running
- Permissions are set correctly

## Troubleshooting

### If 500 error persists:

1. **Check IIS Logs**:
   - Location: `C:\inetpub\logs\LogFiles\`
   - Look for recent errors

2. **Check Backend Status**:
   ```powershell
   # Test backend health endpoint
   Invoke-WebRequest -Uri "https://bookingbot.abovethewings.com/api/health"
   ```

3. **Verify File Permissions**:
   ```powershell
   icacls "C:\inetpub\wwwroot\bookingbot" /grant "IIS_IUSRS:(OI)(CI)R" /T
   ```

4. **Restart IIS**:
   ```powershell
   iisreset
   ```

5. **Check Browser Console**:
   - Open DevTools (F12)
   - Check Console tab for JavaScript errors
   - Check Network tab for failed requests

## Important Notes

- The app is configured for `/bookingbot/` subdirectory
- Frontend assets are built with `/bookingbot/` base path
- Backend should be accessible at `/api` endpoints
- All API calls should go to `https://bookingbot.abovethewings.com/api/*`

