"""
Real-time WebSocket Server for Stock Data
"""
from flask_socketio import SocketIO, emit
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def init_websocket(app):
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
        emit('connected', {'data': 'Connected to stock data stream'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')
    
    @socketio.on('subscribe')
    def handle_subscribe(data):
        symbol = data.get('symbol', 'AAPL')
        print(f'Subscribing to {symbol}')
        
        # Simulate real-time data (replace with actual Finnhub WebSocket)
        import threading
        import time
        import random
        
        def send_realtime_data():
            while True:
                # Simulate price update
                price_data = {
                    'symbol': symbol,
                    'price': round(150 + random.uniform(-5, 5), 2),
                    'change': round(random.uniform(-2, 2), 2),
                    'timestamp': int(time.time() * 1000)
                }
                socketio.emit('price_update', price_data)
                time.sleep(5)  # Update every 5 seconds
        
        thread = threading.Thread(target=send_realtime_data)
        thread.daemon = True
        thread.start()
    
    return socketio