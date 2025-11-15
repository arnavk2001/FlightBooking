# Fixing 500 Internal Server Error

## Issue: 500 Internal Server Error at `/bookingbot/`

This error typically occurs when:
1. The web server can't find `index.html`
2. The `.htaccess` file has syntax errors
3. Files are not in the correct directory structure
4. Server configuration conflicts

## Solution Steps

### Step 1: Verify File Structure

Ensure your deployment structure looks like this:
```
/bookingbot/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── .htaccess (for Apache)
└── web.config (for IIS/Windows Server)
```

### Step 2: Rebuild Frontend

```bash
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

### Step 3: Check Build Output

After building, verify:
- `dist/index.html` exists
- `dist/assets/` folder contains JS/CSS files
- `.htaccess` is in `dist/` folder (copy from `public/`)

### Step 4: Deploy Correctly

**Important**: Copy the CONTENTS of `frontend/dist/` to `/bookingbot/` directory on your server.

Do NOT copy the `dist` folder itself, but its contents.

### Step 5: Server Configuration

#### For Apache:

1. Ensure `.htaccess` is in `/bookingbot/` directory
2. Verify `mod_rewrite` is enabled:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```
3. Check Apache error logs:
   ```bash
   tail -f /var/log/apache2/error.log
   ```

#### For Nginx:

Update nginx configuration:
```nginx
location /bookingbot {
    alias /path/to/deployment/bookingbot;
    try_files $uri $uri/ /bookingbot/index.html;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### For IIS/Windows Server:

1. Ensure `web.config` is in `/bookingbot/` directory
2. Install URL Rewrite module if not installed
3. Check IIS error logs

### Step 6: Permissions

Ensure proper file permissions:
```bash
chmod 644 /bookingbot/index.html
chmod 644 /bookingbot/.htaccess
chmod 755 /bookingbot/assets/
chmod 644 /bookingbot/assets/*
```

### Step 7: Test Direct Access

Try accessing:
- `https://bookingbot.abovethewings.com/bookingbot/index.html` (should work)
- `https://bookingbot.abovethewings.com/bookingbot/assets/` (should list files)

### Step 8: Check Server Logs

Check your web server error logs for specific errors:
- Apache: `/var/log/apache2/error.log`
- Nginx: `/var/log/nginx/error.log`
- IIS: Event Viewer → Windows Logs → Application

### Step 9: Alternative .htaccess (Simplified)

If the current `.htaccess` causes issues, try this simplified version:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /bookingbot/
  
  # Don't rewrite if file exists
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule ^(.*)$ index.html [L]
</IfModule>
```

### Step 10: Debug Mode

Add this to the top of your `.htaccess` to see what's happening:
```apache
# Enable rewrite logging (remove after debugging)
RewriteLog /tmp/rewrite.log
RewriteLogLevel 3
```

### Common Issues

1. **Missing index.html**: Ensure `index.html` is in `/bookingbot/` directory
2. **Wrong .htaccess location**: Must be in `/bookingbot/` not `/bookingbot/dist/`
3. **mod_rewrite disabled**: Enable it on Apache
4. **PHP errors**: If server has PHP, ensure no PHP syntax errors in `.htaccess`
5. **Path issues**: Check that all paths in `.htaccess` are correct

### Quick Fix Command

If you have SSH access:
```bash
# Navigate to deployment directory
cd /path/to/bookingbot

# Check if index.html exists
ls -la index.html

# Check .htaccess
cat .htaccess

# Check permissions
ls -la

# Test Apache configuration
apachectl configtest
```

### Still Not Working?

1. Temporarily rename `.htaccess` to `.htaccess.bak` to see if it's the issue
2. Check server error logs for specific error messages
3. Verify the web server is actually serving from `/bookingbot/` directory
4. Try accessing the site without trailing slash: `/bookingbot` (not `/bookingbot/`)

