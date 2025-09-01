import React, { useState } from 'react';

const IndicatorDropdown = ({ selectedIndicators, onIndicatorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const indicators = [
    { id: 'sma20', label: 'SMA 20', color: '#2962ff', type: 'overlay' },
    { id: 'sma50', label: 'SMA 50', color: '#ff6d00', type: 'overlay' },
    { id: 'ema20', label: 'EMA 20', color: '#e91e63', type: 'overlay' },
    { id: 'rsi', label: 'RSI (14)', color: '#9c27b0', type: 'oscillator' },
    { id: 'macd', label: 'MACD', color: '#00bcd4', type: 'oscillator' }
  ];

  const handleToggle = (indicatorId) => {
    const newSelected = selectedIndicators.includes(indicatorId)
      ? selectedIndicators.filter(id => id !== indicatorId)
      : [...selectedIndicators, indicatorId];
    onIndicatorChange(newSelected);
  };

  return (
    <div className="indicator-dropdown">
      <button 
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        Indicators ({selectedIndicators.length})
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {indicators.map(indicator => (
            <label key={indicator.id} className="dropdown-item">
              <input
                type="checkbox"
                checked={selectedIndicators.includes(indicator.id)}
                onChange={() => handleToggle(indicator.id)}
              />
              <span style={{ color: indicator.color }}>
                {indicator.label}
              </span>
              <span className="indicator-type">
                {indicator.type === 'oscillator' ? 'OSC' : 'OVL'}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default IndicatorDropdown;