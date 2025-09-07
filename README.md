# Real-Time Stock Chart Application

A production-ready, full-stack web application that displays real-time stock data with modern architecture and clean design.

## Technology Stack

- **Backend**: Python 3.9+ with FastAPI and WebSockets
- **Frontend**: React with TypeScript, Vite, and Tailwind CSS
- **Charting**: TradingView Lightweight Charts
- **API**: Finnhub real-time stock data API

## Features

- Real-time stock price updates via WebSocket connections
- Interactive candlestick charts with volume indicators
- Dynamic stock symbol search
- Multiple timeframe selection (1h, 1D, 1W, 1M, 1Y)
- Modern dark theme UI similar to TradingView
- Responsive design for desktop and mobile

## Setup Instructions

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- npm or yarn package manager
- Finnhub API key (free at https://finnhub.io)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
   - Copy `.env` file and add your Finnhub API key:
   ```
   FINNHUB_API_KEY=your_actual_api_key_here
   ```

5. Run the backend server:
```bash
python main.py
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

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Configuration

### Getting a Finnhub API Key

1. Visit https://finnhub.io
2. Sign up for a free account
3. Navigate to your dashboard to get your API key
4. Add the key to the backend `.env` file

### Supported Stock Symbols

The application supports all major stock symbols available on Finnhub, including:
- AAPL (Apple Inc.)
- MSFT (Microsoft Corporation)
- TSLA (Tesla, Inc.)
- GOOGL (Alphabet Inc.)
- AMZN (Amazon.com, Inc.)

## Architecture

### Backend Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **WebSocket Manager**: Handles multiple client connections per stock symbol
- **Stock Data Provider**: Manages connections to external APIs and real-time feeds
- **Error Handling**: Robust error handling for API failures and connection issues

### Frontend Architecture

- **React with TypeScript**: Type-safe component development
- **Custom Hooks**: `useWebSocket` for managing WebSocket connections
- **Component Structure**: Modular components for chart, search, and UI elements
- **State Management**: React hooks for managing application state

## Development

### Backend Development

The backend uses FastAPI with the following key endpoints:
- `GET /health` - Health check endpoint
- `WebSocket /ws/{symbol}` - Real-time stock data stream

### Frontend Development

Key components:
- `StockChart`: Main charting component using Lightweight Charts
- `SearchInput`: Stock symbol search functionality
- `TimeframeSelector`: Timeframe selection buttons
- `LoadingSpinner`: Loading state indicator

### Building for Production

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the backend is running on port 8000
   - Check that CORS is properly configured
   - Verify the WebSocket URL in the frontend

2. **No Stock Data Displayed**
   - Verify your Finnhub API key is correct
   - Check that the stock symbol is valid
   - Monitor browser console for error messages

3. **Chart Not Rendering**
   - Ensure all dependencies are installed
   - Check browser compatibility (modern browsers required)
   - Verify chart container dimensions

### Performance Optimization

- The application limits trade updates to the last 100 trades
- WebSocket connections are automatically managed per symbol
- Charts are optimized for real-time updates

## Deployment

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/your-username/Stock-Charts
cd Stock-Charts
```

## Live Demo

- **Frontend**: https://chartbro.netlify.app/
- **Backend API**: https://stock-charts-2gle.onrender.com

2. Create environment file:
```bash
cp backend/.env.example .env
# Edit .env with your API keys
```

3. Build and run:
```bash
docker-compose up --build
```

Access the application at `http://localhost:3000`

### Manual Deployment

#### Backend
```bash
cd backend
pip install -r requirements.txt
export FINNHUB_API_KEY=your_key
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview
```

### Production Environment Variables

#### Backend (.env)
```
FINNHUB_API_KEY=your_actual_api_key
ALLOWED_ORIGINS=https://chartbro.netlify.app
PORT=8000
```

#### Frontend (.env.production)
```
VITE_API_URL=https://stock-charts-2gle.onrender.com
VITE_WS_URL=wss://stock-charts-2gle.onrender.com
```

## License

This project is for educational and demonstration purposes.