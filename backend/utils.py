def validate_and_sanitize_stock_data(data_point):
    """Validate and sanitize a single stock data point."""
    required_keys = ['c', 'o', 'h', 'l', 'v', 't']
    
    for key in required_keys:
        if key not in data_point:
            raise ValueError(f"Missing required key: {key}")
    
    try:
        sanitized = {
            'c': float(data_point['c']),
            'o': float(data_point['o']),
            'h': float(data_point['h']),
            'l': float(data_point['l']),
            'v': float(data_point['v']),
            't': int(data_point['t'])
        }
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid data type in stock data: {e}")
    
    return sanitized