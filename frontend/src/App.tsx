import { useState, useEffect } from 'react';
import { StockChart } from './components/StockChart';
import { UnifiedSearch } from './components/SearchInput';
import { TimeframeSelector } from './components/TimeframeSelector';
import { TechnicalIndicators } from './components/TechnicalIndicators';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useWebSocket } from './hooks/useWebSocket';
import type { StockData, TradeData, Timeframe } from './types';

function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

  const { data, isConnected, error } = useWebSocket(`${symbol}_${timeframe}`, timeframe);

  useEffect(() => {
    if (data) {
      if (data.type === 'historical') {
        // Validate data before setting
        if (data.data && data.data.timestamps && data.data.timestamps.length > 0) {
          console.log(`Received ${data.data.timestamps.length} data points for ${data.symbol} (${data.timeframe})`);
          setStockData(data.data);
          setIsLoading(false);
        } else {
          console.error('Invalid historical data received');
          setIsLoading(false);
        }
      } else if (data.type === 'trade' || data.type === 'realtime') {
        setTrades(prev => [...prev.slice(-99), data]);
      }
    }
  }, [data]);

  useEffect(() => {
    setIsLoading(true);
    setStockData(null);
    setTrades([]);
  }, [symbol, timeframe]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  const handleIndicatorToggle = (indicator: string, enabled: boolean, data?: any) => {
    if (enabled) {
      setActiveIndicators(prev => [...prev, indicator]);
      // Store indicator data for chart display
      if (data && stockData) {
        setStockData(prev => prev ? {
          ...prev,
          [indicator]: data.values
        } : null);
      }
    } else {
      setActiveIndicators(prev => prev.filter(i => i !== indicator));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Top Navigation */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Stock Information */}
          <div className="flex items-center gap-6">
            <span className="text-2xl font-semibold text-white">{symbol}</span>
            <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-6">
            <TimeframeSelector 
              selectedTimeframe={timeframe} 
              onTimeframeChange={setTimeframe} 
            />
            <UnifiedSearch onSymbolChange={handleSymbolChange} currentSymbol={symbol} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Chart Area */}
        <main className="flex-1 bg-black">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : (
            <StockChart data={stockData} trades={trades} symbol={symbol} timeframe={timeframe} activeIndicators={activeIndicators} />
          )}
        </main>

        {/* Controls Sidebar */}
        <aside className="w-64 bg-gray-900 border-l border-gray-700 p-4">
          <TechnicalIndicators 
            onIndicatorToggle={handleIndicatorToggle} 
            symbol={symbol}
            timeframe={timeframe}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;