import React, { useState, useEffect } from 'react'
import axios from 'axios'

const FareRules = ({ flightOffer, onClose }) => {
  const [rules, setRules] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '')

  useEffect(() => {
    if (flightOffer) {
      loadFareRules()
    }
  }, [flightOffer])

  const loadFareRules = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/fare-rules`, {
        flight_offer: flightOffer
      })
      setRules(response.data.fare_rules)
    } catch (error) {
      console.error('Error loading fare rules:', error)
      setError(error.response?.data?.detail || error.message || 'Failed to load fare rules')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Fare Rules</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading fare rules...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Error loading fare rules: {error}</p>
            <button
              onClick={loadFareRules}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : rules ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Change Policy</h3>
              <div className="bg-gray-50 p-3 rounded">
                {rules.change_rules && Object.keys(rules.change_rules).length > 0 ? (
                  <pre className="text-sm">{JSON.stringify(rules.change_rules, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-gray-600">Change rules available at time of booking</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Refund Policy</h3>
              <div className="bg-gray-50 p-3 rounded">
                {rules.refund_rules && Object.keys(rules.refund_rules).length > 0 ? (
                  <pre className="text-sm">{JSON.stringify(rules.refund_rules, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-gray-600">Refund rules available at time of booking</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Baggage</h3>
              <div className="bg-gray-50 p-3 rounded">
                {rules.baggage && Object.keys(rules.baggage).length > 0 ? (
                  <pre className="text-sm">{JSON.stringify(rules.baggage, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-gray-600">Baggage information available at time of booking</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Penalties</h3>
              <div className="bg-gray-50 p-3 rounded">
                {rules.penalties && Object.keys(rules.penalties).length > 0 ? (
                  <pre className="text-sm">{JSON.stringify(rules.penalties, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-gray-600">Penalty information available at time of booking</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No fare rules available</div>
        )}

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default FareRules

