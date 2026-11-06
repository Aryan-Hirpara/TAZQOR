import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-transparent w-full print:block print:min-h-0 print:bg-white">
      {/* Desktop Persistent Left Floating Rail */}
      <Suspense fallback={<div className="hidden md:block w-[72px] h-screen sticky top-0 shrink-0" />}>
        <div className="print:hidden">
          <Sidebar />
        </div>
      </Suspense>

      {/* Main Content Canvas:
          Desktop: cards start at exact x=87 (72px rail + 15px pl), balanced 24px right padding (md:pr-6)
          Mobile: equal px-4 sm:px-6 padding, full width, safe bottom padding for floating bottom nav */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full md:pl-[15px] md:pr-6 px-4 sm:px-6 print:p-0 print:m-0 print:w-full print:max-w-none print:block">
        <main className="flex-1 w-full min-w-0 pb-[calc(110px+env(safe-area-inset-bottom,20px))] md:pb-0 print:p-0 print:m-0 print:w-full print:pb-0">
          <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400 font-light">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={null}>
        <div className="print:hidden">
          <BottomNav />
        </div>
      </Suspense>
    </div>
  );
}
