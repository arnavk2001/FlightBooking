import React, { useState, useRef, useEffect } from 'react'
import FlightCard from './FlightCard'

const FlightCardsCarousel = ({ flightData, onSelectFlight, onViewFareRules }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(2)
  const scrollContainerRef = useRef(null)

  // Determine which flights to show
  const featuredFlights = [
    flightData.cheapest && { ...flightData.cheapest, label: '💰 Cheapest', category: 'cheapest', isFeatured: true },
    flightData.fastest && { ...flightData.fastest, label: '⚡ Fastest', category: 'fastest', isFeatured: true },
    flightData.most_comfortable && { ...flightData.most_comfortable, label: '💺 Most Comfortable', category: 'most_comfortable', isFeatured: true },
    flightData.best_future_deal && { ...flightData.best_future_deal, label: '🌍 Best Future Deal', category: 'best_future_deal', isFeatured: true }
  ].filter(Boolean)

  // Get all flights if available, merge with featured to avoid duplicates
  const allFlights = flightData.all_flights || []
  const featuredIds = new Set(featuredFlights.map(f => f.id))
  const otherFlights = allFlights.filter(f => !featuredIds.has(f.id))
  
  // Combine: featured first, then others
  const displayFlights = allFlights.length > 0 
    ? [...featuredFlights, ...otherFlights]
    : featuredFlights

  // Calculate cards per view based on container width
  useEffect(() => {
    const updateCardsPerView = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.offsetWidth
        setCardsPerView(width >= 768 ? 2 : 1)
      }
    }
    updateCardsPerView()
    window.addEventListener('resize', updateCardsPerView)
    return () => window.removeEventListener('resize', updateCardsPerView)
  }, [])

  const maxIndex = Math.max(0, displayFlights.length - cardsPerView)
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < maxIndex

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(prev => Math.max(0, prev - cardsPerView))
    }
  }

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(prev => Math.min(maxIndex, prev + cardsPerView))
    }
  }

  const visibleFlights = displayFlights.slice(currentIndex, currentIndex + cardsPerView)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Showing {currentIndex + 1}-{Math.min(currentIndex + cardsPerView, displayFlights.length)} of {displayFlights.length} flights
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`px-2.5 py-1 text-sm rounded-lg transition ${
              canScrollLeft
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Previous flights"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`px-2.5 py-1 text-sm rounded-lg transition ${
              canScrollRight
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Next flights"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-hidden"
        style={{ position: 'relative' }}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
            pointerEvents: 'auto'
          }}
        >
          {displayFlights.map((flight, idx) => {
            const isFeatured = flight.isFeatured || featuredFlights.some(f => f && f.id === flight.id)
            const label = isFeatured 
              ? (featuredFlights.find(f => f && f.id === flight.id)?.label || flight.label || `Option ${idx + 1}`)
              : `Option ${idx + 1}`
            
            return (
              <div
                key={flight.id || `flight-${idx}`}
                className="flex-shrink-0 px-2"
                style={{ 
                  width: `${100 / cardsPerView}%`,
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ pointerEvents: 'auto' }}
                >
                  <FlightCard
                    flight={flight}
                    label={label}
                    onSelectFlight={onSelectFlight}
                  />
                  {flight.raw_offer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onViewFareRules && onViewFareRules(flight.raw_offer)
                      }}
                      className="mt-1.5 w-full text-xs text-blue-600 hover:underline text-center"
                    >
                      View Fare Rules
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination dots */}
      {displayFlights.length > cardsPerView && (
        <div className="flex justify-center space-x-1.5 mt-3">
          {Array.from({ length: Math.ceil(displayFlights.length / cardsPerView) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * cardsPerView)}
              className={`w-1.5 h-1.5 rounded-full transition ${
                Math.floor(currentIndex / cardsPerView) === idx
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FlightCardsCarousel

