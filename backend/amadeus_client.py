import requests
import os
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import time


class AmadeusClient:
    def __init__(self):
        self.api_key = os.getenv("AMADEUS_API_KEY", "RiiZIbGA9oOEGhOaJ1MYddaVWUw1AoLH")
        self.api_secret = os.getenv("AMADEUS_API_SECRET", "rS0AG10jrlo8zxmb")
        self.base_url = os.getenv("AMADEUS_BASE_URL", "https://test.travel.api.amadeus.com")
        self.token = None
        self.token_expires_at = None

    def _get_access_token(self) -> str:
        """Get or refresh OAuth2 access token"""
        # Check if token is still valid
        if self.token and self.token_expires_at:
            if datetime.now() < self.token_expires_at - timedelta(minutes=5):
                return self.token

        # Get new token
        url = f"{self.base_url}/v1/security/oauth2/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.api_secret
        }

        try:
            print(f"🔐 Getting Amadeus access token from: {url}")
            print(f"   API Key: {self.api_key[:10]}...")
            
            response = requests.post(url, headers=headers, data=data, timeout=10)
            
            print(f"   Token response status: {response.status_code}")
            
            response.raise_for_status()
            token_data = response.json()
            self.token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 1800)  # Default 30 minutes
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            if self.token:
                print(f"✅ Access token obtained successfully (expires in {expires_in}s)")
            else:
                print(f"⚠️  Warning: No access token in response")
            
            return self.token
        except requests.exceptions.HTTPError as e:
            error_text = response.text if hasattr(response, 'text') else str(e)
            print(f"❌ Failed to get access token: {response.status_code}")
            print(f"   Error: {error_text}")
            raise Exception(f"Failed to get Amadeus access token: {response.status_code} - {error_text}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error getting token: {str(e)}")
            raise Exception(f"Failed to get Amadeus access token: {str(e)}")

    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        travel_class: str = "ECONOMY",
        currency: str = "GBP",
        return_date: Optional[str] = None,
        direct_only: Optional[bool] = False,
        max_stops: Optional[int] = None,
        preferred_airlines: Optional[List[str]] = None,
        excluded_airlines: Optional[List[str]] = None,
        earliest_departure: Optional[str] = None,
        latest_arrival: Optional[str] = None
    ) -> Dict:
        """
        Search for flight offers using Amadeus Flight Offers Search v2.12
        Uses POST request with JSON body according to Swagger specification
        """
        token = self._get_access_token()
        url = f"{self.base_url}/v2/shopping/flight-offers"

        # Build request body according to v2.12 specification
        # Ensure we have at least one traveler before building request
        if adults == 0 and children == 0:
            raise Exception("At least one adult traveler is required")
        
        request_body = {
            "currencyCode": currency.upper(),
            "originDestinations": [
                {
                    "id": "1",
                    "originLocationCode": origin.upper(),
                    "destinationLocationCode": destination.upper(),
                    "departureDateTimeRange": {
                        "date": departure_date
                    }
                }
            ],
            "travelers": [],
            "sources": ["GDS"],
            "searchCriteria": {
                "maxFlightOffers": 250  # Get maximum results for better categorization
            }
        }
        
        # Build flight filters
        flight_filters = {}
        
        # Add cabin restrictions if not ECONOMY
        if travel_class.upper() != "ECONOMY":
            flight_filters["cabinRestrictions"] = [
                {
                    "cabin": travel_class.upper(),
                    "coverage": "MOST_SEGMENTS",
                    "originDestinationIds": ["1"]
                }
            ]
        
        # Add direct only filter
        if direct_only:
            flight_filters["connectionRestriction"] = {
                "maxNumberOfConnections": 0
            }
        elif max_stops is not None:
            flight_filters["connectionRestriction"] = {
                "maxNumberOfConnections": max_stops
            }
        
        # Add carrier restrictions
        carrier_restrictions = {}
        if preferred_airlines:
            carrier_restrictions["includedCarrierCodes"] = [c.upper() for c in preferred_airlines]
        if excluded_airlines:
            carrier_restrictions["excludedCarrierCodes"] = [c.upper() for c in excluded_airlines]
        if carrier_restrictions:
            flight_filters["carrierRestrictions"] = carrier_restrictions
        
        # Add departure/arrival time restrictions
        if earliest_departure or latest_arrival:
            departure_time_range = {}
            if earliest_departure:
                departure_time_range["earliest"] = earliest_departure
            if latest_arrival:
                departure_time_range["latest"] = latest_arrival
            if departure_time_range:
                flight_filters["departureTime"] = departure_time_range
        
        if flight_filters:
            request_body["searchCriteria"]["flightFilters"] = flight_filters

        # Add travelers according to v2.12 spec
        # CRITICAL: Must have at least one traveler
        traveler_id = 1
        
        for i in range(adults):
            request_body["travelers"].append({
                "id": str(traveler_id),
                "travelerType": "ADULT"
            })
            traveler_id += 1
        
        for i in range(children):
            request_body["travelers"].append({
                "id": str(traveler_id),
                "travelerType": "CHILD"
            })
            traveler_id += 1
        
        for i in range(infants):
            # Infants must be associated with an adult (use first adult)
            adult_id = "1" if adults > 0 else str(traveler_id - children)
            request_body["travelers"].append({
                "id": str(traveler_id),
                "travelerType": "HELD_INFANT",
                "associatedAdultId": adult_id
            })
            traveler_id += 1
        
        # Verify travelers array is not empty
        if not request_body["travelers"]:
            raise Exception("At least one traveler must be specified")
        
        print(f"👥 Travelers added: {len(request_body['travelers'])} travelers")
        print(f"   Travelers: {request_body['travelers']}")

        # Add return date if provided
        if return_date:
            request_body["originDestinations"].append({
                "id": "2",
                "originLocationCode": destination.upper(),
                "destinationLocationCode": origin.upper(),
                "departureDateTimeRange": {
                    "date": return_date
                }
            })
            # Update cabin restrictions for return if they exist
            if "flightFilters" in request_body["searchCriteria"] and "cabinRestrictions" in request_body["searchCriteria"]["flightFilters"]:
                request_body["searchCriteria"]["flightFilters"]["cabinRestrictions"][0]["originDestinationIds"].append("2")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
            # Removed Accept header - some Amadeus endpoints don't like it
        }

        try:
            # Debug: Print request details for troubleshooting
            print(f"🔍 Amadeus API Request: {url}")
            print(f"📤 Request method: POST")
            print(f"📤 Request body: {request_body}")
            print(f"🔑 Authorization header: Bearer {token[:20]}...")
            
            response = requests.post(url, headers=headers, json=request_body, timeout=30)
            
            # Debug: Print response status
            print(f"📥 Response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"📥 Response headers: {dict(response.headers)}")
                print(f"📥 Response body: {response.text[:500]}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Log error details
            error_text = response.text if hasattr(response, 'text') else str(e)
            print(f"❌ Amadeus API HTTP Error: {response.status_code}")
            print(f"   Response: {error_text}")
            
            if response.status_code == 401:
                # 401 could mean token issue or invalid request
                print(f"   🔍 Checking token validity...")
                print(f"   Token being used: {token[:20]}...")
                
                # Try refreshing token and retry
                print(f"   🔄 Refreshing token and retrying...")
                self.token = None
                token = self._get_access_token()
                headers["Authorization"] = f"Bearer {token}"
                print(f"   🔑 New token: {token[:20]}...")
                
                response = requests.post(url, headers=headers, json=request_body, timeout=30)
                print(f"   📥 Retry response status: {response.status_code}")
                
                if response.status_code == 401:
                    # Still 401 after token refresh - likely request format issue
                    print(f"   ⚠️  Still 401 after token refresh - checking request format...")
                    print(f"   Request body keys: {list(request_body.keys())}")
                    print(f"   OriginDestinations: {request_body.get('originDestinations')}")
                    print(f"   Travelers: {request_body.get('travelers')}")
                
                response.raise_for_status()
                return response.json()
            raise Exception(f"Amadeus API error: {response.status_code} - {error_text}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Amadeus API Request Error: {str(e)}")
            raise Exception(f"Failed to search flights: {str(e)}")

    def search_airports(self, query: str) -> List[Dict]:
        """Search for airports by keyword"""
        token = self._get_access_token()
        url = f"{self.base_url}/v1/reference-data/locations"

        params = {
            "subType": "AIRPORT",
            "keyword": query,
            "page[limit]": 10
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            airports = []
            for location in data.get("data", []):
                airports.append({
                    "code": location.get("iataCode"),
                    "name": location.get("name"),
                    "city": location.get("address", {}).get("cityName"),
                    "country": location.get("address", {}).get("countryName")
                })
            return airports
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to search airports: {str(e)}")

    def get_seatmap_for_offer(self, flight_offer: Dict) -> Dict:
        """Call Amadeus SeatMap Display API for a given flight offer"""
        token = self._get_access_token()
        # Some environments expose seatmaps under shopping; try that first
        shopping_url = f"{self.base_url}/v1/shopping/seatmaps"
        booking_url = f"{self.base_url}/v1/booking/seatmaps"

        # Build request body per Amadeus spec
        # Ensure offer has a type as expected by API
        offer_with_type = dict(flight_offer)
        offer_with_type.setdefault("type", "flight-offer")

        request_body = {
            "data": [
                {
                    "type": "flight-offers",
                    "flightOffers": [offer_with_type]
                }
            ]
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Try shopping endpoint first, then booking as fallback
        for url in (shopping_url, booking_url):
            try:
                print(f"🔍 Seatmap API Request: {url}")
                response = requests.post(url, headers=headers, json=request_body, timeout=30)
                print(f"📥 Seatmap response status: {response.status_code}")
                if response.status_code != 200:
                    print(f"📥 Seatmap response body: {response.text[:500]}")
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                last_err = e
        raise Exception(f"Failed to fetch seatmap: {str(last_err)}")

    def price_flight_offer(self, flight_offer: Dict) -> Dict:
        """Call Flight Offers Pricing to get a priced offer (some APIs require priced offers)"""
        token = self._get_access_token()
        url = f"{self.base_url}/v1/shopping/flight-offers/pricing"

        offer_with_type = dict(flight_offer)
        offer_with_type.setdefault("type", "flight-offer")

        body = {
            "data": {
                "type": "flight-offers-pricing",
                "flightOffers": [offer_with_type]
            }
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        print(f"🔍 Pricing API Request: {url}")
        resp = requests.post(url, headers=headers, json=body, timeout=30)
        print(f"📥 Pricing response status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"📥 Pricing response body: {resp.text[:500]}")
        resp.raise_for_status()
        return resp.json()

