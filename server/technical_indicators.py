"""
Advanced Technical Indicators Calculator
High-performance calculations using pandas and numpy
"""
import pandas as pd
import numpy as np

def calculate_sma_advanced(data, period):
    """Calculate Simple Moving Average with pandas efficiency"""
    if len(data) < period:
        return []
    
    df = pd.DataFrame(data)
    sma = df['close'].rolling(window=period).mean()
    
    result = []
    for i, value in enumerate(sma):
        if not pd.isna(value):
            result.append({
                'time': data[i]['time'],
                'value': round(float(value), 2)
            })
    
    return result

def calculate_ema_advanced(data, period):
    """Calculate Exponential Moving Average"""
    if len(data) < period:
        return []
    
    df = pd.DataFrame(data)
    ema = df['close'].ewm(span=period).mean()
    
    result = []
    for i, value in enumerate(ema):
        result.append({
            'time': data[i]['time'],
            'value': round(float(value), 2)
        })
    
    return result

def calculate_rsi_advanced(data, period=14):
    """Calculate Relative Strength Index"""
    if len(data) < period + 1:
        return []
    
    df = pd.DataFrame(data)
    delta = df['close'].diff()
    
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    result = []
    for i, value in enumerate(rsi):
        if not pd.isna(value):
            result.append({
                'time': data[i]['time'],
                'value': round(float(value), 2)
            })
    
    return result

def calculate_macd_advanced(data, fast=12, slow=26, signal=9):
    """Calculate MACD with signal line and histogram"""
    if len(data) < slow:
        return {'macd': [], 'signal': [], 'histogram': []}
    
    df = pd.DataFrame(data)
    
    ema_fast = df['close'].ewm(span=fast).mean()
    ema_slow = df['close'].ewm(span=slow).mean()
    
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal).mean()
    histogram = macd_line - signal_line
    
    macd_data = []
    signal_data = []
    histogram_data = []
    
    for i, (macd_val, signal_val, hist_val) in enumerate(zip(macd_line, signal_line, histogram)):
        if not pd.isna(macd_val):
            macd_data.append({
                'time': data[i]['time'],
                'value': round(float(macd_val), 4)
            })
        
        if not pd.isna(signal_val):
            signal_data.append({
                'time': data[i]['time'],
                'value': round(float(signal_val), 4)
            })
        
        if not pd.isna(hist_val):
            histogram_data.append({
                'time': data[i]['time'],
                'value': round(float(hist_val), 4)
            })
    
    return {
        'macd': macd_data,
        'signal': signal_data,
        'histogram': histogram_data
    }

def calculate_bollinger_bands(data, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    if len(data) < period:
        return {'upper': [], 'middle': [], 'lower': []}
    
    df = pd.DataFrame(data)
    
    middle = df['close'].rolling(window=period).mean()
    std = df['close'].rolling(window=period).std()
    
    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)
    
    upper_data = []
    middle_data = []
    lower_data = []
    
    for i, (u, m, l) in enumerate(zip(upper, middle, lower)):
        if not pd.isna(u):
            upper_data.append({
                'time': data[i]['time'],
                'value': round(float(u), 2)
            })
            middle_data.append({
                'time': data[i]['time'],
                'value': round(float(m), 2)
            })
            lower_data.append({
                'time': data[i]['time'],
                'value': round(float(l), 2)
            })
    
    return {
        'upper': upper_data,
        'middle': middle_data,
        'lower': lower_data
    }