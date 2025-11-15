import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const PriceCalendar = ({ origin, destination, baseDate, adults, children, travelClass, currency, onDateSelect }) => {
  const [prices, setPrices] = useState({}) // Store prices by date string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dateOffset, setDateOffset] = useState(0) // Offset from base date
  const loadedDatesRef = useRef(new Set()) // Track which dates have been loaded
  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '')
  
  const DAYS_TO_SHOW = 7 // Show 7 days at a time

  // Load prices for a specific date range
  const loadCalendarPrices = async (startDate, endDate) => {
    const datesToLoad = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!loadedDatesRef.current.has(dateStr)) {
        datesToLoad.push(dateStr)
      }
    }

    if (datesToLoad.length === 0) return // All dates already loaded

    setLoading(true)
    setError(null)
    try {
      // Load prices for the date range
      const promises = datesToLoad.map(async (date) => {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/calendar-prices`, {
            origin,
            destination,
            departure_date: date,
            adults: adults || 1,
            children: children || 0,
            travel_class: travelClass || 'ECONOMY',
            currency: currency || 'GBP'
          })
          const priceData = response.data.calendar_prices || []
          // Find price for this specific date
          const datePrice = priceData.find(p => p.date === date)
          return { date, price: datePrice?.price || null }
        } catch (err) {
          console.error(`Error loading price for ${date}:`, err)
          return { date, price: null }
        }
      })

      const results = await Promise.all(promises)
      const newPrices = { ...prices }
      results.forEach(({ date, price }) => {
        if (price !== null) {
          newPrices[date] = price
          loadedDatesRef.current.add(date)
        }
      })
      setPrices(newPrices)
    } catch (error) {
      console.error('Error loading calendar prices:', error)
      setError(error.response?.data?.detail || error.message || 'Failed to load calendar prices')
    } finally {
      setLoading(false)
    }
  }

  // Load initial 7 days around base date
  useEffect(() => {
    if (origin && destination && baseDate) {
      // Reset state when base date changes
      setPrices({})
      setDateOffset(0)
      loadedDatesRef.current.clear()
      
      const base = new Date(baseDate)
      const startDate = new Date(base)
      startDate.setDate(base.getDate() - 3) // 3 days before
      const endDate = new Date(base)
      endDate.setDate(base.getDate() + 3) // 3 days after
      
      loadCalendarPrices(startDate, endDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, baseDate, adults, children, travelClass, currency])

  const getPriceForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return prices[dateStr] || null
  }

  const getLowestPrice = () => {
    const priceValues = Object.values(prices).filter(p => p !== null)
    if (priceValues.length === 0) return null
    return Math.min(...priceValues)
  }

  const getHighestPrice = () => {
    const priceValues = Object.values(prices).filter(p => p !== null)
    if (priceValues.length === 0) return null
    return Math.max(...priceValues)
  }

  // Load more dates when scrolling
  const loadMoreDates = (direction) => {
    if (!baseDate) return
    
    const base = new Date(baseDate)
    const currentStart = new Date(base)
    currentStart.setDate(base.getDate() + dateOffset - 3)
    
    let newStart, newEnd
    if (direction === 'forward') {
      newStart = new Date(currentStart)
      newStart.setDate(currentStart.getDate() + DAYS_TO_SHOW)
      newEnd = new Date(newStart)
      newEnd.setDate(newStart.getDate() + DAYS_TO_SHOW - 1)
      setDateOffset(prev => prev + DAYS_TO_SHOW)
    } else {
      newEnd = new Date(currentStart)
      newEnd.setDate(currentStart.getDate() - 1)
      newStart = new Date(newEnd)
      newStart.setDate(newEnd.getDate() - DAYS_TO_SHOW + 1)
      setDateOffset(prev => prev - DAYS_TO_SHOW)
    }
    
    loadCalendarPrices(newStart, newEnd)
  }

  const getPriceColor = (price) => {
    if (!price) return 'bg-gray-500 text-gray-500'
    const lowest = getLowestPrice()
    const highest = getHighestPrice()
    if (lowest === highest) return 'bg-gray-500 text-black'
    const ratio = (price - lowest) / (highest - lowest)
    if (ratio < 0.33) return 'bg-gray-300 text-black'
    if (ratio < 0.66) return 'bg-gray-400 text-black'
    return 'bg-gray-500 text-black'
  }

  const renderCalendar = () => {
    if (!baseDate) return null

    const base = new Date(baseDate)
    const startDate = new Date(base)
    startDate.setDate(base.getDate() + dateOffset - 3) // Show 3 days before offset point
    
    // Generate 7 days to show
    const visibleDays = []
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      visibleDays.push(date)
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-black py-1">
              {day}
            </div>
          ))}
          {visibleDays.map((date, idx) => {
            const price = getPriceForDate(date)
            const isBaseDate = date.toISOString().split('T')[0] === baseDate
            const dateStr = date.toISOString().split('T')[0]
            
            // Price will be loaded by initial useEffect or navigation buttons
            
            return (
              <button
                key={idx}
                onClick={() => onDateSelect && onDateSelect(dateStr)}
                className={`p-1.5 rounded-lg text-xs transition border border-black ${
                  isBaseDate
                    ? 'ring-2 ring-blue-500 bg-gray-500 text-black'
                    : getPriceColor(price)
                } ${price ? 'hover:shadow-md cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                disabled={!price}
              >
                <div className="font-semibold text-black">{date.getDate()}</div>
                {price ? (
                  <div className="text-xs mt-0.5 text-black">
                    {currency} {price.toFixed(0)}
                  </div>
                ) : loading ? (
                  <div className="text-xs mt-0.5 text-black">...</div>
                ) : null}
              </button>
            )
          })}
        </div>
        
        {/* Navigation arrows */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => loadMoreDates('backward')}
            disabled={loading}
            className={`px-3 py-1 text-sm rounded-lg transition border border-black ${
              loading
                ? 'bg-gray-500 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 text-black hover:bg-gray-600 font-semibold'
            }`}
          >
            ← Earlier Dates
          </button>
          <span className="text-sm text-black">
            {dateOffset === 0 ? 'Around your date' : `${dateOffset > 0 ? '+' : ''}${dateOffset} days`}
          </span>
          <button
            onClick={() => loadMoreDates('forward')}
            disabled={loading}
            className={`px-3 py-1 text-sm rounded-lg transition border border-black ${
              loading
                ? 'bg-gray-500 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 text-black hover:bg-gray-600 font-semibold'
            }`}
          >
            Later Dates →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-400 rounded-lg shadow-lg p-4 border-2 border-black">
      <h3 className="text-lg font-bold mb-4 text-black">Choose your date and Price</h3>
      {loading ? (
        <div className="text-center py-8 text-black">Loading prices...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>Error loading prices: {error}</p>
          <button
            onClick={loadCalendarPrices}
            className="mt-2 px-4 py-2 bg-gray-500 text-black rounded hover:bg-gray-600 border-2 border-black font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {Object.keys(prices).length > 0 && (
            <div className="mb-4 text-sm text-black">
              Lowest: {currency} {getLowestPrice()?.toFixed(2)} | Highest: {currency} {getHighestPrice()?.toFixed(2)}
            </div>
          )}
          {renderCalendar()}
        </>
      )}
    </div>
  )
}

export default PriceCalendar

