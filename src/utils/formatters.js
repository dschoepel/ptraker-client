import { brandColors } from '../theme';

// =============================================================================
// Formatters
// =============================================================================

// Format a number as USD currency
// 1234567.89 → "$1,234,567.89"
export const formatCurrency = (value, options = {}) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options.decimals ?? 2,
    maximumFractionDigits: options.decimals ?? 2,
    ...options,
  }).format(value);
};

// Format a number as a percentage
// 35.59 → "+35.59%"
export const formatPercent = (value, options = {}) => {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(options.decimals ?? 2)}%`;
};

// Format shares/quantity
// 1569.320000 → "1,569.32"
export const formatShares = (value, decimals = 3) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Get color for a gain/loss value
export const gainLossColor = (value) => {
  if (value === null || value === undefined) return brandColors.neutral;
  if (value > 0) return brandColors.gain;
  if (value < 0) return brandColors.loss;
  return brandColors.neutral;
};

// Format a gain/loss value with color styling
export const formatGainLoss = (value, asPercent = false) => {
  if (value === null || value === undefined) return { text: '—', color: brandColors.neutral };
  const color = gainLossColor(value);
  const text = asPercent ? formatPercent(value) : formatCurrency(value);
  return { text, color };
};

// Format a date string
// "2026-05-15" → "May 15, 2026"
export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

// Format a datetime string
// "2026-05-17T22:27:53Z" → "May 17, 2026 5:27 PM"
export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Map institution key to display name
export const institutionName = (key) => {
  const map = {
    lpl:     'LPL Financial',
    merrill: 'Merrill Lynch',
    schwab:  'Schwab',
    cfcu:    'Community First CU',
    bank:    'Bank',
    manual:  'Manual Entry',
  };
  return map[key?.toLowerCase()] || key || '—';
};

// Map account type to display label
export const accountTypeName = (type) => {
  const map = {
    brokerage:  'Brokerage',
    retirement: 'Retirement',
    checking:   'Checking',
    savings:    'Savings',
    other:      'Other',
  };
  return map[type] || type || '—';
};

// Map asset type to display label
export const assetTypeName = (type) => {
  const map = {
    stock:       'Stock',
    etf:         'ETF',
    mutual_fund: 'Mutual Fund',
    cash:        'Cash',
    other:       'Other',
  };
  return map[type] || type || '—';
};
