import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import FlightCard from './FlightCard'
import FlightCardsCarousel from './FlightCardsCarousel'
import DatePicker from './DatePicker'
import PriceCalendar from './PriceCalendar'
import PassengerSelector from './PassengerSelector'
import CabinFilter from './CabinFilter'
import FareRules from './FareRules'
import TripTypeSelector from './TripTypeSelector'
import AirportAutocomplete from './AirportAutocomplete'
import FlightSummary from './FlightSummary'

// Use Vite proxy in dev (relative path /api), or full URL in production
// In development, Vite proxy forwards /api to http://localhost:8000
// In production, use relative path if backend is on same domain, or set VITE_API_URL
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // In production, try relative path first (assumes backend is proxied at /api)
  // In development, use empty string to use Vite proxy
  return import.meta.env.PROD ? '' : ''
}
const API_BASE_URL = getApiBaseUrl()

const ChatBot = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [flightData, setFlightData] = useState(null)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  // Load user info from sessionStorage on mount
  const loadUserInfo = () => {
    try {
      const saved = sessionStorage.getItem('bookingbot_userInfo')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error loading user info from sessionStorage:', e)
    }
    return {
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    }
  }

  const [userInfo, setUserInfo] = useState(loadUserInfo())

  // Save user info to sessionStorage whenever it changes (only if all fields are filled)
  useEffect(() => {
    const hasCompleteInfo = userInfo.first_name && userInfo.last_name && userInfo.email && userInfo.phone
    if (hasCompleteInfo) {
      try {
        sessionStorage.setItem('bookingbot_userInfo', JSON.stringify(userInfo))
        console.log('User info saved to session:', userInfo.first_name)
      } catch (e) {
        console.error('Error saving user info to sessionStorage:', e)
      }
    }
  }, [userInfo])
  const [bookingForm, setBookingForm] = useState({
    customer_email: '',
    customer_name: '',
    customer_phone: ''
  })
  const [sessionKey, setSessionKey] = useState(0) // Force remount on new session
  const [conversationState, setConversationState] = useState({
    step: 'first_name', // Start with user info collection
    origin: null,
    destination: null,
    departure_date: null,
    return_date: null,
    adults: 1,
    children: 0,
    infants: 0,
    travel_class: 'ECONOMY',
    trip_type: null, // Start with null, ask first
    direct_only: false,
    max_stops: null,
    preferred_airlines: [],
    excluded_airlines: [],
    flexibility: 0,
    loading: false,
    showPriceCalendar: false,
    showFareRules: false,
    selectedFareRulesOffer: null,
    showInput: false // Control when to show text input vs widgets
  })
  const messagesEndRef = useRef(null)
  const isInitializedRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Only initialize once per session
    if (isInitializedRef.current) return

    // Check if user info already exists (from sessionStorage or state)
    // Also check sessionStorage directly in case state hasn't updated yet
    let currentUserInfo = userInfo
    try {
      const saved = sessionStorage.getItem('bookingbot_userInfo')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.first_name && parsed.last_name && parsed.email && parsed.phone) {
          currentUserInfo = parsed
          // Update state if sessionStorage has more complete info
          if (!userInfo.first_name || !userInfo.last_name || !userInfo.email || !userInfo.phone) {
            setUserInfo(parsed)
          }
        }
      }
    } catch (e) {
      console.error('Error reading user info from sessionStorage:', e)
    }

    const hasUserInfo = currentUserInfo.first_name && currentUserInfo.last_name && currentUserInfo.email && currentUserInfo.phone

    if (hasUserInfo) {
      // User info exists, skip to trip type selection
      addBotMessage(
        `Welcome back, ${currentUserInfo.first_name}! ✈️\n\n` +
        "What type of trip are you planning?"
      )
      setConversationState(prev => ({ ...prev, showInput: false, step: 'trip_type' }))
    } else {
      // No user info, collect it first
      addBotMessage(
        "Hello! Let's get to know you a little bit. ✈️\n\n" +
        "What's your first name?"
      )
      setConversationState(prev => ({ ...prev, showInput: true, step: 'first_name' }))
    }
    isInitializedRef.current = true

    // Diagnostic check - always run in production to catch API issues
    import('../utils/diagnostics').then(({ checkDeployment, testApiConnection }) => {
      checkDeployment()
      testApiConnection().then(result => {
        if (!result.success) {
          console.error('API connection failed:', result.error)
          // Don't show error to user immediately, but log it
        }
      })
    }).catch(err => {
      console.error('Failed to load diagnostics:', err)
    })
  }, [sessionKey]) // Re-run when session key changes

  const addBotMessage = (text) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last && last.type === 'bot' && last.text === text) return prev
      return [...prev, { type: 'bot', text, timestamp: new Date() }]
    })
  }

  const addUserMessage = (text) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last && last.type === 'user' && last.text === text) return prev
      return [...prev, { type: 'user', text, timestamp: new Date() }]
    })
  }

  const extractAirportCode = (text) => {
    // Try to extract airport code (3 letters)
    const codeMatch = text.match(/\b[A-Z]{3}\b/)
    if (codeMatch) return codeMatch[0].toUpperCase()
    return null
  }

  const extractDate = (text) => {
    // Try various date formats
    const patterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
      /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        // Simple date parsing - in production, use a proper date library
        const now = new Date()
        let day, month, year

        if (pattern === patterns[0]) {
          // Format: DD/MM/YYYY or MM/DD/YYYY
          day = parseInt(match[1])
          month = parseInt(match[2]) - 1
          year = parseInt(match[3])
        } else {
          // Format: "5th June" or "5 June 2024"
          day = parseInt(match[1])
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december']
          month = monthNames.indexOf(match[match.length - 1].toLowerCase())
          year = match[3] ? parseInt(match[3]) : now.getFullYear()
        }

        const date = new Date(year, month, day)
        if (date > now) {
          return date.toISOString().split('T')[0]
        }
      }
    }
    return null
  }

  const extractNumber = (text) => {
    const match = text.match(/\d+/)
    return match ? parseInt(match[0]) : null
  }

  const handleSearchFlights = async () => {
    setConversationState(prev => ({ ...prev, loading: true }))
    addBotMessage("Searching for the best flight options... 🔍")

    try {
      const response = await axios.post(`${API_BASE_URL}/api/search-flights`, {
        origin: conversationState.origin,
        destination: conversationState.destination,
        departure_date: conversationState.departure_date,
        return_date: conversationState.return_date,
        adults: conversationState.adults,
        children: conversationState.children,
        infants: conversationState.infants,
        travel_class: conversationState.travel_class,
        currency: 'GBP',
        trip_type: conversationState.trip_type,
        direct_only: conversationState.direct_only,
        max_stops: conversationState.max_stops,
        preferred_airlines: conversationState.preferred_airlines,
        excluded_airlines: conversationState.excluded_airlines,
        flexibility: conversationState.flexibility
      })

      setFlightData(response.data)
      if (response.data.message) {
        // Check if it's a "no flights found" message
        const message = response.data.message.toLowerCase()
        if (message.includes('no flights found')) {
          addBotMessage("No Flights Found. Please revise search criteria.")
          // Clear loading state immediately
          setConversationState(prev => ({ ...prev, loading: false }))
          // Wait 1 second, then reset to initial search state (but keep user info)
          setTimeout(() => {
            setFlightData(null)
            setSelectedFlight(null)
            setShowSummary(false)
            setShowBookingForm(false)

            // Check if user info exists (don't reset it)
            const hasUserInfo = userInfo.first_name && userInfo.last_name && userInfo.email && userInfo.phone

            setConversationState({
              step: hasUserInfo ? 'trip_type' : 'first_name',
              origin: null,
              destination: null,
              departure_date: null,
              return_date: null,
              adults: 1,
              children: 0,
              infants: 0,
              travel_class: 'ECONOMY',
              trip_type: null,
              direct_only: false,
              max_stops: null,
              preferred_airlines: [],
              excluded_airlines: [],
              flexibility: 0,
              loading: false,
              showPriceCalendar: false,
              showFareRules: false,
              selectedFareRulesOffer: null,
              showInput: !hasUserInfo
            })
            // Force re-initialization
            isInitializedRef.current = false
            setSessionKey(prev => prev + 1)
            // Add appropriate greeting based on whether user info exists
            if (hasUserInfo) {
              addBotMessage(`Let's try a different search, ${userInfo.first_name}! ✈️\n\nWhat type of trip are you planning?`)
            } else {
              addBotMessage("Hello! Let's get to know you a little bit. ✈️\n\nWhat's your first name?")
            }
          }, 1000)
        } else {
          addBotMessage(`⚠️ ${response.data.message}\n\nPlease try adjusting your search criteria.`)
        }
      } else {
        addBotMessage("Great! I found some fantastic flight options for you. Here are 4 curated choices:")
      }
    } catch (error) {
      console.error('Error searching flights:', error)
      console.error('API_BASE_URL:', API_BASE_URL)
      console.error('Full error:', error)

      let errorMessage = 'Unknown error occurred'

      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message.includes('Network Error')) {
        const apiUrl = API_BASE_URL || (import.meta.env.PROD ? window.location.origin + '/api' : 'http://localhost:8000')
        errorMessage = `Network Error: Cannot connect to backend server\n\n` +
          `API URL: ${apiUrl}\n` +
          `Please check:\n` +
          `1. Backend server is running and accessible\n` +
          `2. CORS is configured correctly\n` +
          `3. Check browser console (F12) for details`
      } else if (error.response) {
        // Server responded with error
        const status = error.response.status
        const detail = error.response.data?.detail || error.response.statusText || error.message

        if (status === 500) {
          errorMessage = `Server Error (500): ${detail}\n\n` +
            `This usually means:\n` +
            `1. Backend encountered an internal error\n` +
            `2. Check backend logs for details\n` +
            `3. API may be temporarily unavailable`
        } else if (status === 404) {
          errorMessage = `Not Found (404): API endpoint not found\n\n` +
            `Check if backend is deployed correctly`
        } else if (status === 401 || status === 403) {
          errorMessage = `Authentication Error (${status}): ${detail}`
        } else {
          errorMessage = `Error (${status}): ${detail}`
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = `No response from server\n\n` +
          `The request was sent but no response was received.\n` +
          `Check if backend is running and accessible.`
      } else {
        errorMessage = error.message || 'Unknown error'
      }

      addBotMessage(
        `Sorry, I encountered an error: ${errorMessage}\n\n` +
        "Please try again or contact support if the issue persists."
      )
    } finally {
      setConversationState(prev => ({ ...prev, loading: false }))
    }
  }

  // Handler for first name
  const handleFirstName = (firstName) => {
    addUserMessage(firstName)
    setUserInfo(prev => ({ ...prev, first_name: firstName }))
    setConversationState(prev => ({
      ...prev,
      step: 'last_name',
      showInput: true
    }))
    addBotMessage(`Nice to meet you, ${firstName}! 👋\n\nWhat's your last name?`)
  }

  // Handler for last name
  const handleLastName = (lastName) => {
    addUserMessage(lastName)
    setUserInfo(prev => ({ ...prev, last_name: lastName }))
    setConversationState(prev => ({
      ...prev,
      step: 'email',
      showInput: true
    }))
    addBotMessage(`Got it! Now, what's your email address?`)
  }

  // Handler for email
  const handleEmail = (email) => {
    addUserMessage(email)
    setUserInfo(prev => ({ ...prev, email: email }))
    setConversationState(prev => ({
      ...prev,
      step: 'phone',
      showInput: true
    }))
    addBotMessage(`Perfect! And finally, what's your phone number with country code? (e.g., +44 123 456 7890)`)
  }

  // Handler for phone
  const handlePhone = (phone) => {
    addUserMessage(phone)
    setUserInfo(prev => {
      const updated = { ...prev, phone: phone }
      // Update booking form with collected info
      setBookingForm({
        customer_email: updated.email,
        customer_name: `${updated.first_name} ${updated.last_name}`.trim(),
        customer_phone: phone
      })
      return updated
    })
    setConversationState(prev => ({
      ...prev,
      step: 'trip_type',
      showInput: false
    }))
    addBotMessage(`Thank you! Now let's find your perfect flight. ✈️\n\nWhat type of trip are you planning?`)
  }

  // Handler for trip type selection
  const handleTripTypeSelect = (tripType) => {
    addUserMessage(tripType === 'one-way' ? 'One-Way' : tripType === 'round-trip' ? 'Round-Trip' : 'Multi-City')
    setConversationState(prev => ({
      ...prev,
      trip_type: tripType,
      step: 'origin',
      showInput: false
    }))
    addBotMessage(`Great! ${tripType === 'one-way' ? 'One-way' : tripType === 'round-trip' ? 'Round-trip' : 'Multi-city'} trip. ✈️\n\nWhere are you flying from, ${userInfo.first_name}?`)
  }

  // Handler for origin selection
  const handleOriginSelect = (code, airport) => {
    addUserMessage(`${airport.name} (${code})`)
    setConversationState(prev => ({
      ...prev,
      origin: code,
      step: 'destination',
      showInput: false
    }))
    addBotMessage(`Perfect! ${airport.name} (${code}). ✈️\n\nWhere would you like to go, ${userInfo.first_name}?`)
  }

  // Handler for destination selection
  const handleDestinationSelect = (code, airport) => {
    addUserMessage(`${airport.name} (${code})`)
    setConversationState(prev => ({
      ...prev,
      destination: code,
      step: 'departure_date',
      showInput: false
    }))
    addBotMessage(`Great! ${airport.name} (${code}). 🎯\n\nWhen do you want to travel, ${userInfo.first_name}?`)
  }

  // Handler for date selection
  const handleDateSelect = (date) => {
    // date can be a string (YYYY-MM-DD) or Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateISO = typeof date === 'string' ? date : dateObj.toISOString().split('T')[0]

    addUserMessage(dateStr)
    setConversationState(prev => ({
      ...prev,
      departure_date: dateISO,
      step: prev.trip_type === 'round-trip' ? 'return_date' : 'passengers',
      showInput: false
    }))
    if (conversationState.trip_type === 'round-trip') {
      addBotMessage(`Perfect! Departure date: ${dateStr}. 📅\n\nWhen do you want to return, ${userInfo.first_name}?`)
    } else {
      addBotMessage(`Perfect! Travel date: ${dateStr}. 📅\n\nHow many passengers, ${userInfo.first_name}?`)
    }
  }

  // Handler for return date selection
  const handleReturnDateSelect = (date) => {
    // date can be a string (YYYY-MM-DD) or Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const dateISO = typeof date === 'string' ? date : dateObj.toISOString().split('T')[0]

    addUserMessage(dateStr)
    setConversationState(prev => ({
      ...prev,
      return_date: dateISO,
      step: 'passengers',
      showInput: false
    }))
    addBotMessage(`Perfect! Return date: ${dateStr}. 📅\n\nHow many passengers, ${userInfo.first_name}?`)
  }

  // Handler for passenger count
  const handlePassengerConfirm = () => {
    const { adults, children, infants } = conversationState
    const passengerText = `${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}${infants > 0 ? `, ${infants} infant${infants > 1 ? 's' : ''}` : ''}`
    addUserMessage(passengerText)
    setConversationState(prev => ({
      ...prev,
      step: 'search_summary',
      showInput: false
    }))

    const tripTypeText = conversationState.trip_type === 'one-way' ? 'One-way' : conversationState.trip_type === 'round-trip' ? 'Round-trip' : 'Multi-city'
    addBotMessage(
      `Great! ${passengerText}. 👥\n\n` +
      `**Your Search Summary**\n\n` +
      `**Passengers:**\n` +
      `  • ${adults} Adult${adults > 1 ? 's' : ''}\n` +
      (children > 0 ? `  • ${children} Child${children > 1 ? 'ren' : ''}\n` : '') +
      (infants > 0 ? `  • ${infants} Infant${infants > 1 ? 's' : ''}\n` : '') +
      `\n**Flight Details:**\n` +
      `  • Trip Type: ${tripTypeText}\n` +
      `  • From: ${conversationState.origin}\n` +
      `  • To: ${conversationState.destination}\n` +
      `  • Departure: ${new Date(conversationState.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      (conversationState.return_date ? `  • Return: ${new Date(conversationState.return_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n` : '') +
      `\nSearching for flights now, ${userInfo.first_name}...`
    )

    // Auto-search after showing summary
    setTimeout(() => {
      handleSearchFlights()
    }, 1500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || conversationState.loading) return

    const userText = input.trim()
    // Don't add the user message here — specific handlers (e.g. handleFirstName)
    // already add the user's message. Adding it here caused duplicates.
    setInput('')

    // Process based on current step - fallback for text input
    switch (conversationState.step) {
      case 'first_name':
        if (userText.trim()) {
          handleFirstName(userText.trim())
        } else {
          addBotMessage("Please enter your first name.")
        }
        break

      case 'last_name':
        if (userText.trim()) {
          handleLastName(userText.trim())
        } else {
          addBotMessage("Please enter your last name.")
        }
        break

      case 'email':
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(userText.trim())) {
          handleEmail(userText.trim())
        } else {
          addBotMessage("Please enter a valid email address (e.g., john@example.com)")
        }
        break

      case 'phone':
        if (userText.trim()) {
          handlePhone(userText.trim())
        } else {
          addBotMessage("Please enter your phone number with country code (e.g., +44 123 456 7890)")
        }
        break

      case 'trip_type':
        // Try to parse trip type from text
        if (userText.toLowerCase().includes('one') || userText.toLowerCase().includes('single')) {
          handleTripTypeSelect('one-way')
        } else if (userText.toLowerCase().includes('round') || userText.toLowerCase().includes('return')) {
          handleTripTypeSelect('round-trip')
        } else if (userText.toLowerCase().includes('multi')) {
          handleTripTypeSelect('multi-city')
        } else {
          addBotMessage("Please select a trip type using the buttons above, or type 'one-way', 'round-trip', or 'multi-city'")
        }
        break

      case 'origin':
        // Try to extract airport code or use full text
        const originCode = extractAirportCode(userText)
        if (originCode) {
          handleOriginSelect(originCode, { name: originCode, code: originCode })
        } else {
          // Search for airport
          try {
            const response = await axios.get(`${API_BASE_URL}/api/airports`, {
              params: { query: userText }
            })
            const airports = response.data.airports
            if (airports.length > 0) {
              const airport = airports[0]
              handleOriginSelect(airport.code, airport)
            } else {
              addBotMessage("I couldn't find that airport. Please use the search box above or try again with the airport code (e.g., LHR) or city name.")
            }
          } catch (error) {
            console.error('Error searching airports:', error)
            if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message.includes('Network Error')) {
              addBotMessage(
                `Network Error: Cannot connect to backend server.\n\n` +
                `Please make sure the backend server is running (start-backend.bat)`
              )
            } else {
              addBotMessage("Please use the search box above or enter the airport code (e.g., LHR for London Heathrow)")
            }
          }
        }
        break

      case 'destination':
        const destCode = extractAirportCode(userText)
        if (destCode) {
          handleDestinationSelect(destCode, { name: destCode, code: destCode })
        } else {
          try {
            const response = await axios.get(`${API_BASE_URL}/api/airports`, {
              params: { query: userText }
            })
            const airports = response.data.airports
            if (airports.length > 0) {
              const airport = airports[0]
              handleDestinationSelect(airport.code, airport)
            } else {
              addBotMessage("I couldn't find that airport. Please use the search box above or try again with the airport code or city name.")
            }
          } catch (error) {
            console.error('Error searching airports:', error)
            if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message.includes('Network Error')) {
              addBotMessage(
                `Network Error: Cannot connect to backend server.\n\n` +
                `Please make sure the backend server is running (start-backend.bat)`
              )
            } else {
              addBotMessage("Please use the search box above or enter the airport code (e.g., CFU for Corfu) or city name.")
            }
          }
        }
        break

      case 'departure_date':
      case 'return_date':
        const date = extractDate(userText) || (userText.match(/^\d{4}-\d{2}-\d{2}$/) ? userText : null)
        if (date) {
          if (conversationState.step === 'departure_date') {
            handleDateSelect(date)
          } else {
            handleReturnDateSelect(date)
          }
        } else {
          addBotMessage("Please use the calendar widget above or enter a date in format: YYYY-MM-DD or '5th June 2024'")
        }
        break

      case 'passengers':
        const adultsMatch = userText.match(/(\d+)\s*adult/i)
        const childrenMatch = userText.match(/(\d+)\s*child/i)
        const infantsMatch = userText.match(/(\d+)\s*infant/i)
        const adults = adultsMatch ? parseInt(adultsMatch[1]) : extractNumber(userText) || 1
        const children = childrenMatch ? parseInt(childrenMatch[1]) : 0
        const infants = infantsMatch ? parseInt(infantsMatch[1]) : 0

        setConversationState(prev => ({
          ...prev,
          adults,
          children,
          infants: Math.min(infants, adults), // Infants can't exceed adults
          step: 'confirm',
          showInput: false
        }))

        handlePassengerConfirm()
        break

      default:
        // Unrecognized free text: echo the raw user message once, then bot fallback
        addUserMessage(userText)
        addBotMessage("I'm ready to help you search for flights! Type 'start' to begin a new search.")
    }
  }

  const handleSelectFlight = (flight) => {
    try {
      console.log('handleSelectFlight called with:', flight)
      if (!flight) {
        console.error('No flight provided to handleSelectFlight')
        addBotMessage("Error: No flight selected. Please try selecting a flight again.")
        return
      }

      // Validate flight has required properties
      if (!flight.departure_airport || !flight.arrival_airport) {
        console.error('Flight missing required properties:', flight)
        addBotMessage("Error: Flight information is incomplete. Please try selecting a different flight.")
        return
      }

      setSelectedFlight(flight)
      setShowSummary(true)

      // Ensure booking form is pre-filled with user info
      if (userInfo.first_name && userInfo.email) {
        setBookingForm({
          customer_email: userInfo.email,
          customer_name: `${userInfo.first_name} ${userInfo.last_name}`.trim(),
          customer_phone: userInfo.phone || ''
        })
      }

      const firstName = userInfo.first_name || 'there'
      addBotMessage(`Great choice, ${firstName}! You selected the ${flight.category || 'selected'} option. Review your booking summary below! 📝`)
    } catch (error) {
      console.error('Error in handleSelectFlight:', error)
      addBotMessage(`Sorry, I encountered an error: ${error.message}. Please try selecting the flight again.`)
    }
  }

  const handleSummaryConfirm = () => {
    console.log('handleSummaryConfirm: Closing summary, opening booking form')
    // Ensure booking form is pre-filled with user info before showing
    if (userInfo.first_name && userInfo.email) {
      setBookingForm({
        customer_email: userInfo.email,
        customer_name: `${userInfo.first_name} ${userInfo.last_name}`.trim(),
        customer_phone: userInfo.phone || ''
      })
    }
    setShowSummary(false)
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setShowBookingForm(true)
      console.log('Booking form should now be visible')
    }, 100)
  }

  const handleSummaryCancel = () => {
    setShowSummary(false)
    setSelectedFlight(null)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFlight || !bookingForm.customer_email || !bookingForm.customer_name) {
      alert('Please fill in all required fields')
      return
    }

    setConversationState(prev => ({ ...prev, loading: true }))
    addBotMessage("Creating your booking and processing payment... 💳")

    try {
      // Calculate total price with service fee (5%)
      const basePrice = selectedFlight.price || 0
      const serviceFee = basePrice * 0.05
      const totalPrice = basePrice + serviceFee

      // Create booking request
      const bookingRequest = {
        flight_id: selectedFlight.id,
        customer_email: bookingForm.customer_email,
        customer_name: bookingForm.customer_name,
        customer_phone: bookingForm.customer_phone,
        origin: selectedFlight.departure_airport,
        destination: selectedFlight.arrival_airport,
        departure_date: conversationState.departure_date,
        departure_time: selectedFlight.departure_time,
        arrival_time: selectedFlight.arrival_time,
        airline: selectedFlight.airline,
        cabin_class: selectedFlight.cabin_class,
        duration: selectedFlight.duration,
        stops: selectedFlight.stops,
        total_price: totalPrice, // Include service fee
        currency: selectedFlight.currency,
        adults: conversationState.adults,
        children: conversationState.children,
        infants: conversationState.infants || 0,
        flight_data: selectedFlight.raw_offer
      }

      const response = await axios.post(`${API_BASE_URL}/api/create-booking`, bookingRequest)

      console.log('Booking response:', response.data)

      if (response.data.approval_url) {
        // Redirect to PayPal
        console.log('Redirecting to PayPal:', response.data.approval_url)
        addBotMessage("Redirecting to PayPal for payment... 💳")
        // Small delay to show message
        setTimeout(() => {
          window.location.href = response.data.approval_url
        }, 500)
      } else {
        console.error('No approval_url in response:', response.data)
        addBotMessage("Error: Could not get payment URL. Please try again.")
        setConversationState(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      let errorMessage = 'Unknown error occurred'

      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || error.message.includes('Network Error')) {
        errorMessage = `Network Error: Cannot connect to backend server at ${API_BASE_URL || 'http://localhost:8000'}\n\n` +
          `Please make sure the backend server is running.`
      } else if (error.response) {
        errorMessage = error.response.data?.detail || error.response.statusText || error.message
      } else {
        errorMessage = error.message || 'Unknown error'
      }

      addBotMessage(
        `Sorry, I encountered an error: ${errorMessage}\n\n` +
        "Please try again."
      )
    } finally {
      setConversationState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleNewSearch = () => {
    // Reset search-related state but keep user info
    setMessages([])
    setInput('')
    setFlightData(null)
    setSelectedFlight(null)
    setShowSummary(false)
    setShowBookingForm(false)
    // Reset booking form but keep user info in userInfo state
    setBookingForm({ customer_email: '', customer_name: '', customer_phone: '' })

    // Check if user info exists (don't reset it)
    const hasUserInfo = userInfo.first_name && userInfo.last_name && userInfo.email && userInfo.phone

    setConversationState({
      step: hasUserInfo ? 'trip_type' : 'first_name',
      origin: null,
      destination: null,
      departure_date: null,
      return_date: null,
      adults: 1,
      children: 0,
      infants: 0,
      travel_class: 'ECONOMY',
      trip_type: null,
      direct_only: false,
      max_stops: null,
      preferred_airlines: [],
      excluded_airlines: [],
      flexibility: 0,
      loading: false,
      showPriceCalendar: false,
      showFareRules: false,
      selectedFareRulesOffer: null,
      showInput: !hasUserInfo
    })
    // Force re-initialization by incrementing session key
    isInitializedRef.current = false
    setSessionKey(prev => prev + 1)
    // Initial greeting will be added by useEffect when sessionKey changes (will check for user info)
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div>
          <div className="chat-title">✈️ Flight Booking Bot</div>
          <div className="chat-subtitle">Find your perfect flight</div>
        </div>
        <button
          onClick={handleNewSearch}
          className="px-3 py-2 bg-white/10 rounded-md text-white hover:opacity-90"
        >
          New Search
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.type === 'user' ? 'user' : 'bot'}`}>
            <div className={`message-bubble ${msg.type === 'user' ? 'user' : 'bot'}`}>
              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
              <div className="message-meta">{msg.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}

        {/* Show widgets after bot messages based on current step */}
        {messages.length > 0 && messages[messages.length - 1].type === 'bot' && (
          <div className="mt-2 ml-2 relative">
            {conversationState.step === 'trip_type' && (
              <TripTypeSelector onSelect={handleTripTypeSelect} />
            )}
            {conversationState.step === 'origin' && (
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm max-w-md">
                <AirportAutocomplete
                  onSelect={handleOriginSelect}
                  placeholder="Enter city or airport code"
                  label="Departure Airport"
                />
              </div>
            )}
            {conversationState.step === 'destination' && (
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm max-w-md">
                <AirportAutocomplete
                  onSelect={handleDestinationSelect}
                  placeholder="Enter city or airport code"
                  label="Destination Airport"
                />
              </div>
            )}
            {(conversationState.step === 'departure_date' || conversationState.step === 'return_date') && (
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm max-w-md relative" style={{ zIndex: 10 }}>
                <DatePicker
                  value={conversationState.step === 'departure_date' ? conversationState.departure_date : conversationState.return_date}
                  onChange={conversationState.step === 'departure_date' ? handleDateSelect : handleReturnDateSelect}
                  placeholder={conversationState.step === 'departure_date' ? "Select departure date" : "Select return date"}
                  flexible={true}
                />
              </div>
            )}
            {conversationState.step === 'passengers' && (
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm max-w-md">
                <PassengerSelector
                  adults={conversationState.adults}
                  children={conversationState.children}
                  infants={conversationState.infants}
                  onAdultsChange={(adults) => setConversationState(prev => ({ ...prev, adults }))}
                  onChildrenChange={(children) => setConversationState(prev => ({ ...prev, children }))}
                  onInfantsChange={(infants) => setConversationState(prev => ({ ...prev, infants }))}
                  showAges={false}
                />
                <button
                  onClick={handlePassengerConfirm}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Confirm Passengers
                </button>
              </div>
            )}
          </div>
        )}

        {conversationState.loading && (
          <div className="message-row bot">
            <div className="message-bubble bot">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Flight Results */}
      {flightData && (
        <div className="p-4 bg-white/5 border-t overflow-y-auto" style={{ maxHeight: '40vh' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-black">Flight Options</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setConversationState(prev => ({ ...prev, showPriceCalendar: !prev.showPriceCalendar }))}
                className="px-3 py-1 text-sm bg-gray-500 text-black rounded hover:bg-gray-600 border border-black font-semibold"
              >
                📅 Choose your date and Price
              </button>
            </div>
          </div>

          {conversationState.showPriceCalendar && (
            <div className="mb-4">
              <PriceCalendar
                origin={conversationState.origin}
                destination={conversationState.destination}
                baseDate={conversationState.departure_date}
                adults={conversationState.adults}
                children={conversationState.children}
                travelClass={conversationState.travel_class}
                currency="GBP"
                onDateSelect={async (date) => {
                  setConversationState(prev => ({ ...prev, departure_date: date, showPriceCalendar: false }))
                  await handleSearchFlights()
                }}
              />
            </div>
          )}

          <FlightCardsCarousel
            flightData={flightData}
            onSelectFlight={handleSelectFlight}
            onViewFareRules={(offer) => {
              setConversationState(prev => ({ ...prev, showFareRules: true, selectedFareRulesOffer: offer }))
            }}
          />
        </div>
      )}

      {/* Fare Rules Modal */}
      {conversationState.showFareRules && conversationState.selectedFareRulesOffer && (
        <FareRules
          flightOffer={conversationState.selectedFareRulesOffer}
          onClose={() => setConversationState(prev => ({ ...prev, showFareRules: false, selectedFareRulesOffer: null }))}
        />
      )}

      {/* Flight Summary Modal */}
      {showSummary && selectedFlight && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal if clicking outside
            if (e.target === e.currentTarget) {
              handleSummaryCancel()
            }
          }}
        >
          <FlightSummary
            flight={selectedFlight}
            passengers={{
              adults: conversationState.adults,
              children: conversationState.children,
              infants: conversationState.infants
            }}
            onConfirm={() => {
              console.log('Flight Summary: Proceed to Payment clicked')
              handleSummaryConfirm()
            }}
            onCancel={() => {
              console.log('Flight Summary: Cancel clicked')
              handleSummaryCancel()
            }}
          />
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && selectedFlight && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal if clicking outside
            if (e.target === e.currentTarget) {
              setShowBookingForm(false)
              setSelectedFlight(null)
            }
          }}
        >
          <div className="bg-gray-400 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-black">
            <h2 className="text-2xl font-bold mb-4 text-black">Complete Your Booking</h2>
            <div className="mb-4 p-3 bg-gray-300 rounded border border-black">
              <p className="text-sm text-black">
                <strong>Flight:</strong> {selectedFlight.departure_airport} → {selectedFlight.arrival_airport}
              </p>
              <p className="text-sm text-black">
                <strong>Price:</strong> {selectedFlight.currency} {selectedFlight.price.toFixed(2)}
              </p>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingForm.customer_email}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-black"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customer_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-black"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.customer_phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-black"
                    placeholder="+44 123 456 7890"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false)
                    setSelectedFlight(null)
                  }}
                  className="flex-1 px-4 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-500 transition bg-gray-400 font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={conversationState.loading}
                  onClick={(e) => {
                    console.log('Pay Now button clicked')
                    console.log('Form data:', bookingForm)
                    console.log('Selected flight:', selectedFlight)
                    // Form will submit via onSubmit handler
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-black rounded-lg hover:bg-gray-600 transition disabled:opacity-50 border-2 border-black font-semibold"
                >
                  {conversationState.loading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input - only show when text input is needed */}
      {(conversationState.showInput || conversationState.step === 'confirm' || conversationState.step === 'searching') && (
        <form onSubmit={handleSubmit} className="chat-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="chat-input"
            disabled={conversationState.loading}
          />
          <button
            type="submit"
            disabled={conversationState.loading || !input.trim()}
            className="send-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      )}
    </div>
  )
}

export default ChatBot

