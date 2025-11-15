# Flight Booking Bot - Setup & Run Guide

## 📋 Project Overview

This is a full-stack flight booking application with:
- **Backend**: Python FastAPI (runs on port 8000)
- **Frontend**: React + Vite (runs on port 3000)

## ✅ Current Status

### Installed & Ready:
- ✅ **Python 3.14.0** - Available
- ✅ **Node.js v24.11.0** - Available
- ✅ **Frontend Dependencies** - Installed (node_modules exists)

### Needs Setup:
- ⚠️ **Backend Virtual Environment** - Needs to be recreated (points to old Python path)
- ⚠️ **Backend Dependencies** - Need to be installed in new venv
- ⚠️ **Environment Variables** - Need to be configured (optional for testing)

## 🚀 Quick Start

### Option 1: Use the Start Scripts (Recommended)

**For Backend:**
```batch
start-backend.bat
```

**For Frontend (in a separate terminal):**
```batch
start-frontend.bat
```

The scripts will:
- Create/recreate virtual environment if needed
- Install dependencies automatically
- Start the servers

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory:**
   ```batch
   cd backend
   ```

2. **Create virtual environment:**
   ```batch
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```batch
   venv\Scripts\activate
   ```
   You should see `(venv)` in your prompt.

4. **Install dependencies:**
   ```batch
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. **Configure environment variables (optional for testing):**
   ```batch
   copy .env.example .env
   ```
   Then edit `.env` with your actual credentials (or use defaults for testing).

6. **Run the backend:**
   ```batch
   python app.py
   ```
   Backend will be available at `http://localhost:8000`

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```batch
   cd frontend
   ```

2. **Install dependencies (if not already installed):**
   ```batch
   npm install
   ```

3. **Configure environment variables (optional):**
   Create `frontend/.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_BASE_PATH=/bookingbot
   ```

4. **Run the frontend:**
   ```batch
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

## 🔧 Environment Variables

### Backend (.env file)

The backend uses environment variables with defaults. You can create a `.env` file in the `backend/` directory or use the defaults:

**Required for full functionality:**
- `AMADEUS_API_KEY` - Amadeus API key (default: test key included)
- `AMADEUS_API_SECRET` - Amadeus API secret (default: test secret included)
- `PAYPAL_CLIENT_ID` - PayPal client ID (default: sandbox ID included)
- `PAYPAL_CLIENT_SECRET` - PayPal secret (default: sandbox secret included)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials (defaults included)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email credentials (optional)

**Optional:**
- `ALLOWED_ORIGINS` - CORS origins (default: `http://localhost:3000,http://localhost:5173`)
- `FRONTEND_URL` - Frontend URL for PayPal redirects (default: production URL)

See `backend/.env.example` for all available variables.

### Frontend (.env file)

Optional environment variables for frontend:

- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000` in dev mode)
- `VITE_BASE_PATH` - Base path for deployment (default: `/bookingbot`)

## 📍 URLs

After starting both servers:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

## 🔍 Troubleshooting

### Backend Issues

**Issue: "No Python at '...python.exe'"**
- **Solution**: The virtual environment was created with a different Python installation. Run `start-backend.bat` to recreate it, or manually delete `backend/venv` and recreate it.

**Issue: "ModuleNotFoundError: No module named 'fastapi'"**
- **Solution**: Make sure virtual environment is activated (you should see `(venv)` in prompt), then run:
  ```batch
  pip install -r requirements.txt
  ```

**Issue: Database connection errors**
- **Solution**: The app will continue without database. Database is only needed for storing bookings. For testing, you can ignore database warnings.

### Frontend Issues

**Issue: "Cannot find module"**
- **Solution**: Run `npm install` in the `frontend` directory.

**Issue: CORS errors**
- **Solution**: Make sure backend is running and `ALLOWED_ORIGINS` includes your frontend URL.

## 📝 What to Run

### For Development:

1. **Terminal 1 - Backend:**
   ```batch
   start-backend.bat
   ```
   OR manually:
   ```batch
   cd backend
   venv\Scripts\activate
   python app.py
   ```

2. **Terminal 2 - Frontend:**
   ```batch
   start-frontend.bat
   ```
   OR manually:
   ```batch
   cd frontend
   npm run dev
   ```

3. **Open Browser:**
   - Navigate to http://localhost:3000

### For Testing Backend Only:

```batch
cd backend
venv\Scripts\activate
python app.py
```

Then test at:
- http://localhost:8000/health
- http://localhost:8000/docs (API documentation)

## 📦 Dependencies

### Backend Dependencies:
- fastapi
- uvicorn
- sqlalchemy
- pymysql
- cryptography
- requests
- python-dotenv
- email-validator

### Frontend Dependencies:
- react
- react-dom
- react-router-dom
- axios
- vite
- tailwindcss

## 🎯 Next Steps

1. ✅ Run `start-backend.bat` to set up and start backend
2. ✅ Run `start-frontend.bat` to start frontend
3. ✅ Open http://localhost:3000 in your browser
4. ✅ Test the flight booking flow

## 📚 Additional Resources

- See `README.md` for detailed documentation
- See `backend/INSTALL.md` for backend setup details
- See `DEPLOYMENT.md` for production deployment
- See `TROUBLESHOOTING.md` for common issues

---

**Note**: The application uses test/sandbox credentials by default. For production, update all API keys and secrets in the `.env` file.

