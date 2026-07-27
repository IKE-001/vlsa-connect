"use client";
import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React, { useState } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { ContributionChart } from "@/components/organisms/ContributionChart/ContributionChart";
import { TransactionRow } from "@/components/molecules/TransactionRow/TransactionRow";
import { PendingActionCard } from "@/components/molecules/PendingActionCard/PendingActionCard";
import { QuickInfoTile } from "@/components/molecules/QuickInfoTile/QuickInfoTile";
import { NextMeetingCard } from "@/components/organisms/NextMeetingCard/NextMeetingCard";
import { ContributionRecord, MemberBalanceSummary, LoanWithVotes } from "@/types/financial";
import { MeetingRecord } from "@/hooks/useMeetings";
import { formatMWK } from "@/lib/utils/money";
import { format, parseISO } from "date-fns";
import { UserProfile } from "@/hooks/useProfile";

type MobileTab = "home" | "savings" | "add" | "loans" | "profile";

export interface MemberDashboardTemplateProps {
  user: UserProfile | null;
  groupName: string;
  membersCount: number;
  memberBalances: MemberBalanceSummary | null;
  contributions: ContributionRecord[];
  loans: LoanWithVotes[];
  meetings: MeetingRecord[];
  totalGroupSavings: number;
}

export const MemberDashboardTemplate: React.FC<MemberDashboardTemplateProps> = ({
  user,
  groupName,
  membersCount,
  memberBalances,
  contributions,
  loans,
  meetings,
  totalGroupSavings,
}) => {
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [showBalance, setShowBalance] = useState<boolean>(true);

  // Derived data
  const userName = user?.fullName || "Member";
  const userInitials = (userName || "User").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const nextMeeting = meetings.find((m) => m.status === "SCHEDULED");
  
  // MemberBalanceSummary only tracks contributions — total saved == total contributed
  const mySavingsBalance = memberBalances?.totalContributedTambala ?? 0;
  const myLoanBalance = loans
    .filter(l => l.status === "DISBURSED" || l.status === "REPAYING" || l.status === "OVERDUE")
    .reduce((sum, l) => sum + l.remainingDueTambala, 0);
  
  const recentContributions = [...contributions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const pendingLoans = loans.filter(l => l.status === "PENDING");
  const myShares = Math.floor(mySavingsBalance / 50000);

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className="hidden md:block">
        <MemberSidebar />
      </div>

      {/* ===== MAIN COLUMN ===== */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ────── DESKTOP TOPBAR ────── */}
        <header className="hidden md:flex bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 items-center justify-between shadow-xs">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321] tracking-tight">Welcome back, {(userName || "User").split(" ")[0]} 👋</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5 font-medium">Here&apos;s what&apos;s happening in your group today.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5B6B65] border border-[#E9EDEA] bg-white rounded-[10px] px-3 py-1.5 cursor-pointer hover:border-[#2D7A52]/40 transition-colors">
              EN <Icon name="chevron-down" className="w-3 h-3" />
            </span>
            <div className="relative text-[#5B6B65] cursor-pointer hover:text-[#1B2321] transition-colors p-1">
              <Icon name="bell" className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-[#DC4B3F] text-white text-[9.5px] font-bold w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                0
              </span>
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E9EDEA]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#123A29] to-[#2D7A52] text-white flex items-center justify-center font-extrabold text-[12.5px] shadow-xs">
                {userInitials}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#1B2321]">{userName}</div>
                <div className="text-[11px] text-[#94A29C] font-semibold">Member</div>
              </div>
            </div>
          </div>
        </header>

        {/* ────── DESKTOP CONTENT ────── */}
        <main className="hidden md:flex flex-col gap-5 p-7 pb-12">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard variant="member" icon="wallet" iconBgColor="blue" value={showBalance ? formatMWK(mySavingsBalance) : "••••••••"} label="My Contributions Total" linkText="View details" />
            <StatCard variant="member" icon="users" iconBgColor="green" value={showBalance ? formatMWK(totalGroupSavings) : "••••••••"} label="Group Total Savings" linkText="View group" />
            <StatCard variant="member" icon="arrow-down-circle" iconBgColor="blue" value={String(contributions.length)} label="Total Contributions" linkText="View history" />
            <StatCard variant="member" icon="layers" iconBgColor="purple" value={formatMWK(myLoanBalance)} label="My Loan Balance" linkText="View details" />
          </div>

          {/* Contribution chart */}
          <ContributionChart />

          {/* Two column: Recent transactions + Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
            <div className="bg-white rounded-[18px] p-5.5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-extrabold text-[#1B2321]">Recent Transactions</span>
                <button className="text-[12.5px] font-bold text-[#2D7A52] hover:text-[#1B5E3F] transition-colors">View all</button>
              </div>
              {recentContributions.length > 0 ? recentContributions.map((contrib) => (
                <TransactionRow 
                  key={contrib.id}
                  icon="arrow-down-circle" 
                  iconBgColor="green" 
                  title="Contribution" 
                  subtitle={`Share purchase · ${format(new Date(contrib.createdAt), "MMM dd, yyyy")}`} 
                  amount={`+ ${formatMWK(contrib.amountTambala)}`} 
                  isPositive={true} 
                />
              )) : (
                <div className="text-sm text-gray-500 py-4 text-center">No recent transactions</div>
              )}
            </div>

            <div className="bg-white rounded-[18px] p-5.5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-extrabold text-[#1B2321]">Upcoming &amp; Pending</span>
              </div>
              {pendingLoans.map((loan) => (
                <PendingActionCard 
                  key={loan.id}
                  variant="blue" 
                  icon="doc" 
                  title="Loan Request" 
                  subtitle={`Requested by: ${loan.memberId === user?.userId ? 'You' : 'Member'}`} 
                  amount={`Amount: ${formatMWK(loan.principalTambala)}`} 
                  badgeText="Pending" 
                  actionText="Review" 
                />
              ))}
              {pendingLoans.length === 0 && (
                <div className="text-sm text-gray-500 py-4 text-center">No pending actions</div>
              )}
            </div>
          </div>

          {/* Group quick info + next meeting */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-white rounded-[18px] p-5.5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
              <QuickInfoTile icon="tag" label="Group Name" value={groupName || "Group"} />
              <QuickInfoTile icon="hash" label="Group Code" value="TVS-2025-001" />
              <QuickInfoTile icon="calendar" label="Meeting Day" value="Scheduled" />
              <QuickInfoTile icon="vote" label="Group Type" value="VSLA" />
              <QuickInfoTile icon="users" label="Members" value={`${membersCount} Members`} />
            </div>
            <div className="w-full lg:w-[300px] shrink-0">
              <NextMeetingCard date={nextMeeting ? format(parseISO(nextMeeting.scheduledAt), "EEEE, d MMMM yyyy · p") : "No upcoming meetings"} />
            </div>
          </div>
        </main>

        {/* ═══════════════════════════════════════════════
            MOBILE VIEW — enriched with interactive balance toggle & micro-animations
            ═══════════════════════════════════════════════ */}
        <div className="md:hidden flex flex-col flex-1 bg-[#F3F5F4] pb-[85px]">

          {/* App header */}
          <header className="bg-gradient-to-b from-[#123A29] to-[#164A34] text-white px-5 pt-3.5 pb-14 relative">
            <div className="flex items-center justify-between mb-[18px]">
              <button className="p-1 -ml-1 active:scale-95 transition-transform">
                <Icon name="grid" className="w-[22px] h-[22px]" />
              </button>
              <div className="text-center">
                <div className="text-[16px] font-extrabold tracking-[0.3px]">VSLA CONNECT</div>
                <div className="text-[10.5px] text-[#B9D4C6] mt-0.5 font-medium">Growing Together, Building Futures</div>
              </div>
              <div className="relative cursor-pointer p-1 -mr-1">
                <Icon name="bell" className="w-[22px] h-[22px]" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-[52px] h-[52px] rounded-full bg-white/12 border border-white/35 flex items-center justify-center shrink-0 backdrop-blur-xs">
                <Icon name="users" className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-bold">{groupName || "Your Group"}</div>
                <div className="flex items-center gap-1.5 text-[12.5px] text-[#C9E0D4] mt-0.5 font-medium">
                  <Icon name="globe" className="w-[13px] h-[13px]" />
                  Malawi
                </div>
                <div className="flex items-center gap-2 mt-2 text-[12px] text-[#DCEDE4]">
                  <span className="flex items-center gap-1.5 bg-white/14 rounded-full px-2.5 py-0.5 font-semibold text-white backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5BE38A] animate-ping" />
                    Active
                  </span>
                  <span>• {membersCount} Members</span>
                </div>
              </div>
            </div>
          </header>

          {/* Balance card */}
          <div className="mx-4 -mt-[42px] bg-white rounded-[20px] shadow-[0_4px_16px_rgba(18,58,41,0.08)] p-[18px] relative z-10 border border-[#EBEFED]">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center gap-1.5 text-[12.5px] text-[#5B6B65] font-semibold hover:text-[#1B2321] transition-colors cursor-pointer"
              >
                <Icon name="wallet" className="w-[14px] h-[14px]" />
                My Savings Balance
              </button>
            </div>

            <div className="text-[29px] font-extrabold mt-2 mb-0.5 tracking-[-0.3px] text-[#1B2321]">
              {showBalance ? formatMWK(mySavingsBalance) : "••••••••••••"}
            </div>
            <div className="text-[12px] text-[#94A29C] font-medium">Total Shares: {myShares}</div>

            <div className="h-px bg-[#EBEFED] my-3.5" />

            <div className="flex">
              <div className="flex-1 text-center border-r border-[#EBEFED]">
                <div className="text-[11px] text-[#5B6B65] font-medium mb-0.5">My Loan Balance</div>
                <div className="text-[14px] font-bold text-[#4A7FC1]">
                  {showBalance ? formatMWK(myLoanBalance) : "••••••"}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-[11px] text-[#5B6B65] font-medium mb-0.5">Group Total</div>
                <div className="text-[14px] font-bold text-[#2D7A52]">
                  {showBalance ? formatMWK(totalGroupSavings) : "••••••"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mx-4 mt-3.5 bg-white rounded-[20px] shadow-[0_2px_10px_rgba(18,58,41,0.06)] p-4 border border-[#EBEFED]">
            <div className="text-[14.5px] font-bold text-[#1B2321] mb-3.5">Quick Actions</div>
            <div className="flex justify-between">
              {[
                { icon: "arrow-down-circle" as const, label: "Make\nContribution", bg: "bg-[#E3F3EA]", color: "text-[#2D7A52]" },
                { icon: "arrow-up-circle" as const, label: "Request\nLoan", bg: "bg-[#E6EEFA]", color: "text-[#4A7FC1]" },
                { icon: "vote" as const, label: "Vote &\nApprovals", bg: "bg-[#EFE9F9]", color: "text-[#8B6FC7]" },
                { icon: "doc" as const, label: "Group\nDocuments", bg: "bg-[#FCEADC]", color: "text-[#E8873A]" },
                { icon: "chat" as const, label: "Chat", bg: "bg-[#E3F3EA]", color: "text-[#2D7A52]" },
              ].map((qa) => (
                <button key={qa.label} className="flex flex-col items-center gap-1.5 w-[19%] active:scale-95 transition-transform cursor-pointer">
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${qa.bg} ${qa.color} shadow-xs`}>
                    <Icon name={qa.icon} className="w-5 h-5" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-[#5B6B65] text-center leading-[1.2] whitespace-pre-line">{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mx-4 mt-3.5 bg-white rounded-[20px] shadow-[0_2px_10px_rgba(18,58,41,0.06)] p-4 pb-3.5 border border-[#EBEFED]">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[14.5px] font-bold text-[#1B2321]">Recent Activity</span>
              <button className="text-[12.5px] font-semibold text-[#2D7A52] hover:underline">View all</button>
            </div>
            {recentContributions.map((contrib) => (
              <div key={contrib.id} className="flex items-center gap-3 py-2.5 border-b border-[#EBEFED] last:border-0">
                <div className="w-[38px] h-[38px] rounded-full bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center shrink-0">
                  <Icon name="arrow-down-circle" className="w-[17px] h-[17px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1B2321]">You contributed</div>
                  <div className="text-[11.5px] text-[#94A29C] mt-0.5">{format(new Date(contrib.createdAt), "dd MMM yyyy, p")}</div>
                </div>
                <div className="text-[13px] font-bold text-[#2D7A52] whitespace-nowrap">+{formatMWK(contrib.amountTambala)}</div>
              </div>
            ))}
            {recentContributions.length === 0 && (
              <div className="text-sm text-gray-500 py-4 text-center">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav />

    </div>
  );
};
