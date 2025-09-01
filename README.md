# Stock Charts - Professional Trading Platform

A comprehensive TradingView-like stock charting application built with React and Flask, featuring real-time data, technical indicators, and professional UI.

## 🚀 Features

### Frontend (React)
- **Professional TradingView UI** - Pixel-perfect dark theme interface
- **Real-time Data** - WebSocket integration for live price updates
- **Multiple Timeframes** - 1D, 1W, 1M chart intervals
- **Technical Indicators** - SMA, EMA, RSI, MACD with toggle controls
- **Interactive Charts** - Crosshair, tooltips, zoom, and pan
- **Volume Analysis** - Separate volume pane with color-coded bars
- **User Authentication** - Login/signup with JWT tokens
- **Watchlist** - Save and manage favorite stocks
- **Responsive Design** - Works on desktop and mobile

### Backend (Flask)
- **RESTful API** - Clean endpoints for data and indicators
- **WebSocket Server** - Real-time price streaming
- **Technical Analysis** - Advanced indicator calculations with pandas
- **User Management** - Secure authentication with SQLite
- **Data Caching** - Optimized performance with in-memory cache
- **Multiple Data Sources** - yfinance integration with fallbacks

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Hooks
- Lightweight Charts (TradingView)
- Heroicons for UI icons
- Axios for API calls
- Socket.IO client

**Backend:**
- Flask with Flask-SocketIO
- pandas & numpy for calculations
- yfinance for market data
- SQLite for user data
- JWT for authentication


## 🎯 Usage

1. **Search Stocks** - Use the search bar to find any stock symbol
2. **Change Timeframes** - Click 1D, 1W, or 1M buttons
3. **Add Indicators** - Toggle SMA, EMA, RSI indicators
4. **Volume Analysis** - Click Vol button to show/hide volume
5. **Create Account** - Sign up to save watchlists
6. **Real-time Data** - Live price updates with WebSocket

## 📊 API Endpoints

- `GET /api/historical?symbol=AAPL&interval=1d` - Historical data
- `GET /api/indicators?symbol=AAPL&type=sma&period=20` - Technical indicators
- `POST /api/auth/login` - User authentication
- `GET /api/watchlist` - User watchlist
- WebSocket: Real-time price updates

## 🎨 UI Components

- **TopNavbar** - Stock info and search
- **StockChart** - Main chart with indicators
- **RightSidebar** - Popular stocks list
- **AuthModal** - Login/signup form
- **IndicatorToggleButton** - Technical indicator controls

## 🔒 Security Features

- JWT token authentication
- Password hashing with SHA-256
- CORS protection
- Input validation and sanitization
- Secure WebSocket connections

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly controls
- Adaptive layouts
- Optimized for all screen sizes


## 🙏 Acknowledgments

- TradingView for UI inspiration
- Lightweight Charts library
- yfinance for market data
- Heroicons for beautiful icons

---

**Built with ❤️ for traders and developers**