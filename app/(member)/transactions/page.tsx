'use client';

import React, { useState, useMemo } from 'react';
import { MemberSidebar } from '@/components/organisms/MemberSidebar/MemberSidebar';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useProfile } from '@/hooks/useProfile';
import { useLoans } from '@/hooks/useLoans';
import { useSavings } from '@/hooks/useSavings';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useGroup } from '@/hooks/useGroup';
import { setActiveGroupId } from '@/lib/api/client';
import { formatMWK } from '@/lib/utils/money';
import { format } from 'date-fns';

type TabType = 'ALL' | 'DEPOSITS' | 'LOANS' | 'WITHDRAWALS';

interface TxRow {
  id: string;
  type: 'DEPOSIT' | 'LOAN_DISBURSED' | 'LOAN_REPAYMENT' | 'WITHDRAWAL';
  title: string;
  subtitle: string;
  amountTambala: number;
  isPositive: boolean;
  date: Date;
  status: string;
  statusColor: 'green' | 'orange' | 'red' | 'blue';
}

function getStoredGroupId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vsla_active_group_id') ?? '';
}

export default function TransactionHistoryPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members } = useGroup(groupId);
  const myMemberId = members.find((m) => m.userId === profile?.userId)?.id;

  const { contributions, isLoading: loadingS } = useSavings({ groupId, memberId: myMemberId });
  const { loans, isLoading: loadingL } = useLoans({ groupId, memberId: myMemberId });
  const { withdrawals, isLoading: loadingW } = useWithdrawals({ groupId, memberId: myMemberId });

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [search, setSearch] = useState('');

  const isLoading = loadingS || loadingL || loadingW;

  const allTx: TxRow[] = useMemo(() => {
    const rows: TxRow[] = [];

    contributions.forEach((c) => {
      rows.push({
        id: c.id,
        type: 'DEPOSIT',
        title: `Contribution${c.cyclePeriod ? ` — ${c.cyclePeriod}` : ''}`,
        subtitle: `${c.method === 'MOBILE_MONEY' ? 'Mobile Money' : c.method} · ${c.status}`,
        amountTambala: c.amountTambala,
        isPositive: true,
        date: new Date(c.createdAt),
        status: c.status,
        statusColor: c.status === 'APPROVED' ? 'green' : c.status === 'PENDING' ? 'orange' : 'red',
      });
    });

    loans.forEach((l) => {
      if (l.disbursedAt) {
        rows.push({
          id: `${l.id}-dis`,
          type: 'LOAN_DISBURSED',
          title: `Loan Disbursed #${l.id.substring(0, 6)}`,
          subtitle: `${l.interestRate}% interest · due ${l.dueDate ? format(new Date(l.dueDate), 'MMM dd, yyyy') : 'N/A'}`,
          amountTambala: l.principalTambala,
          isPositive: true,
          date: new Date(l.disbursedAt),
          status: l.status,
          statusColor: 'blue',
        });
      }
      if (l.amountRepaidTambala > 0) {
        rows.push({
          id: `${l.id}-rep`,
          type: 'LOAN_REPAYMENT',
          title: `Loan Repayment #${l.id.substring(0, 6)}`,
          subtitle: `Remaining: ${formatMWK(l.remainingDueTambala)}`,
          amountTambala: l.amountRepaidTambala,
          isPositive: false,
          date: l.repaidAt ? new Date(l.repaidAt) : new Date(l.requestedAt),
          status: 'REPAID',
          statusColor: 'green',
        });
      }
    });

    withdrawals.forEach((w) => {
      rows.push({
        id: w.id,
        type: 'WITHDRAWAL',
        title: `Withdrawal — ${w.reason.substring(0, 40)}`,
        subtitle: `${w.approveCount}/${w.quorumNeeded} votes · ${w.status}`,
        amountTambala: w.amountTambala,
        isPositive: false,
        date: new Date(w.createdAt),
        status: w.status,
        statusColor: w.status === 'PAID_OUT' ? 'green' : w.status === 'PENDING' ? 'orange' : 'red',
      });
    });

    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [contributions, loans, withdrawals]);

  const filtered = useMemo(() => {
    return allTx
      .filter((tx) => {
        if (activeTab === 'DEPOSITS') return tx.type === 'DEPOSIT';
        if (activeTab === 'LOANS') return tx.type === 'LOAN_DISBURSED' || tx.type === 'LOAN_REPAYMENT';
        if (activeTab === 'WITHDRAWALS') return tx.type === 'WITHDRAWAL';
        return true;
      })
      .filter((tx) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return tx.title.toLowerCase().includes(q) || tx.subtitle.toLowerCase().includes(q) || formatMWK(tx.amountTambala).toLowerCase().includes(q);
      });
  }, [allTx, activeTab, search]);

  const TABS: { key: TabType; label: string; icon: string }[] = [
    { key: 'ALL', label: 'All', icon: 'layers' },
    { key: 'DEPOSITS', label: 'Deposits', icon: 'arrow-down-circle' },
    { key: 'LOANS', label: 'Loans', icon: 'hand-coin' },
    { key: 'WITHDRAWALS', label: 'Withdrawals', icon: 'arrow-up-circle' },
  ];

  const TYPE_ICON: Record<string, { icon: string; bg: string; color: string }> = {
    DEPOSIT:          { icon: 'arrow-down-circle', bg: 'bg-[#E3F3EA]', color: 'text-[#2D7A52]' },
    LOAN_DISBURSED:   { icon: 'hand-coin',         bg: 'bg-[#E6EEFA]', color: 'text-[#4A7FC1]' },
    LOAN_REPAYMENT:   { icon: 'wallet',             bg: 'bg-[#EFE9F9]', color: 'text-[#8B6FC7]' },
    WITHDRAWAL:       { icon: 'arrow-up-circle',    bg: 'bg-[#FCEADC]', color: 'text-[#E8873A]' },
  };

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><MemberSidebar /></div>
      <div className="flex-1 min-w-0 flex flex-col pb-16">

        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Transaction History</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">All your deposits, loans, and withdrawals in one place</p>
          </div>
          <span className="text-[12px] font-semibold text-[#94A29C] bg-[#F1F4F2] px-3 py-1.5 rounded-[8px]">
            {filtered.length} records
          </span>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-4">

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-bold whitespace-nowrap border transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#2D7A52] text-white border-[#2D7A52] shadow-sm'
                    : 'bg-white text-[#5B6B65] border-[#E9EDEA] hover:border-[#2D7A52]/40'
                }`}
              >
                <Icon name={tab.icon as any} className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A29C]" />
            <input
              type="text"
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E9EDEA] rounded-[12px] pl-10 pr-4 py-2.5 text-[13px] text-[#1B2321] placeholder:text-[#94A29C] focus:outline-none focus:border-[#2D7A52] transition-colors"
            />
          </div>

          {/* Transaction list */}
          <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] overflow-hidden">
            {isLoading && <div className="py-12 text-center text-[13px] text-[#94A29C]">Loading transactions…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F1F4F2] flex items-center justify-center">
                  <Icon name="layers" className="w-5 h-5 text-[#94A29C]" />
                </div>
                <p className="text-[13px] font-semibold text-[#5B6B65]">No transactions found.</p>
              </div>
            )}
            {!isLoading && filtered.map((tx, i) => {
              const cfg = TYPE_ICON[tx.type];
              return (
                <div key={tx.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[#F1F4F2]' : ''}`}>
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon name={cfg.icon as any} className={`w-4.5 h-4.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-[#1B2321] truncate">{tx.title}</div>
                    <div className="text-[11.5px] text-[#94A29C] mt-0.5">{tx.subtitle} · {format(tx.date, 'dd MMM yyyy')}</div>
                  </div>
                  <div className={`text-[14px] font-extrabold whitespace-nowrap ${tx.isPositive ? 'text-[#2D7A52]' : 'text-[#E8873A]'}`}>
                    {tx.isPositive ? '+' : '−'}{formatMWK(tx.amountTambala)}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
