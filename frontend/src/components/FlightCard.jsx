import React from 'react'
import { getAirlineName } from '../utils/airlineNames'

const FlightCard = ({ flight, label, onSelectFlight }) => {
  const formatTime = (datetimeStr) => {
    if (!datetimeStr) return 'N/A'
    const date = new Date(datetimeStr)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (datetimeStr) => {
    if (!datetimeStr) return 'N/A'
    const date = new Date(datetimeStr)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
    return cabinMap[cabin] || cabin
  }

  return (
    <div className="bg-gray-400 rounded-lg shadow-lg p-3 border-2 border-black hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs font-semibold text-black mb-0.5">{label}</div>
          <div className="text-xl font-bold text-black">
            {flight.currency} {flight.price.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-black">{getAirlineName(flight.airline)}</div>
          {flight.airline_logo && (
            <img
              src={flight.airline_logo}
              alt={flight.airline}
              className="w-10 h-10 mt-1"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-black">{flight.departure_airport}</span>
            <span className="text-black">→</span>
            <span className="text-base font-bold text-black">{flight.arrival_airport}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-black">
          <div>
            <span className="font-semibold">{formatTime(flight.departure_time)}</span>
            <span className="mx-1.5">-</span>
            <span className="font-semibold">{formatTime(flight.arrival_time)}</span>
          </div>
          <div className="text-black">{flight.duration}</div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={`px-1.5 py-0.5 rounded border border-black ${
            flight.stops === 0 
              ? 'bg-gray-500 text-black' 
              : 'bg-gray-500 text-black'
          }`}>
            {getStopsText(flight.stops)}
          </span>
          <span className="text-black">{getCabinClassDisplay(flight.cabin_class)}</span>
        </div>

        {flight.days_later && (
          <div className="text-xs text-black font-semibold">
            📅 Available {flight.days_later} days later
          </div>
        )}
      </div>

      <button
        type="button"
        className="w-full py-1.5 text-sm bg-gray-500 text-black rounded-lg hover:bg-gray-600 transition font-semibold border-2 border-black"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Select Flight clicked', flight)
          if (onSelectFlight) {
            onSelectFlight(flight)
          } else {
            console.error('onSelectFlight is not defined')
          }
        }}
      >
        Select Flight
      </button>
    </div>
  )
}

export default FlightCard

