import { useState } from 'react';
import { useIndicators } from '../hooks/useIndicators';

interface TechnicalIndicatorsProps {
  onIndicatorToggle: (indicator: string, enabled: boolean, data?: any) => void;
  symbol: string;
  timeframe: string;
}

export const TechnicalIndicators = ({ onIndicatorToggle, symbol, timeframe }: TechnicalIndicatorsProps) => {
  const [indicators, setIndicators] = useState({
    sma_20: false,
    sma_50: false,
    ema_12: false,
    rsi: false,
  });
  const { fetchIndicator } = useIndicators();

  const handleToggle = async (indicator: string) => {
    const newState = !indicators[indicator as keyof typeof indicators];
    setIndicators(prev => ({ ...prev, [indicator]: newState }));
    
    if (newState) {
      // Fetch indicator data when enabling
      const [type, periodStr] = indicator.split('_');
      let period = parseInt(periodStr);
      
      // Default periods for indicators without explicit period
      if (isNaN(period)) {
        period = type === 'rsi' ? 14 : type === 'ema' ? 12 : 20;
      }
      
      const data = await fetchIndicator(symbol, type, period, timeframe);
      onIndicatorToggle(indicator, newState, data);
    } else {
      onIndicatorToggle(indicator, newState);
    }
  };

  return (
    <div>
      <h3 className="text-white font-medium mb-4">Indicators</h3>
      <div className="space-y-1">
        <button
          onClick={() => handleToggle('sma_20')}
          className={`w-full px-3 py-2 text-sm text-left ${
            indicators.sma_20 
              ? 'bg-white text-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          SMA 20
        </button>
        <button
          onClick={() => handleToggle('sma_50')}
          className={`w-full px-3 py-2 text-sm text-left ${
            indicators.sma_50 
              ? 'bg-white text-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          SMA 50
        </button>
        <button
          onClick={() => handleToggle('ema_12')}
          className={`w-full px-3 py-2 text-sm text-left ${
            indicators.ema_12 
              ? 'bg-white text-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          EMA 12
        </button>
        <button
          onClick={() => handleToggle('rsi')}
          className={`w-full px-3 py-2 text-sm text-left ${
            indicators.rsi 
              ? 'bg-white text-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          RSI
        </button>
      </div>
    </div>
  );
};