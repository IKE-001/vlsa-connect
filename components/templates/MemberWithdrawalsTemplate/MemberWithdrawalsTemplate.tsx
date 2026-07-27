"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { WithdrawalWithVotes } from "@/types/financial";
import { formatMWK } from "@/lib/utils/money";
import { format } from "date-fns";

export interface MemberWithdrawalsTemplateProps {
  withdrawals: WithdrawalWithVotes[];
  myTotalSavingsTambala: number;
  isLoading: boolean;
  onRequestWithdrawal: (amountTambala: number, reason: string) => Promise<void>;
  onVote: (requestId: string, decision: "APPROVE" | "REJECT") => Promise<void>;
}

export const MemberWithdrawalsTemplate: React.FC<MemberWithdrawalsTemplateProps> = ({
  withdrawals,
  myTotalSavingsTambala,
  isLoading,
  onRequestWithdrawal,
  onVote,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return withdrawals;
    const q = search.toLowerCase();
    return withdrawals.filter((w) =>
      w.reason.toLowerCase().includes(q) ||
      w.status.toLowerCase().includes(q)
    );
  }, [withdrawals, search]);

  const pendingVotes = filtered.filter((w) => w.status === "PENDING");
  const paidOut = filtered.filter((w) => w.status === "PAID_OUT");
  const totalPaid = paidOut.reduce((sum, w) => sum + w.amountTambala, 0);

  const handleSubmit = async () => {
    const amt = parseInt(amount) * 100;
    if (!amt || !reason.trim()) return;
    setSubmitting(true);
    try {
      await onRequestWithdrawal(amt, reason);
      setShowModal(false);
      setAmount("");
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    setVoting(`${requestId}-${decision}`);
    try {
      await onVote(requestId, decision);
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block">
        <MemberSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pb-12">
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Withdrawals &amp; Voting</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Request savings payouts and vote on group withdrawal requests</p>
          </div>
          <Button theme="green" leftIcon={<Icon name="arrow-up-circle" className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Request Payout
          </Button>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard variant="member" icon="arrow-up-circle" iconBgColor="purple" value={formatMWK(totalPaid)} label="Total Payouts Received" linkText="View history" />
            <StatCard variant="member" icon="vote" iconBgColor="blue" value={`${pendingVotes.length} Votes Pending`} label="Active Group Votes" linkText="Review all" />
            <StatCard variant="member" icon="goal" iconBgColor="green" value={formatMWK(myTotalSavingsTambala)} label="Available Share Value" linkText="View shares" />
          </div>

          {/* Pending vote cards */}
          <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
            <h2 className="text-[15px] font-extrabold text-[#1B2321] mb-3">
              Pending Group Withdrawal Votes
            </h2>

            {/* Search */}
            <div className="relative mb-3">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A29C]" />
              <input
                type="text"
                placeholder="Search by reason or status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F7F9F8] border border-[#E9EDEA] rounded-[10px] pl-9 pr-3 py-2 text-[12.5px] text-[#1B2321] placeholder:text-[#94A29C] focus:outline-none focus:border-[#2D7A52] transition-colors"
              />
            </div>
            {isLoading && <div className="py-4 text-center text-sm text-[#94A29C]">Loading…</div>}
            {!isLoading && pendingVotes.length === 0 && (
              <div className="py-4 text-center text-sm text-[#94A29C]">No pending votes at this time.</div>
            )}
            <div className="flex flex-col gap-3">
              {pendingVotes.map((w) => {
                const approveKey = `${w.id}-APPROVE`;
                const rejectKey = `${w.id}-REJECT`;
                const pct = w.quorumNeeded > 0 ? Math.round((w.approveCount / w.quorumNeeded) * 100) : 0;
                return (
                  <div key={w.id} className="border border-[#E9EDEA] rounded-[14px] p-4 bg-[#F7F9F8]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-8 h-8 rounded-[10px] bg-[#FEF0E1] text-[#E8873A] flex items-center justify-center shrink-0">
                            <Icon name="arrow-up-circle" className="w-4 h-4" />
                          </div>
                          <span className="text-[13.5px] font-bold text-[#1B2321]">{w.reason}</span>
                        </div>
                        <p className="text-[12px] text-[#5B6B65] mt-1.5">
                          Requested {format(new Date(w.createdAt), "dd MMM yyyy")} · <span className="font-bold text-[#1B2321]">{formatMWK(w.amountTambala)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Vote progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#5B6B65] mb-1.5">
                        <span>{w.approveCount} of {w.quorumNeeded} votes needed</span>
                        <span className="text-[#2D7A52] font-bold">{pct}%</span>
                      </div>
                      <div className="h-2 bg-[#E9EDEA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2D7A52] to-[#5BE38A] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Vote buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(w.id, "APPROVE")}
                        disabled={!!voting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#E3F3EA] text-[#2D7A52] text-[12.5px] font-bold border border-[#2D7A52]/20 hover:bg-[#2D7A52] hover:text-white transition-all disabled:opacity-50"
                      >
                        {voting === approveKey ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon name="star" className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleVote(w.id, "REJECT")}
                        disabled={!!voting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#FEE2E2] text-[#DC4B3F] text-[12.5px] font-bold border border-[#DC4B3F]/20 hover:bg-[#DC4B3F] hover:text-white transition-all disabled:opacity-50"
                      >
                        {voting === rejectKey ? (
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon name="logout" className="w-3.5 h-3.5" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paid out history */}
          {paidOut.length > 0 && (
            <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <h2 className="text-[15px] font-extrabold text-[#1B2321] mb-4">Paid-Out Withdrawals</h2>
              <div className="flex flex-col">
                {paidOut.map((w, i) => (
                  <div key={w.id} className={`flex items-center gap-4 py-3 ${i < paidOut.length - 1 ? "border-b border-[#F1F4F2]" : ""}`}>
                    <div className="w-9 h-9 rounded-[10px] bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center shrink-0">
                      <Icon name="arrow-up-circle" className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#1B2321] truncate">{w.reason}</div>
                      <div className="text-[11.5px] text-[#94A29C]">{format(new Date(w.createdAt), "dd MMM yyyy")}</div>
                    </div>
                    <div className="text-[13.5px] font-extrabold text-[#E8873A]">−{formatMWK(w.amountTambala)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Request withdrawal modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Request Share Payout</h3>
            <Input label="Withdrawal Amount (MWK)" placeholder="e.g. 200" theme="green" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input label="Reason for Withdrawal" placeholder="e.g. Emergency, School fees" theme="green" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} />
            <p className="text-[11.5px] text-[#5B6B65] bg-[#F1F4F2] rounded-[8px] p-3">
              Your request will be put to a group vote. {"{quorum}"} members must approve before payout is processed.
            </p>
            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button theme="green" onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting…" : "Submit Request"}</Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};
