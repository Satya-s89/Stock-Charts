import React from 'react';

/**
 * Popular Indian Stocks Component
 * Quick access to major NSE/BSE stocks
 */
const IndianStocksList = ({ onStockSelect }) => {
  const popularStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries' },
    { symbol: 'TCS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY', name: 'Infosys Limited' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
    { symbol: 'ITC', name: 'ITC Limited' },
    { symbol: 'SBIN', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
    { symbol: 'LT', name: 'Larsen & Toubro' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki' },
    { symbol: 'TITAN', name: 'Titan Company' },
    { symbol: 'WIPRO', name: 'Wipro Limited' }
  ];

  return (
    <div className="indian-stocks-list">
      <h3>Popular Indian Stocks</h3>
      <div className="stocks-grid">
        {popularStocks.map(stock => (
          <button
            key={stock.symbol}
            className="stock-button"
            onClick={() => onStockSelect(stock.symbol)}
            title={stock.name}
          >
            {stock.symbol}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IndianStocksList;