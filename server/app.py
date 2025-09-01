from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import requests
import time
import json
import websocket
import threading
import yfinance as yf
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from indicators import calculate_sma, calculate_ema, calculate_rsi, calculate_macd
from stock_info import get_stock_info

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app, origins=['http://localhost:3000', 'http://localhost:5173'])
socketio = SocketIO(app, cors_allowed_origins="*")

connected_clients = set()

# Simple in-memory cache
cache = {}
CACHE_DURATION = 300  # 5 minutes

def calculate_sma(prices, period):
    if len(prices) < period:
        return []
    sma = []
    for i in range(period - 1, len(prices)):
        avg = sum(prices[i - period + 1:i + 1]) / period
        sma.append(avg)
    return sma

def fill_missing_data(data):
    if not data or len(data) < 2:
        return data
    
    filled_data = []
    for i in range(len(data)):
        filled_data.append(data[i])
        
        if i < len(data) - 1:
            current_time = time.mktime(time.strptime(data[i]['time'], '%Y-%m-%d'))
            next_time = time.mktime(time.strptime(data[i + 1]['time'], '%Y-%m-%d'))
            
            # Check for gaps (more than 1 day)
            if next_time - current_time > 86400:  # 24 hours
                gap_days = int((next_time - current_time) / 86400) - 1
                for day in range(1, gap_days + 1):
                    gap_time = current_time + (day * 86400)
                    filled_data.append({
                        'time': time.strftime('%Y-%m-%d', time.gmtime(gap_time)),
                        'open': None,
                        'high': None,
                        'low': None,
                        'close': None
                    })
    
    return filled_data

@app.route('/')
def home():
    return {"message": "Stock Charts API"}

@app.route('/api/test')
def test_api():
    api_key = os.getenv('FINNHUB_API_KEY')
    return jsonify({
        "status": "OK",
        "api_key_configured": bool(api_key),
        "timestamp": int(time.time())
    })

def generate_mock_data(symbol, days=100):
    import random
    import math
    
    data = []
    base_price = 150.0
    current_time = int(time.time())
    
    for i in range(days):
        timestamp = current_time - (days - i) * 86400
        date_str = time.strftime('%Y-%m-%d', time.gmtime(timestamp))
        
        # Generate realistic OHLC data
        volatility = random.uniform(0.01, 0.03)
        change = random.uniform(-volatility, volatility)
        
        open_price = base_price * (1 + change)
        high_price = open_price * (1 + random.uniform(0, 0.02))
        low_price = open_price * (1 - random.uniform(0, 0.02))
        close_price = open_price + random.uniform(-0.02, 0.02) * open_price
        
        data.append({
            'time': date_str,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': random.randint(1000000, 10000000)
        })
        
        base_price = close_price
    
    return data

