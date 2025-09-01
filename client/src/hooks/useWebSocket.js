/**
 * WebSocket Hook for Real-time Stock Data
 */
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (symbol, onPriceUpdate) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    // Simple WebSocket connection (install socket.io-client: npm install socket.io-client)
    const connectWebSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        
        socketRef.current = io('http://localhost:5000', {
          transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
          console.log('WebSocket connected');
          setConnected(true);
          setError(null);
          
          // Subscribe to symbol updates
          socketRef.current.emit('subscribe', { symbol });
        });

        socketRef.current.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setConnected(false);
        });

        socketRef.current.on('stock_update', (data) => {
          if (onPriceUpdate && data.data && data.data.length > 0) {
            const update = data.data[0];
            onPriceUpdate({
              symbol: update.s,
              price: update.p,
              volume: update.v,
              timestamp: update.t
            });
          }
        });

        socketRef.current.on('error', (error) => {
          console.error('WebSocket error:', error);
          setError(error.message);
        });

      } catch (err) {
        console.error('Failed to load socket.io-client:', err);
        setError('WebSocket not available');
      }
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [symbol, onPriceUpdate]);

  const subscribe = (newSymbol) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('subscribe', { symbol: newSymbol });
    }
  };

  return {
    connected,
    error,
    subscribe
  };
};