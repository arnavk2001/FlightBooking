import React from 'react'

const PassengerSelector = ({ adults, children, infants, onAdultsChange, onChildrenChange, onInfantsChange, showAges = false, childAges = [], infantAges = [], onChildAgeChange, onInfantAgeChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
          <p className="text-xs text-gray-500">12+ years</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onAdultsChange(Math.max(1, adults - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            -
          </button>
          <span className="w-8 text-center font-semibold">{adults}</span>
          <button
            type="button"
            onClick={() => onAdultsChange(adults + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
          <p className="text-xs text-gray-500">2-11 years</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onChildrenChange(Math.max(0, children - 1))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            -
          </button>
          <span className="w-8 text-center font-semibold">{children}</span>
          <button
            type="button"
            onClick={() => onChildrenChange(children + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {children > 0 && showAges && (
        <div className="ml-4 space-y-2">
          {Array.from({ length: children }).map((_, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Child {idx + 1} age:</label>
              <input
                type="number"
                min="2"
                max="11"
                value={childAges[idx] || ''}
                onChange={(e) => onChildAgeChange && onChildAgeChange(idx, parseInt(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded"
                placeholder="Age"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Infants</label>
          <p className="text-xs text-gray-500">Under 2 years (on lap)</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onInfantsChange(Math.max(0, Math.min(infants - 1, adults)))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            -
          </button>
          <span className="w-8 text-center font-semibold">{infants}</span>
          <button
            type="button"
            onClick={() => onInfantsChange(Math.min(infants + 1, adults))}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {infants > 0 && showAges && (
        <div className="ml-4 space-y-2">
          {Array.from({ length: infants }).map((_, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Infant {idx + 1} age:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={infantAges[idx] || ''}
                onChange={(e) => onInfantAgeChange && onInfantAgeChange(idx, parseInt(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded"
                placeholder="Months"
              />
              <span className="text-xs text-gray-500">months</span>
            </div>
          ))}
        </div>
      )}

      {infants > adults && (
        <p className="text-xs text-red-600">Note: Each infant must be accompanied by an adult</p>
      )}
    </div>
  )
}

export default PassengerSelector

