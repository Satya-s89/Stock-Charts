/**
 * Dedicated API Service
 * Encapsulates all backend API calls with error handling
 */

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// In-memory cache for performance optimization
const indicatorCache = new Map();

/**
 * Generate cache key for indicator data
 */
const getCacheKey = (symbol, indicator, period) => {
  return `${symbol}_${indicator}_${period}`;
};

/**
 * Fetch indicator data from backend with caching
 */
export const fetchIndicatorData = async (symbol, indicator, period) => {
  const cacheKey = getCacheKey(symbol, indicator, period);
  
  // Check cache first
  if (indicatorCache.has(cacheKey)) {
    const cached = indicatorCache.get(cacheKey);
    const now = Date.now();
    
    // Cache valid for 5 minutes
    if (now - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    
    // Remove expired cache
    indicatorCache.delete(cacheKey);
  }
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/indicators?symbol=${symbol}&type=${indicator}&period=${period}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    indicatorCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
    
  } catch (error) {
    console.error(`API Error fetching ${indicator} for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Fetch historical stock data
 */
export const fetchHistoricalData = async (symbol, interval = '1d') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/historical?symbol=${symbol}&interval=${interval}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error(`API Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Clear cache for specific symbol or all cache
 */
export const clearCache = (symbol = null) => {
  if (symbol) {
    // Clear cache for specific symbol
    for (const key of indicatorCache.keys()) {
      if (key.startsWith(symbol)) {
        indicatorCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    indicatorCache.clear();
  }
};