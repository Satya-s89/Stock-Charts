import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData } from 'lightweight-charts';
import type { StockData, TradeData } from '../types';

interface StockChartProps {
  data: StockData | null;
  trades: TradeData[];
  symbol: string;
  timeframe: string;
  activeIndicators: string[];
}

export const StockChart = ({ data, trades, symbol, timeframe, activeIndicators }: StockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear existing chart safely
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // Chart already disposed
      }
    }
    indicatorSeriesRef.current.clear();

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#000000' },
        textColor: '#9CA3AF',
        fontSize: 11,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: '#1F2937', style: 2, visible: true },
        horzLines: { color: '#1F2937', style: 2, visible: true },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758BFD',
          width: 1,
          style: 3,
          labelBackgroundColor: '#758BFD',
        },
        horzLine: {
          color: '#758BFD',
          width: 1,
          style: 3,
          labelBackgroundColor: '#758BFD',
        },
      },
      rightPriceScale: {
        borderColor: '#374151',
        textColor: '#9CA3AF',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#374151',
        textColor: '#9CA3AF',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00D4AA',
      downColor: '#FF6B6B',
      borderVisible: false,
      wickUpColor: '#00D4AA',
      wickDownColor: '#FF6B6B',
      borderUpColor: '#00D4AA',
      borderDownColor: '#FF6B6B',
      wickVisible: true,
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#758BFD',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      base: 0,
    });

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          // Chart already disposed
        }
        chartRef.current = null;
      }
    };
  }, []);



  useEffect(() => {
    if (!data || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const candlestickData: CandlestickData[] = data.timestamps.map((timestamp, index) => ({
      time: timestamp,
      open: data.open[index],
      high: data.high[index],
      low: data.low[index],
      close: data.close[index],
    }));

    const volumeData: HistogramData[] = data.timestamps.map((timestamp, index) => ({
      time: timestamp,
      value: data.volume[index],
      color: data.close[index] >= data.open[index] ? '#00D4AA40' : '#FF6B6B40',
    }));

    candlestickSeriesRef.current.setData(candlestickData);
    volumeSeriesRef.current.setData(volumeData);
    
    // Fit chart content to show all data from start to end
    chartRef.current.timeScale().fitContent();
    
    // Clear existing indicators
    indicatorSeriesRef.current.forEach((series, key) => {
      if (chartRef.current) {
        chartRef.current.removeSeries(series);
      }
    });
    indicatorSeriesRef.current.clear();
    
    // Add active indicators
    if (chartRef.current) {
      if (data.sma_20 && activeIndicators.includes('sma_20')) {
        const series = chartRef.current.addLineSeries({ color: '#2196F3', lineWidth: 2 });
        const seriesData = data.timestamps.map((timestamp, index) => ({
          time: timestamp,
          value: data.sma_20![index],
        })).filter(item => item.value !== null);
        series.setData(seriesData);
        indicatorSeriesRef.current.set('sma_20', series);
      }
      
      if (data.sma_50 && activeIndicators.includes('sma_50')) {
        const series = chartRef.current.addLineSeries({ color: '#FF9800', lineWidth: 2 });
        const seriesData = data.timestamps.map((timestamp, index) => ({
          time: timestamp,
          value: data.sma_50![index],
        })).filter(item => item.value !== null);
        series.setData(seriesData);
        indicatorSeriesRef.current.set('sma_50', series);
      }
      
      if (data.ema_12 && activeIndicators.includes('ema_12')) {
        const series = chartRef.current.addLineSeries({ color: '#9C27B0', lineWidth: 2 });
        const seriesData = data.timestamps.map((timestamp, index) => ({
          time: timestamp,
          value: data.ema_12![index],
        })).filter(item => item.value !== null);
        series.setData(seriesData);
        indicatorSeriesRef.current.set('ema_12', series);
      }
      
      if (data.rsi && activeIndicators.includes('rsi')) {
        const series = chartRef.current.addLineSeries({ color: '#4CAF50', lineWidth: 1, priceScaleId: 'rsi' });
        chartRef.current.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        const seriesData = data.timestamps.map((timestamp, index) => ({
          time: timestamp,
          value: data.rsi![index],
        })).filter(item => item.value !== null);
        series.setData(seriesData);
        indicatorSeriesRef.current.set('rsi', series);
      }
    }
  }, [data, activeIndicators]);

  useEffect(() => {
    if (!trades.length || !candlestickSeriesRef.current) return;

    const latestTrade = trades[trades.length - 1];
    candlestickSeriesRef.current.update({
      time: Math.floor(latestTrade.timestamp / 1000),
      open: latestTrade.price,
      high: latestTrade.price,
      low: latestTrade.price,
      close: latestTrade.price,
    });
  }, [trades]);

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};