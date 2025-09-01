import React, { useState } from 'react';
import StockChart from './StockChart';
import TopNavbar from './components/TopNavbar';
import RightSidebar from './components/RightSidebar';
import axios from 'axios';
import './App.css';

function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [stockInfo, setStockInfo] = useState(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && symbol.trim()) {
      setCurrentSymbol(symbol.trim());
    }
  };

  return (
    <div className="app-container">
      <div className="main-layout">
        <TopNavbar 
          stockInfo={stockInfo}
          onSearch={async (searchSymbol) => {
            try {
              const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/historical?symbol=${searchSymbol}&interval=D`);
              if (response.data) {
                setSymbol(searchSymbol);
                setCurrentSymbol(searchSymbol);
                if (response.data.stock_info) {
                  setStockInfo(response.data.stock_info);
                }
              }
            } catch (error) {
              console.error('Search failed:', error);
              throw error;
            }
          }}
          searchValue={symbol}
          setSearchValue={setSymbol}
        />
        
        <div className="content-area">
          <div className="chart-container">
            <StockChart 
              symbol={currentSymbol} 
              onStockInfoUpdate={setStockInfo}
            />
          </div>
          
          <RightSidebar 
            onStockSelect={(stock) => {
              setSymbol(stock);
              setCurrentSymbol(stock);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;