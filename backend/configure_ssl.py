#!/usr/bin/env python3
"""
SSL Configuration Helper for PayPal API Connections
This script helps configure SSL for outbound HTTPS connections to PayPal API.
"""

import ssl
import sys
import os
import certifi
import requests
from urllib3.util.ssl_ import create_urllib3_context

def check_ssl_configuration():
    """Check current SSL configuration"""
    print("=" * 60)
    print("SSL Configuration Check")
    print("=" * 60)
    
    print(f"Python Version: {sys.version}")
    print(f"OpenSSL Version: {ssl.OPENSSL_VERSION}")
    print(f"Certifi Path: {certifi.where()}")
    print(f"Certifi Exists: {os.path.exists(certifi.where())}")
    
    # Check if certifi certificates are accessible
    try:
        with open(certifi.where(), 'r') as f:
            cert_count = f.read().count('BEGIN CERTIFICATE')
            print(f"Certificates in certifi bundle: {cert_count}")
    except Exception as e:
        print(f"Error reading certifi bundle: {e}")
    
    print()
    
    # Test SSL connection to PayPal
    print("Testing SSL connection to PayPal API...")
    try:
        # Test basic HTTPS connection
        response = requests.get(
            'https://api.sandbox.paypal.com',
            timeout=5,
            verify=True
        )
        print(f"✅ SSL connection successful (Status: {response.status_code})")
        return True
    except requests.exceptions.SSLError as e:
        print(f"❌ SSL Error: {e}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Connection Error (not SSL): {e}")
        return False

def configure_ssl_for_requests():
    """Configure requests library to use proper SSL certificates"""
    print()
    print("=" * 60)
    print("SSL Configuration Recommendations")
    print("=" * 60)
    
    print("For outbound HTTPS connections to PayPal API:")
    print("1. The requests library uses certifi by default for SSL verification")
    print("2. Ensure certifi is installed: pip install certifi")
    print("3. If behind a corporate proxy/firewall, you may need to:")
    print("   - Configure proxy settings")
    print("   - Add corporate CA certificates to certifi bundle")
    print("   - Set REQUESTS_CA_BUNDLE environment variable")
    
    print()
    print("Current SSL context configuration:")
    try:
        # Create a default SSL context
        context = ssl.create_default_context()
        print(f"✅ Default SSL context created successfully")
        print(f"   Protocol: {context.protocol}")
        print(f"   Options: {context.options}")
    except Exception as e:
        print(f"❌ Error creating SSL context: {e}")

def test_paypal_ssl():
    """Test SSL connection specifically to PayPal"""
    print()
    print("=" * 60)
    print("PayPal API SSL Test")
    print("=" * 60)
    
    test_urls = [
        'https://api.sandbox.paypal.com/v1/oauth2/token',
    ]
    
    for url in test_urls:
        print(f"\nTesting: {url}")
        try:
            # Just test SSL handshake, not full API call
            response = requests.get(
                'https://api.sandbox.paypal.com',
                timeout=10,
                verify=True
            )
            print(f"✅ SSL handshake successful")
        except requests.exceptions.SSLError as e:
            print(f"❌ SSL Error: {e}")
            print("   This indicates an SSL certificate validation issue")
            print("   Possible causes:")
            print("   - Corporate firewall/proxy intercepting SSL")
            print("   - Missing CA certificates")
            print("   - Network configuration blocking SSL")
        except Exception as e:
            print(f"⚠️  Other error: {e}")

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("PayPal SSL Configuration Helper")
    print("=" * 60)
    print()
    
    check_ssl_configuration()
    configure_ssl_for_requests()
    test_paypal_ssl()
    
    print()
    print("=" * 60)
    print("Note: The SSL certificate on IIS is for INCOMING connections")
    print("(HTTPS to bookingbot.abovethewings.com)")
    print()
    print("For OUTBOUND connections to PayPal API, Python uses:")
    print("- System CA certificates")
    print("- certifi bundle (if installed)")
    print("- REQUESTS_CA_BUNDLE environment variable (if set)")
    print("=" * 60)

