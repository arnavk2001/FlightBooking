from typing import Dict, List, Optional
from datetime import datetime, timedelta


class FlightCategorizer:
    def __init__(self):
        pass

    def _parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to total minutes"""
        try:
            # Format: PT5H10M or PT2H30M
            duration_str = duration_str.replace("PT", "")
            hours = 0
            minutes = 0
            
            if "H" in duration_str:
                hours_str = duration_str.split("H")[0]
                hours = int(hours_str)
                duration_str = duration_str.split("H")[1]
            
            if "M" in duration_str:
                minutes_str = duration_str.split("M")[0]
                minutes = int(minutes_str)
            
            return hours * 60 + minutes
        except:
            return 0

    def _format_duration(self, minutes: int) -> str:
        """Format minutes to readable duration"""
        hours = minutes // 60
        mins = minutes % 60
        if hours > 0:
            return f"{hours}h{mins}m"
        return f"{mins}m"

    def _parse_flight_offer(self, offer: Dict) -> Optional[Dict]:
        """Parse Amadeus flight offer to standardized format"""
        try:
            itineraries = offer.get("itineraries", [])
            if not itineraries:
                print(f"⚠️  Flight offer {offer.get('id', 'unknown')} has no itineraries")
                return None

            segments = []
            total_duration = 0
            stops = 0

            for itinerary in itineraries:
                segments_list = itinerary.get("segments", [])
                if segments_list:
                    # Calculate total duration
                    duration_str = itinerary.get("duration", "")
                    total_duration = self._parse_duration(duration_str)
                    
                    # Count stops (segments - 1)
                    stops = len(segments_list) - 1

                    # Get first and last segments
                    first_segment = segments_list[0]
                    last_segment = segments_list[-1]

                    segments.append({
                        "departure": {
                            "airport": first_segment.get("departure", {}).get("iataCode"),
                            "time": first_segment.get("departure", {}).get("at", "")[:16]  # Remove timezone
                        },
                        "arrival": {
                            "airport": last_segment.get("arrival", {}).get("iataCode"),
                            "time": last_segment.get("arrival", {}).get("at", "")[:16]
                        },
                        "airline": first_segment.get("carrierCode"),
                        "duration": self._format_duration(total_duration),
                        "stops": stops,
                        "stops_details": [
                            {
                                "airport": seg.get("arrival", {}).get("iataCode"),
                                "duration": seg.get("duration", "")
                            }
                            for seg in segments_list[1:-1] if len(segments_list) > 1
                        ]
                    })

            # Get pricing
            price_data = offer.get("price", {})
            total_price = float(price_data.get("total", 0))
            currency = price_data.get("currency", "GBP")

            # Get travel class - handle missing data gracefully
            travel_class = "ECONOMY"  # Default
            try:
                traveler_pricings = offer.get("travelerPricings", [])
                if traveler_pricings and len(traveler_pricings) > 0:
                    fare_details = traveler_pricings[0].get("fareDetailsBySegment", [])
                    if fare_details and len(fare_details) > 0:
                        travel_class = fare_details[0].get("cabin", "ECONOMY")
            except (KeyError, IndexError, AttributeError):
                # If structure is different, try alternative paths
                travel_class = offer.get("cabin", "ECONOMY")

            # Get airline code - handle missing segments
            airline_code = "UNKNOWN"
            if segments and len(segments) > 0:
                airline_code = segments[0].get("airline", "UNKNOWN")
            elif segments_list and len(segments_list) > 0:
                # Fallback to first segment if segments list is empty
                airline_code = segments_list[0].get("carrierCode", "UNKNOWN")

            # Safely get segment data
            departure_airport = ""
            arrival_airport = ""
            departure_time = ""
            arrival_time = ""
            
            if segments and len(segments) > 0:
                departure_airport = segments[0].get("departure", {}).get("airport", "")
                arrival_airport = segments[0].get("arrival", {}).get("airport", "")
                departure_time = segments[0].get("departure", {}).get("time", "")
                arrival_time = segments[0].get("arrival", {}).get("time", "")
            
            return {
                "id": offer.get("id", ""),
                "airline": airline_code,
                "airline_logo": f"https://www.gstatic.com/flights/airline_logos/70px/{airline_code.lower()}.png" if airline_code != "UNKNOWN" else "",
                "departure_airport": departure_airport,
                "arrival_airport": arrival_airport,
                "departure_time": departure_time,
                "arrival_time": arrival_time,
                "duration": self._format_duration(total_duration),
                "duration_minutes": total_duration,
                "stops": stops,
                "cabin_class": travel_class,
                "price": total_price,
                "currency": currency,
                "segments": segments,
                "raw_offer": offer  # Keep original for reference
            }
        except Exception as e:
            print(f"⚠️  Error parsing flight offer {offer.get('id', 'unknown')}: {e}")
            import traceback
            traceback.print_exc()
            return None

    def categorize_flights(self, flight_offers: List[Dict]) -> Dict:
        """Categorize flights into cheapest, fastest, most comfortable"""
        parsed_flights = []
        
        for offer in flight_offers:
            try:
                parsed = self._parse_flight_offer(offer)
                if parsed:
                    parsed_flights.append(parsed)
            except Exception as e:
                print(f"⚠️  Warning: Failed to parse flight offer {offer.get('id', 'unknown')}: {e}")
                continue

        if not parsed_flights:
            print("⚠️  Warning: No flights could be parsed from offers")
            return {}

        # Find cheapest
        cheapest = min(parsed_flights, key=lambda x: x.get("price", float('inf')))
        cheapest["category"] = "cheapest"

        # Find fastest (prefer direct flights)
        fastest = min(
            parsed_flights,
            key=lambda x: (x.get("duration_minutes", float('inf')), x.get("stops", 999), x.get("price", float('inf')))
        )
        fastest["category"] = "fastest"

        # Find most comfortable (business/premium class, or lowest stops)
        comfortable = None
        business_flights = [f for f in parsed_flights if f.get("cabin_class") and ("BUSINESS" in f["cabin_class"].upper() or "FIRST" in f["cabin_class"].upper())]
        premium_flights = [f for f in parsed_flights if f.get("cabin_class") and "PREMIUM" in f["cabin_class"].upper()]

        if business_flights:
            comfortable = min(business_flights, key=lambda x: x.get("price", float('inf')))
        elif premium_flights:
            comfortable = min(premium_flights, key=lambda x: x.get("price", float('inf')))
        else:
            # If no business/premium, get the one with least stops
            comfortable = min(parsed_flights, key=lambda x: (x.get("stops", 999), x.get("price", float('inf'))))

        if comfortable:
            comfortable["category"] = "most_comfortable"

        result = {
            "cheapest": cheapest,
            "fastest": fastest,
            "most_comfortable": comfortable
        }
        
        print(f"✅ Categorized {len(parsed_flights)} flights: cheapest={cheapest.get('price')}, fastest={fastest.get('duration')}, comfortable={comfortable.get('price') if comfortable else 'N/A'}")
        
        return result

    def get_best_future_deal(self, flight_offers: List[Dict]) -> Optional[Dict]:
        """Get the best deal from future date search"""
        parsed_flights = []
        
        for offer in flight_offers:
            parsed = self._parse_flight_offer(offer)
            if parsed:
                parsed_flights.append(parsed)

        if not parsed_flights:
            return None

        # Get the cheapest reasonable option (prefer direct or 1 stop)
        best_deal = min(
            parsed_flights,
            key=lambda x: (x["stops"] if x["stops"] <= 1 else 999, x["price"])
        )
        best_deal["category"] = "best_future_deal"
        best_deal["days_later"] = 30

        return best_deal

