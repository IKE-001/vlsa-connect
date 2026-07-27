"use client";

import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React, { useState } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Badge } from "@/components/atoms/Badge/Badge";
import { LoanWithVotes } from "@/types/financial";
import { formatMWK } from "@/lib/utils/money";
import { format, addMonths } from "date-fns";

export interface MemberLoansTemplateProps {
  loans: LoanWithVotes[];
  isLoading: boolean;
  onApplyLoan: (principalTambala: number) => Promise<void>;
  onRepay: (loanId: string, amountTambala: number, method: "CASH" | "MOBILE_MONEY") => Promise<void>;
}

const STATUS_BADGE: Record<string, { variant: "blue" | "green" | "orange" | "red"; label: string }> = {
  PENDING:    { variant: "orange", label: "Pending" },
  APPROVED:   { variant: "green",  label: "Approved" },
  REJECTED:   { variant: "red",    label: "Rejected" },
  DISBURSED:  { variant: "blue",   label: "Disbursed" },
  REPAYING:   { variant: "blue",   label: "In Repayment" },
  REPAID:     { variant: "green",  label: "Fully Repaid" },
  OVERDUE:    { variant: "red",    label: "Overdue" },
};

export const MemberLoansTemplate: React.FC<MemberLoansTemplateProps> = ({
  loans,
  isLoading,
  onApplyLoan,
  onRepay,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [showRepayModal, setShowRepayModal] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"MOBILE_MONEY" | "CASH">("MOBILE_MONEY");
  const [repaySubmitting, setRepaySubmitting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Schedule modal state
  const [scheduleModalLoan, setScheduleModalLoan] = useState<LoanWithVotes | null>(null);

  const activeLoans = loans.filter((l) =>
    l.status === "DISBURSED" || l.status === "REPAYING" || l.status === "OVERDUE"
  );
  const totalActiveLoanBalance = activeLoans.reduce((sum, l) => sum + l.remainingDueTambala, 0);

  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.principalTambala / 100).toString().includes(searchQuery);
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") return matchesSearch && (l.status === "DISBURSED" || l.status === "REPAYING" || l.status === "OVERDUE");
    return matchesSearch && l.status === statusFilter;
  });

  const handleApply = async () => {
    const amt = parseInt(loanAmount) * 100;
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      await onApplyLoan(amt);
      setShowApplyModal(false);
      setLoanAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async () => {
    if (!showRepayModal) return;
    const amt = parseInt(repayAmount) * 100;
    if (!amt || amt <= 0) return;
    setRepaySubmitting(true);
    try {
      await onRepay(showRepayModal, amt, repayMethod);
      setShowRepayModal(null);
      setRepayAmount("");
    } finally {
      setRepaySubmitting(false);
    }
  };

  const generateRepaymentSchedule = (loan: LoanWithVotes) => {
    const totalDue = loan.totalDueTambala || Math.round(loan.principalTambala * (1 + Number(loan.interestRate) / 100));
    const monthlyInstallment = Math.round(totalDue / 3);
    const startDate = new Date(loan.requestedAt);

    return [1, 2, 3].map((monthNum) => {
      const dueDate = addMonths(startDate, monthNum);
      const isPaid = loan.amountRepaidTambala >= monthlyInstallment * monthNum;
      return {
        installment: monthNum,
        dueDate,
        amountTambala: monthlyInstallment,
        isPaid,
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block">
        <MemberSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pb-12">
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Loans &amp; Borrowing</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Apply for loans and track repayment schedules</p>
          </div>
          <Button theme="green" leftIcon={<Icon name="hand-coin" className="w-4 h-4" />} onClick={() => setShowApplyModal(true)}>
            Apply for Loan
          </Button>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard variant="member" icon="wallet" iconBgColor="blue" value={formatMWK(totalActiveLoanBalance)} label="Active Loan Balance" linkText="View active" />
            <StatCard variant="member" icon="goal" iconBgColor="green" value={String(activeLoans.length)} label="Active Loans" linkText="View all" />
            <StatCard variant="member" icon="star" iconBgColor="purple" value={String(loans.filter(l => l.status === "PENDING").length)} label="Pending Applications" linkText="View terms" />
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-[18px] p-4 border border-[#E9EDEA] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search loan ID or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[13px] pl-9 pr-3 py-2 border border-[#E9EDEA] rounded-[10px] focus:outline-none focus:border-[#2D7A52]"
              />
              <Icon name="search" className="w-4 h-4 text-[#94A29C] absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {["ALL", "ACTIVE", "PENDING", "REPAID"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-[#2D7A52] text-white"
                      : "bg-[#F1F4F2] text-[#5B6B65] hover:bg-[#E3F3EA]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {isLoading && <div className="py-8 text-center text-sm text-[#94A29C]">Loading loans…</div>}
          {!isLoading && filteredLoans.length === 0 && (
            <div className="bg-white rounded-[18px] p-8 text-center text-sm text-[#94A29C] border border-[#E9EDEA]">
              No loan records match your search or filter.
            </div>
          )}

          {filteredLoans.map((loan) => {
            const badge = STATUS_BADGE[loan.status] ?? { variant: "blue" as const, label: loan.status };
            return (
              <div key={loan.id} className="bg-white rounded-[18px] p-5.5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[15px] font-extrabold text-[#1B2321]">Loan #{loan.id.substring(0, 8)}</span>
                    <p className="text-[11.5px] text-[#5B6B65] mt-0.5">
                      Requested {format(new Date(loan.requestedAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Badge variant={badge.variant} dot>{badge.label}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-[14px] bg-[#F1F4F2]/60 border border-[#E9EDEA] mb-4">
                  <div>
                    <div className="text-[11px] text-[#94A29C] font-semibold">Principal</div>
                    <div className="text-[14px] font-bold text-[#1B2321]">{formatMWK(loan.principalTambala)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#94A29C] font-semibold">Interest Rate</div>
                    <div className="text-[14px] font-bold text-[#2D7A52]">{loan.interestRate}% / month</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#94A29C] font-semibold">Repaid</div>
                    <div className="text-[14px] font-bold text-[#3B7DDB]">{formatMWK(loan.amountRepaidTambala)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#94A29C] font-semibold">Remaining</div>
                    <div className="text-[14px] font-bold text-[#E8873A]">{formatMWK(loan.remainingDueTambala)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(loan.status === "REPAYING" || loan.status === "DISBURSED") && (
                    <Button size="sm" theme="green" onClick={() => setShowRepayModal(loan.id)}>
                      Make Repayment
                    </Button>
                  )}
                  <Button size="sm" variant="outline" theme="green" onClick={() => setScheduleModalLoan(loan)}>
                    View Repayment Schedule
                  </Button>
                </div>
              </div>
            );
          })}
        </main>
      </div>

      {/* Loan Repayment Schedule Modal */}
      {scheduleModalLoan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-[#1B2321]">Repayment Schedule</h3>
              <button onClick={() => setScheduleModalLoan(null)} className="text-[#94A29C] hover:text-[#1B2321]">✕</button>
            </div>

            <div className="bg-[#F1F4F2] p-3 rounded-[12px] text-[12.5px] text-[#5B6B65]">
              <div><strong className="text-[#1B2321]">Principal:</strong> {formatMWK(scheduleModalLoan.principalTambala)}</div>
              <div><strong className="text-[#1B2321]">Interest Rate:</strong> {scheduleModalLoan.interestRate}%</div>
              <div><strong className="text-[#1B2321]">Total Due:</strong> {formatMWK(scheduleModalLoan.totalDueTambala || Math.round(scheduleModalLoan.principalTambala * 1.1))}</div>
            </div>

            <div className="flex flex-col gap-2">
              {generateRepaymentSchedule(scheduleModalLoan).map((item) => (
                <div key={item.installment} className="flex items-center justify-between p-3 rounded-[10px] border border-[#E9EDEA] text-[13px]">
                  <div>
                    <div className="font-bold text-[#1B2321]">Month {item.installment} Installment</div>
                    <div className="text-[11px] text-[#94A29C]">Due by {format(item.dueDate, "MMM dd, yyyy")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#2D7A52]">{formatMWK(item.amountTambala)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isPaid ? "bg-[#E3F3EA] text-[#2D7A52]" : "bg-orange-50 text-orange-600"}`}>
                      {item.isPaid ? "Paid" : "Upcoming"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-2">
              <Button theme="green" onClick={() => setScheduleModalLoan(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Loan Application</h3>
            <Input label="Loan Amount Requested (MWK)" placeholder="e.g. 1500" theme="green" fullWidth value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
            <p className="text-[12px] text-[#94A29C]">Your application will be reviewed and voted on by group officials.</p>
            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setShowApplyModal(false)}>Cancel</Button>
              <Button theme="green" onClick={handleApply} disabled={submitting}>{submitting ? "Submitting…" : "Submit Request"}</Button>
            </div>
          </div>
        </div>
      )}

      {showRepayModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Make Loan Repayment</h3>
            <Input label="Repayment Amount (MWK)" placeholder="e.g. 250" theme="green" fullWidth value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#5B6B65]">Payment Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRepayMethod("MOBILE_MONEY")}
                  className={`flex-1 py-2.5 px-3 rounded-[10px] text-[13px] font-bold border transition-all ${
                    repayMethod === "MOBILE_MONEY"
                      ? "bg-[#E3F3EA] border-[#2D7A52] text-[#2D7A52]"
                      : "border-[#E9EDEA] text-[#94A29C] hover:border-[#2D7A52]"
                  }`}
                >
                  Online Payment (Airtel, TNM or Bank via PayChangu)
                </button>
                <button
                  type="button"
                  onClick={() => setRepayMethod("CASH")}
                  className={`flex-1 py-2.5 px-3 rounded-[10px] text-[13px] font-bold border transition-all ${
                    repayMethod === "CASH"
                      ? "bg-[#E3F3EA] border-[#2D7A52] text-[#2D7A52]"
                      : "border-[#E9EDEA] text-[#94A29C] hover:border-[#2D7A52]"
                  }`}
                >
                  Cash
                </button>
              </div>
            </div>

            {repayMethod === "MOBILE_MONEY" && (
              <p className="text-[11.5px] text-[#5B6B65] bg-[#F1F4F2] rounded-[8px] p-3">
                You will be redirected to PayChangu to complete your payment securely.
              </p>
            )}

            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setShowRepayModal(null)}>Cancel</Button>
              <Button theme="green" onClick={handleRepay} disabled={repaySubmitting}>
                {repaySubmitting ? "Processing…" : repayMethod === "MOBILE_MONEY" ? "Pay Online Now" : "Confirm Cash"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};
