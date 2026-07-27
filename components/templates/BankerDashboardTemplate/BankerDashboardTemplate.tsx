"use client";

import React, { useState } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { BankerSidebar } from "@/components/organisms/BankerSidebar/BankerSidebar";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { TopGroupsTable } from "@/components/organisms/TopGroupsTable/TopGroupsTable";
import { TransactionRow } from "@/components/molecules/TransactionRow/TransactionRow";
import { BankerGroupSummary, BankerCreditApproval } from "@/hooks/useBanker";

type MobileTab = "dashboard" | "groups" | "members" | "loans" | "reports";

export interface BankerDashboardTemplateProps {
  groups: BankerGroupSummary[];
  approvals: BankerCreditApproval[];
  isLoading: boolean;
}

export const BankerDashboardTemplate: React.FC<BankerDashboardTemplateProps> = ({
  groups,
  approvals,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("dashboard");
  const [activeDateFilter, setActiveDateFilter] = useState("Today, 26 Jul 2026");

  return (
    <div className="min-h-screen bg-[#F2F4F8] font-sans antialiased flex flex-col md:flex-row">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className="hidden md:block">
        <BankerSidebar pendingApprovalsCount={approvals.filter(a => a.status === 'pending').length} />
      </div>

      {/* ===== MAIN COLUMN ===== */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ────── DESKTOP TOPBAR ────── */}
        <header className="hidden md:flex bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#EBEEF4] px-6 py-3.5 items-center justify-between gap-5 shadow-xs">
          <div className="flex-1 max-w-[420px] flex items-center gap-2.5 bg-[#F2F4F8] border border-[#EBEEF4] focus-within:border-[#2F6FED] focus-within:bg-white rounded-[10px] px-3.5 py-2 transition-all">
            <Icon name="search" className="w-4 h-4 text-[#9AA6BC]" />
            <input
              type="text"
              placeholder="Search VSLAs, group codes, officers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] text-[#182233] w-full placeholder:text-[#9AA6BC] font-medium"
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative text-[#5C6B85] cursor-pointer hover:text-[#182233] transition-colors p-1">
              <Icon name="bell" className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-[#DC2626] text-white text-[9.5px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">4</span>
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#EBEEF4]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0B1E3A] to-[#2F6FED] text-white flex items-center justify-center font-extrabold text-[12.5px] shadow-xs">
                TB
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#182233]">Thomas Banda</div>
                <div className="text-[11px] text-[#9AA6BC] font-semibold">Bank Officer</div>
              </div>
            </div>
          </div>
        </header>

        {/* ────── DESKTOP CONTENT ────── */}
        <main className="hidden md:flex flex-col gap-5 p-6 pb-12">
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-[#2F6FED] via-[#1B3B69] to-[#0B1E3A] rounded-[18px] p-5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/18 border border-white/40 flex items-center justify-center font-extrabold text-[15px] shrink-0 backdrop-blur-xs">
                TB
              </div>
              <div>
                <div className="text-[12px] text-[#CFE0FF] font-medium">Bank Portfolio Dashboard</div>
                <div className="text-[18px] font-extrabold tracking-tight mt-0.5">National Bank — Southern Region</div>
                <div className="inline-flex items-center gap-1.5 bg-white/18 rounded-full px-3 py-0.5 text-[11px] font-semibold mt-1.5 backdrop-blur-xs">
                  <Icon name="user" className="w-3.5 h-3.5" />
                  <span>24 Managed VSLAs</span>
                </div>
              </div>
            </div>
            <button className="bg-white/14 hover:bg-white/25 text-white border border-white/30 rounded-[10px] px-4 py-2 text-[12.5px] font-bold transition-all backdrop-blur-xs">
              Export Audit PDF
            </button>
          </div>

          {/* Slim stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <StatCard variant="slim" label="Managed VSLAs" value="24 Groups" deltaText="+3 new" deltaType="up" />
            <StatCard variant="slim" label="Total Members" value="248" deltaText="+18 new" deltaType="up" />
            <StatCard variant="slim" label="Group Deposits" value="MWK 32.8M" deltaText="+8.4%" deltaType="up" />
            <StatCard variant="slim" label="Active Loans" value="MWK 18.6M" deltaText="+6.7%" deltaType="up" />
            <StatCard variant="slim" label="Pending Approvals" value="7 Requests" deltaText="Requires action" deltaType="warn" />
            <StatCard variant="slim" label="Risk Flagged" value="2 Groups" deltaText="High NPL" deltaType="alert" />
          </div>

          {/* Two column */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-4">
            <TopGroupsTable />
            <div className="flex flex-col gap-4">
              {/* Pending approvals */}
              <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(11,30,58,0.04)] border border-[#EBEEF4]">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[15px] font-extrabold text-[#182233]">Pending Credit Approvals</span>
                  <span className="text-[11.5px] font-bold text-[#DC2626] bg-[#FDEAEA] px-2.5 py-0.5 rounded-full animate-pulse">
                    {approvals.filter(a => a.status === 'pending').length} Pending
                  </span>
                </div>
                {approvals.filter(a => a.status === 'pending').slice(0, 3).map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[12px] bg-[#F2F4F8] hover:bg-[#E8EFFD]/50 border border-[#EBEEF4] flex items-center justify-between gap-3 mb-2.5 last:mb-0 transition-colors">
                    <div>
                      <div className="text-[13px] font-bold text-[#182233]">{item.group}</div>
                      <div className="text-[11.5px] text-[#5C6B85] mt-0.5">{item.purpose} · <span className="font-bold text-[#182233]">{item.amount}</span></div>
                    </div>
                    <button className="bg-[#2F6FED] hover:bg-[#2558C7] active:scale-95 text-white border-none rounded-[8px] px-3.5 py-1.5 text-[11.5px] font-bold shrink-0 transition-all cursor-pointer">
                      Review
                    </button>
                  </div>
                ))}
                {approvals.filter(a => a.status === 'pending').length === 0 && (
                  <div className="text-[13px] text-[#5C6B85] py-4 text-center">No pending approvals</div>
                )}
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(11,30,58,0.04)] border border-[#EBEEF4]">
                <div className="text-[15px] font-extrabold text-[#182233] mb-3.5">Recent Bank Activity</div>
                <TransactionRow icon="arrow-down-circle" iconBgColor="blue" title="Bulk Deposit Sync" subtitle="Tikondane VSLA · MWK 250,000 synced" amount="Done" isPositive={true} />
                <TransactionRow icon="doc" iconBgColor="purple" title="Audit Report Generated" subtitle="Q2 Financial Health Score Audit" amount="OK" isPositive={true} />
                <TransactionRow icon="shield-alert" iconBgColor="red" title="Risk Warning Issued" subtitle="Mapalo Community · Overdue repayment" amount="Alert" isPositive={false} />
              </div>
            </div>
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════
            MOBILE VIEW — enriched with date selector & active press animations
            ═══════════════════════════════════════════════════════ */}
        <div className="md:hidden flex flex-col flex-1 bg-[#F2F4F8] pb-[80px]">

          {/* Top bar (navy) */}
          <div className="bg-[#0B1E3A] text-white flex items-center justify-between px-4 py-3.5 sticky top-0 z-20">
            <button className="p-1 -ml-1 active:scale-95 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-[16px] font-extrabold">
                VLSI <span className="text-[#5B9CFF]">CONNECT</span>
              </div>
              <div className="text-[9.5px] text-[#93A6C6] mt-0.5">Bridging VSLA to Banks</div>
            </div>
            <div className="relative cursor-pointer p-1 -mr-1">
              <Icon name="bell" className="w-[22px] h-[22px]" />
              <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0B1E3A] animate-pulse">3</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-0">
            {/* Welcome card */}
            <div className="bg-gradient-to-r from-[#2F6FED] to-[#1B3B69] rounded-[20px] p-[18px] text-white flex items-center gap-3.5 shadow-md">
              <div className="w-[52px] h-[52px] rounded-full bg-white/18 border border-white/40 flex items-center justify-center font-extrabold text-[15px] shrink-0 backdrop-blur-xs">TB</div>
              <div>
                <div className="text-[12px] text-[#CFE0FF]">Welcome back,</div>
                <div className="text-[17px] font-extrabold mt-0.5">Thomas Banda</div>
                <div className="inline-flex items-center gap-1.5 bg-white/18 rounded-full px-2.5 py-0.5 text-[11px] font-bold mt-1.5 backdrop-blur-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.5l8 3.6v5.6c0 5.2-3.5 8.7-8 10-4.5-1.3-8-4.8-8-10V6.1z" />
                  </svg>
                  Bank Officer
                </div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-[#CFE0FF] mt-1.5 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10.5" width="16" height="9" /><path d="M2 10.5l10-6.5 10 6.5" /><path d="M8 19.5v-6M12 19.5v-6M16 19.5v-6" />
                  </svg>
                  National Bank of Malawi · Lilongwe Branch
                </div>
              </div>
            </div>

            {/* Overview header + date */}
            <div className="flex items-center justify-between mt-[18px] mb-3">
              <span className="text-[15px] font-extrabold text-[#182233]">Overview</span>
              <span className="flex items-center gap-1.5 bg-white border border-[#EBEEF4] rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-[#5C6B85] shadow-[0_2px_10px_rgba(11,30,58,0.04)]">
                {activeDateFilter}
                <Icon name="calendar" className="w-3 h-3 text-[#2F6FED]" />
              </span>
            </div>

            {/* 2×2 stat grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "users", color: "bg-[#E8EFFD] text-[#2F6FED]", num: "24", name: "Groups", delta: "3 new" },
                { icon: "user", color: "bg-[#F1ECFE] text-[#8B5CF6]", num: "248", name: "Members", delta: "18 new" },
                { icon: "arrow-down-circle", color: "bg-[#E5F7EA] text-[#16A34A]", num: "MWK 32.8M", name: "Total Savings", delta: "8.4%" },
                { icon: "hand-coin", color: "bg-[#FEF0E1] text-[#F97316]", num: "MWK 18.6M", name: "Total Loans", delta: "6.7%" },
              ].map((s) => (
                <div key={s.name} className="bg-white rounded-[14px] shadow-[0_2px_10px_rgba(11,30,58,0.04)] p-3.5 border border-[#EBEEF4] active:scale-95 transition-transform">
                  <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5 ${s.color}`}>
                    <Icon name={s.icon as any} className="w-[17px] h-[17px]" />
                  </div>
                  <div className="text-[19px] font-extrabold text-[#182233]">{s.num}</div>
                  <div className="text-[11.5px] text-[#5C6B85] my-0.5 font-medium">{s.name}</div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" />
                    </svg>
                    {s.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Savings & Loans bar chart */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(11,30,58,0.04)] border border-[#EBEEF4] p-4 mt-3.5">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[14.5px] font-bold text-[#182233]">Savings &amp; Loans Overview</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5C6B85]">
                  This Month <Icon name="chevron-down" className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 300 140" className="w-full h-[140px] min-w-[240px]">
                  <line x1="0" y1="10" x2="300" y2="10" stroke="#EEF1F6" strokeWidth="1" />
                  <line x1="0" y1="45" x2="300" y2="45" stroke="#EEF1F6" strokeWidth="1" />
                  <line x1="0" y1="80" x2="300" y2="80" stroke="#EEF1F6" strokeWidth="1" />
                  <line x1="0" y1="115" x2="300" y2="115" stroke="#EEF1F6" strokeWidth="1" />
                  <rect x="14" y="55" width="16" height="60" rx="3" fill="#3B82F6" />
                  <rect x="34" y="72" width="16" height="43" rx="3" fill="#16A34A" />
                  <rect x="74" y="40" width="16" height="75" rx="3" fill="#3B82F6" />
                  <rect x="94" y="63" width="16" height="52" rx="3" fill="#16A34A" />
                  <rect x="134" y="60" width="16" height="55" rx="3" fill="#3B82F6" />
                  <rect x="154" y="75" width="16" height="40" rx="3" fill="#16A34A" />
                  <rect x="194" y="18" width="16" height="97" rx="3" fill="#3B82F6" />
                  <rect x="214" y="45" width="16" height="70" rx="3" fill="#16A34A" />
                  <rect x="254" y="30" width="16" height="85" rx="3" fill="#3B82F6" />
                  <rect x="274" y="58" width="16" height="57" rx="3" fill="#16A34A" />
                  <text x="30" y="132" fontSize="9" fill="#9AA6BC" textAnchor="middle" fontFamily="Inter">1 Jul</text>
                  <text x="90" y="132" fontSize="9" fill="#9AA6BC" textAnchor="middle" fontFamily="Inter">8 Jul</text>
                  <text x="150" y="132" fontSize="9" fill="#9AA6BC" textAnchor="middle" fontFamily="Inter">15 Jul</text>
                  <text x="210" y="132" fontSize="9" fill="#9AA6BC" textAnchor="middle" fontFamily="Inter">22 Jul</text>
                  <text x="270" y="132" fontSize="9" fill="#9AA6BC" textAnchor="middle" fontFamily="Inter">29 Jul</text>
                </svg>
              </div>
              <div className="flex gap-4 justify-center mt-2.5">
                <span className="flex items-center gap-1.5 text-[11px] text-[#5C6B85] font-semibold">
                  <span className="w-2 h-2 rounded-[2px] bg-[#3B82F6]" />
                  Savings (MWK)
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#5C6B85] font-semibold">
                  <span className="w-2 h-2 rounded-[2px] bg-[#16A34A]" />
                  Loans Disbursed (MWK)
                </span>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(11,30,58,0.04)] border border-[#EBEEF4] p-4 mt-3.5">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[14.5px] font-bold text-[#182233]">Recent Activities</span>
                <button className="text-[12.5px] font-semibold text-[#2F6FED] hover:underline">View all</button>
              </div>

              {[
                { icon: "users" as const, color: "bg-[#E5F7EA] text-[#16A34A]", title: "New group registered", sub: "Chipembere Women Group", time: "10:30 AM" },
                { icon: "doc" as const, color: "bg-[#F1ECFE] text-[#8B5CF6]", title: "Loan request submitted", sub: "Chisomo Group · MWK 500,000", time: "09:15 AM" },
                { icon: "wallet" as const, color: "bg-[#E8EFFD] text-[#2F6FED]", title: "Savings deposited", sub: "Thousand Smiles Group · MWK 120,000", time: "Yesterday" },
                { icon: "doc" as const, color: "bg-[#FEF0E1] text-[#F97316]", title: "Loan approved", sub: "Tikondane Group · MWK 300,000", time: "Yesterday" },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 py-2.5 ${i < 3 ? "border-b border-[#EBEEF4]" : ""}`}>
                  <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon name={item.icon} className="w-[17px] h-[17px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#182233]">{item.title}</div>
                    <div className="text-[11.5px] text-[#9AA6BC] mt-0.5 truncate">{item.sub}</div>
                  </div>
                  <div className="text-[11px] text-[#9AA6BC] whitespace-nowrap">{item.time}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#EBEEF4] h-[78px] flex items-center justify-around pt-1 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        {[
          { id: "dashboard", label: "Dashboard", icon: "grid" },
          { id: "groups", label: "Groups", icon: "users" },
          { id: "members", label: "Members", icon: "user" },
          { id: "loans", label: "Loans", icon: "wallet" },
          { id: "reports", label: "Reports", icon: "doc" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as MobileTab)}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors active:scale-90 ${mobileTab === tab.id ? "text-[#2F6FED]" : "text-[#9AA6BC]"}`}
          >
            <Icon name={tab.icon as any} className="w-[21px] h-[21px]" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
