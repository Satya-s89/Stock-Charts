import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import IndicatorDropdown from './IndicatorDropdown';
import ChartTypeSelector from './ChartTypeSelector';
import IndicatorToggleButton from './IndicatorToggleButton';
import { fetchIndicatorData, fetchHistoricalData } from './apiService';

const StockChart = ({ symbol, onStockInfoUpdate }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [realTimePrice, setRealTimePrice] = useState(null);
  const chartContainerRef = useRef();
  const chart = useRef();
  const candlestickSeries = useRef();
  const volumeSeries = useRef();
  const indicatorSeries = useRef({});
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('candlestick');
  const [mainSeries, setMainSeries] = useState(null);
  const [showVolume, setShowVolume] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [stockInfo, setStockInfo] = useState(null);
  const [activeIndicators, setActiveIndicators] = useState(new Set());
  const [indicatorLoading, setIndicatorLoading] = useState(new Set());
  const [chartData, setChartData] = useState([]);
  
  const getTimeframeParams = (tf) => {
    switch(tf) {
      case '1W': return { period: '1y', interval: '1wk' };
      case '1M': return { period: '2y', interval: '1mo' };
      default: return { period: '1y', interval: '1d' };
    }
  };

  useEffect(() => {
    chart.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 500,
      autoSize: true,
      rightPriceScale: {
        autoScale: true,
        entireTextOnly: false,
      },
      layout: {
        backgroundColor: '#0c0e14', // Pure dark background for contrast
        textColor: '#ffffff',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: {
          color: 'rgba(240, 243, 250, 0.02)',
          style: 0,
          visible: true,
        },
        horzLines: {
          color: 'rgba(240, 243, 250, 0.02)',
          style: 0,
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
          labelBackgroundColor: '#1e222d',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#1e222d',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(240, 243, 250, 0.1)',
        textColor: '#ffffff',
        entireTextOnly: false,
        visible: true,
        borderVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
        alignLabels: true,
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      timeScale: {
        borderColor: 'rgba(240, 243, 250, 0.1)',
        textColor: '#ffffff',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      leftPriceScale: {
        visible: false, // Hide left price scale
      },
      timeScale: {
        borderColor: 'rgba(240, 243, 250, 0.1)',
        textColor: '#b2b5be',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      watermark: {
        visible: false, // Remove distracting watermark
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

    candlestickSeries.current = chart.current.addCandlestickSeries({
      upColor: '#00c851',
      downColor: '#ff4757',
      borderVisible: false,
      wickUpColor: '#00c851',
      wickDownColor: '#ff4757',
      borderUpColor: '#00c851',
      borderDownColor: '#ff4757',
      wickVisible: true,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Volume in dedicated separate pane below main chart
    volumeSeries.current = chart.current.addHistogramSeries({
      color: '#00c851',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    // Configure volume pane with visible scale
    chart.current.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: true, // Show volume scale
      alignLabels: false,
      borderVisible: true,
      borderColor: 'rgba(240, 243, 250, 0.1)',
      textColor: '#787b86',
      fontSize: 11,
    });

    // Indicators will be added dynamically

    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
        chart.current.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Set initial size and fit content
    setTimeout(() => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
        chart.current.timeScale().fitContent();
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, []);

  /**
   * Fetch historical data using API service
   */
  const loadHistoricalData = useCallback(async () => {
    setLoading(true);
    try {
      const { interval } = getTimeframeParams(timeframe);
      const data = await fetchHistoricalData(symbol, interval);
      
      // Handle new data structure with stock info
      const historicalData = data.data || data;
      const stockInfo = data.stock_info;
      
      if (stockInfo) {
        setStockInfo(stockInfo);
        if (onStockInfoUpdate) {
          onStockInfoUpdate(stockInfo);
        }
      }
      
      setChartData(historicalData);
      
      // Format data based on chart type
      const formatDataForChart = (data, type) => {
        switch(type) {
          case 'candlestick':
          case 'bar':
            return data.map(item => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close
            }));
          case 'line':
          case 'area':
            return data.map(item => ({
              time: item.time,
              value: item.close
            }));
          default:
            return data.map(item => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close
            }));
        }
      };
      
      const formattedData = formatDataForChart(historicalData, chartType);
      if (mainSeries || candlestickSeries.current) {
        (mainSeries || candlestickSeries.current).setData(formattedData);
      }
      
      if (showVolume && volumeSeries.current) {
        const volumeData = historicalData.map((item, index) => {
          // Ensure exact timestamp and color matching
          const open = parseFloat(item.open);
          const close = parseFloat(item.close);
          const isUp = close >= open;
          
          return {
            time: item.time, // Exact timestamp sync
            value: parseInt(item.volume) || Math.floor(Math.random() * 1000000),
            color: isUp ? '#00c851' : '#ff4757' // Exact candlestick color match
          };
        });
        
        // Ensure data is sorted by time for perfect alignment
        volumeData.sort((a, b) => new Date(a.time) - new Date(b.time));
        volumeSeries.current.setData(volumeData);
      }
      
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, chartType, showVolume, mainSeries, timeframe]);
  
  // Real-time price updates
  const handlePriceUpdate = useCallback((update) => {
    setRealTimePrice(update);
    
    if (onStockInfoUpdate && update.symbol === symbol) {
      onStockInfoUpdate(prev => ({
        ...prev,
        current_price: update.price,
        last_update: new Date().toLocaleTimeString()
      }));
    }
  }, [symbol, onStockInfoUpdate]);

  /**
   * Load indicators from backend API
   */
  const loadIndicators = async (priceData) => {
    for (const indicatorId of selectedIndicators) {
      const series = indicatorSeries.current[indicatorId];
      if (!series) continue;
      
      try {
        let indicatorData = [];
        
        if (indicatorId === 'macd') {
          // MACD requires special handling
          const response = await fetch(`http://localhost:5000/api/indicators?symbol=${symbol}&type=macd`);
          const data = await response.json();
          
          if (response.ok) {
            // MACD line
            const macdData = data.macd.map((value, index) => ({
              time: priceData[index + data.start_index]?.time,
              value: value
            })).filter(item => item.time);
            
            series.setData(macdData);
            
            // Add signal line if exists
            if (indicatorSeries.current['macd_signal']) {
              const signalData = data.signal.map((value, index) => ({
                time: priceData[index + data.start_index + 8]?.time, // signal starts later
                value: value
              })).filter(item => item.time);
              
              indicatorSeries.current['macd_signal'].setData(signalData);
            }
          }
        } else {
          // Other indicators
          const indicatorMap = {
            'sma20': { type: 'sma', period: 20 },
            'sma50': { type: 'sma', period: 50 },
            'ema20': { type: 'ema', period: 20 },
            'rsi': { type: 'rsi', period: 14 }
          };
          
          const config = indicatorMap[indicatorId];
          if (config) {
            const response = await fetch(
              `http://localhost:5000/api/indicators?symbol=${symbol}&type=${config.type}&period=${config.period}`
            );
            const data = await response.json();
            
            if (response.ok) {
              indicatorData = data.values.map((value, index) => ({
                time: priceData[index + data.start_index]?.time,
                value: value
              })).filter(item => item.time);
              
              series.setData(indicatorData);
            }
          }
        }
      } catch (error) {
        console.error(`Error loading ${indicatorId}:`, error);
      }
    }
  };

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  /**
   * Chart type configurations for different series types
   */
  const getSeriesConfig = (type) => {
    const configs = {
      candlestick: {
        type: 'candlestick',
        options: {
          upColor: '#00c851',
          downColor: '#ff4757',
          borderVisible: false,
          wickUpColor: '#00c851',
          wickDownColor: '#ff4757',
        }
      },
      line: {
        type: 'line',
        options: {
          color: '#2962ff',
          lineWidth: 2,
        }
      },
      bar: {
        type: 'bar',
        options: {
          upColor: '#00c851',
          downColor: '#ff4757',
        }
      },
      area: {
        type: 'area',
        options: {
          topColor: 'rgba(41, 98, 255, 0.4)',
          bottomColor: 'rgba(41, 98, 255, 0.0)',
          lineColor: '#2962ff',
          lineWidth: 2,
        }
      }
    };
    return configs[type] || configs.candlestick;
  };

  /**
   * Updates chart series based on selected chart type
   */
  const updateChartSeries = () => {
    if (chart.current) {
      // Remove existing main series
      if (mainSeries) {
        chart.current.removeSeries(mainSeries);
      }
      if (volumeSeries.current) chart.current.removeSeries(volumeSeries.current);
      
      // Remove indicators
      Object.values(indicatorSeries.current).forEach(series => {
        chart.current.removeSeries(series);
      });
      indicatorSeries.current = {};
      
      // Add new main series based on chart type
      const config = getSeriesConfig(chartType);
      let newSeries;
      
      switch(config.type) {
        case 'candlestick':
          newSeries = chart.current.addCandlestickSeries(config.options);
          break;
        case 'line':
          newSeries = chart.current.addLineSeries(config.options);
          break;
        case 'bar':
          newSeries = chart.current.addBarSeries(config.options);
          break;
        case 'area':
          newSeries = chart.current.addAreaSeries(config.options);
          break;
        default:
          newSeries = chart.current.addCandlestickSeries(config.options);
      }
      
      setMainSeries(newSeries);
      candlestickSeries.current = newSeries; // Keep for compatibility
      
      if (showVolume) {
        volumeSeries.current = chart.current.addHistogramSeries({
          color: '#00c851',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        
        chart.current.priceScale('volume').applyOptions({
          visible: false,
          scaleMargins: { top: 0.8, bottom: 0 },
          alignLabels: false,
        });
      }
      
      const indicatorConfigs = {
        sma20: { color: '#4fc3f7', title: 'SMA 20', lineWidth: 2, type: 'overlay' },
        sma50: { color: '#ff6d00', title: 'SMA 50', lineWidth: 2, type: 'overlay' },
        ema20: { color: '#e91e63', title: 'EMA 20', lineWidth: 2, type: 'overlay' },
        rsi: { color: '#9c27b0', title: 'RSI', priceScaleId: 'rsi', lineWidth: 1, type: 'oscillator' },
        macd: { color: '#00bcd4', title: 'MACD', priceScaleId: 'macd', lineWidth: 1, type: 'oscillator' }
      };
      
      selectedIndicators.forEach(indicatorId => {
        const config = indicatorConfigs[indicatorId];
        if (!config) return;
        
        indicatorSeries.current[indicatorId] = chart.current.addLineSeries({
          color: config.color,
          lineWidth: config.lineWidth,
          title: config.title,
          priceScaleId: config.priceScaleId || '',
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lineStyle: 0,
          lineType: 0,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        
        // Configure separate panes for oscillators
        if (config.type === 'oscillator') {
          const scaleId = config.priceScaleId;
          chart.current.priceScale(scaleId).applyOptions({
            scaleMargins: {
              top: indicatorId === 'rsi' ? 0.1 : 0.4,
              bottom: indicatorId === 'rsi' ? 0.7 : 0.1,
            },
          });
          
          // Add signal line for MACD
          if (indicatorId === 'macd') {
            indicatorSeries.current['macd_signal'] = chart.current.addLineSeries({
              color: '#ff9800',
              lineWidth: 1,
              title: 'Signal',
              priceScaleId: 'macd',
              crosshairMarkerVisible: true,
            });
          }
        }
      });
    }
  };
  
  useEffect(() => {
    updateChartSeries();
    loadHistoricalData();
  }, [chartType, showVolume]);
  
  /**
   * Handle indicator toggle with dynamic chart integration
   */
  const handleIndicatorToggle = useCallback(async (indicatorType, isActive) => {
    if (isActive) {
      // Add indicator
      setIndicatorLoading(prev => new Set([...prev, indicatorType]));
      
      try {
        const period = indicatorType.includes('20') ? 20 : 
                      indicatorType.includes('50') ? 50 : 14;
        const type = indicatorType.replace(/\d+/, ''); // Remove numbers
        
        const indicatorData = await fetchIndicatorData(symbol, type, period);
        
        // Add indicator series to chart
        const config = getIndicatorConfig(indicatorType);
        const series = chart.current.addLineSeries({
          color: config.color,
          lineWidth: config.lineWidth,
          title: config.title,
          priceScaleId: config.priceScaleId || '',
          crosshairMarkerVisible: true,
          lastValueVisible: true,
        });
        
        // Set indicator data
        series.setData(indicatorData.data);
        
        // Store series reference
        indicatorSeries.current[indicatorType] = series;
        
        // Configure oscillator panes
        if (config.type === 'oscillator') {
          chart.current.priceScale(config.priceScaleId).applyOptions({
            scaleMargins: {
              top: type === 'rsi' ? 0.1 : 0.4,
              bottom: type === 'rsi' ? 0.7 : 0.1,
            },
          });
        }
        
        setActiveIndicators(prev => new Set([...prev, indicatorType]));
        
      } catch (error) {
        console.error(`Error adding ${indicatorType}:`, error);
      } finally {
        setIndicatorLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(indicatorType);
          return newSet;
        });
      }
    } else {
      // Remove indicator
      const series = indicatorSeries.current[indicatorType];
      if (series) {
        chart.current.removeSeries(series);
        delete indicatorSeries.current[indicatorType];
      }
      
      setActiveIndicators(prev => {
        const newSet = new Set(prev);
        newSet.delete(indicatorType);
        return newSet;
      });
    }
  }, [symbol]);
  
  /**
   * Get indicator configuration
   */
  const getIndicatorConfig = (indicatorType) => {
    const configs = {
      sma20: { color: '#2962ff', title: 'SMA 20', lineWidth: 2, type: 'overlay' },
      sma50: { color: '#ff6d00', title: 'SMA 50', lineWidth: 2, type: 'overlay' },
      ema20: { color: '#e91e63', title: 'EMA 20', lineWidth: 2, type: 'overlay' },
      rsi: { color: '#9c27b0', title: 'RSI', priceScaleId: 'rsi', lineWidth: 1, type: 'oscillator' },
      macd: { color: '#00bcd4', title: 'MACD', priceScaleId: 'macd', lineWidth: 1, type: 'oscillator' }
    };
    return configs[indicatorType] || configs.sma20;
  };

  return (
    <div className="tradingview-container">
      <div className="tv-toolbar">
        <div className="tv-toolbar-left">
          <div className="tv-stock-display">
            <span className="tv-symbol">{stockInfo?.symbol || symbol}</span>
            <span className="tv-exchange">NMS</span>
            <span className="tv-company">{stockInfo?.company_name || 'Apple Inc.'}</span>
            <span className="tv-price">{stockInfo?.currency || '$'}{stockInfo?.current_price || '232.14'}</span>
            <span className={`tv-change ${(stockInfo?.price_change || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stockInfo?.price_change || 0) >= 0 ? '+' : ''}{stockInfo?.price_change || '-1.00'} 
              ({(stockInfo?.percent_change || 0) >= 0 ? '+' : ''}{stockInfo?.percent_change?.toFixed(2) || '-0.43'}%)
            </span>
          </div>
        </div>
        
        <div className="tv-toolbar-center">
          <ChartTypeSelector 
            chartType={chartType}
            onChartTypeChange={setChartType}
          />
          
          <div className="tv-indicators">
            <div className="indicators-container">
              <IndicatorToggleButton
                indicator="sma20"
                label="SMA 20"
                isActive={activeIndicators.has('sma20')}
                onToggle={handleIndicatorToggle}
                loading={indicatorLoading.has('sma20')}
                color="#2962ff"
              />
              <IndicatorToggleButton
                indicator="ema20"
                label="EMA 20"
                isActive={activeIndicators.has('ema20')}
                onToggle={handleIndicatorToggle}
                loading={indicatorLoading.has('ema20')}
                color="#e91e63"
              />
              <IndicatorToggleButton
                indicator="rsi"
                label="RSI"
                isActive={activeIndicators.has('rsi')}
                onToggle={handleIndicatorToggle}
                loading={indicatorLoading.has('rsi')}
                color="#9c27b0"
              />
            </div>
          </div>
          
          <div className="tv-volume-toggle">
            <button 
              className={`tv-chart-btn ${showVolume ? 'active' : ''}`}
              onClick={() => setShowVolume(!showVolume)}
              title="Toggle Volume"
            >
              Vol
            </button>
          </div>
        </div>
        
        <div className="tv-toolbar-right">
          {loading && <div className="tv-loading">Loading...</div>}
          
          <div className="realtime-status">
            <div className="status-indicator connected">
              <div className="status-dot"></div>
            </div>
            <span className="status-text">Live</span>
            {realTimePrice && (
              <span className="realtime-price">
                ${realTimePrice.price}
              </span>
            )}
          </div>
          
          <div className="tv-timeframe">
            <button 
              className={`tv-timeframe-btn ${timeframe === '1D' ? 'active' : ''}`}
              onClick={() => setTimeframe('1D')}
            >
              1D
            </button>
            <button 
              className={`tv-timeframe-btn ${timeframe === '1W' ? 'active' : ''}`}
              onClick={() => setTimeframe('1W')}
            >
              1W
            </button>
            <button 
              className={`tv-timeframe-btn ${timeframe === '1M' ? 'active' : ''}`}
              onClick={() => setTimeframe('1M')}
            >
              1M
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="tv-chart-container"
      />
    </div>
  );
};

export default StockChart;