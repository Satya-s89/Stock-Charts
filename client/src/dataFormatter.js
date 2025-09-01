// Data formatting utilities for Lightweight Charts

export const formatCandlestickData = (rawData) => {
  return rawData.map(item => ({
    time: item.time,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close)
  }));
};

export const formatRealtimeData = (tradeData, currentCandle) => {
  const price = parseFloat(tradeData.price);
  const timestamp = new Date(tradeData.timestamp).toISOString().split('T')[0];
  
  if (currentCandle && currentCandle.time === timestamp) {
    return {
      time: timestamp,
      open: currentCandle.open,
      high: Math.max(currentCandle.high, price),
      low: Math.min(currentCandle.low, price),
      close: price
    };
  } else {
    return {
      time: timestamp,
      open: price,
      high: price,
      low: price,
      close: price
    };
  }
};

export const formatLineData = (values, timestamps) => {
  return values.map((value, index) => ({
    time: timestamps[index],
    value: parseFloat(value)
  }));
};