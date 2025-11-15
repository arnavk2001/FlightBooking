import sys
import json
from amadeus_client import AmadeusClient
from utils.categorizer import FlightCategorizer

client = AmadeusClient()
categorizer = FlightCategorizer()

# Test with same data chatbot would send
print("Testing flight search and categorization...")
offers = client.search_flights(
    origin="LHR",
    destination="JFK",
    departure_date="2025-12-12",
    adults=1,
    travel_class="ECONOMY",
    currency="GBP"
)

print(f"Offers received: {len(offers.get('data', []))}")

# Test categorization
categorized = categorizer.categorize_flights(offers["data"])
print(f"Categorized: {list(categorized.keys())}")

# Check if all required fields exist
for key in ['cheapest', 'fastest', 'most_comfortable']:
    if key in categorized and categorized[key]:
        print(f" {key}: price={categorized[key].get('price')}")
    else:
        print(f" {key}: missing or None")
