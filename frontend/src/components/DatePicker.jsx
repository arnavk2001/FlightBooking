import React, { useState, useRef, useEffect } from 'react'

const DatePicker = ({ value, onChange, minDate, maxDate, placeholder = "Select date", flexible = false, onFlexibleChange }) => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [flexibleDays, setFlexibleDays] = useState(0)
  const calendarRef = useRef(null)
  
  // Initialize current month based on value or today
  const getInitialMonth = () => {
    if (value) {
      return new Date(value)
    }
    return new Date()
  }
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth())
  
  // Update current month when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value))
    }
  }, [value])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const min = minDate ? new Date(minDate) : today
  const max = maxDate ? new Date(maxDate) : new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  const formatDisplayDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleDateSelect = (date) => {
    onChange(formatDate(date))
    setShowCalendar(false)
  }

  const handleFlexibleChange = (days) => {
    setFlexibleDays(days)
    if (onFlexibleChange) {
      onFlexibleChange(days)
    }
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false)
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const isDateDisabled = (date) => {
    if (!date) return true
    return date < min || date > max
  }

  const isDateSelected = (date) => {
    if (!date || !value) return false
    return formatDate(date) === value
  }

  const isToday = (date) => {
    if (!date) return false
    return formatDate(date) === formatDate(today)
  }

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="bg-gray-400 border-2 border-black rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => {
              const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
              if (prevMonth >= new Date(min.getFullYear(), min.getMonth(), 1)) {
                setCurrentMonth(prevMonth)
              }
            }}
            className="px-2 py-1 hover:bg-gray-500 rounded text-black font-semibold border border-black"
          >
            ←
          </button>
          <h3 className="font-semibold text-lg text-black">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={() => {
              const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              if (nextMonth <= new Date(max.getFullYear(), max.getMonth() + 1, 0)) {
                setCurrentMonth(nextMonth)
              }
            }}
            className="px-2 py-1 hover:bg-gray-500 rounded text-black font-semibold border border-black"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-black py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square"></div>
            }
            const disabled = isDateDisabled(date)
            const selected = isDateSelected(date)
            const isTodayDate = isToday(date)
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => !disabled && handleDateSelect(date)}
                disabled={disabled}
                className={`aspect-square rounded-lg text-sm transition border border-black ${
                  disabled
                    ? 'text-gray-500 cursor-not-allowed bg-gray-500'
                    : selected
                    ? 'bg-blue-600 text-white font-semibold'
                    : isTodayDate
                    ? 'bg-gray-500 text-black font-semibold'
                    : 'hover:bg-gray-500 text-black bg-gray-300'
                }`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
        {flexible && (
          <div className="mt-4 pt-4 border-t-2 border-black">
            <label className="block text-sm font-medium text-black mb-2">Flexible dates (±days)</label>
            <select
              value={flexibleDays}
              onChange={(e) => handleFlexibleChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-black"
            >
              <option value={0}>Exact date</option>
              <option value={3}>±3 days</option>
              <option value={7}>±7 days</option>
              <option value={14}>±14 days</option>
            </select>
          </div>
        )}
      </div>
    )
  }

  // Calculate calendar position to stay within viewport
  const [calendarPosition, setCalendarPosition] = useState('bottom')
  const calendarContainerRef = useRef(null)
  
  useEffect(() => {
    if (showCalendar && calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const calendarHeight = 450 // Approximate calendar height with flexible dates
      
      // If not enough space below but more space above, show above
      if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
        setCalendarPosition('top')
      } else {
        setCalendarPosition('bottom')
      }
      
      // Scroll calendar into view if needed
      setTimeout(() => {
        if (calendarContainerRef.current) {
          calendarContainerRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
          })
        }
      }, 100)
    }
  }, [showCalendar])

  return (
    <div className="relative" ref={calendarRef}>
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            readOnly
            value={value ? formatDisplayDate(value) : ''}
            onClick={() => setShowCalendar(!showCalendar)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-100 text-black"
          />
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-700"
          >
            📅
          </button>
        </div>
      </div>
      {showCalendar && (
        <div 
          ref={calendarContainerRef}
          className={`absolute z-50 ${calendarPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          style={{ 
            left: 0,
            right: 0,
            maxHeight: '450px',
            overflowY: 'auto',
            maxWidth: '100%',
            width: '100%'
          }}
        >
          {renderCalendar()}
        </div>
      )}
    </div>
  )
}

export default DatePicker


