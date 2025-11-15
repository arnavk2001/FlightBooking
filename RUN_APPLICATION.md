# How to Run the Application

## ✅ Current Status

Both servers have been started and are running:

### Backend Server
- **Status**: ✅ Running
- **URL**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs

### Frontend Server
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **Base Path**: /bookingbot/

## 🚀 Access the Application

1. **Open your browser**
2. **Navigate to**: http://localhost:3000
3. **You should see**: The Flight Booking Bot interface

## 🧪 Testing the Application

### 1. Basic Test
- Open browser DevTools (F12)
- Go to Console tab
- Look for diagnostic messages:
  - `🔍 Deployment Diagnostics`
  - `✅ API Connection Test Successful`

### 2. Flight Search Test
1. Chat with the bot
2. Enter origin: "London" or "LHR"
3. Enter destination: "New York" or "JFK"
4. Enter departure date: "2024-12-15" or "15th December"
5. Search for flights

### 3. API Endpoints Test
- **Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Test Proxy**: http://localhost:3000/api/health

## 📋 Server Windows

You should see two windows:

1. **Backend Window** (Python):
   - Shows: "Application startup complete"
   - Shows: "Uvicorn running on http://0.0.0.0:8000"
   - Shows: "🌐 CORS allowed origins: [...]"

2. **Frontend Window** (Node.js):
   - Shows: "Local: http://localhost:3000"
   - Shows: "ready in XXX ms"

## 🔧 If You Need to Restart

### Restart Backend:
```batch
cd backend
start-backend.bat
```

### Restart Frontend:
```batch
cd frontend
npm run dev
```

## 🐛 Troubleshooting

### If you see "Network Error":
1. Check both server windows are running
2. Check browser console (F12) for errors
3. Verify backend is accessible: http://localhost:8000/health
4. See TROUBLESHOOT_NETWORK_ERROR.md

### If frontend doesn't load:
1. Check frontend window for errors
2. Verify port 3000 is not blocked
3. Try clearing browser cache

### If API calls fail:
1. Check backend window for errors
2. Check CORS configuration
3. Verify Vite proxy is working: http://localhost:3000/api/health

## 📝 Next Steps

1. **Test the flight booking flow**
2. **Check browser console** for any warnings
3. **Test different flight searches**
4. **Verify all features work correctly**

## ✨ Application Features to Test

- ✅ Flight search
- ✅ Airport code detection
- ✅ Date parsing
- ✅ Flight categorization (cheapest, fastest, etc.)
- ✅ Booking form
- ✅ PayPal integration (if configured)
- ✅ Email confirmations (if configured)

---

**Application is ready for testing!** 🎉

