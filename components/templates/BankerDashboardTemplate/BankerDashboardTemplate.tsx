"use client";

import React, { useState } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { BankerSidebar } from "@/components/organisms/BankerSidebar/BankerSidebar";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { TopGroupsTable } from "@/components/organisms/TopGroupsTable/TopGroupsTable";
import { TransactionRow } from "@/components/molecules/TransactionRow/TransactionRow";
import { Button } from "@/components/atoms/Button/Button";
import { BankerGroupSummary, BankerCreditApproval } from "@/hooks/useBanker";

type MobileTab = "dashboard" | "groups" | "members" | "loans" | "reports";

export interface BankerDashboardTemplateProps {
  groups: BankerGroupSummary[];
  approvals: BankerCreditApproval[];
  isLoading: boolean;
  onRefresh?: () => Promise<void>;
}

export const BankerDashboardTemplate: React.FC<BankerDashboardTemplateProps> = ({
  groups,
  approvals,
  isLoading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("dashboard");
  const [activeDateFilter] = useState("Today, 26 Jul 2026");

  // Approval Modal state
  const [reviewApproval, setReviewApproval] = useState<BankerCreditApproval | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const handleDecision = async (action: "APPROVED" | "REJECTED") => {
    if (!reviewApproval) return;
    setActionSubmitting(true);
    try {
      const res = await fetch("/api/banker/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: reviewApproval.id, action }),
      });
      if (res.ok && onRefresh) {
        await onRefresh();
      }
      setReviewApproval(null);
    } catch (err) {
      console.error("Failed to update approval decision:", err);
    } finally {
      setActionSubmitting(false);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-[#F2F4F8] font-sans antialiased flex flex-col md:flex-row">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className="hidden md:block">
        <BankerSidebar pendingApprovalsCount={pendingApprovals.length} />
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
              <span className="absolute top-0 right-0 bg-[#DC2626] text-white text-[9.5px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {pendingApprovals.length}
              </span>
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#EBEEF4]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0B1E3A] to-[#2F6FED] text-white flex items-center justify-center font-extrabold text-[12.5px] shadow-xs">
                BO
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#182233]">Bank Officer</div>
                <div className="text-[11px] text-[#9AA6BC] font-semibold">National Bank</div>
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
                BO
              </div>
              <div>
                <div className="text-[12px] text-[#CFE0FF] font-medium">Bank Portfolio Dashboard</div>
                <div className="text-[18px] font-extrabold tracking-tight mt-0.5">National Bank — Southern Region</div>
                <div className="inline-flex items-center gap-1.5 bg-white/18 rounded-full px-3 py-0.5 text-[11px] font-semibold mt-1.5 backdrop-blur-xs">
                  <Icon name="user" className="w-3.5 h-3.5" />
                  <span>{groups.length} Managed VSLAs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slim stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <StatCard variant="slim" label="Managed VSLAs" value={`${groups.length} Groups`} deltaText="Active" deltaType="up" />
            <StatCard variant="slim" label="Total Members" value="248" deltaText="+18 new" deltaType="up" />
            <StatCard variant="slim" label="Group Deposits" value="MWK 32.8M" deltaText="+8.4%" deltaType="up" />
            <StatCard variant="slim" label="Active Loans" value="MWK 18.6M" deltaText="+6.7%" deltaType="up" />
            <StatCard variant="slim" label="Pending Approvals" value={`${pendingApprovals.length} Requests`} deltaText="Requires action" deltaType="warn" />
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
                    {pendingApprovals.length} Pending
                  </span>
                </div>
                {pendingApprovals.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[12px] bg-[#F2F4F8] hover:bg-[#E8EFFD]/50 border border-[#EBEEF4] flex items-center justify-between gap-3 mb-2.5 last:mb-0 transition-colors">
                    <div>
                      <div className="text-[13px] font-bold text-[#182233]">{item.group}</div>
                      <div className="text-[11.5px] text-[#5C6B85] mt-0.5">{item.purpose} · <span className="font-bold text-[#182233]">{item.amount}</span></div>
                    </div>
                    <button
                      onClick={() => setReviewApproval(item)}
                      className="bg-[#2F6FED] hover:bg-[#2558C7] active:scale-95 text-white border-none rounded-[8px] px-3.5 py-1.5 text-[11.5px] font-bold shrink-0 transition-all cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                ))}
                {pendingApprovals.length === 0 && (
                  <div className="text-[13px] text-[#5C6B85] py-4 text-center">No pending credit approvals</div>
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
      </div>

      {/* Review Credit Approval Modal */}
      {reviewApproval && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#182233]">Review Credit Application</h3>
            
            <div className="bg-[#F2F4F8] p-4 rounded-[12px] flex flex-col gap-1.5 text-[13px]">
              <div><strong className="text-[#182233]">VSLA Group:</strong> {reviewApproval.group}</div>
              <div><strong className="text-[#182233]">Requested Amount:</strong> {reviewApproval.amount}</div>
              <div><strong className="text-[#182233]">Purpose:</strong> {reviewApproval.purpose}</div>
              <div><strong className="text-[#182233]">Total Members:</strong> {reviewApproval.members}</div>
              <div><strong className="text-[#182233]">Group Total Savings:</strong> {reviewApproval.savings}</div>
              <div><strong className="text-[#182233]">Credit Score:</strong> {reviewApproval.score}/100</div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setReviewApproval(null)}>Cancel</Button>
              <button
                onClick={() => handleDecision("REJECTED")}
                disabled={actionSubmitting}
                className="bg-[#DC2626] text-white font-bold text-[13px] px-4 py-2 rounded-[10px] hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleDecision("APPROVED")}
                disabled={actionSubmitting}
                className="bg-[#2F6FED] text-white font-bold text-[13px] px-4 py-2 rounded-[10px] hover:bg-[#2558C7] transition-colors disabled:opacity-50"
              >
                Approve &amp; Disburse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
