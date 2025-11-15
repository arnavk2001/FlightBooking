import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingRef = searchParams.get('booking')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-600 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        
        {bookingRef && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Booking Reference:</strong> <span className="font-mono text-blue-600">{bookingRef}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Your booking is still pending. You can complete the payment later.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
          >
            Return to Home
          </button>
          <p className="text-sm text-gray-500">
            Need help? Contact us at fly@abovethewings.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancelled

