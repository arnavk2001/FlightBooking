import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ChatBot from './components/ChatBot'
import PaymentSuccess from './components/PaymentSuccess'
import PaymentCancelled from './components/PaymentCancelled'
import './App.css'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
      <Route path="/" element={<ChatBot />} />
    </Routes>
  )
}

function App() {
  // Set basename for subdirectory deployment
  const basename = import.meta.env.VITE_BASE_PATH || '/bookingbot'
  
  return (
    <Router basename={basename}>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App

