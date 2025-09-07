# Updated imports and setup are the same as before
import asyncio
import json
import os
import time
from typing import Dict, Set, Optional
import websockets
import aiohttp
import yfinance as yf
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from cachetools import TTLCache
import concurrent.futures
import pandas as pd
import numpy as np

load_dotenv()

app = FastAPI()

# Get allowed origins from environment or use defaults
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,https://chartbro.netlify.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache = TTLCache(maxsize=100, ttl=86400)

def get_timeframe_params(timeframe: str):
    """
    Professional trading timeframe mapping with proper data granularity
    """
    mapping = {
        '1D': {'yf_period': '1d', 'yf_interval': '5m'},
        '1W': {'yf_period': '1mo', 'yf_interval': '1d'},
        '1M': {'yf_period': '3mo', 'yf_interval': '1d'},
        '1Y': {'yf_period': '1y', 'yf_interval': '1wk'},
    }
    return mapping.get(timeframe, {'yf_period': '3mo', 'yf_interval': '1d'})

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, symbol: str):
        await websocket.accept()
        if symbol not in self.active_connections:
            self.active_connections[symbol] = set()
        self.active_connections[symbol].add(websocket)

    def disconnect(self, websocket: WebSocket, symbol: str):
        if symbol in self.active_connections:
            self.active_connections[symbol].discard(websocket)
            if not self.active_connections[symbol]:
                del self.active_connections[symbol]

    async def broadcast(self, symbol: str, data: dict):
        if symbol in self.active_connections:
            disconnected = []
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_text(json.dumps(data))
                except:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.active_connections[symbol].discard(conn)

manager = ConnectionManager()

