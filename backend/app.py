from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from amadeus_client import AmadeusClient
from utils.categorizer import FlightCategorizer
from paypal_client import PayPalClient
from database import get_db, init_db, Booking, Payment
from email_service import EmailService

load_dotenv()

# Initialize database (with error handling for SSL/connection issues)
try:
    init_db()
    print("✅ Database connection successful")
except Exception as e:
    print(f"⚠️  Database initialization warning: {e}")
    print("   The app will continue but database features may not work.")
    print("   This is normal if database is not accessible or SSL is misconfigured.")

app = FastAPI(title="Flight Booking Bot API", version="1.0.0")

# CORS middleware
# Get allowed origins from environment or use defaults
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,https://bookingbot.abovethewings.com")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

# Also allow localhost with different formats
allowed_origins.extend([
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:5173",
])

# Remove duplicates
allowed_origins = list(set(allowed_origins))

print(f"🌐 CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
amadeus_client = AmadeusClient()
categorizer = FlightCategorizer()
paypal_client = PayPalClient()
email_service = EmailService()


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: Optional[str] = None
    adults: int = 1
    children: int = 0
    infants: int = 0
    travel_class: str = "ECONOMY"
    currency: str = "GBP"
    flexibility: Optional[int] = None  # ±N days
    trip_type: str = "one-way"  # one-way, round-trip, multi-city
    direct_only: Optional[bool] = False
    max_stops: Optional[int] = None
    preferred_airlines: Optional[List[str]] = None
    excluded_airlines: Optional[List[str]] = None
    earliest_departure: Optional[str] = None
    latest_arrival: Optional[str] = None


class FlightOffer(BaseModel):
    id: str
    airline: str
    airline_logo: Optional[str] = None
    departure_airport: str
    arrival_airport: str
    departure_time: str
    arrival_time: str
    duration: str
    stops: int
    cabin_class: str
    price: float
    currency: str
    category: str
    segments: List[dict]


class BookingRequest(BaseModel):
    flight_id: str
    customer_email: EmailStr
    customer_name: str
    customer_phone: Optional[str] = None
    origin: str
    destination: str
    departure_date: str
    departure_time: str
    arrival_time: str
    airline: str
    cabin_class: str
    duration: str
    stops: int
    total_price: float
    currency: str = "GBP"
    adults: int = 1
    children: int = 0
    infants: int = 0
    passenger_details: Optional[dict] = None
    flight_data: Optional[dict] = None
    ssr_requests: Optional[List[dict]] = None  # Special service requests
    seat_assignments: Optional[List[dict]] = None
    ancillaries: Optional[List[dict]] = None  # Extra bags, lounge, etc.


class PaymentCaptureRequest(BaseModel):
    order_id: str
    booking_reference: str


class OfferPriceRequest(BaseModel):
    flight_offer: dict  # Full flight offer from Amadeus


class FareRulesRequest(BaseModel):
    flight_offer: dict


class SeatMapRequest(BaseModel):
    flight_offer: dict


class PNRCreateRequest(BaseModel):
    booking_reference: str
    flight_offer: dict
    passengers: List[dict]
    contacts: Optional[dict] = None
    ssr: Optional[List[dict]] = None
    osi: Optional[List[dict]] = None


class ChangeBookingRequest(BaseModel):
    booking_reference: str
    new_flight_offer: dict
    change_type: str  # date_change, route_change, etc.


class CancelBookingRequest(BaseModel):
    booking_reference: str
    reason: Optional[str] = None


@app.get("/")
def root():
    return {"message": "Flight Booking Bot API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/search-flights", response_model=dict)
async def search_flights(request: FlightSearchRequest):
    """
    Search flights and return 4 curated options:
    1. Cheapest
    2. Fastest/Direct
    3. Most Comfortable
    4. Best Future Deal (30 days later)
    """
    try:
        # Validate date format
        try:
            departure_date = datetime.strptime(request.departure_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # Get flight offers for requested date
        try:
            flight_offers = amadeus_client.search_flights(
                origin=request.origin,
                destination=request.destination,
                departure_date=request.departure_date,
                return_date=request.return_date,
                adults=request.adults,
                children=request.children,
                infants=request.infants,
                travel_class=request.travel_class,
                currency=request.currency,
                direct_only=request.direct_only,
                max_stops=request.max_stops,
                preferred_airlines=request.preferred_airlines,
                excluded_airlines=request.excluded_airlines,
                earliest_departure=request.earliest_departure,
                latest_arrival=request.latest_arrival
            )
        except Exception as e:
            print(f"❌ Amadeus API call failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Amadeus API error: {str(e)}")

        if not flight_offers or "data" not in flight_offers or not flight_offers["data"]:
            # Return empty result instead of error to allow frontend to handle gracefully
            return {
                "cheapest": None,
                "fastest": None,
                "most_comfortable": None,
                "best_future_deal": None,
                "search_params": {
                    "origin": request.origin,
                    "destination": request.destination,
                    "departure_date": request.departure_date,
                    "adults": request.adults,
                    "children": request.children
                },
                "message": "No flights found for the specified criteria"
            }

        # Categorize flights
        try:
            categorized = categorizer.categorize_flights(flight_offers["data"])
        except Exception as e:
            print(f"❌ Error categorizing flights: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error categorizing flights: {str(e)}")

        # If best future deal is requested, search for 30 days later
        future_deal = None
        if categorized.get("best_future_deal") is None:
            future_date = departure_date + timedelta(days=30)
            try:
                future_offers = amadeus_client.search_flights(
                    origin=request.origin,
                    destination=request.destination,
                    departure_date=future_date.strftime("%Y-%m-%d"),
                    adults=request.adults,
                    children=request.children,
                    infants=request.infants,
                    travel_class=request.travel_class,
                    currency=request.currency
                )
                if future_offers and "data" in future_offers and future_offers["data"]:
                    future_deal = categorizer.get_best_future_deal(future_offers["data"])
            except Exception as e:
                print(f"Error fetching future deal: {e}")

        # Get all parsed flights for scrolling/pagination
        all_flights = []
        try:
            for offer in flight_offers["data"]:
                parsed = categorizer._parse_flight_offer(offer)
                if parsed:
                    all_flights.append(parsed)
            # Sort by price (cheapest first)
            all_flights.sort(key=lambda x: x.get("price", float('inf')))
        except Exception as e:
            print(f"Warning: Error parsing all flights: {e}")
        
        # Build result, ensuring no None values cause issues
        result = {
            "cheapest": categorized.get("cheapest"),
            "fastest": categorized.get("fastest"),
            "most_comfortable": categorized.get("most_comfortable"),
            "best_future_deal": future_deal if future_deal else categorized.get("best_future_deal"),
            "all_flights": all_flights[:50],  # Limit to 50 for performance, sorted by price
            "search_params": {
                "origin": request.origin,
                "destination": request.destination,
                "departure_date": request.departure_date,
                "adults": request.adults,
                "children": request.children
            }
        }
        
        # Validate result has at least one flight category
        if not result.get("cheapest") and not result.get("fastest") and not result.get("most_comfortable"):
            print("⚠️  Warning: No flight categories found in result")
            # Return result with message instead of error
            result["message"] = "Failed to categorize flights - no valid categories returned"
            return result
        
        print(f"✅ Returning result with {len([k for k in ['cheapest', 'fastest', 'most_comfortable'] if result.get(k)])} categories")
        
        # Clean result to ensure JSON serialization works
        # Remove any None values that might cause issues
        cleaned_result = {}
        for key, value in result.items():
            if value is not None:
                cleaned_result[key] = value
        
        return cleaned_result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Unhandled exception in search_flights:")
        print(f"   Error: {str(e)}")
        print(f"   Type: {type(e).__name__}")
        print(f"   Traceback:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Error searching flights: {str(e)}")


@app.get("/api/airports")
async def get_airports(query: str):
    """Search for airports by city or airport code"""
    try:
        airports = amadeus_client.search_airports(query)
        return {"airports": airports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching airports: {str(e)}")


@app.post("/api/create-booking")
async def create_booking(booking_request: BookingRequest, db: Session = Depends(get_db)):
    """Create a booking and initiate PayPal payment"""
    try:
        # Generate unique booking reference
        booking_reference = f"ATW-{uuid.uuid4().hex[:8].upper()}"

        # Create booking record
        booking = Booking(
            booking_reference=booking_reference,
            customer_email=booking_request.customer_email,
            customer_name=booking_request.customer_name,
            customer_phone=booking_request.customer_phone,
            flight_id=booking_request.flight_id,
            origin=booking_request.origin,
            destination=booking_request.destination,
            departure_date=booking_request.departure_date,
            departure_time=booking_request.departure_time,
            arrival_time=booking_request.arrival_time,
            airline=booking_request.airline,
            cabin_class=booking_request.cabin_class,
            duration=booking_request.duration,
            stops=booking_request.stops,
            adults=booking_request.adults,
            children=booking_request.children,
            infants=booking_request.infants,
            passenger_details=booking_request.passenger_details,
            total_price=booking_request.total_price,
            currency=booking_request.currency,
            flight_data=booking_request.flight_data,
            payment_status="pending",
            booking_status="pending"
        )

        db.add(booking)
        db.commit()
        db.refresh(booking)

        # Create PayPal order
        try:
            paypal_order = paypal_client.create_order(
                amount=booking_request.total_price,
                currency=booking_request.currency,
                description=f"Flight Booking {booking_reference}: {booking_request.origin} to {booking_request.destination}",
                return_url=f"{os.getenv('FRONTEND_URL', 'https://bookingbot.abovethewings.com/bookingbot')}/payment-success?booking={booking_reference}",
                cancel_url=f"{os.getenv('FRONTEND_URL', 'https://bookingbot.abovethewings.com/bookingbot')}/payment-cancelled?booking={booking_reference}"
            )
        except Exception as paypal_error:
            print(f"❌ PayPal order creation failed: {str(paypal_error)}")
            # Still save the booking but mark payment as failed
            booking.payment_status = "failed"
            booking.booking_status = "payment_failed"
            db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create PayPal payment: {str(paypal_error)}. Your booking has been saved but payment could not be processed. Please contact support."
            )

        # Store PayPal order ID
        booking.paypal_order_id = paypal_order.get("id")
        db.commit()

        # Create payment record
        payment = Payment(
            booking_id=booking.id,
            paypal_order_id=paypal_order.get("id"),
            amount=booking_request.total_price,
            currency=booking_request.currency,
            status="pending",
            paypal_response=paypal_order
        )
        db.add(payment)
        db.commit()

        # Return approval URL for redirect
        approval_url = None
        for link in paypal_order.get("links", []):
            if link.get("rel") == "approve":
                approval_url = link.get("href")
                break

        if not approval_url:
            print(f"⚠️  Warning: No approval URL found in PayPal order response")
            print(f"   PayPal order links: {paypal_order.get('links', [])}")
            raise HTTPException(
                status_code=500, 
                detail="PayPal order created but no approval URL found. Please check PayPal order response."
            )

        print(f"✅ Booking created successfully")
        print(f"   Booking Reference: {booking_reference}")
        print(f"   PayPal Order ID: {paypal_order.get('id')}")
        print(f"   Approval URL: {approval_url[:80]}...")

        return {
            "booking_reference": booking_reference,
            "booking_id": booking.id,
            "paypal_order_id": paypal_order.get("id"),
            "approval_url": approval_url,
            "status": "pending"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating booking: {str(e)}")


@app.post("/api/capture-payment")
async def capture_payment(payment_request: PaymentCaptureRequest, db: Session = Depends(get_db)):
    """Capture PayPal payment and confirm booking"""
    try:
        # Get booking - try by booking reference first, then by PayPal order ID
        booking = db.query(Booking).filter(
            Booking.booking_reference == payment_request.booking_reference
        ).first()

        if not booking:
            # Try to find by PayPal order ID
            booking = db.query(Booking).filter(
                Booking.paypal_order_id == payment_request.order_id
            ).first()

        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Use booking's PayPal order ID if available, otherwise use provided order_id
        order_id_to_capture = booking.paypal_order_id or payment_request.order_id

        # Capture PayPal payment
        capture_result = paypal_client.capture_order(order_id_to_capture)

        # Check if payment was successful
        payment_status = capture_result.get("status", "FAILED")
        if payment_status == "COMPLETED":
            # Extract payment ID
            payment_id = None
            if "purchase_units" in capture_result:
                for unit in capture_result["purchase_units"]:
                    if "payments" in unit and "captures" in unit["payments"]:
                        captures = unit["payments"]["captures"]
                        if captures:
                            payment_id = captures[0].get("id")

            # Update booking
            booking.payment_status = "completed"
            booking.booking_status = "confirmed"
            booking.paypal_payment_id = payment_id
            booking.payment_amount = booking.total_price

            # Update payment record
            payment = db.query(Payment).filter(
                Payment.paypal_order_id == payment_request.order_id
            ).first()
            if payment:
                payment.status = "completed"
                payment.paypal_payment_id = payment_id
                payment.paypal_response = capture_result

            db.commit()

            # Send confirmation emails
            flight_details = {
                "origin": booking.origin,
                "destination": booking.destination,
                "departure_time": booking.departure_time,
                "arrival_time": booking.arrival_time,
                "airline": booking.airline,
                "cabin_class": booking.cabin_class,
                "duration": booking.duration
            }

            booking_details = {
                "customer_name": booking.customer_name,
                "customer_email": booking.customer_email,
                "customer_phone": booking.customer_phone,
                "departure_date": booking.departure_date,
                "total_price": booking.total_price,
                "currency": booking.currency,
                "payment_status": booking.payment_status
            }

            email_sent = email_service.send_booking_confirmation(
                customer_email=booking.customer_email,
                booking_reference=booking.booking_reference,
                booking_details=booking_details,
                flight_details=flight_details
            )

            booking.confirmation_sent = email_sent
            db.commit()

            return {
                "status": "success",
                "booking_reference": booking.booking_reference,
                "payment_status": "completed",
                "email_sent": email_sent,
                "message": "Payment captured and booking confirmed"
            }
        else:
            # Payment failed
            booking.payment_status = "failed"
            db.commit()

            return {
                "status": "failed",
                "message": "Payment capture failed",
                "details": capture_result
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error capturing payment: {str(e)}")


@app.get("/api/booking/{booking_reference}")
async def get_booking(booking_reference: str, db: Session = Depends(get_db)):
    """Get booking details by reference"""
    booking = db.query(Booking).filter(
        Booking.booking_reference == booking_reference
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return booking.to_dict()


@app.post("/api/price-offer")
async def price_offer(request: OfferPriceRequest):
    """Price a flight offer to get final pricing and fare rules"""
    try:
        priced_offer = amadeus_client.price_flight_offer(request.flight_offer)
        return {"priced_offer": priced_offer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error pricing offer: {str(e)}")


@app.post("/api/fare-rules")
async def get_fare_rules(request: FareRulesRequest):
    """Get fare rules for a flight offer"""
    try:
        # Amadeus Quick Connect may have a specific fare rules endpoint
        # For now, we'll extract from the priced offer
        priced_offer = amadeus_client.price_flight_offer(request.flight_offer)
        
        # Extract fare rules from the response
        fare_rules = {
            "change_rules": {},
            "refund_rules": {},
            "baggage": {},
            "penalties": {}
        }
        
        # Parse fare rules from Amadeus response structure
        if "data" in priced_offer:
            offer_data = priced_offer["data"]
            # Extract rules from travelerPricings
            for traveler_pricing in offer_data.get("travelerPricings", []):
                for fare_detail in traveler_pricing.get("fareDetailsBySegment", []):
                    # Extract fare rules if available
                    pass
        
        return {"fare_rules": fare_rules, "priced_offer": priced_offer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting fare rules: {str(e)}")


@app.post("/api/seatmap")
async def get_seatmap(request: SeatMapRequest):
    """Get seat map for a flight offer"""
    try:
        seatmap = amadeus_client.get_seatmap_for_offer(request.flight_offer)
        return seatmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting seatmap: {str(e)}")


@app.post("/api/calendar-prices")
async def get_calendar_prices(request: FlightSearchRequest):
    """Get price calendar for a month"""
    try:
        # Calculate date range for calendar
        base_date = datetime.strptime(request.departure_date, "%Y-%m-%d")
        calendar_prices = []
        
        # Get prices for ±15 days
        for day_offset in range(-15, 16):
            check_date = base_date + timedelta(days=day_offset)
            try:
                offers = amadeus_client.search_flights(
                    origin=request.origin,
                    destination=request.destination,
                    departure_date=check_date.strftime("%Y-%m-%d"),
                    adults=request.adults,
                    children=request.children,
                    infants=request.infants,
                    travel_class=request.travel_class,
                    currency=request.currency
                )
                if offers and "data" in offers and offers["data"]:
                    cheapest = min(offers["data"], key=lambda x: float(x.get("price", {}).get("total", float('inf'))))
                    price = float(cheapest.get("price", {}).get("total", 0))
                    calendar_prices.append({
                        "date": check_date.strftime("%Y-%m-%d"),
                        "price": price,
                        "currency": cheapest.get("price", {}).get("currency", "GBP")
                    })
            except Exception as e:
                print(f"Error getting price for {check_date}: {e}")
                continue
        
        return {"calendar_prices": calendar_prices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting calendar prices: {str(e)}")


@app.post("/api/create-pnr")
async def create_pnr(request: PNRCreateRequest, db: Session = Depends(get_db)):
    """Create PNR in Amadeus system"""
    try:
        # This would integrate with Amadeus PNR creation API
        # For now, we'll create a booking record and mark it as PNR-ready
        booking = db.query(Booking).filter(
            Booking.booking_reference == request.booking_reference
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Store PNR data
        pnr_data = {
            "passengers": request.passengers,
            "contacts": request.contacts,
            "ssr": request.ssr,
            "osi": request.osi,
            "flight_offer": request.flight_offer
        }
        
        booking.passenger_details = pnr_data
        booking.booking_status = "pnr_created"
        db.commit()
        
        return {
            "status": "success",
            "booking_reference": request.booking_reference,
            "message": "PNR created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating PNR: {str(e)}")


@app.post("/api/change-booking")
async def change_booking(request: ChangeBookingRequest, db: Session = Depends(get_db)):
    """Change an existing booking"""
    try:
        booking = db.query(Booking).filter(
            Booking.booking_reference == request.booking_reference
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Price the new offer
        priced_offer = amadeus_client.price_flight_offer(request.new_flight_offer)
        
        # Calculate price difference
        new_price = float(priced_offer.get("data", {}).get("price", {}).get("total", 0))
        price_difference = new_price - booking.total_price
        
        return {
            "status": "success",
            "price_difference": price_difference,
            "new_price": new_price,
            "old_price": booking.total_price,
            "currency": booking.currency,
            "priced_offer": priced_offer
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing booking: {str(e)}")


@app.post("/api/cancel-booking")
async def cancel_booking(request: CancelBookingRequest, db: Session = Depends(get_db)):
    """Cancel an existing booking"""
    try:
        booking = db.query(Booking).filter(
            Booking.booking_reference == request.booking_reference
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Update booking status
        booking.booking_status = "cancelled"
        booking.payment_status = "refunded"
        db.commit()
        
        return {
            "status": "success",
            "booking_reference": request.booking_reference,
            "message": "Booking cancelled successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling booking: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Run on all interfaces (0.0.0.0) to allow network access
    # This suppresses the "use --host to expose" warning
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )

