"use client";
import Link from "next/link";
import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React from "react";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { formatMWK } from "@/lib/utils/money";
import { ContributionRecord } from "@/types/financial";

export interface MemberSavingsGoalTemplateProps {
  savedTambala: number;
  goalAmountTambala?: number;
  contributions?: ContributionRecord[];
}

export const MemberSavingsGoalTemplate: React.FC<MemberSavingsGoalTemplateProps> = ({
  savedTambala,
  goalAmountTambala = 50000000, // 500,000 MWK default
  contributions = [],
}) => {
  const pct = Math.min(Math.round((savedTambala / goalAmountTambala) * 100), 100);

  // Build monthly contribution totals from real data
  const monthlyTotals: number[] = Array(12).fill(0);
  contributions.forEach((c) => {
    const month = new Date(c.createdAt).getMonth(); // 0-11
    monthlyTotals[month] += c.amountTambala;
  });
  const maxMonthly = Math.max(...monthlyTotals, 1);
  const monthlyPcts = monthlyTotals.map((v) => Math.round((v / maxMonthly) * 100));

  const milestones = [
    { label: "50% Milestone", target: goalAmountTambala * 0.5, icon: "star" as const },
    { label: "75% Milestone", target: goalAmountTambala * 0.75, icon: "goal" as const },
    { label: "100% Goal",     target: goalAmountTambala,        icon: "layers" as const },
  ];

  const months = ["J","F","M","A","M","J","J","A","S","O","N","D"];

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><MemberSidebar activePath="/savings-goal" /></div>
      <div className="flex-1 min-w-0 flex flex-col pb-12">

        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Savings Goal</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Track your personal savings milestones</p>
          </div>
          <Button theme="green" leftIcon={<Icon name="goal" className="w-4 h-4" />}>Set New Goal</Button>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">

          {/* Goal hero card */}
          <div className="bg-gradient-to-r from-[#123A29] to-[#2D7A52] rounded-[20px] p-6 text-white">
            <div className="text-[12.5px] text-[#B9D4C6] font-semibold mb-1">Annual Savings Target {new Date().getFullYear()}</div>
            <div className="text-[32px] font-extrabold tracking-tight">{formatMWK(goalAmountTambala)}</div>
            <div className="text-[13px] text-[#B9D4C6] mt-1">
              {formatMWK(savedTambala)} saved · {formatMWK(Math.max(0, goalAmountTambala - savedTambala))} remaining
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-[12px] font-bold mb-2">
                <span>Progress</span><span>{pct}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5BE38A] rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Monthly contributions chart — real data */}
          <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
            <h2 className="text-[15px] font-extrabold text-[#1B2321] mb-4">Monthly Contribution Progress</h2>
            {contributions.length === 0 ? (
              <div className="text-sm text-[#94A29C] text-center py-8">No contributions recorded yet</div>
            ) : (
              <div className="flex items-end gap-2 h-[110px]">
                {monthlyPcts.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-[4px] bg-[#2D7A52]/15 overflow-hidden" style={{ height: "90px" }}>
                      <div
                        className="w-full bg-[#2D7A52] rounded-[4px] transition-all duration-500"
                        style={{ height: `${v}%`, marginTop: `${100 - v}%` }}
                      />
                    </div>
                    <span className="text-[9.5px] text-[#94A29C] font-semibold">{months[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestone cards — dynamic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {milestones.map((m, i) => {
              const reached = savedTambala >= m.target;
              return (
                <div key={i} className={`rounded-[16px] p-4 border flex items-center gap-3.5 ${reached ? "bg-[#E3F3EA] border-[#C9EAD5]" : "bg-white border-[#E9EDEA]"}`}>
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${reached ? "bg-[#2D7A52] text-white" : "bg-[#F1F4F2] text-[#94A29C]"}`}>
                    <Icon name={m.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-extrabold text-[#1B2321]">{m.label}</div>
                    <div className="text-[12px] text-[#5B6B65] mt-0.5">{formatMWK(m.target)}</div>
                    <div className={`text-[11px] font-bold mt-1 ${reached ? "text-[#2D7A52]" : "text-[#94A29C]"}`}>
                      {reached ? "✓ Reached" : "Not yet"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA if 0 contributions */}
          {contributions.length === 0 && (
            <div className="bg-white border border-[#E9EDEA] rounded-[18px] p-5 text-center">
              <p className="text-[13px] text-[#5B6B65] mb-3">Start contributing to track your progress toward your savings goal.</p>
              <Link href="/contributions">
                <Button theme="green" leftIcon={<Icon name="arrow-down-circle" className="w-4 h-4" />}>Make First Contribution</Button>
              </Link>
            </div>
          )}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
