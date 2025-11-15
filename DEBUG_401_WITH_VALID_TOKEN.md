# Debugging 401 Error with Valid Token

## Problem
Token is successfully obtained (200 OK), but flight search returns 401 Unauthorized.

## Possible Causes

### 1. Request Body Format Issue
The request body structure might not match what Amadeus v2.12 expects exactly.

### 2. Missing Required Fields
Some required fields might be missing from the request.

### 3. Invalid Field Values
Field values might be in wrong format or invalid.

### 4. Token Not Being Sent Correctly
Token might not be included in Authorization header properly.

## Enhanced Debugging Added

The backend now logs:
- ✅ Request method (POST)
- ✅ Request body structure
- ✅ Authorization header (first 20 chars of token)
- ✅ Response status and body
- ✅ Detailed error information

## What to Check

### 1. Backend Console Output
After trying a flight search, check the backend window for:

```
🔍 Amadeus API Request: https://test.travel.api.amadeus.com/v2/shopping/flight-offers
📤 Request method: POST
📤 Request body: {...}
🔑 Authorization header: Bearer eyJ0eXAiOiJKV1QiLC...
📥 Response status: 401
📥 Response body: {...}
```

### 2. Response Body Content
The 401 response body should contain the exact error message from Amadeus, such as:
- `"invalid_token"` - Token is invalid
- `"insufficient_scope"` - Token doesn't have required permissions
- `"invalid_request"` - Request format is wrong
- Other specific error messages

### 3. Request Body Structure
Verify the request body has:
- ✅ `currencyCode`
- ✅ `originDestinations` array with at least one entry
- ✅ `travelers` array with at least one ADULT
- ✅ `sources` array
- ✅ `searchCriteria` object

## Common Issues

### Issue 1: Empty Travelers Array
**Symptom:** Request fails with 401
**Solution:** Ensure at least one ADULT traveler is added

### Issue 2: Invalid Date Format
**Symptom:** Request fails with 400 or 401
**Solution:** Date must be in YYYY-MM-DD format, must be future date

### Issue 3: Invalid Airport Codes
**Symptom:** Request fails
**Solution:** Verify origin and destination are valid IATA codes

### Issue 4: Wrong API Version/Endpoint
**Symptom:** 401 or 404
**Solution:** Verify endpoint is `/v2/shopping/flight-offers` and base URL is correct

## Next Steps

1. **Try flight search again** from frontend
2. **Check backend window** for detailed request/response logs
3. **Share the response body** from the 401 error - it will contain the exact Amadeus error message
4. **Check if travelers array is populated** - it should have at least one ADULT

## Testing

A test script has been created: `backend/test_amadeus_request.py`

Run it to test the API call directly:
```batch
cd backend
venv\Scripts\python.exe test_amadeus_request.py
```

This will show the exact request being sent and the response received.

---

**Status**: Enhanced debugging added. Backend will now show detailed request/response information to identify the exact issue.

