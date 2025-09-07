import { useState, useCallback } from 'react';

interface IndicatorData {
  timestamps: number[];
  values: (number | null)[];
}

export const useIndicators = () => {
  const [indicatorData, setIndicatorData] = useState<Record<string, IndicatorData>>({});
  const [loading, setLoading] = useState(false);

  const fetchIndicator = useCallback(async (
    symbol: string, 
    indicatorType: string, 
    period: number, 
    timeframe: string = '1D'
  ) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/indicators?symbol=${symbol}&indicator_type=${indicatorType}&period=${period}&timeframe=${timeframe}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const key = `${indicatorType}_${period}`;
        setIndicatorData(prev => ({
          ...prev,
          [key]: data.data
        }));
        return data.data;
      }
    } catch (error) {
      console.error('Failed to fetch indicator:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  return { indicatorData, fetchIndicator, loading };
};