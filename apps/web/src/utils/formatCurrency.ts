const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

const getFormatter = (currency: string): Intl.NumberFormat => {
  let formatter = CURRENCY_FORMATTERS.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    CURRENCY_FORMATTERS.set(currency, formatter);
  }
  return formatter;
};

export const formatCurrency = (value: string | number, currency = 'ILS'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  try {
    return getFormatter(currency).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
};

export const formatCompact = (value: string | number, currency = 'ILS'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M ${currency}`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K ${currency}`;
  return formatCurrency(num, currency);
};
