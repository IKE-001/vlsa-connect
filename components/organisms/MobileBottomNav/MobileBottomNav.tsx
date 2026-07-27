"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "@/components/atoms/Icon/Icon";
import { useNotifications } from "@/hooks/useNotifications";

export const MobileBottomNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { unreadCount } = useNotifications(50);

  // Close menu if route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname?.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({ href, icon, label }: { href: string; icon: IconName; label: string }) => {
    const active = isActive(href);
    return (
      <Link href={href} className="flex flex-col items-center gap-1 group relative pb-2 w-16">
        <div className={`transition-all duration-200 flex flex-col items-center justify-center ${active ? "text-[#2D7A52]" : "text-[#94A29C] hover:text-[#5B6B65]"}`}>
          <div className={`relative mb-1 transition-transform duration-200 ${active ? "scale-110" : "group-active:scale-90"}`}>
            <Icon name={icon} className="w-[22px] h-[22px]" />
          </div>
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${active ? "text-[#2D7A52]" : "text-[#94A29C]"}`}>
            {label}
          </span>
        </div>
        {/* Active Indicator Dot */}
        {active && (
          <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#2D7A52] animate-in fade-in slide-in-from-bottom-2 duration-300" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Overlay & Menu Modal */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="relative bg-white w-full rounded-t-[28px] sm:rounded-[24px] sm:w-[360px] pb-28 pt-8 px-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 ease-out">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#EBEFED] rounded-full sm:hidden" />
            
            <h3 className="text-[18px] font-extrabold text-[#1B2321] mb-6 text-center">More Options &amp; Features</h3>
            
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              <Link href="/my-group" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#F1F4F2] text-[#1B2321] flex items-center justify-center group-active:scale-95 transition-all shadow-xs group-hover:bg-[#E3F3EA] group-hover:text-[#2D7A52]">
                  <Icon name="users" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">My Group</span>
              </Link>

              <Link href="/contributions" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="arrow-down-circle" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">Contributions</span>
              </Link>
              
              <Link href="/withdrawals" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#FCEAE9] text-[#DC4B3F] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="arrow-up-circle" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">Withdrawals</span>
              </Link>

              <Link href="/messages" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#E6EEFA] text-[#4A7FC1] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="chat" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">Messages</span>
              </Link>

              <Link href="/documents" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#FCEADC] text-[#E8873A] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="doc" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">Documents</span>
              </Link>

              <Link href="/notifications" className="flex flex-col items-center gap-2 group relative">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="bell" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">Alerts</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 right-1 bg-[#E8873A] border-2 border-white text-white text-[9.5px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">{unreadCount}</span>
                )}
              </Link>

              <Link href="/ai-assistant" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#E8EFFD] text-[#2F6FED] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="sparkle" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">AI Help</span>
              </Link>

              <Link href="/profile/support" className="flex flex-col items-center gap-2 group">
                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#F1ECFE] text-[#8B5CF6] flex items-center justify-center group-active:scale-95 transition-all shadow-xs">
                  <Icon name="support" className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[10.5px] font-bold text-[#5B6B65] text-center leading-tight">Support</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#EBEFED] h-[82px] flex items-start justify-around pt-3 z-50 shadow-[0_-8px_30px_rgba(18,58,41,0.04)]">
        <NavItem href="/dashboard" icon="grid" label="Home" />
        <NavItem href="/savings-goal" icon="layers" label="Savings" />
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`-mt-[34px] w-[56px] h-[56px] rounded-full text-white flex items-center justify-center shadow-[0_8px_20px_rgba(45,122,82,0.4)] border-[4px] border-[#F1F4F2] transition-all duration-300 ${isMenuOpen ? "bg-[#1B2321] rotate-45 shadow-none scale-95" : "bg-gradient-to-tr from-[#123A29] to-[#2D7A52] hover:scale-105 active:scale-95"}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        
        <NavItem href="/loans" icon="wallet" label="Loans" />
        <NavItem href="/profile" icon="user" label="Profile" />
      </nav>
    </>
  );
};
