import React from 'react'
import { getAirlineName } from '../utils/airlineNames'

const FlightSummary = ({ flight, passengers, onConfirm, onCancel }) => {
  // Add error boundary - if flight is missing or invalid, show error
  if (!flight) {
    return (
      <div className="bg-gray-400 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 border-2 border-black">
        <h2 className="text-2xl font-bold mb-4 text-black">Error</h2>
        <p className="text-black">Flight information is missing. Please try selecting a flight again.</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-gray-500 text-black rounded-lg hover:bg-gray-600 transition font-semibold border-2 border-black"
        >
          Close
        </button>
      </div>
    )
  }

  const formatTime = (datetimeStr) => {
    if (!datetimeStr) return 'N/A'
    try {
      const date = new Date(datetimeStr)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return 'N/A'
    }
  }

  const formatDate = (datetimeStr) => {
    if (!datetimeStr) return 'N/A'
    try {
      const date = new Date(datetimeStr)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch (e) {
      return 'N/A'
    }
  }

  const getStopsText = (stops) => {
    if (stops === 0) return 'Direct'
    if (stops === 1) return '1 stop'
    return `${stops} stops`
  }

  const getCabinClassDisplay = (cabin) => {
    const cabinMap = {
      'ECONOMY': 'Economy',
      'PREMIUM_ECONOMY': 'Premium Economy',
      'BUSINESS': 'Business',
      'FIRST': 'First Class'
    }
    return cabinMap[cabin] || cabin || 'Economy'
  }

  // Price breakdown - flight.price is already the total for all passengers from Amadeus
  const adults = passengers?.adults || 1
  const children = passengers?.children || 0
  const infants = passengers?.infants || 0
  const totalPassengers = adults + children + infants
  
  // The flight.price from Amadeus already includes all passengers
  // For display, we'll show it as a total with breakdown estimate
  const basePricePerAdult = flight?.price ? flight.price / Math.max(totalPassengers, 1) : 0
  const basePrice = basePricePerAdult // Alias for use in display
  const adultTotal = basePricePerAdult * adults
  const childTotal = basePricePerAdult * 0.75 * children // Children typically 75% of adult
  const infantTotal = basePricePerAdult * 0.1 * infants // Infants typically 10% of adult
  const subtotal = flight?.price || (adultTotal + childTotal + infantTotal)
  
  // Service fee (5% of subtotal)
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  return (
    <div className="bg-gray-400 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-black">
      <h2 className="text-2xl font-bold mb-6 text-black">Booking Summary</h2>
      
      {/* Flight Details */}
      <div className="mb-6 p-4 bg-gray-300 rounded-lg border border-black">
        <h3 className="text-lg font-semibold mb-3 text-black">Flight Details</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg text-black">
                {flight.departure_airport || 'N/A'} → {flight.arrival_airport || 'N/A'}
              </div>
              <div className="text-sm text-black mt-1">
                {formatDate(flight.departure_time)} at {formatTime(flight.departure_time)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-black">{getAirlineName(flight.airline || '')}</div>
              <div className="text-xs text-black">{getCabinClassDisplay(flight.cabin_class)}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="text-black">
              <span className="font-semibold">Duration:</span> {flight.duration || 'N/A'}
            </div>
            <div className={`px-2 py-1 rounded text-xs border border-black ${
              (flight.stops || 0) === 0 
                ? 'bg-gray-500 text-black' 
                : 'bg-gray-500 text-black'
            }`}>
              {getStopsText(flight.stops || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Passengers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-black">Passengers</h3>
        <div className="space-y-2 text-sm">
          {adults > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Adults (x{adults})</span>
              <span className="font-semibold text-black">{adults}</span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Children (x{children})</span>
              <span className="font-semibold text-black">{children}</span>
            </div>
          )}
          {infants > 0 && (
            <div className="flex justify-between">
              <span className="text-black">Infants (x{infants})</span>
              <span className="font-semibold text-black">{infants}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mb-6 border-t-2 border-black pt-4">
        <h3 className="text-lg font-semibold mb-3 text-black">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          {adults > 0 && (
            <div className="flex justify-between">
              <span className="text-black">
                Adult{adults > 1 ? 's' : ''} ({flight.currency || 'GBP'} {basePrice.toFixed(2)} × {adults})
              </span>
              <span className="font-semibold text-black">{flight.currency || 'GBP'} {adultTotal.toFixed(2)}</span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between">
              <span className="text-black">
                Child{children > 1 ? 'ren' : ''} ({flight.currency || 'GBP'} {(basePrice * 0.75).toFixed(2)} × {children})
              </span>
              <span className="font-semibold text-black">{flight.currency || 'GBP'} {childTotal.toFixed(2)}</span>
            </div>
          )}
          {infants > 0 && (
            <div className="flex justify-between">
              <span className="text-black">
                Infant{infants > 1 ? 's' : ''} ({flight.currency || 'GBP'} {(basePrice * 0.1).toFixed(2)} × {infants})
              </span>
              <span className="font-semibold text-black">{flight.currency || 'GBP'} {infantTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-black">
            <span className="text-black">Subtotal</span>
            <span className="font-semibold text-black">{flight.currency || 'GBP'} {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">Service Fee</span>
            <span className="font-semibold text-black">{flight.currency || 'GBP'} {serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-black mt-2">
            <span className="text-lg font-bold text-black">Total</span>
            <span className="text-lg font-bold text-black">{flight.currency || 'GBP'} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-500 transition bg-gray-400 font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-gray-500 text-black rounded-lg hover:bg-gray-600 transition font-semibold border-2 border-black"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  )
}

export default FlightSummary

