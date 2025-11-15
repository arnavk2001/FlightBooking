#!/usr/bin/env python3
"""
Test script to verify Amadeus API connection
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

try:
    from amadeus_client import AmadeusClient
    
    print("=" * 60)
    print("Testing Amadeus API Connection")
    print("=" * 60)
    print()
    
    # Initialize client
    client = AmadeusClient()
    
    # Show configuration (hide secrets)
    print("Configuration:")
    print(f"  Base URL: {client.base_url}")
    print(f"  API Key: {client.api_key[:10]}..." if client.api_key else "  API Key: Not set")
    print(f"  API Secret: {'*' * len(client.api_secret) if client.api_secret else 'Not set'}")
    print()
    
    # Test 1: Get access token
    print("Test 1: Getting access token...")
    try:
        token = client._get_access_token()
        if token:
            print(f"✅ Access token obtained successfully!")
            print(f"   Token (first 20 chars): {token[:20]}...")
            print(f"   Token expires at: {client.token_expires_at}")
        else:
            print("❌ Failed to get access token (token is None)")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to get access token: {e}")
        sys.exit(1)
    
    print()
    
    # Test 2: Search airports (lightweight test)
    print("Test 2: Searching airports (London)...")
    try:
        airports = client.search_airports("London")
        if airports:
            print(f"✅ Airport search successful!")
            print(f"   Found {len(airports)} airports:")
            for airport in airports[:3]:  # Show first 3
                print(f"     - {airport.get('code')}: {airport.get('name')} ({airport.get('city')})")
        else:
            print("⚠️  Airport search returned no results")
    except Exception as e:
        print(f"❌ Airport search failed: {e}")
        sys.exit(1)
    
    print()
    
    # Test 3: Search flights (actual flight search)
    print("Test 3: Searching flights (LHR to JFK, 30 days from now)...")
    try:
        from datetime import datetime, timedelta
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        flights = client.search_flights(
            origin="LHR",
            destination="JFK",
            departure_date=future_date,
            adults=1,
            travel_class="ECONOMY",
            currency="GBP"
        )
        
        if flights and "data" in flights and flights["data"]:
            print(f"✅ Flight search successful!")
            print(f"   Found {len(flights['data'])} flight offers")
            if flights["data"]:
                first_flight = flights["data"][0]
                price = first_flight.get("price", {}).get("total", "N/A")
                print(f"   Sample flight price: {price} {first_flight.get('price', {}).get('currency', 'GBP')}")
        else:
            print("⚠️  Flight search returned no results")
            print("   This might be normal if no flights are available for that date")
    except Exception as e:
        print(f"❌ Flight search failed: {e}")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("✅ All Amadeus API tests passed!")
    print("=" * 60)
    print()
    print("The Amadeus API is working correctly.")
    print("You can now use the flight booking bot.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the backend directory and virtual environment is activated")
    print("Run: venv\\Scripts\\activate (Windows) or source venv/bin/activate (Mac/Linux)")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

