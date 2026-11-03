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
  variant?: "glass" | "black" | "lime";
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
  variant = "glass",
}: RoundIconButtonProps) {
  const baseClass = cn(
    "relative flex items-center justify-center w-11 h-11 rounded-full transition-all group shrink-0 select-none",
    isActive
      ? "bg-black text-white shadow-lg scale-100"
      : variant === "black"
      ? "bg-black text-white hover:scale-105 active:scale-95 shadow-md"
      : variant === "lime"
      ? "bg-[#E0FE52] text-black hover:scale-105 active:scale-95 shadow-md"
      : "bg-white/45 hover:bg-white/80 text-neutral-800 hover:text-black border border-white/65 hover:shadow-sm",
    className
  );

  const content = (
    <>
      {icon}
      {hasBadge && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
      )}
      {label && (
        <span className="absolute left-14 px-3 py-1.5 text-xs font-light text-white bg-black/95 rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
          {label}
        </span>
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
