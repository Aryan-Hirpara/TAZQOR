import React from "react";
import Image from "next/image";

interface TazqorLogoProps {
  className?: string;
  variant?: "auto" | "light" | "dark" | "black";
  height?: number;
  priority?: boolean;
}

/**
 * TAZQOR Official Brand Logo Component
 * Default uses the high-contrast obsidian black text + emerald green leaf logo (/brand/tazqor-logo-black.png)
 * for perfect legibility across all light and ambient backgrounds.
 */
export function TazqorLogo({
  className = "h-7 w-auto",
  variant = "black",
  height = 28,
  priority = false,
}: TazqorLogoProps) {
  if (variant === "light") {
    return (
      <img
        src="/brand/tazqor-logo-trimmed.png"
        alt="TAZQOR"
        className={className}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      />
    );
  }

  if (variant === "dark") {
    return (
      <img
        src="/brand/tazqor-logo-dark.png"
        alt="TAZQOR"
        className={className}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      />
    );
  }

  // Default ("black" or "auto"): High-contrast Obsidian Black text + Emerald leaf
  return (
    <img
      src="/brand/tazqor-logo-black.png"
      alt="TAZQOR"
      className={className}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}

