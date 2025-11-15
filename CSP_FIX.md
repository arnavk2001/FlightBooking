# Content Security Policy (CSP) Fix

## Issue
Error: "Content Security Policy of your site blocks the use of 'eval' in JavaScript"

## Solution
Added `'unsafe-eval'` to the `script-src` directive in the Content Security Policy to allow Vite's Hot Module Replacement (HMR) to work in development mode.

## Changes Made

### 1. `frontend/vite.config.js`
- Added CSP headers to the Vite dev server configuration
- `script-src` now includes `'unsafe-eval'` for development

### 2. `frontend/index.html`
- Added CSP meta tag with `'unsafe-eval'` in `script-src`

### 3. `frontend/public/web.config` (IIS)
- Updated CSP header to allow `'unsafe-eval'` in `script-src`

### 4. `web.config` (Root IIS config)
- Updated CSP header to allow `'unsafe-eval'` in `script-src`

## CSP Configuration

The CSP now allows:
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Allows eval for Vite HMR
- `connect-src` - Allows connections to localhost, Amadeus API, and PayPal
- `style-src 'self' 'unsafe-inline'` - Allows inline styles (TailwindCSS)
- Other necessary directives for images, fonts, etc.

## Important Notes

⚠️ **Security Warning**: `'unsafe-eval'` should only be used in development. For production:

1. **Remove or restrict CSP** in production builds - Vite production builds don't use eval
2. **Use stricter CSP** in production:
   ```
   script-src 'self' 'unsafe-inline';  # Remove 'unsafe-eval'
   ```
3. **Consider using nonces** for better security in production

## Testing

After making these changes:
1. Restart the frontend dev server: `npm run dev`
2. Clear browser cache or use incognito mode
3. The CSP error should be resolved

## For Production

When deploying to production, you should:
1. Remove `'unsafe-eval'` from `script-src`
2. Use a stricter CSP since Vite production builds don't need eval
3. Consider using CSP nonces for better security

