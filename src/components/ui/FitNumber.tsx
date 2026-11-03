"use client";

import React, { useRef, useState, useEffect } from "react";

interface FitNumberProps {
  value: string | number;
  className?: string;
  minFontSize?: number; // in pixels
  maxFontSize?: number; // in pixels (spec: never exceed about 26px at 1440)
  isCurrency?: boolean;
}

/**
 * FitNumber dynamically adjusts font size using ResizeObserver
 * to guarantee that big currency amounts never overflow or clip.
 * Per spec: currency symbol is Light, digits are SemiBold, e.g. "₹ 1,77,349.50".
 * Max font size does not exceed ~26px at 1440.
 */
export function FitNumber({
  value,
  className = "",
  minFontSize = 13,
  maxFontSize = 26,
  isCurrency,
}: FitNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number>(maxFontSize);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    function adjustSize() {
      if (!container || !text) return;

      const availableWidth = container.clientWidth;
      if (availableWidth <= 0) return;

      let currentSize = maxFontSize;
      text.style.fontSize = `${currentSize}px`;

      while (text.scrollWidth > availableWidth && currentSize > minFontSize) {
        currentSize -= 1;
        text.style.fontSize = `${currentSize}px`;
      }

      setFontSize(currentSize);
    }

    adjustSize();

    const observer = new ResizeObserver(() => {
      adjustSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [value, maxFontSize, minFontSize]);

  const strVal = String(value);
  const hasRupee = isCurrency !== false && (strVal.startsWith("₹") || strVal.includes("₹"));
  const digits = hasRupee ? strVal.replace(/^₹\s*/, "") : strVal;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden flex items-baseline min-w-0"
    >
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px` }}
        className={`whitespace-nowrap tracking-tight leading-none transition-[font-size] duration-75 text-neutral-900 ${className}`}
      >
        {hasRupee ? (
          <>
            <span className="font-light text-[0.88em] mr-1">₹</span>
            <span className="font-semibold">{digits}</span>
          </>
        ) : (
          <span className="font-semibold">{strVal}</span>
        )}
      </span>
    </div>
  );
}
