#!/usr/bin/env python3
"""
Test PayPal Integration
This script tests PayPal authentication and order creation to verify the integration is working.
"""

import sys
import os
from paypal_client import PayPalClient

def test_paypal_authentication():
    """Test PayPal OAuth2 authentication"""
    print("=" * 60)
    print("Testing PayPal Authentication")
    print("=" * 60)
    
    try:
        client = PayPalClient()
        print(f"✓ PayPalClient initialized")
        print(f"  App Name: {client.app_name}")
        print(f"  Base URL: {client.base_url}")
        print(f"  Client ID: {client.client_id[:20]}...")
        print(f"  Client Secret: {'*' * 20}...")
        print()
        
        print("Attempting to get access token...")
        token = client._get_access_token()
        
        if token:
            print(f"✅ SUCCESS: Access token obtained")
            print(f"   Token (first 30 chars): {token[:30]}...")
            print(f"   Token length: {len(token)} characters")
            return True, token
        else:
            print("❌ FAILED: No access token returned")
            return False, None
            
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False, None

def test_paypal_order_creation(token=None):
    """Test PayPal order creation"""
    print()
    print("=" * 60)
    print("Testing PayPal Order Creation")
    print("=" * 60)
    
    try:
        client = PayPalClient()
        
        # Use provided token or get a new one
        if not token:
            print("Getting access token first...")
            token = client._get_access_token()
            if not token:
                print("❌ FAILED: Could not get access token for order creation")
                return False
        
        print("Creating test order...")
        print("  Amount: £100.00")
        print("  Currency: GBP")
        print("  Description: Test Flight Booking")
        
        order = client.create_order(
            amount=100.00,
            currency="GBP",
            description="Test Flight Booking - Integration Check",
            return_url="https://bookingbot.abovethewings.com/bookingbot/payment-success",
            cancel_url="https://bookingbot.abovethewings.com/bookingbot/payment-cancelled"
        )
        
        if order:
            print("✅ SUCCESS: Order created")
            print(f"   Order ID: {order.get('id', 'N/A')}")
            print(f"   Status: {order.get('status', 'N/A')}")
            
            # Check for approval URL
            approval_url = None
            for link in order.get('links', []):
                if link.get('rel') == 'approve':
                    approval_url = link.get('href')
                    break
            
            if approval_url:
                print(f"   Approval URL: {approval_url[:80]}...")
                print("✅ Approval URL found - ready for payment redirect")
            else:
                print("⚠️  WARNING: No approval URL found in order links")
                print(f"   Available links: {[link.get('rel') for link in order.get('links', [])]}")
            
            return True
        else:
            print("❌ FAILED: No order returned")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        import traceback
        print("\nFull error traceback:")
        traceback.print_exc()
        return False

def main():
    """Run all PayPal integration tests"""
    print("\n" + "=" * 60)
    print("PayPal Integration Test Suite")
    print("=" * 60)
    print()
    
    # Test 1: Authentication
    auth_success, token = test_paypal_authentication()
    
    if not auth_success:
        print("\n" + "=" * 60)
        print("❌ AUTHENTICATION FAILED - Cannot proceed with order creation test")
        print("=" * 60)
        print("\nPlease check:")
        print("  1. PayPal credentials are correct")
        print("  2. Client ID and Secret are for the correct environment (sandbox/production)")
        print("  3. PayPal app is properly configured in PayPal Developer Portal")
        print("  4. Network connectivity to PayPal API")
        sys.exit(1)
    
    # Test 2: Order Creation
    order_success = test_paypal_order_creation(token)
    
    # Summary
    print()
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Authentication: {'✅ PASSED' if auth_success else '❌ FAILED'}")
    print(f"Order Creation: {'✅ PASSED' if order_success else '❌ FAILED'}")
    print()
    
    if auth_success and order_success:
        print("🎉 All tests passed! PayPal integration is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
