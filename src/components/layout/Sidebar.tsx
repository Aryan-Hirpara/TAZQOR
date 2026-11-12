"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Boxes,
  Wallet,
  BarChart3,
  CalendarCheck,
  Mail,
  Bell,
  LogOut,
  Settings,
} from "lucide-react";
import { RoundIconButton } from "@/components/ui/RoundIconButton";
import { NotificationsPopover } from "@/components/layout/NotificationsPopover";
import { MessagesPopover } from "@/components/layout/MessagesPopover";
import { createClient } from "@/lib/supabase/client";

// Exactly 8 primary navigation items matching reference
const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    async function initUserAndCounts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setUserEmail(user.email);
          const fullName = user.user_metadata?.full_name || user.email?.split("@")[0];
          if (fullName) setUserName(fullName);
        }

        // Fetch mail unread count
        fetch("/api/mail/inbox")
          .then((res) => res.json())
          .then((data) => {
            if (data && Array.isArray(data.messages)) {
              const unread = data.messages.filter((m: any) => m.unread).length;
              setUnreadMessagesCount(unread);
            }
          })
          .catch(() => {});
      } catch {}
    }
    initUserAndCounts();
  }, []);

  const toggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
    setMessagesOpen(false);
    setUserMenuOpen(false);
  };

  const toggleMessages = () => {
    setMessagesOpen((prev) => !prev);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen((prev) => !prev);
    setNotificationsOpen(false);
    setMessagesOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best effort
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className="hidden md:flex flex-col items-center justify-between w-[72px] py-4 select-none bg-transparent shrink-0 z-50"
      style={{
        position: "sticky",
        top: 0,
        height: "100dvh",
      }}
    >
      {/* Top spacer to balance rail at design pitch */}
      <div className="h-2" />

      {/* Nav Group: 42px circles, 45px pitch (gap-[3px]), 8 primary icons */}
      <nav aria-label="Main Navigation" className="flex flex-col items-center gap-[3px]">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <RoundIconButton
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={isActive}
              icon={<Icon className="w-4 h-4" />}
            />
          );
        })}
      </nav>

      {/* Bottom Group: Pinned Mail (red dot), Bell (red dot), User Avatar */}
      <div className="flex flex-col items-center gap-[3px] pb-2 relative z-50">
        {/* Messages / Mail Icon */}
        <RoundIconButton
          icon={<Mail className="w-4 h-4 text-neutral-800" />}
          label="Messages"
          title="Store Communications & Messages"
          hasBadge={unreadMessagesCount > 0}
          isActive={messagesOpen}
          onClick={toggleMessages}
        />

        {/* Notifications / Bell Icon */}
        <RoundIconButton
          icon={<Bell className="w-4 h-4 text-neutral-800" />}
          label="Notifications"
          title="Live Store Alerts & Operational Notifications"
          hasBadge={unreadNotifsCount > 0}
          isActive={notificationsOpen}
          onClick={toggleNotifications}
        />

        {/* 42px User Avatar with Popover */}
        <button
          type="button"
          onClick={toggleUserMenu}
          className="w-[42px] h-[42px] rounded-full bg-black text-[#D7FF00] border border-white/80 flex items-center justify-center text-xs font-semibold cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF00]"
          title="Account Menu"
          aria-expanded={userMenuOpen}
        >
          TQ
        </button>

        {/* Notifications Popover */}
        <NotificationsPopover
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onUnreadCountChange={(count) => setUnreadNotifsCount(count)}
          anchorPosition="sidebar"
        />

        {/* Messages Popover */}
        <MessagesPopover
          isOpen={messagesOpen}
          onClose={() => setMessagesOpen(false)}
          onUnreadCountChange={(count) => setUnreadMessagesCount(count)}
          anchorPosition="sidebar"
        />

        {/* User Account Popover */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div className="absolute left-14 bottom-2 z-50 w-56 p-3 bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-xl space-y-2 text-left">
              <div className="px-1.5 py-1">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                  Signed in as
                </span>
                <span className="text-xs font-semibold text-neutral-900 block truncate">
                  {userName}
                </span>
                <span className="text-[11px] font-light text-neutral-500 block truncate">
                  {userEmail}
                </span>
              </div>

              <div className="pt-1.5 border-t border-neutral-100 flex flex-col gap-1 text-xs">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 font-light transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-normal transition-colors cursor-pointer w-full text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
