"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/atoms/Icon/Icon";
import { useNotifications } from "@/hooks/useNotifications";

interface NavItemData {
  label: string;
  icon: IconName;
  href: string;
  badge?: string;
}

const navItems: NavItemData[] = [
  { label: "Dashboard",     icon: "grid",             href: "/dashboard" },
  { label: "My Group",      icon: "users",            href: "/my-group" },
  { label: "Contributions", icon: "arrow-down-circle",href: "/contributions" },
  { label: "Loans",         icon: "hand-coin",        href: "/loans" },
  { label: "Withdrawals",   icon: "arrow-up-circle",  href: "/withdrawals" },
  { label: "Savings Goal",  icon: "goal",             href: "/savings-goal" },
  { label: "Messages",      icon: "chat",             href: "/messages" },
  { label: "Documents",     icon: "doc",              href: "/documents" },
  { label: "Notifications", icon: "bell",             href: "/notifications" },
  { label: "AI Assistant",  icon: "sparkle",          href: "/ai-assistant" },
  { label: "Profile",       icon: "user",             href: "/profile" },
  { label: "Support",       icon: "support",          href: "/profile/support" },
];

interface MemberSidebarProps {
  activePath?: string;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({ activePath }) => {
  const pathname = usePathname();
  const { unreadCount } = useNotifications(50);
  const currentPath = activePath ?? pathname ?? "/dashboard";
  return (
    <aside className="w-[246px] shrink-0 bg-gradient-to-b from-[#123A29] to-[#164A34] text-white px-[14px] py-5 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-white/14 flex items-center justify-center shrink-0">
          <Icon name="logo" className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <div className="text-[14.5px] font-extrabold tracking-wide">VSLA CONNECT</div>
          <div className="text-[9.5px] text-[#9FC7B0] mt-0.5">Save Together, Grow Together</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
          const badge = item.href === "/notifications" && unreadCount > 0 ? String(unreadCount) : undefined;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-white text-[#1B5E3F] shadow-xs"
                  : "text-[#C7DED2] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="w-[17px] h-[17px] shrink-0" />
              <span>{item.label}</span>
              {badge && (
                <span className={`ml-auto text-[10px] font-extrabold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white ${isActive ? "bg-[#1B5E3F]" : "bg-[#E8873A]"}`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/12 pt-2.5 mt-2">
        <Link
          href="/logout"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold text-[#F3A79C] hover:bg-white/10 transition-colors"
        >
          <Icon name="logout" className="w-[17px] h-[17px] shrink-0" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
};
