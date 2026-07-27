"use client";

import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React, { useState, useMemo } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { TransactionRow } from "@/components/molecules/TransactionRow/TransactionRow";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { ContributionRecord } from "@/types/financial";
import { formatMWK } from "@/lib/utils/money";
import { format } from "date-fns";

export interface MemberContributionsTemplateProps {
  contributions: ContributionRecord[];
  totalContributedTambala: number;
  isLoading: boolean;
  onContribute: (amountTambala: number, phone: string, method: "MOBILE_MONEY" | "CASH") => Promise<void>;
}

const METHOD_LABEL: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CASH: "Cash",
  CARD: "Card",
};

export const MemberContributionsTemplate: React.FC<MemberContributionsTemplateProps> = ({
  contributions,
  totalContributedTambala,
  isLoading,
  onContribute,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"MOBILE_MONEY" | "CASH">("MOBILE_MONEY");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return contributions;
    const q = search.toLowerCase();
    return contributions.filter(
      (c) =>
        (c.cyclePeriod ?? "").toLowerCase().includes(q) ||
        c.method.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [contributions, search]);

  const approvedContributions = filtered.filter((c) => c.status === "APPROVED");
  const pendingContributions = filtered.filter((c) => c.status === "PENDING");
  const compliance = filtered.length > 0
    ? Math.round((approvedContributions.length / filtered.length) * 100)
    : 100;

  const handleSubmit = async () => {
    const amountNum = parseInt(amount) * 100; // Convert MWK to tambala
    if (!amountNum || amountNum <= 0) return;
    setSubmitting(true);
    try {
      await onContribute(amountNum, phone, payMethod);
      setShowModal(false);
      setAmount("");
      setPhone("");
    } finally {
      setSubmitting(false);
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
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Contributions</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Track and make group savings contributions</p>
          </div>
          <Button theme="green" leftIcon={<Icon name="arrow-down-circle" className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Make Contribution
          </Button>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard variant="member" icon="arrow-down-circle" iconBgColor="green" value={formatMWK(totalContributedTambala)} label="Total Contributions YTD" linkText="Download summary" />
            <StatCard variant="member" icon="wallet" iconBgColor="blue" value={String(pendingContributions.length)} label="Pending Verification" linkText="View schedule" />
            <StatCard variant="member" icon="goal" iconBgColor="purple" value={`${compliance}%`} label="Payment Compliance" linkText="View badge" />
          </div>

          <div className="bg-white rounded-[18px] p-5.5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-extrabold text-[#1B2321]">Contribution History</h2>
              <span className="text-[12px] text-[#94A29C] font-semibold">Showing {filtered.length} entries</span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A29C]" />
              <input
                type="text"
                placeholder="Search by month, method, status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F7F9F8] border border-[#E9EDEA] rounded-[10px] pl-9 pr-3 py-2 text-[12.5px] text-[#1B2321] placeholder:text-[#94A29C] focus:outline-none focus:border-[#2D7A52] transition-colors"
              />
            </div>

            <div className="flex flex-col">
              {isLoading && <div className="py-8 text-center text-sm text-[#94A29C]">Loading contributions…</div>}
              {!isLoading && filtered.length === 0 && (
                <div className="py-8 text-center text-sm text-[#94A29C]">No contributions found.</div>
              )}
              {filtered.map((c) => (
                <TransactionRow
                  key={c.id}
                  icon="arrow-down-circle"
                  iconBgColor={c.status === "APPROVED" ? "green" : c.status === "PENDING" ? "gold" : "red"}
                  title={`${c.cyclePeriod ? `Monthly Contribution — ${c.cyclePeriod}` : "Contribution"} (${c.status})`}
                  subtitle={`${METHOD_LABEL[c.method] ?? c.method} · ${format(new Date(c.createdAt), "MMM dd, yyyy")}`}
                  amount={`+ ${formatMWK(c.amountTambala)}`}
                  isPositive={true}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Make New Contribution</h3>
            <Input label="Contribution Amount (MWK)" placeholder="e.g. 250" theme="green" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
            {/* Payment method selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#5B6B65]">Payment Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod("MOBILE_MONEY")}
                  className={`flex-1 py-2.5 px-3 rounded-[10px] text-[13px] font-bold border transition-all ${
                    payMethod === "MOBILE_MONEY"
                      ? "bg-[#E3F3EA] border-[#2D7A52] text-[#2D7A52]"
                      : "border-[#E9EDEA] text-[#94A29C] hover:border-[#2D7A52]"
                  }`}
                >
                  Online Payment (Airtel, TNM or Bank via PayChangu)
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("CASH")}
                  className={`flex-1 py-2.5 px-3 rounded-[10px] text-[13px] font-bold border transition-all ${
                    payMethod === "CASH"
                      ? "bg-[#E3F3EA] border-[#2D7A52] text-[#2D7A52]"
                      : "border-[#E9EDEA] text-[#94A29C] hover:border-[#2D7A52]"
                  }`}
                >
                  Cash
                </button>
              </div>
            </div>
            {payMethod === "MOBILE_MONEY" && (
              <Input label="Mobile Number" placeholder="+265 999 000 000" theme="green" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
            )}
            {payMethod === "MOBILE_MONEY" && (
              <p className="text-[11.5px] text-[#5B6B65] bg-[#F1F4F2] rounded-[8px] p-3">
                You will be redirected to PayChangu to complete your payment securely.
              </p>
            )}
            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button theme="green" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Processing…" : payMethod === "MOBILE_MONEY" ? "Pay Online Now" : "Confirm Cash"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

