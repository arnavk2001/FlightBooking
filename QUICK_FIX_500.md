# Quick Fix for 500 Internal Server Error

## Immediate Steps

### Step 1: Try the Simplified .htaccess

If you're getting 500 errors, the `.htaccess` file might be the issue. Try this:

1. **Backup current `.htaccess`**:
   ```bash
   mv /bookingbot/.htaccess /bookingbot/.htaccess.backup
   ```

2. **Use the simplified version** (copy from `frontend/public/.htaccess.simple`):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /bookingbot/
     
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^(.*)$ index.html [L]
   </IfModule>
   ```

### Step 2: Check if index.html Exists

Verify the file exists:
```bash
ls -la /bookingbot/index.html
```

If it doesn't exist, you need to:
1. Rebuild the frontend: `cd frontend && npm run build`
2. Copy `dist/index.html` to `/bookingbot/index.html`
3. Copy all files from `dist/` to `/bookingbot/`

### Step 3: Check File Permissions

```bash
chmod 644 /bookingbot/index.html
chmod 644 /bookingbot/.htaccess
chmod -R 755 /bookingbot/assets/
```

### Step 4: Check Apache Error Logs

```bash
# Find the error log location
apachectl -S

# Check recent errors
tail -50 /var/log/apache2/error.log
# OR
tail -50 /var/log/httpd/error_log
```

Look for specific error messages that will tell you what's wrong.

### Step 5: Test Without .htaccess

Temporarily disable `.htaccess`:
```bash
mv /bookingbot/.htaccess /bookingbot/.htaccess.disabled
```

Then try accessing: `https://bookingbot.abovethewings.com/bookingbot/index.html`

If this works, the issue is with `.htaccess`. If it still gives 500, the issue is elsewhere.

### Step 6: Verify Deployment Structure

Your `/bookingbot/` directory should contain:
```
/bookingbot/
├── index.html          ← MUST EXIST
├── assets/             ← MUST EXIST
│   ├── index-[hash].js
│   └── index-[hash].css
└── .htaccess           ← Optional (for routing)
```

### Step 7: Check Apache Configuration

Verify `mod_rewrite` is enabled:
```bash
apachectl -M | grep rewrite
```

If not enabled:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Step 8: Alternative - Use Nginx Configuration

If Apache continues to have issues, consider using Nginx (if available). See `frontend/public/nginx.conf` for configuration.

## Common 500 Error Causes

1. **Syntax Error in .htaccess**
   - Solution: Use simplified `.htaccess` or disable it temporarily

2. **Missing index.html**
   - Solution: Rebuild and redeploy frontend

3. **PHP Errors** (if PHP is enabled)
   - Solution: Check for PHP code in `.htaccess` or disable PHP for this directory

4. **File Permissions**
   - Solution: Set correct permissions (644 for files, 755 for directories)

5. **mod_rewrite Not Enabled**
   - Solution: Enable `mod_rewrite` module

6. **Server Configuration Conflict**
   - Solution: Check server error logs for specific conflicts

## Quick Test Commands

```bash
# Test if index.html is accessible directly
curl https://bookingbot.abovethewings.com/bookingbot/index.html

# Test Apache configuration
apachectl configtest

# Check if files exist
ls -la /bookingbot/

# Check permissions
stat /bookingbot/index.html
```

## Still Not Working?

1. Check server error logs for the EXACT error message
2. Try accessing `/bookingbot/index.html` directly (bypasses routing)
3. Verify all files from `dist/` were copied correctly
4. Check if there are any server-level restrictions blocking the directory

