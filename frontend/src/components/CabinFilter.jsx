import React from 'react'

const CabinFilter = ({ selectedCabin, onCabinChange, showDirectOnly = false, directOnly = false, onDirectOnlyChange, maxStops = null, onMaxStopsChange }) => {
  const cabins = [
    { value: 'ECONOMY', label: 'Economy' },
    { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'FIRST', label: 'First Class' }
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cabin Class</label>
        <div className="grid grid-cols-2 gap-2">
          {cabins.map(cabin => (
            <button
              key={cabin.value}
              type="button"
              onClick={() => onCabinChange(cabin.value)}
              className={`px-4 py-2 rounded-lg border transition ${
                selectedCabin === cabin.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cabin.label}
            </button>
          ))}
        </div>
      </div>

      {showDirectOnly && (
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={directOnly}
              onChange={(e) => onDirectOnlyChange && onDirectOnlyChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Direct flights only</span>
          </label>
        </div>
      )}

      {!directOnly && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Stops</label>
          <select
            value={maxStops || ''}
            onChange={(e) => onMaxStopsChange && onMaxStopsChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any</option>
            <option value="0">Non-stop</option>
            <option value="1">1 stop max</option>
            <option value="2">2 stops max</option>
          </select>
        </div>
      )}
    </div>
  )
}

export default CabinFilter

