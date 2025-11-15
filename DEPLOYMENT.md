# Deployment Guide

## Production Deployment Checklist

### Backend Configuration

1. **Environment Variables** - Set in your hosting platform (Azure App Service, etc.):
   ```env
   ALLOWED_ORIGINS=https://bookingbot.abovethewings.com
   FRONTEND_URL=https://bookingbot.abovethewings.com/bookingbot
   AMADEUS_API_KEY=your_key
   AMADEUS_API_SECRET=your_secret
   AMADEUS_BASE_URL=https://test.travel.api.amadeus.com
   PAYPAL_CLIENT_ID=your_paypal_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   PAYPAL_BASE_URL=https://api.sandbox.paypal.com
   DB_HOST=atw-db-dev.mysql.database.azure.com
   DB_NAME=atw_dev
   DB_USER=atwdevdbadmin
   DB_PASSWORD=your_password
   DB_PORT=3306
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASSWORD=your_app_password
   FROM_EMAIL=noreply@abovethewings.com
   ADMIN_EMAIL=fly@abovethewings.com
   ```

2. **Backend URL** - Ensure backend is accessible at:
   - `https://bookingbot.abovethewings.com/api` (if using reverse proxy)
   - OR configure your backend URL and update frontend `.env.production`

### Frontend Configuration

1. **Build for Production**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Environment Variables** - Create `.env.production`:
   ```env
   VITE_API_URL=https://bookingbot.abovethewings.com/api
   VITE_BASE_PATH=/bookingbot
   ```

3. **Deploy** - Upload `frontend/dist` folder to your web server at `/bookingbot/` path

### Common Issues

#### Issue 1: 404 Errors on Routes
**Solution**: Ensure your web server is configured to serve `index.html` for all routes under `/bookingbot/`

For Apache, add to `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /bookingbot/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /bookingbot/index.html [L]
</IfModule>
```

For Nginx:
```nginx
location /bookingbot {
  alias /path/to/dist;
  try_files $uri $uri/ /bookingbot/index.html;
}
```

#### Issue 2: API Calls Failing
**Solution**: 
- Check CORS configuration in backend
- Verify `VITE_API_URL` is set correctly
- Ensure backend is accessible at the configured URL
- Check browser console for CORS errors

#### Issue 3: Assets Not Loading
**Solution**: 
- Verify `base: '/bookingbot/'` in `vite.config.js`
- Ensure all assets are in the correct path
- Check browser network tab for 404 errors on assets

#### Issue 4: PayPal Redirect Issues
**Solution**:
- Verify `FRONTEND_URL` environment variable in backend
- Ensure PayPal return URLs match your deployment URL

### Testing Deployment

1. **Check API Connection**:
   - Open browser console
   - Navigate to the app
   - Check for API errors

2. **Test Flight Search**:
   - Try searching for flights
   - Verify API calls are working

3. **Test Payment Flow**:
   - Select a flight
   - Complete booking form
   - Test PayPal redirect (sandbox mode)

### Backend API Endpoints

If your backend is deployed separately, ensure these endpoints are accessible:
- `GET /api/health` - Health check
- `POST /api/search-flights` - Flight search
- `GET /api/airports` - Airport search
- `POST /api/create-booking` - Create booking
- `POST /api/capture-payment` - Capture payment
- `GET /api/booking/{reference}` - Get booking

### Reverse Proxy Configuration

If using a reverse proxy (Nginx/Apache) to route `/api` to backend:

**Nginx Example**:
```nginx
location /bookingbot {
  alias /var/www/bookingbot/dist;
  try_files $uri $uri/ /bookingbot/index.html;
}

location /api {
  proxy_pass http://backend-server:8000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### Troubleshooting

1. **Check Browser Console** - Look for JavaScript errors
2. **Check Network Tab** - Verify API calls are being made correctly
3. **Check Backend Logs** - Look for errors in backend application
4. **Verify Environment Variables** - Ensure all are set correctly
5. **Test API Directly** - Use Postman/curl to test backend endpoints