@app.route('/api/historical')
def get_historical_data():
    try:
        symbol = request.args.get('symbol')
        interval = request.args.get('interval', 'D')
        
        if not symbol:
            return jsonify({"error": "Symbol parameter required"}), 400
        
        # Check cache first
        cache_key = f"{symbol}_{interval}"
        current_time = time.time()
        
        if cache_key in cache:
            cached_data, timestamp = cache[cache_key]
            if current_time - timestamp < CACHE_DURATION:
                return jsonify(cached_data)
        
        api_key = os.getenv('FINNHUB_API_KEY')
        
        # Try yfinance with smart symbol formatting
        try:
            stock_info = get_stock_info(symbol)
            
            if stock_info:
                # Use formatted symbol for data fetching
                ticker = yf.Ticker(stock_info['formatted_symbol'])
                
                # Map intervals to yfinance format
                interval_map = {
                    'D': '1d', '1d': '1d',
                    '1wk': '1wk', '1W': '1wk', 
                    '1mo': '1mo', '1M': '1mo'
                }
                yf_interval = interval_map.get(interval, '1d')
                
                # Set appropriate period based on interval for accurate data
                if yf_interval == '1mo':
                    period = '10y'  # 10 years of monthly data
                elif yf_interval == '1wk':
                    period = '5y'   # 5 years of weekly data
                else:
                    period = '1y'   # 1 year of daily data
                    
                hist = ticker.history(period=period, interval=yf_interval)
                
                if not hist.empty:
                    chart_data = []
                    for date, row in hist.iterrows():
                        chart_data.append({
                            'time': date.strftime('%Y-%m-%d'),
                            'open': round(float(row['Open']), 2),
                            'high': round(float(row['High']), 2),
                            'low': round(float(row['Low']), 2),
                            'close': round(float(row['Close']), 2),
                            'volume': int(row['Volume']) if row['Volume'] > 0 else 0
                        })
                    
                    response_data = {
                        'stock_info': stock_info,
                        'data': chart_data,
                        'symbol': symbol.upper(),
                        'total_records': len(chart_data)
                    }
                    
                    cache[cache_key] = (response_data, current_time)
                    return jsonify(response_data)
        
        except Exception as yf_error:
            print(f"yfinance error: {str(yf_error)}")
        
        # Fallback to mock data if yfinance fails
        print(f"Using mock data for {symbol}")
        mock_data = generate_mock_data(symbol)
        cache[cache_key] = (mock_data, current_time)
        
        return jsonify(mock_data)
    
    except Exception as e:
        print(f"Error in get_historical_data: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/indicators')
def get_indicators():
    """Secure & Validated API Endpoint for Technical Indicators"""
    try:
        # Parameter validation
        symbol = request.args.get('symbol')
        indicator_type = request.args.get('type')
        period_str = request.args.get('period', '20')
        
        # Validate required parameters
        if not symbol:
            return jsonify({"error": "Missing required parameter: symbol"}), 400
        if not indicator_type:
            return jsonify({"error": "Missing required parameter: type"}), 400
        
        # Validate indicator type
        valid_indicators = ['sma', 'ema', 'rsi', 'macd']
        if indicator_type not in valid_indicators:
            return jsonify({
                "error": f"Invalid indicator type. Must be one of: {', '.join(valid_indicators)}"
            }), 400
        
        # Validate period parameter
        try:
            period = int(period_str)
            if period <= 0 or period > 200:
                return jsonify({"error": "Period must be between 1 and 200"}), 400
        except ValueError:
            return jsonify({"error": "Period must be a valid integer"}), 400
        
        # Get stock data with comprehensive error handling
        try:
            stock_info = get_stock_info(symbol)
            if not stock_info:
                return jsonify({"error": f"Stock symbol '{symbol}' not found"}), 404
                
            ticker = yf.Ticker(stock_info['formatted_symbol'])
            hist = ticker.history(period="1y")
            
            if hist.empty:
                return jsonify({"error": f"No historical data available for '{symbol}'"}), 404
        
        except requests.RequestException:
            return jsonify({"error": "External data service unavailable"}), 500
        except KeyError as e:
            return jsonify({"error": f"Data parsing error: missing field {str(e)}"}), 500
        
        # Calculate indicators using modular function
        from indicator_calculator import calculate_indicators
        
        try:
            result = calculate_indicators(hist, indicator_type, period)
            
            if not result:
                return jsonify({"error": "Unable to calculate indicator with given parameters"}), 400
            
            return jsonify({
                "symbol": symbol,
                "indicator": indicator_type,
                "period": period,
                "data": result
            })
            
        except Exception as calc_error:
            return jsonify({"error": f"Calculation error: {str(calc_error)}"}), 500
        
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON in request"}), 400
    except Exception as e:
        print(f"Unexpected error in get_indicators: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Removed WebSocket handlers - using mock real-time data instead

@socketio.on('connect')
def handle_connect():
    connected_clients.add(request.sid)
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    connected_clients.discard(request.sid)
    print(f"Client disconnected: {request.sid}")

@socketio.on('subscribe')
def handle_subscribe(data):
    symbol = data.get('symbol')
    
    if not symbol:
        emit('error', {'message': 'Symbol required'})
        return
    
    # Simulate real-time updates with mock data
    def send_mock_updates():
        import random
        base_price = 150.0
        
        for _ in range(10):  # Send 10 updates
            time.sleep(2)  # Wait 2 seconds between updates
            price = base_price + random.uniform(-2, 2)
            
            mock_trade = {
                'type': 'trade',
                'data': [{
                    't': int(time.time() * 1000),  # timestamp in ms
                    'p': round(price, 2),  # price
                    's': symbol,  # symbol
                    'v': random.randint(100, 1000)  # volume
                }]
            }
            
            socketio.emit('stock_update', mock_trade)
            base_price = price
    
    # Start mock updates in background
    update_thread = threading.Thread(target=send_mock_updates)
    update_thread.daemon = True
    update_thread.start()
    
    emit('subscribed', {'symbol': symbol})

# Authentication routes
from auth import init_db, register_user, authenticate_user, generate_token, token_required, get_user_watchlist, add_to_watchlist, remove_from_watchlist

# Initialize database
init_db()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not all([username, email, password]):
        return jsonify({'error': 'All fields required'}), 400
    
    user_id = register_user(username, email, password)
    if not user_id:
        return jsonify({'error': 'Username or email already exists'}), 400
    
    token = generate_token(user_id)
    return jsonify({
        'token': token,
        'user': {'id': user_id, 'username': username, 'email': email}
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not all([username, password]):
        return jsonify({'error': 'Username and password required'}), 400
    
    user_id = authenticate_user(username, password)
    if not user_id:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = generate_token(user_id)
    return jsonify({
        'token': token,
        'user': {'id': user_id, 'username': username}
    })

@app.route('/api/watchlist', methods=['GET'])
@token_required
def get_watchlist():
    watchlist = get_user_watchlist(request.current_user_id)
    return jsonify({'watchlist': watchlist})

@app.route('/api/watchlist', methods=['POST'])
@token_required
def add_watchlist():
    data = request.get_json()
    symbol = data.get('symbol')
    
    if not symbol:
        return jsonify({'error': 'Symbol required'}), 400
    
    success = add_to_watchlist(request.current_user_id, symbol)
    if success:
        return jsonify({'message': 'Added to watchlist'})
    else:
        return jsonify({'error': 'Already in watchlist'}), 400

@app.route('/api/watchlist/<symbol>', methods=['DELETE'])
@token_required
def remove_watchlist(symbol):
    success = remove_from_watchlist(request.current_user_id, symbol)
    if success:
        return jsonify({'message': 'Removed from watchlist'})
    else:
        return jsonify({'error': 'Not found in watchlist'}), 404

# Enhanced indicators endpoint
@app.route('/api/indicators/advanced', methods=['POST'])
def get_advanced_indicators():
    from technical_indicators import calculate_sma_advanced, calculate_ema_advanced, calculate_rsi_advanced, calculate_macd_advanced, calculate_bollinger_bands
    
    data = request.get_json()
    symbol = data.get('symbol')
    indicators = data.get('indicators', [])
    
    if not symbol:
        return jsonify({'error': 'Symbol required'}), 400
    
    # Get historical data
    try:
        stock_info = get_stock_info(symbol)
        if not stock_info:
            return jsonify({'error': 'Symbol not found'}), 404
        
        ticker = yf.Ticker(stock_info['formatted_symbol'])
        hist = ticker.history(period='1y')
        
        # Convert to list format
        data_list = []
        for date, row in hist.iterrows():
            data_list.append({
                'time': date.strftime('%Y-%m-%d'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })
        
        results = {}
        
        for indicator in indicators:
            indicator_type = indicator.get('type')
            period = indicator.get('period', 20)
            
            if indicator_type == 'sma':
                results['sma'] = calculate_sma_advanced(data_list, period)
            elif indicator_type == 'ema':
                results['ema'] = calculate_ema_advanced(data_list, period)
            elif indicator_type == 'rsi':
                results['rsi'] = calculate_rsi_advanced(data_list, period)
            elif indicator_type == 'macd':
                results['macd'] = calculate_macd_advanced(data_list)
            elif indicator_type == 'bollinger':
                results['bollinger'] = calculate_bollinger_bands(data_list, period)
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)