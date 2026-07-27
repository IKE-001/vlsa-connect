"use client";
import React, { useState } from "react";
import { BankerSidebar } from "@/components/organisms/BankerSidebar/BankerSidebar";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { BankerCreditApproval } from "@/hooks/useBanker";

type Filter = "all" | "pending" | "approved" | "rejected";

export interface BankerCreditApprovalsTemplateProps {
  approvals: BankerCreditApproval[];
  isLoading: boolean;
}

const statusBadge: Record<string, "orange" | "green" | "red"> = { pending: "orange", approved: "green", rejected: "red" };

export const BankerCreditApprovalsTemplate: React.FC<BankerCreditApprovalsTemplateProps> = ({
  approvals,
  isLoading,
}) => {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = filter === "all" ? approvals : approvals.filter(a => a.status === filter);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F2F4F8] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><BankerSidebar activePath="/bank-officer/credit-approvals" pendingApprovalsCount={approvals.filter(a => a.status === 'pending').length} /></div>
      <div className="flex-1 min-w-0 flex flex-col pb-12">

        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#EBEEF4] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#182233]">Credit Approvals</h1>
            <p className="text-[12.5px] text-[#5C6B85] mt-0.5 font-medium">Review and action group credit line requests</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-[#FDEAEA] text-[#DC2626] animate-pulse">{approvals.filter(a => a.status === 'pending').length} Pending</span>
          </div>
        </header>

        <main className="p-4 md:p-6 flex flex-col gap-5">

          {/* Filters */}
          <div className="flex gap-2">
            {(["all","pending","approved","rejected"] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-bold border capitalize transition-all ${filter === f ? "bg-[#2F6FED] text-white border-[#2F6FED]" : "bg-white text-[#5C6B85] border-[#EBEEF4] hover:border-[#2F6FED]/40"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Approval cards */}
          <div className="flex flex-col gap-3">
              {isLoading && (
                <div className="text-center py-12 text-[#9AA6BC] text-sm font-medium">Loading credit requests...</div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-12 text-[#9AA6BC] text-sm font-medium">No credit requests found.</div>
              )}
              {!isLoading && filtered.map((req) => (
                <div key={req.id} className={`bg-white rounded-[16px] border transition-all shadow-[0_2px_8px_rgba(11,30,58,0.04)] ${selected === req.id ? "border-[#2F6FED] shadow-[0_4px_20px_rgba(47,111,237,0.12)]" : "border-[#EBEEF4] hover:border-[#BFCCEE]"}`}>
                <button className="w-full text-left px-5 py-4 flex items-center gap-4" onClick={() => setSelected(selected === req.id ? null : req.id)}>
                  <div className="w-10 h-10 rounded-[10px] bg-[#E8EFFD] text-[#2F6FED] flex items-center justify-center shrink-0">
                    <Icon name="doc" className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-extrabold text-[#182233] truncate">{req.group}</span>
                      <Badge variant={statusBadge[req.status]} size="sm">{req.status}</Badge>
                    </div>
                    <div className="text-[12px] text-[#5C6B85] mt-0.5">{req.purpose} · <span className="font-bold text-[#182233]">{req.amount}</span></div>
                  </div>
                  <Icon name="chevron-down" className={`w-4 h-4 text-[#9AA6BC] shrink-0 transition-transform ${selected === req.id ? "rotate-180" : ""}`} />
                </button>

                {selected === req.id && (
                  <div className="border-t border-[#EBEEF4] px-5 py-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { l: "Request ID",    v: req.id },
                        { l: "Members",       v: String(req.members) },
                        { l: "Group Savings", v: req.savings },
                        { l: "Credit Score",  v: `${req.score}/100` },
                      ].map((row, i) => (
                        <div key={i} className="bg-[#F5F7FA] rounded-[10px] p-3">
                          <div className="text-[11px] text-[#9AA6BC] font-bold">{row.l}</div>
                          <div className="text-[13.5px] font-extrabold text-[#182233] mt-0.5">{row.v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Score bar */}
                    <div>
                      <div className="flex justify-between text-[11.5px] font-bold mb-1.5 text-[#5C6B85]">
                        <span>Credit Score</span><span className={`${req.score >= 75 ? "text-[#16A34A]" : req.score >= 50 ? "text-[#F97316]" : "text-[#DC2626]"}`}>{req.score}/100</span>
                      </div>
                      <div className="h-2.5 bg-[#EBEEF4] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${req.score >= 75 ? "bg-[#16A34A]" : req.score >= 50 ? "bg-[#F97316]" : "bg-[#DC2626]"}`} style={{ width: `${req.score}%` }} />
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" theme="blue">Request More Info</Button>
                        <Button variant="danger" theme="blue">Reject</Button>
                        <Button theme="blue">Approve Credit Line</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};
