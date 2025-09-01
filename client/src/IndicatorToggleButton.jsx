import React from 'react';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * User-Friendly Indicator Toggle Button
 * Provides clear visual feedback for active/inactive states
 */
const IndicatorToggleButton = ({ 
  indicator, 
  label, 
  isActive, 
  onToggle, 
  loading = false,
  color = '#2962ff'
}) => {
  const handleClick = () => {
    if (!loading) {
      onToggle(indicator, !isActive);
    }
  };

  return (
    <button
      className={`indicator-toggle-btn ${isActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleClick}
      disabled={loading}
      style={{
        '--indicator-color': color
      }}
      title={`${isActive ? 'Hide' : 'Show'} ${label}`}
    >
      <span className="indicator-icon">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : isActive ? (
          <CheckIcon className="hero-icon" />
        ) : (
          <PlusIcon className="hero-icon" />
        )}
      </span>
      <span className="indicator-label">{label}</span>
      {isActive && (
        <div 
          className="indicator-color-dot"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
};

export default IndicatorToggleButton;