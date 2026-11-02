/**
 * Currency and Number Formatting for TAZQOR
 * Strictly uses en-IN locale with Indian digit grouping (lakhs, crores).
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrNoDecimalsFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrNumberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number | string | null | undefined, hideDecimalsIfZero = false): string {
  const val = Number(amount) || 0;
  if (hideDecimalsIfZero && val % 1 === 0) {
    return inrNoDecimalsFormatter.format(val);
  }
  return inrFormatter.format(val);
}

export function formatINRNumber(amount: number | string | null | undefined): string {
  const val = Number(amount) || 0;
  return inrNumberFormatter.format(val);
}

export function formatQuantity(qty: number | string | null | undefined, unit = ''): string {
  const val = Number(qty) || 0;
  // If whole number, format without decimals, else up to 3 decimals
  const formatted = val % 1 === 0 ? val.toString() : val.toFixed(3).replace(/\.?0+$/, '');
  return unit ? `${formatted} ${unit}` : formatted;
}
