import React from 'react';

const RightSidebar = ({ onStockSelect }) => {
  const popularStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: '₹2,456.75', change: '+1.2%' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', price: '₹3,234.50', change: '+0.8%' },
    { symbol: 'INFY', name: 'Infosys Limited', price: '₹1,567.25', change: '-0.5%' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: '₹1,678.90', change: '+2.1%' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: '₹987.45', change: '+1.5%' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: '₹2,345.60', change: '-0.3%' },
    { symbol: 'ITC', name: 'ITC Limited', price: '₹456.78', change: '+0.9%' },
    { symbol: 'SBIN', name: 'State Bank of India', price: '₹567.89', change: '+1.8%' },
  ];

  return (
    <div className="right-sidebar">
      <div className="sidebar-header">
        <h3>Popular Indian Stocks</h3>
      </div>
      
      <div className="stocks-list">
        {popularStocks.map((stock, index) => (
          <div 
            key={index}
            className="stock-item"
            onClick={() => onStockSelect(stock.symbol)}
          >
            <div className="stock-main">
              <span className="stock-symbol">{stock.symbol}</span>
              <span className="stock-price">{stock.price}</span>
            </div>
            <div className="stock-details">
              <span className="stock-name">{stock.name}</span>
              <span className={`stock-change ${stock.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {stock.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightSidebar;