import { describe, it, expect } from 'vitest';
import { calculateLineItem, calculateInvoice, rupeesToPaise, paiseToRupees } from '@/lib/calculations/money';
import { formatINR } from '@/lib/formatting/currency';

describe('TAZQOR Money Engine', () => {
  it('converts between rupees and paise accurately', () => {
    expect(rupeesToPaise(120.55)).toBe(12055);
    expect(paiseToRupees(12055)).toBe(120.55);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30); // avoids IEEE 754 0.30000000000000004 bug
  });

  it('calculates tax-exclusive line items with CGST & SGST split correctly', () => {
    const item = calculateLineItem({
      quantity: 10,
      unitPrice: 100,
      discountPercent: 10, // 10% discount -> subtotal = 900
      taxRatePercent: 18,  // 18% GST -> 162 total tax (81 CGST + 81 SGST)
      isTaxInclusive: false,
      isInterState: false,
    });

    expect(item.lineSubtotal).toBe(900);
    expect(item.discountAmount).toBe(100);
    expect(item.taxAmount).toBe(162);
    expect(item.cgstAmount).toBe(81);
    expect(item.sgstAmount).toBe(81);
    expect(item.igstAmount).toBe(0);
    expect(item.lineTotal).toBe(1062);
  });

  it('calculates inter-state supply with IGST correctly', () => {
    const item = calculateLineItem({
      quantity: 5,
      unitPrice: 200,
      discountPercent: 0,
      taxRatePercent: 18,
      isTaxInclusive: false,
      isInterState: true,
    });

    expect(item.lineSubtotal).toBe(1000);
    expect(item.taxAmount).toBe(180);
    expect(item.cgstAmount).toBe(0);
    expect(item.sgstAmount).toBe(0);
    expect(item.igstAmount).toBe(180);
    expect(item.lineTotal).toBe(1180);
  });

  it('calculates tax-inclusive line items correctly', () => {
    const item = calculateLineItem({
      quantity: 1,
      unitPrice: 118,
      discountPercent: 0,
      taxRatePercent: 18,
      isTaxInclusive: true,
      isInterState: false,
    });

    // 118 tax inclusive at 18% -> 100 base + 18 tax
    expect(item.lineSubtotal).toBe(100);
    expect(item.taxAmount).toBe(18);
    expect(item.lineTotal).toBe(118);
  });

  it('rounds invoice total to nearest rupee and records round-off', () => {
    // 3 items of 33.33 each with 0% tax -> 99.99 raw total -> rounded to 100.00 (+0.01 round off)
    const inv = calculateInvoice([
      { quantity: 1, unitPrice: 33.33, taxRatePercent: 0 },
      { quantity: 1, unitPrice: 33.33, taxRatePercent: 0 },
      { quantity: 1, unitPrice: 33.33, taxRatePercent: 0 },
    ], true);

    expect(inv.rawTotal).toBe(99.99);
    expect(inv.roundOff).toBe(0.01);
    expect(inv.grandTotal).toBe(100);
  });

  it('formats currency in Indian numbering format', () => {
    const formatted = formatINR(1234567.89);
    expect(formatted).toContain('12,34,567.89');
    expect(formatted).toContain('₹');
  });
});

