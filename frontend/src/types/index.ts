export interface StockData {
  timestamps: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  sma_20?: (number | null)[];
  sma_50?: (number | null)[];
  ema_12?: (number | null)[];
  rsi?: (number | null)[];
}

export interface TradeData {
  type: 'trade';
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface HistoricalData {
  type: 'historical';
  symbol: string;
  timeframe: string;
  data: StockData;
}

export type WebSocketMessage = TradeData | HistoricalData;

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y' | 'All';