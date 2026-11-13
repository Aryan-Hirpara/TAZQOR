import { describe, it, expect } from "vitest";
import {
  DEFAULT_INVOICE_TERMS,
  formatBillCustomerBlock,
  formatBusinessAddressLines,
  formatPlaceOfSupplyWithCode,
  formatWhatsAppShareMessage,
  normalizeWhatsAppDigits,
  splitBatchCodes,
  toIndianCurrencyWords,
} from "@/lib/invoices/bill-format";
import { convertSignaturePixelsToTransparentInk } from "@/lib/invoices/signature-ink";

describe("bill format & Indian invoice helpers", () => {
  it("deduplicates single-customer name so Attn is omitted when identical, while keeping distinct wholesaler contact", () => {
    const single = formatBillCustomerBlock({
      name: "jeel patoliya",
      shop_name: null,
      contact_person: null,
      delivery_address: "vadal , junagadh",
      city: "junagadh",
      district: "junagadh",
      state: "Gujarat",
      pin: "362310",
      phone: "+91 7043189098",
    });

    expect(single.displayName).toBe("jeel patoliya");
    expect(single.attnContact).toBe("");
    expect(single.streetLine).toBe("Vadal");
    expect(single.regionLine).toBe("Junagadh, Gujarat - 362310");
    expect(single.phone).toBe("+91 7043189098");

    const wholesaler = formatBillCustomerBlock({
      shop_name: "Shreeji Provision Store",
      name: "Haresh Bhai",
      contact_person: "Haresh Bhai",
      delivery_address: "Shop 4, Main Bazaar, Rajkot",
      city: "Rajkot",
      district: "Rajkot",
      state: "Gujarat",
      pin: "360001",
    });

    expect(wholesaler.displayName).toBe("Shreeji Provision Store");
    expect(wholesaler.attnContact).toBe("Haresh Bhai");
    expect(wholesaler.streetLine).toBe("Shop 4, Main Bazaar");
    expect(wholesaler.regionLine).toBe("Rajkot, Gujarat - 360001");
  });

  it("formats business address cleanly without trailing commas or duplicate city", () => {
    const biz = formatBusinessAddressLines({
      address_line1: "Railway Station Road , Vadal",
      address_line2: null,
      city: "Junagadh",
      state: "Gujarat",
      pin: "362310",
    });
    expect(biz.streetLine).toBe("Railway Station Road, Vadal");
    expect(biz.regionLine).toBe("Junagadh, Gujarat - 362310");
  });

  it("converts amounts into Indian Rupee words with Lakhs, Crores, and Paise", () => {
    expect(toIndianCurrencyWords(400)).toBe("Indian Rupees Four Hundred Only");
    expect(toIndianCurrencyWords(125450.5)).toBe(
      "Indian Rupees One Lakh Twenty Five Thousand Four Hundred Fifty and Fifty Paise Only"
    );
    expect(toIndianCurrencyWords(10000000)).toBe("Indian Rupees One Crore Only");
    expect(toIndianCurrencyWords(0)).toBe("Indian Rupees Zero Only");
  });

  it("normalizes WhatsApp digits, batch splits, and 5 company return/replacement terms", () => {
    expect(normalizeWhatsAppDigits("9213434001")).toBe("919213434001");
    expect(normalizeWhatsAppDigits("+91 7043189098")).toBe("917043189098");
    expect(splitBatchCodes("STK-1, STK-2")).toEqual(["STK-1", "STK-2"]);
    expect(splitBatchCodes("—")).toEqual([]);
    expect(DEFAULT_INVOICE_TERMS.length).toBe(5);
    expect(DEFAULT_INVOICE_TERMS[0]).toContain("7 days");
    expect(DEFAULT_INVOICE_TERMS[1].toLowerCase()).toContain("opened");
  });

  it("appends Indian state code to Place of Supply cleanly", () => {
    expect(formatPlaceOfSupplyWithCode("Gujarat")).toBe("Gujarat (24)");
    expect(formatPlaceOfSupplyWithCode("Maharashtra")).toBe("Maharashtra (27)");
    expect(formatPlaceOfSupplyWithCode("Gujarat (24)")).toBe("Gujarat (24)");
    expect(formatPlaceOfSupplyWithCode("—")).toBe("—");
  });

  it("strips gray paper background into transparent ink and computes tight crop bounds", () => {
    // 10x10 opaque image: light gray paper (185,185,185) with a 2x2 dark ink mark at (4..5, 4..5)
    const width = 10;
    const height = 10;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const isInk = x >= 4 && x <= 5 && y >= 4 && y <= 5;
        const val = isInk ? 30 : 185;
        rgba[idx] = val;
        rgba[idx + 1] = val;
        rgba[idx + 2] = val;
        rgba[idx + 3] = 255;
      }
    }

    const bounds = convertSignaturePixelsToTransparentInk(rgba, width, height);
    expect(bounds).not.toBeNull();
    // Paper corner must now be transparent
    expect(rgba[3]).toBe(0);
    // Ink pixel at (4,4) must stay opaque dark ink
    const inkAlphaIdx = (4 * width + 4) * 4 + 3;
    expect(rgba[inkAlphaIdx]).toBeGreaterThan(220);
  });

  it("clears faint alpha haze from transparent PNG signatures and crops tightly to the ink baseline", () => {
    const width = 12;
    const height = 12;
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (x >= 3 && x <= 7 && y >= 2 && y <= 5) {
          // Solid ink stroke
          rgba[idx] = 15;
          rgba[idx + 1] = 15;
          rgba[idx + 2] = 20;
          rgba[idx + 3] = 240;
        } else if (y === 11 && x === 11) {
          // Faint residual corner smudge (alpha=30)
          rgba[idx] = 210;
          rgba[idx + 1] = 210;
          rgba[idx + 2] = 210;
          rgba[idx + 3] = 30;
        } else {
          rgba[idx + 3] = 0;
        }
      }
    }

    const bounds = convertSignaturePixelsToTransparentInk(rgba, width, height);
    expect(bounds).toEqual({ minX: 1, minY: 0, maxX: 9, maxY: 5 });
    // Faint corner smudge cleared
    expect(rgba[(11 * width + 11) * 4 + 3]).toBe(0);
  });

  it("formats WhatsApp share message with customer thank-you, purchased items list, and support contact details", () => {
    const lines = formatWhatsAppShareMessage({
      businessName: "TAZQOR",
      businessPhone: "+91 96384 90740",
      businessEmail: "tazqor@gmail.com",
      customerName: "Jeel Domadiya",
      invoiceNumber: "BILL/2026-27/0002",
      invoiceDate: "2026-11-12",
      docLabel: "Bill of Supply",
      grandTotal: 200,
      outstanding: 0,
      status: "finalized",
      items: [
        {
          description: "Dish wash (lemon) 250ml",
          quantity: 2,
          line_total: 100,
        },
        {
          description: "Liquid soap (lavender) 250ml",
          quantity: 1,
          line_total: 100,
        },
      ],
    });

    const msg = lines.join("\n");
    expect(msg).toContain("Dear *Jeel Domadiya*");
    expect(msg).toContain("Thank you for your purchase from *TAZQOR*!");
    expect(msg).toContain("Bill No: *BILL/2026-27/0002*");
    expect(msg).toContain("• Dish wash (lemon) 250ml × 2 (₹100.00)");
    expect(msg).toContain("• Liquid soap (lavender) 250ml × 1 (₹100.00)");
    expect(msg).toContain("*Total Amount:* *₹200.00*");
    expect(msg).toContain("Payment Status: *PAID IN FULL* ✅");
    expect(msg).toContain("For any query or support, please contact us:");
    expect(msg).toContain("📞 Phone: +91 96384 90740");
    expect(msg).toContain("✉️ Email: tazqor@gmail.com");
  });
});

