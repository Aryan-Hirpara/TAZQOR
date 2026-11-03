"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "glass-sm" | "hero" | "lime" | "black" | "gradient-blue";
  children: React.ReactNode;
  allowScroll?: boolean;
}

export function GlassCard({
  variant = "glass",
  className,
  children,
  allowScroll = false,
  ...props
}: GlassCardProps) {
  const variantStyles = {
    glass: "glass-card",
    "glass-sm": "glass-card-sm",
    hero: "hero-card",
    lime: "lime-card",
    black: "black-card",
    "gradient-blue": "bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white border border-white/10 rounded-[var(--radius-card)] overflow-hidden min-w-0 min-h-0",
  };

  return (
    <div
      data-card="true"
      {...(allowScroll ? { "data-allow-scroll": "true" } : {})}
      className={cn(
        "card-container",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

