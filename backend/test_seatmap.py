#!/usr/bin/env python3
"""
Test script to verify Amadeus SeatMap Display API using provided credentials.
It will:
  1) Get an access token
  2) Search for a sample flight offer (LHR -> JFK, 30 days from now)
  3) Request seatmap for the first flight offer
"""
import sys
from datetime import datetime, timedelta
from amadeus_client import AmadeusClient


def main():
    client = AmadeusClient()

    print("========================================")
    print("SeatMap API Test")
    print("========================================\n")

    # Step 1: Token
    print("1) Getting access token...")
    token = client._get_access_token()
    print(f"   ✅ Token obtained: {token[:20]}...\n")

    # Step 2: Search a sample flight
    print("2) Searching a sample flight offer (LHR -> JFK)...")
    future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    offers = client.search_flights(
        origin="LHR",
        destination="JFK",
        departure_date=future_date,
        adults=1,
        travel_class="ECONOMY",
        currency="GBP"
    )

    if not offers or "data" not in offers or not offers["data"]:
        print("   ❌ No flight offers returned; cannot test seatmap")
        sys.exit(1)

    first_offer = offers["data"][0]
    print("   ✅ Flight offer retrieved. Pricing the offer...\n")

    # Step 3: Price the flight offer (some accounts/flows require priced offers)
    priced = client.price_flight_offer(first_offer)
    priced_offers = []
    if isinstance(priced, dict):
        if isinstance(priced.get("data"), dict):
            priced_offers = priced.get("data", {}).get("flightOffers", [])
        elif isinstance(priced.get("data"), list):
            # Some variants may return list; flatten possible flightOffers
            for entry in priced.get("data", []):
                if isinstance(entry, dict) and "flightOffers" in entry:
                    priced_offers.extend(entry["flightOffers"]) 
    if not priced_offers:
        print("   ❌ Pricing did not return offers; cannot fetch seatmap")
        sys.exit(1)

    priced_offer = priced_offers[0]
    print("   ✅ Offer priced. Requesting seatmap...\n")

    # Step 4: Get seatmap for the priced offer
    seatmap = client.get_seatmap_for_offer(priced_offer)
    count = len(seatmap.get("data", [])) if isinstance(seatmap, dict) else 0
    print(f"3) Seatmap response received. Blocks returned: {count}")
    print("   ✅ Seatmap API test completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Seatmap test failed: {e}")
        sys.exit(1)


