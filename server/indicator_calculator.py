"""
Modular & Efficient Indicator Calculator
Uses pandas for high-performance calculations
"""
import pandas as pd
import numpy as np

def calculate_indicators(data, indicator_type, period):
    """
    Calculate technical indicators using pandas for efficiency
    
    Args:
        data: pandas DataFrame with OHLCV data
        indicator_type: str ('sma', 'ema', 'rsi', 'macd')
        period: int (period for calculation)
    
    Returns:
        list: JSON-ready list of dictionaries
    """
    if data.empty:
        return []
    
    result = []
    
    if indicator_type == 'sma':
        # Efficient SMA using pandas rolling mean
        sma_values = data['Close'].rolling(window=period).mean()
        
        for i, (date, value) in enumerate(sma_values.items()):
            if not pd.isna(value):
                result.append({
                    'time': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 2)
                })
    
    elif indicator_type == 'ema':
        # Efficient EMA using pandas ewm
        ema_values = data['Close'].ewm(span=period).mean()
        
        for date, value in ema_values.items():
            result.append({
                'time': date.strftime('%Y-%m-%d'),
                'value': round(float(value), 2)
            })
    
    elif indicator_type == 'rsi':
        # Efficient RSI calculation
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        for date, value in rsi.items():
            if not pd.isna(value):
                result.append({
                    'time': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 2)
                })
    
    elif indicator_type == 'macd':
        # MACD calculation
        ema12 = data['Close'].ewm(span=12).mean()
        ema26 = data['Close'].ewm(span=26).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9).mean()
        histogram = macd_line - signal_line
        
        macd_data = []
        signal_data = []
        histogram_data = []
        
        for date, value in macd_line.items():
            if not pd.isna(value):
                macd_data.append({
                    'time': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 4)
                })
        
        for date, value in signal_line.items():
            if not pd.isna(value):
                signal_data.append({
                    'time': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 4)
                })
        
        for date, value in histogram.items():
            if not pd.isna(value):
                histogram_data.append({
                    'time': date.strftime('%Y-%m-%d'),
                    'value': round(float(value), 4)
                })
        
        return {
            'macd': macd_data,
            'signal': signal_data,
            'histogram': histogram_data
        }
    
    return result