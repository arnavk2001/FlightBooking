import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const AirportAutocomplete = ({ onSelect, placeholder = "Enter city or airport code", label }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState('bottom')
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const containerRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  const cancelTokenRef = useRef(null)
  const currentQueryRef = useRef('')
  const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '')

  const searchAirports = useCallback(async (searchQuery) => {
    // Skip if query is too short
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setLoading(false)
      return
    }

    // Cancel previous request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New search initiated')
    }

    // Create new cancel token
    const CancelToken = axios.CancelToken
    cancelTokenRef.current = CancelToken.source()

    // Update current query ref
    currentQueryRef.current = searchQuery

    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/airports`, {
        params: { query: searchQuery },
        cancelToken: cancelTokenRef.current.token,
        timeout: 10000 // 10 second timeout
      })
      
      // Only update if this is still the current query (check ref, not state)
      if (searchQuery === currentQueryRef.current) {
        setSuggestions(response.data.airports || [])
        setShowSuggestions(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      // Ignore cancellation errors
      if (axios.isCancel(error)) {
        console.log('Airport search cancelled:', error.message)
        return
      }
      console.error('Error searching airports:', error)
      // Only update state if this is still the current query
      if (searchQuery === currentQueryRef.current) {
        setSuggestions([])
        setShowSuggestions(false)
      }
    } finally {
      // Only update loading if this is still the current query
      if (searchQuery === currentQueryRef.current) {
        setLoading(false)
      }
    }
  }, [API_BASE_URL])

  // Debounced search with cancellation
  useEffect(() => {
    // Update current query ref
    currentQueryRef.current = query

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Cancel previous request if still pending
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New search initiated')
    }

    // Only search if query is at least 2 characters
    if (query.trim().length >= 2) {
      // Debounce: wait 300ms after user stops typing
      searchTimeoutRef.current = setTimeout(() => {
        // Double-check query is still valid before searching
        if (currentQueryRef.current.trim().length >= 2) {
          searchAirports(currentQueryRef.current)
        }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setLoading(false)
    }

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted or query changed')
      }
    }
  }, [query, searchAirports])

  const handleSelect = (airport) => {
    setQuery(`${airport.name} (${airport.code})`)
    setShowSuggestions(false)
    onSelect(airport.code, airport)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (showSuggestions && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top
        const dropdownHeight = 240 // Max height of dropdown (max-h-60 = 240px)
        
        // If not enough space below but more space above, show above
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropdownPosition('top')
        } else {
          setDropdownPosition('bottom')
        }
      }
      
      updatePosition()
      // Only update on window resize, not on every showSuggestions change
      window.addEventListener('resize', updatePosition)
      return () => window.removeEventListener('resize', updatePosition)
    }
  }, [showSuggestions, suggestions.length]) // Only recalculate when suggestions change

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-black mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 200)
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-black"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={`absolute z-50 w-full bg-gray-400 border-2 border-black rounded-lg shadow-lg max-h-60 overflow-auto ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {suggestions.map((airport, index) => (
            <button
              key={`${airport.code}-${index}`}
              type="button"
              onClick={() => handleSelect(airport)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-500 transition ${
                index === selectedIndex ? 'bg-gray-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-black">{airport.name}</div>
                  <div className="text-sm text-black">
                    {airport.city && `${airport.city}, `}
                    {airport.country}
                  </div>
                </div>
                <div className="text-lg font-bold text-black">{airport.code}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {showSuggestions && query.length >= 2 && !loading && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-400 border-2 border-black rounded-lg shadow-lg p-4 text-center text-black">
          No airports found
        </div>
      )}
    </div>
  )
}

export default AirportAutocomplete

