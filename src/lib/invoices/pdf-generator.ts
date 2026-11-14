import { formatINRNumber } from "@/lib/formatting/currency";

export interface GeneratedInvoicePdf {
  blob: Blob;
  base64: string;
  filename: string;
  file: File;
  save: () => void;
}

export function sanitizeInvoiceFilename(invoiceNumber: string): string {
  const safeNumber = (invoiceNumber || "Bill").replace(/[/\\?%*:|"<>]/g, "-");
  return `Invoice_${safeNumber}.pdf`;
}

export interface GenerateVectorInvoiceOptions {
  invoice: any;
  copyMode?: "digital" | "print";
  transparentSignUrl?: string | null;
  signatureMeta?: { available: boolean; url?: string | null };
  amountInWords?: string;
  termsList?: string[];
}

/**
 * Converts any web image URL (or data URL) into a Base64 data URL
 * so it can be embedded directly into a jsPDF document.
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    if (!url) return null;
    if (url.startsWith("data:")) return url;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates a 100% pure Vector PDF (matching Ctrl+P / Save as PDF clarity).
 * Text, lines, table borders, and amounts are true mathematical vector paths
 * that never blur or pixelate at any zoom level, while keeping file size under 50KB.
 */
export async function generateVectorInvoicePdf(
  options: GenerateVectorInvoiceOptions
): Promise<GeneratedInvoicePdf> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const {
    invoice,
    copyMode = "digital",
    transparentSignUrl,
    signatureMeta,
    amountInWords,
    termsList,
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Pre-load Brand Logo and Signature
  const [logoData, signData] = await Promise.all([
    fetchImageAsDataUrl("/brand/tazqor-logo-black.png"),
    copyMode === "digital"
      ? fetchImageAsDataUrl(transparentSignUrl || signatureMeta?.url || "")
      : Promise.resolve(null),
  ]);

  // Clean vector outer frame (0.35mm crisp stroke)
  const drawPageFrame = () => {
    doc.setDrawColor(215, 218, 224);
    doc.setLineWidth(0.35);
    doc.roundedRect(10, 10, 190, 277, 2, 2, "S");
  };
  drawPageFrame();

  // 1. Logo (Top Left)
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", 16, 15, 32, 8);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(17, 17, 17);
      doc.text(invoice.business?.name || "TAZQOR", 16, 20);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text(invoice.business?.name || "TAZQOR", 16, 20);
  }

  // Business Info (Below Logo)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);
  doc.text(invoice.business?.name || "TAZQOR", 16, 27.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  let bY = 32;
  const addr = [invoice.business?.address, invoice.business?.city].filter(Boolean).join(", ");
  if (addr) {
    doc.text(addr, 16, bY);
    bY += 4;
  }
  if (invoice.business?.phone) {
    doc.text(`Phone: ${invoice.business.phone}`, 16, bY);
    bY += 4;
  }
  if (invoice.business?.email) {
    doc.text(`Email: ${invoice.business.email}`, 16, bY);
    bY += 4;
  }
  if (invoice.mode === "gst" && invoice.business?.gstin) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(`GSTIN: ${invoice.business.gstin}`, 16, bY);
    doc.setFont("helvetica", "normal");
    bY += 4;
  }

  // 2. Right Side Header (Badges & Invoice Metadata)
  const isGst = invoice.mode === "gst";
  const isDigital = copyMode === "digital";
  const docLabel = isGst ? "TAX INVOICE" : "BILL OF SUPPLY";
  const copyLabel = isDigital ? "Digital Copy" : "Original for Recipient";

  // Mode Badge
  doc.setFillColor(15, 15, 15);
  doc.roundedRect(154, 15, 40, 6, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(docLabel, 174, 19.2, { align: "center" });

  // Copy Badge
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.roundedRect(162, 23, 32, 5, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(75, 85, 99);
  doc.text(copyLabel, 178, 26.5, { align: "center" });

  // Invoice Number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(17, 17, 17);
  doc.text(invoice.invoice_number || "—", 194, 34, { align: "right" });

  // Dates & Supply
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${invoice.date || "—"}`, 194, 38.5, { align: "right" });
  if (invoice.due_date) {
    doc.text(`Due Date: ${invoice.due_date}`, 194, 42.5, { align: "right" });
  }
  if (invoice.place_of_supply) {
    doc.text(`Place of Supply: ${invoice.place_of_supply}`, 194, 46.5, { align: "right" });
  }

  // 3. Section Divider
  const headerDividerY = Math.max(bY, 50);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.25);
  doc.line(16, headerDividerY, 194, headerDividerY);

  // 4. Billed To & Payment Status
  const custY = headerDividerY + 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text("BILLED TO (CUSTOMER)", 16, custY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 17, 17);
  doc.text(invoice.customer?.name || "Customer", 16, custY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  let cLineY = custY + 9.5;
  if (invoice.customer?.contact) {
    doc.text(`Attn: ${invoice.customer.contact}`, 16, cLineY);
    cLineY += 4;
  }
  const cAddr = [invoice.customer?.address, invoice.customer?.city].filter(Boolean).join(", ");
  if (cAddr) {
    doc.text(cAddr, 16, cLineY);
    cLineY += 4;
  }
  if (invoice.customer?.phone) {
    doc.text(`Phone: ${invoice.customer.phone}`, 16, cLineY);
    cLineY += 4;
  }
  if (invoice.customer?.gstin) {
    doc.text(`GSTIN / Code: ${invoice.customer.gstin}`, 16, cLineY);
    cLineY += 4;
  }

  // Payment Status (Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text("PAYMENT STATUS", 194, custY, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  if (invoice.status === "cancelled") {
    doc.setTextColor(156, 163, 175);
    doc.text("CANCELLED", 194, custY + 5.5, { align: "right" });
  } else if (invoice.outstanding <= 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("PAID IN FULL", 194, custY + 5.5, { align: "right" });
  } else {
    doc.setTextColor(225, 29, 72);
    doc.text(
      `BALANCE DUE: Rs. ${formatINRNumber(invoice.outstanding)}`,
      194,
      custY + 5.5,
      { align: "right" }
    );
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Paid: Rs. ${formatINRNumber(invoice.paid_amount)} / Total: Rs. ${formatINRNumber(invoice.grand_total)}`,
    194,
    custY + 10.5,
    { align: "right" }
  );

  const tableStartY = Math.max(cLineY, custY + 16) + 3;
  doc.setDrawColor(229, 231, 235);
  doc.line(16, tableStartY - 3, 194, tableStartY - 3);

  // 5. Line Items Table (Vector Table)
  const items = invoice.items || [];
  const hasIgst = Number(invoice.igst_total || 0) > 0;
  const head = isGst
    ? [
        [
          "Item Description",
          "HSN",
          "Batch",
          "Qty",
          "Rate",
          "Taxable",
          "CGST",
          "SGST",
          ...(hasIgst ? ["IGST"] : []),
          "Total",
        ],
      ]
    : [["Item Description", "HSN", "Batch", "Qty", "Rate", "Total"]];

  const body = items.map((it: any) => {
    const desc = it.sku && it.sku !== "—" ? `${it.name}\n${it.sku}` : it.name;
    if (isGst) {
      const row = [
        desc,
        it.hsn || "—",
        it.batch || "—",
        String(it.quantity || 1),
        `Rs. ${formatINRNumber(it.unit_price)}`,
        `Rs. ${formatINRNumber(it.taxable)}`,
        `Rs. ${formatINRNumber(it.cgst)}`,
        `Rs. ${formatINRNumber(it.sgst)}`,
      ];
      if (hasIgst) {
        row.push(`Rs. ${formatINRNumber(it.igst)}`);
      }
      row.push(`Rs. ${formatINRNumber(it.total)}`);
      return row;
    } else {
      return [
        desc,
        it.hsn || "—",
        it.batch || "—",
        String(it.quantity || 1),
        `Rs. ${formatINRNumber(it.unit_price)}`,
        `Rs. ${formatINRNumber(it.total)}`,
      ];
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 16, right: 16 },
    head,
    body,
    theme: "plain",
    didDrawPage: () => {
      drawPageFrame();
    },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [75, 85, 99],
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      textColor: [17, 24, 39],
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 3,
    },
    columnStyles: isGst
      ? {
          0: { cellWidth: hasIgst ? 40 : 46 },
          1: { cellWidth: 16, font: "courier" },
          2: { cellWidth: 18, font: "courier" },
          3: { cellWidth: 11, halign: "right" },
          4: { cellWidth: 16, halign: "right" },
          5: { cellWidth: 17, halign: "right" },
          6: { cellWidth: 15, halign: "right" },
          7: { cellWidth: 15, halign: "right" },
          ...(hasIgst ? { 8: { cellWidth: 15, halign: "right" } } : {}),
          [hasIgst ? 9 : 8]: { cellWidth: 18, halign: "right", fontStyle: "bold" },
        }
      : {
          0: { cellWidth: 72 },
          1: { cellWidth: 24, font: "courier" },
          2: { cellWidth: 26, font: "courier" },
          3: { cellWidth: 14, halign: "right" },
          4: { cellWidth: 20, halign: "right" },
          5: { cellWidth: 22, halign: "right", fontStyle: "bold" },
        },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.15,
  });

  // 6. Totals Section & Words
  let finalY = (doc as any).lastAutoTable.finalY + 3;
  doc.setDrawColor(229, 231, 235);
  doc.line(16, finalY, 194, finalY);
  finalY += 4;

  // Left: Amount in Words + Notes
  if (amountInWords) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text("Amount in Words:", 16, finalY + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(amountInWords, 16, finalY + 6.5, { maxWidth: 110 });
  }
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    doc.text("Notes:", 16, finalY + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.notes, 16, finalY + 16.5, { maxWidth: 110 });
  }

  // Right: Totals Breakdown
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Taxable Amount:", 145, finalY + 2);
  doc.setTextColor(17, 17, 17);
  doc.text(`Rs. ${formatINRNumber(invoice.subtotal)}`, 194, finalY + 2, { align: "right" });

  let totY = finalY + 6;
  if (Number(invoice.discount_total || 0) > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("Discount:", 145, totY);
    doc.text(`-Rs. ${formatINRNumber(invoice.discount_total)}`, 194, totY, { align: "right" });
    totY += 4.5;
  }
  if (isGst) {
    if (hasIgst) {
      doc.setTextColor(100, 100, 100);
      doc.text("IGST:", 145, totY);
      doc.text(`Rs. ${formatINRNumber(invoice.igst_total)}`, 194, totY, { align: "right" });
      totY += 4.5;
    } else {
      doc.setTextColor(100, 100, 100);
      doc.text("CGST:", 145, totY);
      doc.text(`Rs. ${formatINRNumber(invoice.cgst_total)}`, 194, totY, { align: "right" });
      totY += 4.5;
      doc.text("SGST:", 145, totY);
      doc.text(`Rs. ${formatINRNumber(invoice.sgst_total)}`, 194, totY, { align: "right" });
      totY += 4.5;
    }
  }
  doc.setTextColor(100, 100, 100);
  doc.text("Round off:", 145, totY);
  doc.setTextColor(17, 17, 17);
  doc.text(Number(invoice.round_off || 0).toFixed(2), 194, totY, { align: "right" });
  totY += 3;

  doc.setDrawColor(229, 231, 235);
  doc.line(145, totY, 194, totY);
  totY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 17, 17);
  doc.text("Total Amount:", 145, totY);
  doc.setFontSize(10.5);
  doc.text(`Rs. ${formatINRNumber(invoice.grand_total)}`, 194, totY, { align: "right" });

  finalY = Math.max(totY + 8, finalY + 22);
  doc.setDrawColor(229, 231, 235);
  doc.line(16, finalY, 194, finalY);
  finalY += 4;

  // 7. Terms & Signatory Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text("Terms & Conditions:", 16, finalY + 2);

  const activeTerms =
    termsList && termsList.length > 0
      ? termsList
      : [
          "Unopened and unused products in original sealed packaging may be returned within 7 days.",
          "Products that are opened, unsealed, or tampered with will not be accepted for return.",
          "Original invoice copy must be presented at the time of any return request.",
          "Please verify item quantities upon delivery; shortages must be reported within 24 hours.",
          "All disputes, if any, are subject to Junagadh, Gujarat jurisdiction only.",
        ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  let termY = finalY + 5.5;
  activeTerms.slice(0, 5).forEach((t, i) => {
    doc.text(`${i + 1}. ${t}`, 16, termY, { maxWidth: 115 });
    termY += 3.5;
  });

  // Right: Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`For ${invoice.business?.name || "TAZQOR"}`, 170, finalY + 2, { align: "center" });

  if (isDigital && signData) {
    try {
      doc.addImage(signData, "PNG", 153, finalY + 4, 34, 11);
    } catch {
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      doc.text(invoice.business?.name || "TAZQOR", 170, finalY + 11, { align: "center" });
    }
  } else if (isDigital) {
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(invoice.business?.name || "TAZQOR", 170, finalY + 11, { align: "center" });
  }

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.2);
  doc.line(150, finalY + 17, 190, finalY + 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text("Authorized Signatory", 170, finalY + 20.5, { align: "center" });

  // 8. Statutory Declaration (Bottom)
  doc.setDrawColor(243, 244, 246);
  doc.line(16, 274, 194, 274);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(156, 163, 175);
  const decl = isDigital
    ? "Certified that the particulars given above are true and correct. This is a computer-generated Digital Copy bearing an authorized electronic signature." +
      (invoice.mode === "non_gst" ? " Bill of Supply (Non-GST / Exempt / Unregistered Supply)." : "")
    : "Certified that the particulars given above are true and correct." +
      (invoice.mode === "non_gst" ? " Bill of Supply (Non-GST / Exempt / Unregistered Supply)." : "");

  doc.text(decl, 16, 278, { maxWidth: 155 });
  doc.text("E. & O.E.", 194, 278, { align: "right" });

  const filename = sanitizeInvoiceFilename(invoice.invoice_number);
  const blob = doc.output("blob");
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
  const file = new File([blob], filename, { type: "application/pdf" });

  return {
    blob,
    base64,
    filename,
    file,
    save: () => {
      doc.save(filename);
    },
  };
}

/**
 * Backwards-compatible invoice PDF generator.
 */
export async function generateInvoicePdf(
  elementOrOptions: any,
  invoiceNumber?: string
): Promise<GeneratedInvoicePdf> {
  if (elementOrOptions && typeof elementOrOptions.invoice === "object") {
    return generateVectorInvoicePdf(elementOrOptions);
  }
  throw new Error("generateInvoicePdf requires vector invoice data options.");
}
