# Fix for 401 Unauthorized Error

## Problem
Getting `401 Client Error: Unauthorized` from Amadeus API, and the error URL shows query parameters (GET request) instead of POST with JSON body.

## Root Cause Analysis

The error URL shows:
```
https://test.travel.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=LHR&...
```

This indicates:
1. **GET request** is being made (query parameters in URL)
2. **Should be POST** with JSON body according to v2.12 spec
3. **401 Unauthorized** suggests either:
   - Invalid API credentials
   - Expired/invalid access token
   - Wrong base URL

## Changes Made

### 1. Enhanced Token Debugging
- Added detailed logging for token retrieval
- Shows token request status and response
- Helps identify authentication issues

### 2. Backend Restart
- Stopped all Python processes
- Restarted backend with fresh code
- Ensures latest code is running

### 3. Verification Steps
- Check if code is using POST method
- Verify JSON body is being sent
- Confirm token is being obtained

## Debugging Steps

### 1. Check Backend Window
Look for these messages in order:

1. **Token Request:**
   ```
   🔐 Getting Amadeus access token from: https://test.travel.api.amadeus.com/v1/security/oauth2/token
      API Key: kpyzAGhPnM...
      Token response status: 200
      ✅ Access token obtained successfully
   ```

2. **Flight Search Request:**
   ```
   🔍 Amadeus API Request: https://test.travel.api.amadeus.com/v2/shopping/flight-offers
   📤 Request body: {'currencyCode': 'GBP', 'originDestinations': [...], ...}
   📥 Response status: 200
   ```

### 2. If Token Fails (401 on token request)
- Check API credentials in `.env` file
- Verify `AMADEUS_API_KEY` and `AMADEUS_API_SECRET`
- Check base URL is `https://test.travel.api.amadeus.com`

### 3. If Token Succeeds but Flight Search Fails (401)
- Token might be invalid
- Check if token is being included in Authorization header
- Verify request is POST with JSON body (not GET with query params)

## Common Issues

### Issue 1: Invalid API Credentials
**Solution:**
1. Check `backend/.env` file
2. Verify `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` are correct
3. For test environment, use test credentials from Amadeus Developer Portal

### Issue 2: Wrong Base URL
**Solution:**
- Test environment: `https://test.travel.api.amadeus.com`
- Production: `https://api.amadeus.com`
- Check `.env` file has correct `AMADEUS_BASE_URL`

### Issue 3: Request Method Mismatch
**Solution:**
- Code should use `requests.post()` with `json=request_body`
- Should NOT use `requests.get()` with `params=...`
- Check backend window shows POST request

## Next Steps

1. **Try flight search again** from frontend
2. **Check backend window** for detailed logs:
   - Token request status
   - Flight search request method (should be POST)
   - Request body format (should be JSON dict)
   - Response status
3. **Share error details** if still failing:
   - Token request status
   - Flight search request details
   - Full error message

## Expected Behavior

✅ **Token Request:**
- Method: POST
- URL: `.../v1/security/oauth2/token`
- Status: 200
- Returns: access_token

✅ **Flight Search:**
- Method: POST
- URL: `.../v2/shopping/flight-offers`
- Body: JSON (not query params)
- Headers: Authorization: Bearer {token}
- Status: 200

---

**Status**: Backend restarted with enhanced debugging. Check backend window for detailed logs.

