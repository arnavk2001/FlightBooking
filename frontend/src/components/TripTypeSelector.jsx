import React from 'react'

const TripTypeSelector = ({ onSelect }) => {
  const tripTypes = [
    { value: 'one-way', label: 'One-Way', icon: '✈️' },
    { value: 'round-trip', label: 'Round-Trip', icon: '🔄' },
    { value: 'multi-city', label: 'Multi-City', icon: '🌍' }
  ]

  return (
    <div className="flex flex-col space-y-2 mt-2">
      {tripTypes.map(trip => (
        <button
          key={trip.value}
          onClick={() => onSelect(trip.value)}
          className="px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center space-x-3"
        >
          <span className="text-2xl">{trip.icon}</span>
          <span className="font-semibold text-gray-700">{trip.label}</span>
        </button>
      ))}
    </div>
  )
}

export default TripTypeSelector

