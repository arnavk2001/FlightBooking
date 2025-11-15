from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_HOST = os.getenv("DB_HOST", "atw-db-dev.mysql.database.azure.com")
DB_NAME = os.getenv("DB_NAME", "atw_dev")
DB_USER = os.getenv("DB_USER", "atwdevdbadmin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Zw5QHqjWDV-D!ag")
DB_PORT = os.getenv("DB_PORT", "3306")

# Azure MySQL requires SSL/TLS connections
# Create connection string (SSL will be configured via connect_args)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# Create engine with SSL configuration for Azure MySQL
# Azure MySQL requires SSL connections - PyMySQL SSL configuration
connect_args = {
    "ssl": {
        "ca": None,  # Azure MySQL uses server-side certificates
        "check_hostname": False,  # Azure MySQL uses server-side validation
    }
}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,  # Set to True for SQL query logging
    connect_args=connect_args
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_name = Column(String(255))
    customer_phone = Column(String(50))
    
    # Flight details
    flight_id = Column(String(100))  # Amadeus flight offer ID
    origin = Column(String(10), nullable=False)
    destination = Column(String(10), nullable=False)
    departure_date = Column(String(20), nullable=False)
    departure_time = Column(String(20))
    arrival_time = Column(String(20))
    airline = Column(String(100))
    cabin_class = Column(String(50))
    duration = Column(String(20))
    stops = Column(Integer, default=0)
    
    # Passenger details
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    infants = Column(Integer, default=0)
    passenger_details = Column(JSON)  # Store full passenger info
    
    # Pricing
    total_price = Column(Float, nullable=False)
    currency = Column(String(10), default="GBP")
    
    # Payment details
    payment_status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    paypal_order_id = Column(String(255))
    paypal_payment_id = Column(String(255))
    payment_amount = Column(Float)
    
    # Flight data (raw JSON from Amadeus)
    flight_data = Column(JSON)
    
    # Status
    booking_status = Column(String(50), default="pending")  # pending, confirmed, cancelled
    confirmation_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "booking_reference": self.booking_reference,
            "customer_email": self.customer_email,
            "customer_name": self.customer_name,
            "origin": self.origin,
            "destination": self.destination,
            "departure_date": self.departure_date,
            "airline": self.airline,
            "total_price": self.total_price,
            "currency": self.currency,
            "payment_status": self.payment_status,
            "booking_status": self.booking_status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, index=True)
    paypal_order_id = Column(String(255), unique=True, index=True)
    paypal_payment_id = Column(String(255))
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="GBP")
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    paypal_response = Column(JSON)  # Store full PayPal response
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Create tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

