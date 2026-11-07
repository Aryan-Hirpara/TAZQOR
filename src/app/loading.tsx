import { TazqorLogo } from "@/components/brand/TazqorLogo";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#DCD5E5] via-[#D3C7BD] to-[#D5D7CD] p-4 select-none">
      <div className="w-full max-w-[280px] sm:max-w-xs flex flex-col items-center bg-white/65 backdrop-blur-2xl rounded-[32px] p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] animate-in fade-in duration-300">
        {/* Brand Logo */}
        <div className="relative flex items-center justify-center mb-4">
          <TazqorLogo className="h-10 sm:h-11 w-auto object-contain" height={44} variant="black" priority />
        </div>

        {/* Subtitle */}
        <p className="text-[11px] font-medium tracking-wider text-neutral-600 uppercase mb-5">
          Business Manager
        </p>

        {/* Shimmer Progress Track */}
        <div className="w-36 h-1.5 bg-black/10 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/2 bg-[#D7FF00] rounded-full animate-tazqor-shimmer shadow-[0_0_12px_rgba(215,255,0,0.6)]" />
        </div>

        <p className="text-[10px] text-neutral-500 font-light mt-3">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}
