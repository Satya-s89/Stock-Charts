import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const TopNavbar = ({ stockInfo, onSearch, searchValue, setSearchValue }) => {
  const [isSearchMode, setIsSearchMode] = useState(!stockInfo);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    setLoading(true);
    try {
      await onSearch(searchValue.trim());
      setIsSearchMode(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="top-navbar">
      <div className="navbar-left">
        {isSearchMode || !stockInfo ? (
          <form onSubmit={handleSearch} className="primary-search-container">
            <input
              type="text"
              placeholder="Search stocks (AAPL, RELIANCE, TSLA...)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
              className="primary-search-input"
              disabled={loading}
              autoFocus
            />
            <MagnifyingGlassIcon className="primary-search-icon" />
            {loading && <div className="primary-search-loading">⏳</div>}
          </form>
        ) : (
          <div className="primary-stock-display" onClick={() => setIsSearchMode(true)}>
            <span className="stock-symbol">{stockInfo.symbol}</span>
            <span className="stock-exchange">NMS</span>
            <span className="stock-name">{stockInfo.company_name}</span>
            <span className="current-price">
              {stockInfo.currency}{stockInfo.current_price}
            </span>
            <span className={`price-change ${stockInfo.price_change >= 0 ? 'positive' : 'negative'}`}>
              {stockInfo.price_change >= 0 ? '+' : ''}{stockInfo.price_change} 
              ({stockInfo.price_change >= 0 ? '+' : ''}{stockInfo.percent_change?.toFixed(2)}%)
            </span>
            <MagnifyingGlassIcon className="edit-search-icon" />
          </div>
        )}
      </div>

      <div className="navbar-right">
        <div className="chart-controls">
          <select className="chart-type-select">
            <option value="candlestick">Candlestick</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
          
          <button className="indicators-btn">
            Indicators
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;