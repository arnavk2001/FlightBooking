# Debugging 500 Error - Amadeus API Issues

## Problem
Backend is returning 500 Internal Server Error when trying to search for flights.

## Changes Made

### 1. Added Debug Logging
- Backend now prints request details to console
- Shows request URL, request body, and response status
- Shows detailed error messages from Amadeus API

### 2. Improved Error Handling
- Better error messages in backend
- Proper exception handling in app.py
- More detailed error logging

### 3. Simplified Request Body
- Removed cabin restrictions from default (only add if not ECONOMY)
- Simplified searchCriteria structure
- Kept essential fields only

## How to Debug

1. **Check Backend Window**:
   - Look for: `🔍 Amadeus API Request: ...`
   - Look for: `📤 Request body: ...`
   - Look for: `📥 Response status: ...`
   - Look for: `❌ Amadeus API HTTP Error: ...`

2. **Common Issues**:
   - **400 Bad Request**: Request body structure is wrong
   - **401 Unauthorized**: API credentials are invalid
   - **422 Unprocessable Entity**: Request parameters are invalid
   - **500 Internal Server Error**: Amadeus API issue

3. **Check Request Body**:
   - Verify travelers array is populated
   - Verify originDestinations structure
   - Verify date format is correct (YYYY-MM-DD)

## Next Steps

1. **Try a flight search** from the frontend
2. **Check the backend window** for detailed error messages
3. **Share the error details** from the backend console

The backend will now show exactly what's being sent to Amadeus and what error is being returned.

## Expected Request Structure

```json
{
  "currencyCode": "GBP",
  "originDestinations": [
    {
      "id": "1",
      "originLocationCode": "LHR",
      "destinationLocationCode": "JFK",
      "departureDateTimeRange": {
        "date": "2024-12-15"
      }
    }
  ],
  "travelers": [
    {
      "id": "1",
      "travelerType": "ADULT"
    }
  ],
  "sources": ["GDS"],
  "searchCriteria": {
    "maxFlightOffers": 250
  }
}
```

## If Still Getting Errors

Check the backend console output and share:
1. The request body being sent
2. The response status code
3. The error message from Amadeus

This will help identify the exact issue with the API request.

