import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class EmailService:
    def __init__(self):
        # For production, use SendGrid or similar service
        # For now, using SMTP (Gmail or custom SMTP server)
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@abovethewings.com")
        self.admin_email = os.getenv("ADMIN_EMAIL", "fly@abovethewings.com")

    def send_booking_confirmation(
        self,
        customer_email: str,
        booking_reference: str,
        booking_details: Dict,
        flight_details: Dict
    ) -> bool:
        """Send booking confirmation email to customer and admin"""
        try:
            # Email to customer
            customer_sent = self._send_email(
                to_email=customer_email,
                subject=f"Flight Booking Confirmation - {booking_reference}",
                body=self._generate_customer_confirmation_email(booking_reference, booking_details, flight_details),
                is_html=True
            )

            # Email to admin
            admin_sent = self._send_email(
                to_email=self.admin_email,
                subject=f"New Flight Booking - {booking_reference}",
                body=self._generate_admin_notification_email(booking_reference, booking_details, flight_details),
                is_html=True
            )

            return customer_sent and admin_sent
        except Exception as e:
            print(f"Error sending confirmation emails: {e}")
            return False

    def _send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """Send email using SMTP"""
        if not self.smtp_user or not self.smtp_password:
            print("SMTP credentials not configured. Email not sent.")
            print(f"Would send to: {to_email}")
            print(f"Subject: {subject}")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = self.from_email
            msg["To"] = to_email
            msg["Subject"] = subject

            if is_html:
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            return True
        except Exception as e:
            print(f"Error sending email to {to_email}: {e}")
            return False

    def _generate_customer_confirmation_email(
        self,
        booking_reference: str,
        booking_details: Dict,
        flight_details: Dict
    ) -> str:
        """Generate HTML email for customer"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .details {{ background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .reference {{ font-size: 24px; font-weight: bold; color: #667eea; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✈️ Flight Booking Confirmation</h1>
                </div>
                <div class="content">
                    <p>Dear {booking_details.get('customer_name', 'Valued Customer')},</p>
                    <p>Thank you for booking with ATW! Your flight booking has been confirmed.</p>
                    
                    <div class="details">
                        <p><strong>Booking Reference:</strong> <span class="reference">{booking_reference}</span></p>
                        <p><strong>Flight Details:</strong></p>
                        <p>{flight_details.get('origin', '')} → {flight_details.get('destination', '')}</p>
                        <p><strong>Departure:</strong> {flight_details.get('departure_time', '')} on {booking_details.get('departure_date', '')}</p>
                        <p><strong>Airline:</strong> {flight_details.get('airline', '')}</p>
                        <p><strong>Cabin Class:</strong> {flight_details.get('cabin_class', '')}</p>
                        <p><strong>Duration:</strong> {flight_details.get('duration', '')}</p>
                        <p><strong>Total Price:</strong> {booking_details.get('currency', 'GBP')} {booking_details.get('total_price', 0):.2f}</p>
                    </div>
                    
                    <p>Please keep this confirmation email for your records. You will receive your e-ticket separately.</p>
                    <p>If you have any questions, please contact us at {self.admin_email}</p>
                </div>
                <div class="footer">
                    <p>Above The Wings - Your trusted travel partner</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _generate_admin_notification_email(
        self,
        booking_reference: str,
        booking_details: Dict,
        flight_details: Dict
    ) -> str:
        """Generate HTML email for admin notification"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #dc3545; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .details {{ background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .reference {{ font-size: 24px; font-weight: bold; color: #dc3545; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 New Flight Booking</h1>
                </div>
                <div class="content">
                    <p>A new flight booking has been received:</p>
                    
                    <div class="details">
                        <p><strong>Booking Reference:</strong> <span class="reference">{booking_reference}</span></p>
                        <p><strong>Customer:</strong> {booking_details.get('customer_name', 'N/A')}</p>
                        <p><strong>Email:</strong> {booking_details.get('customer_email', 'N/A')}</p>
                        <p><strong>Phone:</strong> {booking_details.get('customer_phone', 'N/A')}</p>
                        <hr>
                        <p><strong>Flight:</strong> {flight_details.get('origin', '')} → {flight_details.get('destination', '')}</p>
                        <p><strong>Departure:</strong> {flight_details.get('departure_time', '')} on {booking_details.get('departure_date', '')}</p>
                        <p><strong>Airline:</strong> {flight_details.get('airline', '')}</p>
                        <p><strong>Total Price:</strong> {booking_details.get('currency', 'GBP')} {booking_details.get('total_price', 0):.2f}</p>
                        <p><strong>Payment Status:</strong> {booking_details.get('payment_status', 'pending')}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

