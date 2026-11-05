import React from "react";
import Image from "next/image";

interface TazqorLogoProps {
  className?: string;
  variant?: "auto" | "light" | "dark";
  height?: number;
  priority?: boolean;
}

/**
 * TAZQOR Official Brand Logo Component
 * Automatically switches between Navy/Green (light surfaces) and White/Green (dark surfaces).
 */
export function TazqorLogo({
  className = "h-7 w-auto",
  variant = "auto",
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

  return (
    <div className="relative inline-flex items-center">
      {/* Light mode (default) */}
      <img
        src="/brand/tazqor-logo-trimmed.png"
        alt="TAZQOR"
        className={`dark:hidden ${className}`}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      />
      {/* Dark mode */}
      <img
        src="/brand/tazqor-logo-dark.png"
        alt="TAZQOR"
        className={`hidden dark:block ${className}`}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      />
    </div>
  );
}
