export interface CropBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Removes light/gray paper background from an opaque signature RGBA buffer
 * and computes tight bounding-box crop coordinates around the ink strokes.
 */
export function convertSignaturePixelsToTransparentInk(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): CropBounds | null {
  const totalPixels = width * height;
  if (totalPixels <= 0) return null;

  // Detect whether the source image already has a transparent channel
  let transparentCount = 0;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 20) transparentCount += 1;
  }
  const alreadyTransparent = transparentCount / totalPixels > 0.02;

  if (alreadyTransparent) {
    // Strip faint semi-transparent paper haze/dust from pre-cut PNGs while preserving stroke edges
    for (let i = 0; i < rgba.length; i += 4) {
      const a = rgba[i + 3];
      if (a === 0) continue;
      const lum = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
      if (a < 55 || (lum > 185 && a < 140)) {
        rgba[i + 3] = 0;
      }
    }
  } else {
    // Build luminance histogram to estimate the dominant paper background brightness
    const hist = new Uint32Array(256);
    for (let i = 0; i < rgba.length; i += 4) {
      const lum = Math.round(0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]);
      hist[Math.min(255, Math.max(0, lum))] += 1;
    }

    // 70th percentile luminance reliably represents the paper surface under uneven lighting
    const targetRank = Math.floor(totalPixels * 0.7);
    let cumulative = 0;
    let paperLum = 200;
    for (let l = 0; l < 256; l++) {
      cumulative += hist[l];
      if (cumulative >= targetRank) {
        paperLum = l;
        break;
      }
    }

    const cutThreshold = Math.max(40, paperLum - 26);
    const fullInkThreshold = Math.max(10, paperLum - 64);
    const transitionSpan = Math.max(12, cutThreshold - fullInkThreshold);

    for (let i = 0; i < rgba.length; i += 4) {
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum >= cutThreshold) {
        rgba[i + 3] = 0;
        continue;
      }

      // Smoothly ramp opacity across stroke anti-aliasing edges and deepen ink contrast
      const strength = Math.min(1, Math.max(0, (cutThreshold - lum) / transitionSpan));
      const newAlpha = Math.round(Math.pow(strength, 0.85) * 255);
      rgba[i] = Math.round(Math.min(r, 24));
      rgba[i + 1] = Math.round(Math.min(g, 32));
      rgba[i + 2] = Math.round(Math.min(b, 48));
      rgba[i + 3] = newAlpha;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (alpha >= 55) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const sidePad = 2;
  const bottomPad = 0;
  return {
    minX: Math.max(0, minX - sidePad),
    minY: Math.max(0, minY - sidePad),
    maxX: Math.min(width - 1, maxX + sidePad),
    maxY: Math.min(height - 1, maxY + bottomPad),
  };
}

/**
 * Loads a signature image URL in the browser, strips its paper background, trims margins,
 * and returns a clean transparent PNG data URL for screen, print, and PDF rendering.
 */
export async function loadTransparentSignatureDataUrl(imageUrl: string): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(null);
          return;
        }

        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = w;
        srcCanvas.height = h;
        const srcCtx = srcCanvas.getContext("2d");
        if (!srcCtx) {
          resolve(null);
          return;
        }

        srcCtx.drawImage(img, 0, 0, w, h);
        const imageData = srcCtx.getImageData(0, 0, w, h);
        const bounds = convertSignaturePixelsToTransparentInk(imageData.data, w, h);
        srcCtx.putImageData(imageData, 0, 0);

        if (!bounds) {
          resolve(null);
          return;
        }

        const cropW = bounds.maxX - bounds.minX + 1;
        const cropH = bounds.maxY - bounds.minY + 1;
        const outCanvas = document.createElement("canvas");
        outCanvas.width = cropW;
        outCanvas.height = cropH;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) {
          resolve(null);
          return;
        }

        outCtx.drawImage(srcCanvas, bounds.minX, bounds.minY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(outCanvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

