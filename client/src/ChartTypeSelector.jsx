import React from 'react';

/**
 * Chart Type Selector Component
 * Provides dropdown for switching between different chart types
 */
const ChartTypeSelector = ({ chartType, onChartTypeChange }) => {
  const chartTypes = [
    { id: 'candlestick', label: 'Candlestick', icon: '🕯️' },
    { id: 'line', label: 'Line', icon: '📈' },
    { id: 'bar', label: 'Bar', icon: '📊' },
    { id: 'area', label: 'Area', icon: '🏔️' }
  ];

  return (
    <div className="chart-type-selector">
      <select 
        value={chartType} 
        onChange={(e) => onChartTypeChange(e.target.value)}
        className="chart-type-dropdown"
      >
        {chartTypes.map(type => (
          <option key={type.id} value={type.id}>
            {type.icon} {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChartTypeSelector;