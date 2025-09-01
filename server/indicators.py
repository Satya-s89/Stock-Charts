"""
Technical Indicators Library
Provides calculation functions for various technical indicators
"""
import numpy as np
import pandas as pd

def calculate_sma(prices, period):
    """Calculate Simple Moving Average"""
    if len(prices) < period:
        return []
    
    sma = []
    for i in range(period - 1, len(prices)):
        avg = sum(prices[i - period + 1:i + 1]) / period
        sma.append(round(avg, 2))
    return sma

def calculate_ema(prices, period):
    """Calculate Exponential Moving Average"""
    if len(prices) < period:
        return []
    
    ema = [prices[0]]
    multiplier = 2 / (period + 1)
    
    for i in range(1, len(prices)):
        ema_value = (prices[i] * multiplier) + (ema[i-1] * (1 - multiplier))
        ema.append(round(ema_value, 2))
    
    return ema

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index"""
    if len(prices) < period + 1:
        return []
    
    gains = []
    losses = []
    
    # Calculate price changes
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        gains.append(max(change, 0))
        losses.append(max(-change, 0))
    
    rsi = []
    
    # Calculate RSI for each period
    for i in range(period - 1, len(gains)):
        avg_gain = sum(gains[i - period + 1:i + 1]) / period
        avg_loss = sum(losses[i - period + 1:i + 1]) / period
        
        if avg_loss == 0:
            rsi.append(100)
        else:
            rs = avg_gain / avg_loss
            rsi_value = 100 - (100 / (1 + rs))
            rsi.append(round(rsi_value, 2))
    
    return rsi

def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """Calculate MACD (Moving Average Convergence Divergence)"""
    if len(prices) < slow_period:
        return {'macd': [], 'signal': [], 'histogram': []}
    
    # Calculate EMAs
    ema_fast = calculate_ema(prices, fast_period)
    ema_slow = calculate_ema(prices, slow_period)
    
    # Calculate MACD line
    macd_line = []
    start_index = slow_period - fast_period
    
    for i in range(len(ema_slow)):
        macd_value = ema_fast[i + start_index] - ema_slow[i]
        macd_line.append(round(macd_value, 4))
    
    # Calculate Signal line (EMA of MACD)
    signal_line = calculate_ema(macd_line, signal_period)
    
    # Calculate Histogram
    histogram = []
    signal_start = len(macd_line) - len(signal_line)
    
    for i in range(len(signal_line)):
        hist_value = macd_line[i + signal_start] - signal_line[i]
        histogram.append(round(hist_value, 4))
    
    return {
        'macd': macd_line,
        'signal': signal_line,
        'histogram': histogram
    }