import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-transparent w-full overflow-x-hidden">
      {/* Desktop Persistent Left Floating Rail */}
      <Suspense fallback={<div className="hidden md:block w-[72px] h-screen sticky top-0 shrink-0" />}>
        <Sidebar />
      </Suspense>

      {/* Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 pr-4 sm:pr-8 pl-1">
        <main className="flex-1 w-full">
          <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400 font-light">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
