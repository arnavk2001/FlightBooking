# Flight Booking Bot (Amadeus API)

A conversational flight booking bot that helps users find the best flight options using the Amadeus Flight APIs. The bot guides users through an interactive process to search and select from 4 curated flight options.

## Features

- 🤖 **Conversational Interface**: Step-by-step chat flow to collect flight requirements
- ✈️ **Live Flight Search**: Real-time flight data from Amadeus API
- 🎯 **4 Curated Options**:
  - 💰 Cheapest option
  - ⚡ Fastest/Direct flight
  - 💺 Most Comfortable (Business/Premium)
  - 🌍 Best Future Deal (30 days later)
- 🔍 **Airport Search**: Automatic airport code detection and city search
- 💳 **PayPal Payment Integration**: Secure payment processing via PayPal
- 📧 **Email Confirmations**: Automatic confirmation emails to customer and admin
- 🗄️ **Database Storage**: All bookings stored in Azure MySQL database
- 📱 **Modern UI**: Beautiful React interface with TailwindCSS

## Technology Stack

- **Frontend**: React 18 + Vite + TailwindCSS + React Router
- **Backend**: Python FastAPI
- **API Integration**: 
  - Amadeus Flight Offers Search API v2
  - PayPal REST API v2
- **Database**: Azure MySQL (SQLAlchemy ORM)
- **Email**: SMTP (configurable for SendGrid, Gmail, etc.)
- **Authentication**: OAuth2 (Client Credentials for APIs)

## Project Structure

```
flight-booking-bot/
├── backend/
│   ├── app.py                 # FastAPI main application
│   ├── amadeus_client.py      # Amadeus API client with OAuth2
│   ├── utils/
│   │   └── categorizer.py     # Flight categorization logic
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBot.jsx    # Main chatbot component
│   │   │   └── FlightCard.jsx # Flight display card
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8+ 
- Node.js 16+ and npm
- Amadeus API credentials (Client ID and Secret)

### Backend Setup

**Quick Setup (Recommended):**

**Windows:**
```bash
cd backend
setup.bat
```

**Mac/Linux:**
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

**Manual Setup:**

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
# OR
python3 -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

**Note:** If you get "ModuleNotFoundError", make sure:
- Virtual environment is activated (you should see `(venv)` in your terminal)
- You're in the `backend` directory
- Dependencies are installed: `pip install -r requirements.txt`

5. Set up environment variables:
```bash
# Copy the example file
cp env.example .env

# Edit .env and add your credentials:
# - Amadeus API credentials
# - PayPal credentials
# - Database credentials
# - Email SMTP settings
```

See `backend/env.example` for all required environment variables.

6. Run the backend server:
```bash
python app.py
# or
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:8000):
```bash
VITE_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### `GET /`
Health check endpoint.

### `GET /health`
Detailed health status.

### `POST /api/search-flights`
Search for flights and get 4 curated options.

**Request Body:**
```json
{
  "origin": "LHR",
  "destination": "CFU",
  "departure_date": "2024-06-05",
  "return_date": null,
  "adults": 1,
  "children": 0,
  "infants": 0,
  "travel_class": "ECONOMY",
  "currency": "GBP"
}
```

**Response:**
```json
{
  "cheapest": { ... },
  "fastest": { ... },
  "most_comfortable": { ... },
  "best_future_deal": { ... },
  "search_params": { ... }
}
```

### `GET /api/airports?query={search_term}`
Search for airports by city or airport code.

## Usage Example

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Follow the conversational flow:
   - Bot: "Where are you flying from?"
   - You: "London Heathrow" or "LHR"
   - Bot: "Where would you like to go?"
   - You: "Corfu" or "CFU"
   - Bot: "When do you want to travel?"
   - You: "5th June 2024" or "2024-06-05"
   - Bot: "How many passengers?"
   - You: "2 adults"
   - Bot: Shows 4 curated flight options

## Flight Categories

- **Cheapest**: Lowest price option
- **Fastest**: Minimum total duration (prefers direct flights)
- **Most Comfortable**: Business/Premium class, or lowest stops
- **Best Future Deal**: Cheapest reasonable option 30 days later

## Deployment

### Backend Deployment

1. **Set Environment Variables** in your hosting platform:
   ```env
   ALLOWED_ORIGINS=https://bookingbot.abovethewings.com
   FRONTEND_URL=https://bookingbot.abovethewings.com/bookingbot
   AMADEUS_API_KEY=your_key
   AMADEUS_API_SECRET=your_secret
   AMADEUS_BASE_URL=https://test.travel.api.amadeus.com
   PAYPAL_CLIENT_ID=your_paypal_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   PAYPAL_BASE_URL=https://api.sandbox.paypal.com
   DB_HOST=atw-db-dev.mysql.database.azure.com
   DB_NAME=atw_dev
   DB_USER=atwdevdbadmin
   DB_PASSWORD=your_password
   DB_PORT=3306
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASSWORD=your_app_password
   FROM_EMAIL=noreply@abovethewings.com
   ADMIN_EMAIL=fly@abovethewings.com
   ```

2. **Deploy Backend** - Ensure backend is accessible (e.g., `https://bookingbot.abovethewings.com/api`)

