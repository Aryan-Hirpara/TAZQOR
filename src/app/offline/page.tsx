"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#EEEDF4] text-center">
      <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-8 max-w-md border border-white/80 shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <WifiOff className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-normal text-neutral-900">
          You are currently offline
        </h1>
        <p className="text-xs text-neutral-500 font-light leading-relaxed">
          TAZQOR Business Manager is an online-first system. Financial invoicing, stock movements and payments require an active network connection to prevent duplicate entries and maintain database consistency.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}

