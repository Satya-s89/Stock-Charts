import { useState, useEffect, useRef } from 'react';
import type { WebSocketMessage } from '../types';

export const useWebSocket = (symbol: string, timeframe: string = '1D') => {
  const [data, setData] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    // Extract actual symbol from combined string
    const actualSymbol = symbol.includes('_') ? symbol.split('_')[0] : symbol;
    
    // Fetch historical data via REST API
    const fetchHistoricalData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/historical_data?symbol=${actualSymbol}&timeframe=${timeframe}`);
        if (response.ok) {
          const historicalData = await response.json();
          setData(historicalData);
        }
      } catch (err) {
        setError('Failed to fetch historical data');
      }
    };

    fetchHistoricalData();

    const connect = () => {
      try {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
        const ws = new WebSocket(`${wsUrl}/ws/${actualSymbol}?timeframe=${timeframe}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setData(message);
          } catch (err) {
            setError('Failed to parse message');
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
        };

        ws.onerror = () => {
          setError('WebSocket connection failed');
          setIsConnected(false);
        };
      } catch (err) {
        setError('Failed to connect to WebSocket');
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, timeframe]);

  return { data, isConnected, error };
};