class StockDataProvider:
    def __init__(self):
        self.finnhub_api_key = os.getenv("FINNHUB_API_KEY")
        self.polygon_api_key = os.getenv("POLYGON_API_KEY")
        self.ws_connections = {}
        self.ws_subscriptions: Set[str] = set()

    async def get_historical_data(self, symbol: str, timeframe: str = '1D'):
        """Fetch historical candle data with caching and fallback"""
        cache_key = f"{symbol}_{timeframe}"
        
        if cache_key in cache:
            return cache[cache_key]

        try:
            data = await self._fetch_yfinance_data(symbol, timeframe)
            if data and len(data['data']['timestamps']) > 0:
                data_length = len(data['data']['timestamps'])
                if (len(data['data']['open']) == data_length and 
                    len(data['data']['high']) == data_length and 
                    len(data['data']['low']) == data_length and 
                    len(data['data']['close']) == data_length and 
                    len(data['data']['volume']) == data_length):
                    
                    cache[cache_key] = data
                    return data
                else:
                    print(f"Data integrity check failed for {symbol}")
            
        except Exception as e:
            print(f"yfinance fallback failed: {e}")
        
        raise HTTPException(status_code=503, detail=f"Stock data service temporarily unavailable for {symbol}")

    async def _fetch_yfinance_data(self, symbol: str, timeframe: str):
        """Download complete stock data from Yahoo Finance for all timeframes"""
        def fetch_data():
            import requests
            
            print(f"Fetching {symbol} data for {timeframe} using Yahoo Finance REST API")
            
            try:
                base_url = "https://query1.finance.yahoo.com/v8/finance/chart"
                
                timeframe_map = {
                    '1D': {'range': '1d', 'interval': '5m'},
                    '1W': {'range': '1mo', 'interval': '1d'},
                    '1M': {'range': '3mo', 'interval': '1d'},
                    '1Y': {'range': '1y', 'interval': '1wk'}
                }
                
                params = timeframe_map.get(timeframe, timeframe_map['1M'])
                
                url_params = {
                    'range': params['range'],
                    'interval': params['interval'],
                    'includePrePost': 'false',
                    'events': 'div,split'
                }
                
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive'
                }
                
                response = requests.get(
                    f"{base_url}/{symbol}",
                    params=url_params,
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code != 200:
                    print(f"HTTP {response.status_code} for {symbol}")
                    return None
                
                data = response.json()
                
                if 'chart' not in data or not data['chart']['result']:
                    print(f"No chart data for {symbol}")
                    return None
                
                result = data['chart']['result'][0]
                
                if 'timestamp' not in result or not result['timestamp']:
                    print(f"No timestamp data for {symbol}")
                    return None
                
                timestamps = result['timestamp']
                quote = result['indicators']['quote'][0]
                
                opens = quote['open']
                highs = quote['high']
                lows = quote['low']
                closes = quote['close']
                volumes = quote['volume']
                
                clean_data = []
                for i in range(len(timestamps)):
                    if all(x is not None for x in [opens[i], highs[i], lows[i], closes[i], volumes[i]]):
                        clean_data.append({
                            'timestamp': timestamps[i],
                            'open': opens[i],
                            'high': highs[i],
                            'low': lows[i],
                            'close': closes[i],
                            'volume': volumes[i]
                        })
                
                if not clean_data:
                    print(f"No valid data for {symbol}")
                    return None
                
                return {
                    "type": "historical",
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "data": {
                        "timestamps": [d['timestamp'] for d in clean_data],
                        "open": [d['open'] for d in clean_data],
                        "high": [d['high'] for d in clean_data],
                        "low": [d['low'] for d in clean_data],
                        "close": [d['close'] for d in clean_data],
                        "volume": [d['volume'] for d in clean_data]
                    }
                }
            
            except Exception as e:
                print(f"Yahoo Finance REST API error for {symbol}: {e}")
                return None
        
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            return await loop.run_in_executor(executor, fetch_data)
    
    def _calculate_sma(self, prices, period):
        """Calculate Simple Moving Average"""
        if len(prices) < period:
            return [None] * len(prices)
        
        # Use pandas for efficient calculation
        s = pd.Series(prices)
        sma = s.rolling(window=period).mean().tolist()
        
        return [round(x, 4) if not pd.isna(x) else None for x in sma]
    
    def _calculate_ema(self, prices, period):
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return [None] * len(prices)
        
        s = pd.Series(prices)
        ema = s.ewm(span=period, adjust=False).mean().tolist()
        
        return [round(x, 4) if not pd.isna(x) else None for x in ema]
    
    def _calculate_rsi(self, prices, period=14):
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return [None] * len(prices)
        
        df = pd.DataFrame({'close': prices})
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        avg_gain = gain.ewm(span=period, min_periods=period).mean()
        avg_loss = loss.ewm(span=period, min_periods=period).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return [round(x, 2) if not pd.isna(x) else None for x in rsi.tolist()]
    
    async def calculate_indicator(self, symbol: str, indicator_type: str, period: int, timeframe: str = '1D'):
        """Calculate specific technical indicator using pandas"""
        import pandas as pd
        import numpy as np
        
        historical_data = await self.get_historical_data(symbol, timeframe)
        if not historical_data:
            raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
        
        prices = historical_data['data']['close']
        timestamps = historical_data['data']['timestamps']
        
        indicator_values = []
        if indicator_type == 'sma':
            indicator_values = self._calculate_sma(prices, period)
        elif indicator_type == 'ema':
            indicator_values = self._calculate_ema(prices, period)
        elif indicator_type == 'rsi':
            indicator_values = self._calculate_rsi(prices, period)
        else:
            raise HTTPException(status_code=400, detail="Invalid indicator type")
        
        return {
            "symbol": symbol,
            "indicator_type": indicator_type,
            "period": period,
            "timeframe": timeframe,
            "data": {
                "timestamps": timestamps,
                "values": indicator_values
            }
        }

    async def start_real_time_feed(self, symbol: str):
        """Start real-time WebSocket connection to Finnhub"""
        if symbol in self.ws_subscriptions:
            return
        
        try:
            uri = f"wss://ws.finnhub.io?token={self.finnhub_api_key}"
            websocket = await websockets.connect(uri)
            self.ws_connections[symbol] = websocket
            self.ws_subscriptions.add(symbol)
            
            await websocket.send(json.dumps({"type": "subscribe", "symbol": symbol}))
            asyncio.create_task(self._listen_to_feed(websocket, symbol))
            
        except Exception as e:
            print(f"Error connecting to Finnhub WebSocket: {e}")

    async def _listen_to_feed(self, websocket, symbol: str):
        """Listen to real-time feed and broadcast to clients"""
        try:
            async for message in websocket:
                data = json.loads(message)
                if data.get("type") == "trade" and data.get("data"):
                    for trade in data["data"]:
                        if trade.get("s") == symbol:
                            await manager.broadcast(symbol, {
                                "type": "realtime",
                                "price": trade.get("p"),
                                "volume": trade.get("v"),
                                "timestamp": trade.get("t")
                            })
        except websockets.exceptions.ConnectionClosed:
            print(f"WebSocket connection closed for {symbol}")
        except Exception as e:
            print(f"Error in real-time feed: {e}")
        finally:
            self.ws_subscriptions.discard(symbol)
            if symbol in self.ws_connections:
                del self.ws_connections[symbol]
                
    async def stop_real_time_feed(self, symbol: str):
        """Stop real-time feed for symbol"""
        if symbol in self.ws_subscriptions:
            try:
                await self.ws_connections[symbol].send(
                    json.dumps({"type": "unsubscribe", "symbol": symbol})
                )
                await self.ws_connections[symbol].close()
            except:
                pass
            self.ws_subscriptions.discard(symbol)
            if symbol in self.ws_connections:
                del self.ws_connections[symbol]

stock_provider = StockDataProvider()

@app.get("/api/historical_data")
async def get_historical_data(
    symbol: str = Query(..., description="Stock symbol"),
    timeframe: str = Query("1M", description="Timeframe: 1D, 1W, 1M, 3M, 1Y, 5Y, All")
):
    """Get historical stock data with timeframe support"""
    valid_timeframes = ['1D', '1W', '1M', '1Y']
    if timeframe not in valid_timeframes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid timeframe. Must be one of: {', '.join(valid_timeframes)}"
        )
    
    data = await stock_provider.get_historical_data(symbol.upper(), timeframe)
    return data

@app.get("/api/indicators")
async def get_indicators(
    symbol: str = Query(..., description="Stock symbol"),
    indicator_type: str = Query(..., description="Indicator type: sma, ema, rsi"),
    period: int = Query(..., description="Period for calculation"),
    timeframe: str = Query("1M", description="Timeframe")
):
    """Get technical indicators for a stock"""
    valid_indicators = ['sma', 'ema', 'rsi']
    if indicator_type not in valid_indicators:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid indicator. Must be one of: {', '.join(valid_indicators)}"
        )
    
    data = await stock_provider.calculate_indicator(symbol.upper(), indicator_type, period, timeframe)
    return data

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str, timeframe: str = Query("1D")):
    await manager.connect(websocket, symbol.upper())
    
    try:
        historical_data = await stock_provider.get_historical_data(symbol.upper(), timeframe)
        if historical_data:
            await websocket.send_text(json.dumps(historical_data))
        
        await stock_provider.start_real_time_feed(symbol.upper())
        
        while True:
            await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol.upper())
        if symbol.upper() not in manager.active_connections:
            await stock_provider.stop_real_time_feed(symbol.upper())

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)