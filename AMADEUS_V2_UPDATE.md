# Amadeus Flight Offers Search v2.12 Update

## Changes Made

### 1. Updated Amadeus Client (`backend/amadeus_client.py`)

**Changed from GET to POST request:**
- **Before**: GET request with query parameters
- **After**: POST request with JSON body according to v2.12 Swagger specification

**New Request Structure:**
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
    "maxFlightOffers": 250,
    "flightFilters": {
      "cabinRestrictions": [
        {
          "cabin": "ECONOMY",
          "coverage": "MOST_SEGMENTS",
          "originDestinationIds": ["1"]
        }
      ]
    }
  }
}
```

**Key Features:**
- ✅ Uses POST method with JSON body
- ✅ Proper traveler types (ADULT, CHILD, HELD_INFANT)
- ✅ Origin-destination structure with IDs
- ✅ Cabin restrictions for travel class
- ✅ Support for return flights
- ✅ Accept header: `application/vnd.amadeus+json`

### 2. Fixed Frontend Endpoint

**Updated ChatBot.jsx:**
- Changed endpoint from `/api/flight-search` to `/api/search-flights`
- Matches backend endpoint exactly

### 3. API Endpoint

**Endpoint:** `POST /v2/shopping/flight-offers`

**Base URL:** `https://test.travel.api.amadeus.com`

## Benefits

1. **Compliance**: Follows Amadeus v2.12 Swagger specification exactly
2. **Better Structure**: JSON body provides more flexibility
3. **Proper Traveler Types**: Supports adults, children, and infants correctly
4. **Cabin Restrictions**: Properly filters by travel class
5. **Return Flights**: Better support for round-trip searches

## Testing

After restarting servers:

1. **Test Backend:**
   - Health: http://localhost:8000/health
   - API Docs: http://localhost:8000/docs

2. **Test Frontend:**
   - Open: http://localhost:3000
   - Try a flight search

3. **Test Flight Search:**
   - Origin: LHR or London
   - Destination: JFK or New York
   - Date: 2024-12-15 or future date
   - Check console for API responses

## Response Format

The API response format remains the same:
- `data`: Array of flight offers
- Each offer contains: `itineraries`, `price`, `travelerPricings`, etc.

The categorizer (`backend/utils/categorizer.py`) handles the response parsing and categorization.

## Notes

- The API uses the same base URL: `https://test.travel.api.amadeus.com`
- Authentication remains the same (OAuth2)
- Response parsing is handled by the existing categorizer
- Frontend components work with the categorized results

## Status

✅ **Update Complete**
- Backend updated to use POST with JSON body
- Frontend endpoint fixed
- Ready for testing

---

**Next Steps:**
1. Restart both servers
2. Test flight search functionality
3. Verify responses are correctly parsed

