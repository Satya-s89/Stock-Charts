"""
Stock Information Service
Fetches real company data and market information
"""
import yfinance as yf

def format_symbol_for_exchange(symbol):
    """Smart symbol formatting for different exchanges"""
    symbol = symbol.upper().strip()
    
    # If already has exchange suffix, return as is
    if '.NS' in symbol or '.BO' in symbol:
        return symbol
    
    # Common US stock symbols - don't add Indian exchange suffix
    us_symbols = {
        'AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 
        'NFLX', 'AMD', 'INTC', 'ORCL', 'CRM', 'ADBE', 'PYPL', 'UBER', 
        'LYFT', 'SNAP', 'TWTR', 'SPOT', 'ZM', 'DOCU', 'SQ', 'SHOP'
    }
    
    if symbol in us_symbols:
        return symbol
    
    # For other symbols, try NSE first (likely Indian stocks)
    return f"{symbol}.NS"

def get_stock_info(symbol):
    """Get comprehensive stock information for global and Indian stocks"""
    try:
        # Smart symbol formatting
        formatted_symbol = format_symbol_for_exchange(symbol)
        ticker = yf.Ticker(formatted_symbol)
        info = ticker.info
        hist = ticker.history(period="2d")
        
        # If NSE fails and it's not a US stock, try BSE
        if hist.empty and '.NS' in formatted_symbol:
            formatted_symbol = symbol.upper() + '.BO'
            ticker = yf.Ticker(formatted_symbol)
            info = ticker.info
            hist = ticker.history(period="2d")
        
        # If still empty and has suffix, try without suffix
        if hist.empty and ('.' in formatted_symbol):
            formatted_symbol = symbol.upper()
            ticker = yf.Ticker(formatted_symbol)
            info = ticker.info
            hist = ticker.history(period="2d")
            
        if hist.empty:
            return None
            
        latest = hist.iloc[-1]
        previous = hist.iloc[-2] if len(hist) > 1 else latest
        
        price_change = latest['Close'] - previous['Close']
        percent_change = (price_change / previous['Close']) * 100
        
        # Determine exchange
        exchange = 'NSE' if '.NS' in formatted_symbol else 'BSE' if '.BO' in formatted_symbol else info.get('exchange', 'NASDAQ')
        
        # Format currency based on exchange
        currency = '₹' if exchange in ['NSE', 'BSE'] else '$'
        
        return {
            'symbol': symbol.upper(),
            'formatted_symbol': formatted_symbol,
            'company_name': info.get('shortName', symbol),
            'exchange': exchange,
            'currency': currency,
            'sector': info.get('sector', ''),
            'industry': info.get('industry', ''),
            'current_price': round(float(latest['Close']), 2),
            'price_change': round(price_change, 2),
            'percent_change': round(percent_change, 2),
            'volume': int(latest['Volume']),
            'avg_volume': info.get('averageVolume', 0),
            'market_cap': info.get('marketCap', 0),
            'pe_ratio': info.get('trailingPE', 0),
            'dividend_yield': info.get('dividendYield', 0),
            'fifty_two_week_high': info.get('fiftyTwoWeekHigh', 0),
            'fifty_two_week_low': info.get('fiftyTwoWeekLow', 0)
        }
    except Exception as e:
        print(f"Error fetching stock info for {symbol}: {e}")
        return None

def format_market_cap(market_cap):
    """Format market cap in readable format"""
    if market_cap >= 1e12:
        return f"${market_cap/1e12:.2f}T"
    elif market_cap >= 1e9:
        return f"${market_cap/1e9:.2f}B"
    elif market_cap >= 1e6:
        return f"${market_cap/1e6:.2f}M"
    else:
        return f"${market_cap:,.0f}"

def format_volume(volume):
    """Format volume in readable format"""
    if volume >= 1e9:
        return f"{volume/1e9:.2f}B"
    elif volume >= 1e6:
        return f"{volume/1e6:.2f}M"
    elif volume >= 1e3:
        return f"{volume/1e3:.2f}K"
    else:
        return f"{volume:,.0f}"