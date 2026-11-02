/**
 * TAZQOR Money & Calculation Engine
 * 
 * Strict decimal-safe arithmetic using integer paise (1 Rupee = 100 Paise)
 * Prevents IEEE 754 floating-point inaccuracies.
 * All calculations conform to TAZQOR Master Spec §3.1.
 */

export interface LineItemCalculationInput {
  quantity: number; // e.g. 5 or 2.5
  unitPrice: number; // in Rupees
  discountPercent?: number; // e.g. 5 for 5%
  taxRatePercent?: number; // e.g. 18 for 18% GST
  isTaxInclusive?: boolean; // default false
  isInterState?: boolean; // if true, IGST = taxRate; if false, CGST = taxRate/2, SGST = taxRate/2
}

export interface LineItemCalculationResult {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRatePercent: number;
  lineSubtotal: number; // taxable amount before tax
  discountAmount: number;
  taxAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number; // subtotal + tax
}

export interface InvoiceCalculationResult {
  items: LineItemCalculationResult[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  rawTotal: number;
  roundOff: number;
  grandTotal: number;
}

/**
 * Converts Rupees to integer Paise (e.g. 120.50 -> 12050)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts integer Paise to Rupees (e.g. 12050 -> 120.50)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Safe rounding to 2 decimal places
 */
export function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Calculates a single line item
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const qty = Number(input.quantity) || 0;
  const unitPrice = Number(input.unitPrice) || 0;
  const discountPercent = Number(input.discountPercent) || 0;
  const taxRate = Number(input.taxRatePercent) || 0;
  const isInclusive = Boolean(input.isTaxInclusive);
  const isInterState = Boolean(input.isInterState);

  let lineSubtotalPaise = 0;
  let discountPaise = 0;
  let taxPaise = 0;

  if (isInclusive) {
    // If tax inclusive: Line gross = qty * unitPrice
    const grossPaise = Math.round(qty * rupeesToPaise(unitPrice));
    discountPaise = Math.round(grossPaise * (discountPercent / 100));
    const effectiveGrossPaise = grossPaise - discountPaise;
    
    // Taxable base = effectiveGross / (1 + taxRate / 100)
    lineSubtotalPaise = Math.round(effectiveGrossPaise / (1 + taxRate / 100));
    taxPaise = effectiveGrossPaise - lineSubtotalPaise;
  } else {
    // Tax exclusive (standard)
    const rawLinePaise = Math.round(qty * rupeesToPaise(unitPrice));
    discountPaise = Math.round(rawLinePaise * (discountPercent / 100));
    lineSubtotalPaise = rawLinePaise - discountPaise;
    taxPaise = Math.round(lineSubtotalPaise * (taxRate / 100));
  }

  const lineTotalPaise = lineSubtotalPaise + taxPaise;

  // Split CGST / SGST vs IGST
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (taxRate > 0) {
    if (isInterState) {
      igstRate = taxRate;
      igstPaise = taxPaise;
    } else {
      cgstRate = round2(taxRate / 2);
      sgstRate = round2(taxRate / 2);
      cgstPaise = Math.floor(taxPaise / 2);
      sgstPaise = taxPaise - cgstPaise; // balance odd paise to SGST
    }
  }

  return {
    quantity: qty,
    unitPrice: round2(unitPrice),
    discountPercent: round2(discountPercent),
    taxRatePercent: round2(taxRate),
    lineSubtotal: paiseToRupees(lineSubtotalPaise),
    discountAmount: paiseToRupees(discountPaise),
    taxAmount: paiseToRupees(taxPaise),
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount: paiseToRupees(cgstPaise),
    sgstAmount: paiseToRupees(sgstPaise),
    igstAmount: paiseToRupees(igstPaise),
    lineTotal: paiseToRupees(lineTotalPaise),
  };
}

/**
 * Calculates entire invoice with per-line summation and optional nearest-rupee round-off
 */
export function calculateInvoice(
  itemsInput: LineItemCalculationInput[],
  roundOffEnabled = true
): InvoiceCalculationResult {
  const calculatedItems = itemsInput.map(calculateLineItem);

  let subtotalPaise = 0;
  let discountTotalPaise = 0;
  let taxTotalPaise = 0;
  let cgstTotalPaise = 0;
  let sgstTotalPaise = 0;
  let igstTotalPaise = 0;

  for (const item of calculatedItems) {
    subtotalPaise += rupeesToPaise(item.lineSubtotal);
    discountTotalPaise += rupeesToPaise(item.discountAmount);
    taxTotalPaise += rupeesToPaise(item.taxAmount);
    cgstTotalPaise += rupeesToPaise(item.cgstAmount);
    sgstTotalPaise += rupeesToPaise(item.sgstAmount);
    igstTotalPaise += rupeesToPaise(item.igstAmount);
  }

  const rawTotalPaise = subtotalPaise + taxTotalPaise;
  let roundOffPaise = 0;
  let grandTotalPaise = rawTotalPaise;

  if (roundOffEnabled) {
    // Round to nearest Rupee (100 paise)
    const roundedRupees = Math.round(rawTotalPaise / 100);
    grandTotalPaise = roundedRupees * 100;
    roundOffPaise = grandTotalPaise - rawTotalPaise;
  }

  return {
    items: calculatedItems,
    subtotal: paiseToRupees(subtotalPaise),
    discountTotal: paiseToRupees(discountTotalPaise),
    taxTotal: paiseToRupees(taxTotalPaise),
    cgstTotal: paiseToRupees(cgstTotalPaise),
    sgstTotal: paiseToRupees(sgstTotalPaise),
    igstTotal: paiseToRupees(igstTotalPaise),
    rawTotal: paiseToRupees(rawTotalPaise),
    roundOff: paiseToRupees(roundOffPaise),
    grandTotal: paiseToRupees(grandTotalPaise),
  };
}
