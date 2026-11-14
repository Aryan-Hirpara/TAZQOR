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

/**
 * Renders the printable invoice DOM node into an A4 PDF and returns both
 * the Blob/File (for Web Share or download) and raw Base64 (for email attachment).
 */
export async function generateInvoicePdf(
  element: HTMLElement,
  invoiceNumber: string
): Promise<GeneratedInvoicePdf> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: 1024,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const printWidth = pageWidth - margin * 2;
  const printHeight = (canvas.height * printWidth) / canvas.width;

  pdf.addImage(imgData, "JPEG", margin, margin, printWidth, printHeight);

  const filename = sanitizeInvoiceFilename(invoiceNumber);
  const blob = pdf.output("blob");
  const dataUri = pdf.output("datauristring");
  const base64 = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
  const file = new File([blob], filename, { type: "application/pdf" });

  return {
    blob,
    base64,
    filename,
    file,
    save: () => {
      pdf.save(filename);
    },
  };
}

