import requests
import os
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class PayPalClient:
    def __init__(self):
        # PayPal credentials for ATW-Test app (SANDBOX)
        # App Name: ATW-Test
        # Client ID: ASkRPT_YMf4uWMpfwOUOB1BIhdeZZOUNQNuhWoTN4FDwBOpZeDSjq3vBkxkU-ZsQWxJEhuHmLkS_rzwo
        # Secret: EIs_KY59iOybbr6uT9Tx4qNHPPDwzOf7U1hXq7WCaSnufK6OWmjVn7HdOxuB3QDTHwoMxjZokihPz-s-
        # These credentials are for SANDBOX environment (testing)
        self.client_id = os.getenv("PAYPAL_CLIENT_ID", "ASkRPT_YMf4uWMpfwOUOB1BIhdeZZOUNQNuhWoTN4FDwBOpZeDSjq3vBkxkU-ZsQWxJEhuHmLkS_rzwo")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "EIs_KY59iOybbr6uT9Tx4qNHPPDwzOf7U1hXq7WCaSnufK6OWmjVn7HdOxuB3QDTHwoMxjZokihPz-s-")
        # Using sandbox for testing. Change to https://api.paypal.com for production
        # Note: Current credentials are for SANDBOX only
        # Note: PayPal API base URL - using https://api.sandbox.paypal.com for API calls
        # (https://sandbox.paypal.com is the web interface, not the API endpoint)
        self.base_url = os.getenv("PAYPAL_BASE_URL", "https://api.sandbox.paypal.com")
        self.app_name = os.getenv("PAYPAL_APP_NAME", "ATW-Test")
        self.access_token = None

    def _get_access_token(self) -> str:
        """Get PayPal OAuth2 access token"""
        if self.access_token:
            return self.access_token

        url = f"{self.base_url}/v1/oauth2/token"
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US"
        }
        data = {
            "grant_type": "client_credentials"
        }
        auth = (self.client_id, self.client_secret)

        try:
            # Explicitly enable SSL verification using certifi bundle
            response = requests.post(
                url, 
                headers=headers, 
                data=data, 
                auth=auth, 
                timeout=10,
                verify=True  # Verify SSL certificates (uses certifi by default)
            )
            if response.status_code == 401:
                error_detail = response.text
                print(f"❌ PayPal Authentication Failed (401)")
                print(f"   Client ID: {self.client_id[:10]}...")
                print(f"   Base URL: {self.base_url}")
                print(f"   Response: {error_detail[:500]}")
                raise Exception(f"PayPal authentication failed (401 Unauthorized). Please check your PayPal credentials. Response: {error_detail[:200]}")
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data.get("access_token")
            if not self.access_token:
                raise Exception("PayPal returned no access token in response")
            print(f"✅ PayPal access token obtained successfully")
            return self.access_token
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                error_detail = e.response.text[:500] if hasattr(e.response, 'text') else str(e)
                print(f"❌ PayPal API Error: {e.response.status_code}")
                print(f"   Response: {error_detail}")
            raise Exception(f"Failed to get PayPal access token: {str(e)}")

    def create_order(
        self,
        amount: float,
        currency: str = "GBP",
        description: str = "Flight Booking",
        return_url: str = None,
        cancel_url: str = None
    ) -> Dict:
        """Create a PayPal order"""
        token = self._get_access_token()
        url = f"{self.base_url}/v2/checkout/orders"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "PayPal-Request-Id": f"{self.app_name}-{os.urandom(8).hex()}"
        }

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": f"BOOKING-{os.urandom(8).hex()}",
                    "description": description,
                    "amount": {
                        "currency_code": currency,
                        "value": f"{amount:.2f}"
                    }
                }
            ],
            "application_context": {
                "brand_name": self.app_name,
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": return_url or "http://localhost:3000/payment-success",
                "cancel_url": cancel_url or "http://localhost:3000/payment-cancelled"
            }
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to create PayPal order: {str(e)}")

    def capture_order(self, order_id: str) -> Dict:
        """Capture a PayPal order payment"""
        token = self._get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "PayPal-Request-Id": f"{self.app_name}-{os.urandom(8).hex()}"
        }

        try:
            response = requests.post(
                url, 
                headers=headers, 
                timeout=30,
                verify=True  # Verify SSL certificates
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to capture PayPal order: {str(e)}")

    def get_order(self, order_id: str) -> Dict:
        """Get PayPal order details"""
        token = self._get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{order_id}"

        headers = {
            "Authorization": f"Bearer {token}"
        }

        try:
            response = requests.get(
                url, 
                headers=headers, 
                timeout=10,
                verify=True  # Verify SSL certificates
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get PayPal order: {str(e)}")

