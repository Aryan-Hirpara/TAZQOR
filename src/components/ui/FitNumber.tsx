"use client";

import React, { useRef, useState, useEffect } from "react";

interface FitNumberProps {
  value: string | number;
  className?: string;
  minFontSize?: number; // in pixels
  maxFontSize?: number; // in pixels
}

/**
 * FitNumber dynamically adjusts font size using ResizeObserver
 * to guarantee that big currency amounts never overflow or clip,
 * even with stress numbers like ₹99,99,99,999.99.
 */
export function FitNumber({
  value,
  className = "",
  minFontSize = 14,
  maxFontSize = 36,
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

      // Start from maxFontSize and reduce until it fits
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

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden flex items-baseline min-w-0"
    >
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px` }}
        className={`whitespace-nowrap tracking-tight leading-none transition-[font-size] duration-75 ${className}`}
      >
        {value}
      </span>
    </div>
  );
}
