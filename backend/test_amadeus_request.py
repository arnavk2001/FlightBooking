import requests
import json
from amadeus_client import AmadeusClient

client = AmadeusClient()

# Test token
print("Testing token...")
token = client._get_access_token()
print(f"Token obtained: {token[:20]}...")

# Test request body
print("\nTesting request body structure...")
request_body = {
    "currencyCode": "GBP",
    "originDestinations": [
        {
            "id": "1",
            "originLocationCode": "LHR",
            "destinationLocationCode": "JFK",
            "departureDateTimeRange": {
                "date": "2025-12-12"
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

print(f"Request body: {json.dumps(request_body, indent=2)}")

# Test API call
print("\nTesting API call...")
url = f"{client.base_url}/v2/shopping/flight-offers"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers, json=request_body, timeout=30)
    print(f"Response status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
