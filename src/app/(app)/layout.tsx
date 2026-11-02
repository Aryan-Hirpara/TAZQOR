import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#EEEDF4]">
      {/* Desktop Persistent Left Sidebar */}
      <Suspense fallback={<div className="hidden md:block w-16 bg-[#F6F5FB] h-screen sticky top-0 shrink-0" />}>
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <main className="flex-1 w-full max-w-[1600px] mx-auto">
          <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading...</div>}>
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
