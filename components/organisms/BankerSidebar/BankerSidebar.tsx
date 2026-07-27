import React from "react";
import { Icon, IconName } from "@/components/atoms/Icon/Icon";

interface NavItemData {
  label: string;
  icon: IconName;
  href: string;
  badge?: string;
}

const navItems: NavItemData[] = [
  { label: "Dashboard",          icon: "grid",         href: "/bank-officer/dashboard" },
  { label: "VSLA Portfolio",     icon: "users",        href: "/bank-officer/portfolio" },
  { label: "Credit Approvals",   icon: "doc",          href: "/bank-officer/credit-approvals" },
  { label: "Deposits & Ledger",  icon: "wallet",       href: "/bank-officer/deposits" },
  { label: "Risk & Compliance",  icon: "shield-alert", href: "/bank-officer/risk" },
  { label: "Reports & Analytics",icon: "trending-up",  href: "/bank-officer/reports" },
  { label: "Bank Profile",       icon: "user",         href: "/bank-officer/profile" },
];

interface BankerSidebarProps {
  activePath?: string;
  pendingApprovalsCount?: number;
}

export const BankerSidebar: React.FC<BankerSidebarProps> = ({ activePath = "/bank-officer/dashboard", pendingApprovalsCount = 0 }) => {
  return (
    <aside className="w-[236px] shrink-0 bg-gradient-to-b from-[#0B1E3A] to-[#122A4D] text-white px-[14px] py-5 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-white/14 flex items-center justify-center shrink-0">
          <Icon name="logo" className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <div className="text-[14px] font-extrabold tracking-wide">
            VSLA <span className="text-[#5B9CFF]">CONNECT</span>
          </div>
          <div className="text-[9.5px] text-[#9AA6BC] mt-0.5">Banker Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13.2px] font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-white text-[#122A4D] shadow-xs"
                  : "text-[#AEBBD6] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="w-[16.5px] h-[16.5px] shrink-0" />
              <span>{item.label}</span>
              {item.href === "/bank-officer/credit-approvals" && pendingApprovalsCount > 0 && (
                <span className="ml-auto text-[10px] font-extrabold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#DC2626] text-white">
                  {pendingApprovalsCount}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/12 pt-2.5 mt-2">
        <a
          href="/logout"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13.2px] font-semibold text-[#F3A79C] hover:bg-white/10 transition-colors"
        >
          <Icon name="logout" className="w-[16.5px] h-[16.5px] shrink-0" />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
};
