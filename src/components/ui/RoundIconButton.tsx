"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RoundIconButtonProps {
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  hasBadge?: boolean;
  badgeCount?: number;
  icon: React.ReactNode;
  label?: string;
  className?: string;
  title?: string;
  variant?: "glass" | "rail" | "black" | "lime";
}

export function RoundIconButton({
  href,
  onClick,
  isActive = false,
  hasBadge = false,
  icon,
  label,
  className,
  title,
  variant = "rail",
}: RoundIconButtonProps) {
  // Exact Spec: 42px circles, #E3E0EA, active = #000, zero drop shadows
  const baseClass = cn(
    "relative flex items-center justify-center w-[42px] h-[42px] rounded-full transition-all group shrink-0 select-none outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF00]",
    isActive
      ? "bg-[#000000] text-white scale-100"
      : variant === "black"
      ? "bg-[#000000] text-white hover:scale-105 active:scale-95"
      : variant === "lime"
      ? "bg-[#D7FF00] text-black hover:scale-105 active:scale-95"
      : "bg-[#E3E0EA] hover:bg-white text-neutral-800 hover:text-black border border-white/50",
    className
  );

  const content = (
    <>
      {icon}
      {hasBadge && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-1 ring-white" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} title={title || label} className={baseClass}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      className={baseClass}
    >
      {content}
    </button>
  );
}
