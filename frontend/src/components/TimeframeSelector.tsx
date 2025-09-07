import type { Timeframe } from '../types';

interface TimeframeSelectorProps {
  selectedTimeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

const timeframes: Timeframe[] = ['1D', '1W', '1M', '1Y'];

export const TimeframeSelector = ({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) => {
  return (
    <div className="flex">
      {timeframes.map((timeframe) => (
        <button
          key={timeframe}
          onClick={() => onTimeframeChange(timeframe)}
          className={`px-4 py-2 text-sm font-medium ${
            selectedTimeframe === timeframe
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
};