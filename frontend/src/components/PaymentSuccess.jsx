import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

// Use relative path for API calls when deployed, or env variable
// Use Vite proxy in dev (relative path /api), or full URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '')

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [bookingInfo, setBookingInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // PayPal returns token in query params
  const orderId = searchParams.get('token') || searchParams.get('orderId')
  const bookingRef = searchParams.get('booking')

  useEffect(() => {
    const capturePayment = async () => {
      // PayPal redirects with token in query params, but we need the order ID from the booking
      // Try to get booking first, then use its PayPal order ID
      if (!bookingRef) {
        setError('Missing booking reference')
        setLoading(false)
        return
      }

      try {
        // First, get the booking to retrieve PayPal order ID
        let paypalOrderId = orderId
        if (!paypalOrderId && bookingRef) {
          const bookingResponse = await axios.get(`${API_BASE_URL}/api/booking/${bookingRef}`)
          // If booking has paypal_order_id, use it; otherwise use token from URL
          paypalOrderId = bookingResponse.data.paypal_order_id || orderId
        }

        if (!paypalOrderId) {
          setError('Could not retrieve payment information')
          setLoading(false)
          return
        }

        // Capture payment
        const response = await axios.post(`${API_BASE_URL}/api/capture-payment`, {
          order_id: paypalOrderId,
          booking_reference: bookingRef
        })

        if (response.data.status === 'success') {
          // Get booking details
          const bookingResponse = await axios.get(`${API_BASE_URL}/api/booking/${bookingRef}`)
          setBookingInfo(bookingResponse.data)
        } else {
          setError(response.data.message || 'Payment capture failed')
        }
      } catch (err) {
        console.error('Error capturing payment:', err)
        setError(err.response?.data?.detail || 'An error occurred while processing your payment')
      } finally {
        setLoading(false)
      }
    }

    capturePayment()
  }, []) // Run once on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your booking has been confirmed</p>
        </div>

        {bookingInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Booking Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Booking Reference:</strong> <span className="text-blue-600 font-mono">{bookingInfo.booking_reference}</span></p>
              <p><strong>Customer:</strong> {bookingInfo.customer_name}</p>
              <p><strong>Email:</strong> {bookingInfo.customer_email}</p>
              <p><strong>Route:</strong> {bookingInfo.origin} → {bookingInfo.destination}</p>
              <p><strong>Departure:</strong> {bookingInfo.departure_date}</p>
              <p><strong>Total Paid:</strong> {bookingInfo.currency} {bookingInfo.total_price?.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>📧 Confirmation Email Sent!</strong><br />
            A confirmation email has been sent to {bookingInfo?.customer_email || 'your email'} and to fly@abovethewings.com
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
          >
            Book Another Flight
          </button>
          <button
            onClick={() => window.print()}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess

