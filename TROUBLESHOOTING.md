# Troubleshooting Guide

## Quick Diagnosis

### 1. Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for JavaScript errors
- **Network tab**: Check if API calls are failing

### 2. Common Issues

#### Issue: Blank Page / 404 Errors
**Cause**: React Router not configured for subdirectory
**Fix**: 
- Verify `basename="/bookingbot"` in `App.jsx`
- Verify `base: '/bookingbot/'` in `vite.config.js`
- Ensure web server is configured to serve `index.html` for all routes

#### Issue: API Calls Failing (CORS or 404)
**Cause**: Backend URL not configured correctly
**Fix**:
1. Check what URL your backend is deployed at
2. Set `VITE_API_URL` in `.env.production`:
   ```env
   VITE_API_URL=https://your-backend-domain.com
   ```
3. Or use relative paths if backend is on same domain:
   ```env
   VITE_API_URL=
   ```
4. Ensure backend CORS allows your frontend domain

#### Issue: Assets Not Loading (CSS/JS files 404)
**Cause**: Base path not configured in Vite
**Fix**:
- Verify `base: '/bookingbot/'` in `vite.config.js`
- Rebuild the frontend: `npm run build`
- Clear browser cache

#### Issue: Routes Not Working (direct URL access)
**Cause**: Web server not configured for SPA routing
**Fix**: Configure web server to serve `index.html` for all routes under `/bookingbot/`

### 3. Backend Configuration

#### Check Backend is Running
```bash
curl https://your-backend-url.com/api/health
```

#### Check CORS Configuration
Backend should have:
```python
ALLOWED_ORIGINS=https://bookingbot.abovethewings.com
```

#### Check Environment Variables
Ensure all backend environment variables are set:
- Database credentials
- API keys (Amadeus, PayPal)
- Email SMTP settings
- Frontend URL for PayPal redirects

### 4. Frontend Configuration

#### Check Build Output
```bash
cd frontend
npm run build
# Check dist/ folder is created
```

#### Check Environment Variables
Create `.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
VITE_BASE_PATH=/bookingbot
```

#### Verify Deployment Structure
Files should be deployed as:
```
/bookingbot/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   └── index-[hash].css
  └── ...
```

### 5. Testing Steps

1. **Test API Connection**:
   - Open browser console
   - Navigate to app
   - Check Network tab for `/api/health` or `/api/search-flights`
   - Look for CORS errors or 404s

2. **Test Flight Search**:
   - Try searching for flights
   - Check console for errors
   - Verify API response in Network tab

3. **Test Routing**:
   - Navigate to `/bookingbot/payment-success`
   - Should not show 404
   - Should load the payment success page

### 6. Debug Information

Add this to see current configuration:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL)
console.log('Base Path:', import.meta.env.VITE_BASE_PATH)
console.log('Environment:', import.meta.env.MODE)
```

### 7. Quick Fixes

**If nothing works**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Rebuild frontend: `npm run build`
3. Redeploy all files
4. Check web server error logs
5. Verify backend is accessible and running

### 8. Contact Information

If issues persist:
- Check backend logs
- Check web server logs
- Verify all environment variables
- Test API endpoints directly with Postman/curl

