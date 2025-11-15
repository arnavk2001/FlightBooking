#!/usr/bin/env python3
"""
Test script to verify database connection with SSL
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

try:
    from database import engine, DB_HOST, DB_NAME
    
    print("=" * 60)
    print("Testing Database Connection")
    print("=" * 60)
    print(f"Host: {DB_HOST}")
    print(f"Database: {DB_NAME}")
    print()
    
    # Test connection
    print("Attempting to connect...")
    with engine.connect() as conn:
        result = conn.execute("SELECT * from users")
        row = result.fetchone()
        if row and row[0] == 1:
            print("✅ Database connection successful!")
            print()
            print("Testing table creation...")
            from database import Base, Booking, Payment
            Base.metadata.create_all(bind=engine)
            print("✅ Tables created/verified successfully!")
        else:
            print("❌ Connection test failed")
            sys.exit(1)
            
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the backend directory and virtual environment is activated")
    sys.exit(1)
except Exception as e:
    print(f"❌ Connection error: {e}")
    print()
    print("Common issues:")
    print("1. SSL/TLS configuration - Azure MySQL requires SSL")
    print("2. Firewall rules - Ensure your IP is allowed")
    print("3. Database credentials - Verify username/password")
    print("4. Network connectivity - Check if host is reachable")
    sys.exit(1)

print()
print("=" * 60)
print("All checks passed!")
print("=" * 60)

