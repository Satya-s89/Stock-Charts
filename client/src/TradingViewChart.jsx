import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

/**
 * Enhanced TradingView-style Chart Component
 * Provides professional chart styling and interactions
 */
const TradingViewChart = ({ 
  data, 
  chartType, 
  showVolume, 
  indicators,
  symbol,
  onChartReady 
}) => {
  const chartContainerRef = useRef();
  const chart = useRef();
  const series = useRef({});

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with TradingView styling
    chart.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        backgroundColor: '#131722',
        textColor: '#d1d4dc',
        fontSize: 12,
        fontFamily: 'Trebuchet MS, Roboto, Ubuntu, sans-serif',
      },
      grid: {
        vertLines: {
          color: 'rgba(70, 130, 180, 0.1)',
          style: 1,
          visible: true,
        },
        horzLines: {
          color: 'rgba(70, 130, 180, 0.1)',
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: '#485c7b',
        textColor: '#b2b5be',
        entireTextOnly: false,
        visible: true,
        borderVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#485c7b',
        textColor: '#b2b5be',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      watermark: {
        visible: true,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(171, 178, 185, 0.03)',
        text: symbol,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      kineticScroll: {
        mouse: true,
        touch: true,
      },
    });

    // Resize handler
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Notify parent component
    if (onChartReady) {
      onChartReady(chart.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [symbol, onChartReady]);

  return (
    <div 
      ref={chartContainerRef} 
      className="tradingview-chart"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    />
  );
};

export default TradingViewChart;