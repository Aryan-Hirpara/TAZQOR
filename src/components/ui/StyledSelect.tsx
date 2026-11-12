"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StyledSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const StyledSelect = React.forwardRef<HTMLSelectElement, StyledSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative min-w-0 w-full", wrapperClassName)}>
        <select
          ref={ref}
          {...props}
          className={cn(
            "w-full min-w-0 appearance-none truncate rounded-full bg-white/90 border border-black/10 pl-4 pr-9 py-2.5 text-sm font-medium text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:opacity-50",
            className
          )}
        >
          {children}
        </select>
        <ChevronDown
          className="w-4 h-4 text-neutral-500 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0"
          aria-hidden="true"
        />
      </div>
    );
  }
);

StyledSelect.displayName = "StyledSelect";

