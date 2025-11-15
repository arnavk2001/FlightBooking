# Booking Flow Test Guide

## Expected Flow

1. **User clicks "Book Flight" button** on a flight card
   - Should trigger `handleSelectFlight(flight)`
   - Should set `showSummary = true`
   - Should display Flight Summary modal

2. **User reviews Flight Summary** and clicks "Proceed to Payment"
   - Should trigger `handleSummaryConfirm()`
   - Should set `showSummary = false` and `showBookingForm = true`
   - Should display Booking Form modal

3. **User fills booking form** (email, name, phone) and clicks "Pay Now"
   - Should trigger `handleBookingSubmit(e)`
   - Should create booking via `/api/create-booking`
   - Should redirect to PayPal approval URL

4. **User completes payment on PayPal** and returns
   - Should redirect to `/payment-success` or `/payment-cancelled`

## Testing Checklist

- [ ] Click "Book Flight" - Summary modal appears
- [ ] Click "Proceed to Payment" - Booking form appears
- [ ] Fill form and click "Pay Now" - Redirects to PayPal
- [ ] Complete payment - Returns to success page

## Common Issues

1. **Modal not appearing**: Check z-index and modal conditions
2. **Button not working**: Check console for errors, verify event handlers
3. **No redirect to PayPal**: Check backend response for `approval_url`
4. **Form validation**: Ensure required fields are filled

