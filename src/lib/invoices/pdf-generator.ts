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
 * Pre-loads all <img> elements within the target node to ensure they are fully
 * decoded and available before html2canvas takes a snapshot.
 */
async function preloadImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

/**
 * Renders the printable invoice DOM node into an ultra-sharp, high-definition (300+ DPI)
 * A4 PDF matching the clarity of native vector print (`window.print()`).
 *
 * Highlights:
 * 1. Preloads fonts & images (logo, digital signature) before snapshotting.
 * 2. High-resolution rasterization (scale: 3.5 = ~367 DPI on A4).
 * 3. Lossless PNG compression (zero JPEG mosquito noise, ringing, or blurry fonts).
 * 4. Crisp rectangular frame styling: removes screen drop-shadows and bubble rounded corners,
 *    substituting a clean, professional rectangular border framing the bill.
 * 5. Automatic multi-page pagination support if the bill exceeds a single A4 page.
 */
export async function generateInvoicePdf(
  element: HTMLElement,
  invoiceNumber: string
): Promise<GeneratedInvoicePdf> {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  // 1. Ensure web fonts and embedded images (logo, signature) are fully loaded
  if (typeof document !== "undefined" && (document as any).fonts) {
    try {
      await (document as any).fonts.ready;
    } catch {
      // Non-fatal if font API is unavailable
    }
  }
  await preloadImages(element);

  // 2. High-DPI canvas capture using lossless rendering and clean framing
  const canvas = await html2canvas(element, {
    scale: 3.5, // 3.5x scale on ~800px width yields ~2800px wide canvas (~367 DPI on A4)
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: 1024,
    ignoreElements: (el) =>
      el.classList?.contains("print:hidden") ||
      el.getAttribute("data-html2canvas-ignore") === "true",
    onclone: (clonedDoc) => {
      const clonedEl =
        clonedDoc.getElementById("printable-invoice") ||
        clonedDoc.querySelector(".printable-document");
      if (clonedEl && clonedEl instanceof HTMLElement) {
        // Transform screen card into crisp, professional rectangular invoice sheet
        clonedEl.style.boxShadow = "none";
        clonedEl.style.borderRadius = "0px";
        clonedEl.style.border = "1px solid #d1d5db";
        clonedEl.style.backgroundColor = "#ffffff";
        clonedEl.style.width = "800px";
        clonedEl.style.maxWidth = "800px";
        clonedEl.style.minWidth = "800px";
        clonedEl.style.margin = "0 auto";
        clonedEl.style.padding = "32px 36px";
        (clonedEl.style as any).webkitFontSmoothing = "antialiased";
        (clonedEl.style as any).textRendering = "optimizeLegibility";

        // Hide any elements tagged print:hidden in the cloned tree
        const printHiddenEls = clonedEl.querySelectorAll<HTMLElement>(
          '.print\\:hidden, [class*="print:hidden"]'
        );
        printHiddenEls.forEach((hEl) => {
          hEl.style.display = "none";
        });
      }
    },
  });

  // 3. Lossless PNG data URL (crystal sharp text, zero JPEG artifacts)
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 8; // 8mm professional margin matching print standards
  const printWidth = pageWidth - margin * 2; // 194mm
  const printHeight = (canvas.height * printWidth) / canvas.width;
  const availableHeight = pageHeight - margin * 2; // 281mm

  // 4. Paginate cleanly if the invoice is longer than one A4 page
  if (printHeight <= availableHeight) {
    // Fits cleanly on a single page
    pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight, undefined, "FAST");
  } else {
    // Multi-page slicing
    let heightLeft = printHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, printWidth, printHeight, undefined, "FAST");
    heightLeft -= availableHeight;

    while (heightLeft > 0) {
      position -= availableHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, printWidth, printHeight, undefined, "FAST");
      heightLeft -= availableHeight;
    }
  }

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