### Frontend Deployment (Subdirectory: `/bookingbot/`)

1. **Build for Production**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Set Environment Variables** - Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://bookingbot.abovethewings.com/api
   VITE_BASE_PATH=/bookingbot
   ```
   **OR** if backend is on same domain:
   ```env
   VITE_API_URL=
   VITE_BASE_PATH=/bookingbot
   ```

3. **Deploy Files** - Upload `frontend/dist/` contents to `/bookingbot/` directory

4. **Configure Web Server** - Ensure server serves `index.html` for all routes under `/bookingbot/`
   
   **Apache (.htaccess)** - Already included in `frontend/public/.htaccess`
   
   **Nginx**:
   ```nginx
   location /bookingbot {
     alias /path/to/dist;
     try_files $uri $uri/ /bookingbot/index.html;
   }
   ```

### Important Notes

- **Base Path**: The app is configured for `/bookingbot/` subdirectory
- **API URL**: Set `VITE_API_URL` to your backend URL, or use empty string for relative paths
- **CORS**: Backend must allow `https://bookingbot.abovethewings.com` in `ALLOWED_ORIGINS`
- **PayPal URLs**: Backend `FRONTEND_URL` must match your deployment URL

See `DEPLOYMENT.md` and `TROUBLESHOOTING.md` for detailed instructions.

## Security Notes

- ⚠️ Never commit `.env` files to version control
- Use Azure Key Vault for production credentials
- Implement rate limiting for production
- Add authentication/authorization for production use

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### API Testing
Use Postman or curl:
```bash
curl -X POST http://localhost:8000/api/search-flights \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LHR",
    "destination": "CFU",
    "departure_date": "2024-06-05",
    "adults": 1
  }'
```

## Payment Flow

1. User selects a flight option
2. User fills in booking form (email, name, phone)
3. Backend creates booking record in database
4. PayPal order is created
5. User redirected to PayPal for payment
6. After payment, user returns to success page
7. Payment is captured automatically
8. Confirmation emails sent to customer and admin (fly@abovethewings.com)
9. Booking confirmed in database

## Database Schema

The application uses two main tables:

- **bookings**: Stores all flight booking information
- **payments**: Stores payment transaction details

Tables are automatically created on first run using SQLAlchemy.

## Email Configuration

The application sends confirmation emails using SMTP. Configure your SMTP settings in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@abovethewings.com
ADMIN_EMAIL=fly@abovethewings.com
```

**Note**: For Gmail, you'll need to use an App Password, not your regular password.

## Future Enhancements (Phase 2)

- [x] PayPal payment integration
- [x] Email confirmations
- [x] Database storage
- [ ] User accounts and saved preferences
- [ ] Price alerts and notifications
- [ ] Booking flow integration (Amadeus Flight Create Orders API)
- [ ] Natural Language Understanding (NLU) with OpenAI/Rasa
- [ ] Multi-language support (English, French, Spanish)
- [ ] Hotel and car rental integration

## Troubleshooting

### Backend Issues

- **401 Unauthorized**: Check Amadeus API credentials
- **No flights found**: Verify airport codes and date format (YYYY-MM-DD)
- **Token expired**: The client automatically refreshes tokens

### Frontend Issues

- **CORS errors**: Ensure backend CORS is configured for your frontend URL
- **API connection**: Check `VITE_API_URL` environment variable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---

**Note**: This project uses Amadeus Test API. For production, use Amadeus Production API credentials and update the base URL.

