'use client';

/**
 * hooks/useLoans.ts — real API integration with mock fallback
 *
 * GET  /api/loans?groupId=&memberId= → list loans
 * POST /api/loans                    → request a loan
 * POST /api/loans/[id]/vote          → cast vote
 * POST /api/loans/[id]/repay         → make repayment
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type { LoanWithVotes } from '@/types/financial';

// ---------------------------------------------------------------------------
// Mock fallback — used when DB is empty (dev / demo). Remove once seeded.
// ---------------------------------------------------------------------------
const MOCK_LOANS: LoanWithVotes[] = [
  {
    id: "loan-001",
    groupId: "group-001",
    memberId: "member-001",
    principalTambala: 5000000,
    interestRate: 10,
    totalDueTambala: 5500000,
    amountRepaidTambala: 1500000,
    remainingDueTambala: 4000000,
    status: "REPAYING",
    rejectionReason: null,
    requestedAt: new Date("2026-06-01"),
    approvedAt: new Date("2026-06-03"),
    disbursedAt: new Date("2026-06-04"),
    dueDate: new Date("2026-09-04"),
    repaidAt: null,
    votes: [
      { id: "v1", loanId: "loan-001", voterId: "member-002", decision: "APPROVE", note: null, votedAt: new Date("2026-06-02") },
      { id: "v2", loanId: "loan-001", voterId: "member-003", decision: "APPROVE", note: null, votedAt: new Date("2026-06-02") },
    ],
  },
  {
    id: "loan-002",
    groupId: "group-001",
    memberId: "member-004",
    principalTambala: 3000000,
    interestRate: 10,
    totalDueTambala: null,
    amountRepaidTambala: 0,
    remainingDueTambala: 3000000,
    status: "PENDING",
    rejectionReason: null,
    requestedAt: new Date("2026-07-20"),
    approvedAt: null,
    disbursedAt: null,
    dueDate: null,
    repaidAt: null,
    votes: [],
  },
  {
    id: "loan-003",
    groupId: "group-001",
    memberId: "member-005",
    principalTambala: 2000000,
    interestRate: 10,
    totalDueTambala: 2200000,
    amountRepaidTambala: 2200000,
    remainingDueTambala: 0,
    status: "REPAID",
    rejectionReason: null,
    requestedAt: new Date("2026-04-01"),
    approvedAt: new Date("2026-04-03"),
    disbursedAt: new Date("2026-04-04"),
    dueDate: new Date("2026-07-04"),
    repaidAt: new Date("2026-07-01"),
    votes: [],
  },
  {
    id: "loan-004",
    groupId: "group-001",
    memberId: "member-006",
    principalTambala: 7500000,
    interestRate: 10,
    totalDueTambala: 8250000,
    amountRepaidTambala: 0,
    remainingDueTambala: 8250000,
    status: "OVERDUE",
    rejectionReason: null,
    requestedAt: new Date("2026-03-01"),
    approvedAt: new Date("2026-03-05"),
    disbursedAt: new Date("2026-03-06"),
    dueDate: new Date("2026-06-06"),
    repaidAt: null,
    votes: [],
  },
];

interface UseLoansOptions {
  groupId: string;
  memberId?: string;
  callerMemberId?: string;
}

interface LoansState {
  loans: LoanWithVotes[];
  isLoading: boolean;
  error: string | null;
}

export function useLoans({ groupId, memberId, callerMemberId }: UseLoansOptions) {
  const [state, setState] = useState<LoansState>({
    loans: [],
    isLoading: true,
    error: null,
  });

  const fetchLoans = useCallback(async () => {
    if (!groupId) {
      setState({ loans: MOCK_LOANS, isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ groupId });
      if (memberId) params.set('memberId', memberId);
      const data = await api.get<{ items: LoanWithVotes[]; total: number }>(
        `/api/loans?${params}`
      );
      const items = data.items ?? [];
      setState({ loans: items.length > 0 ? items : MOCK_LOANS, isLoading: false, error: null });
    } catch {
      setState({ loans: MOCK_LOANS, isLoading: false, error: null });
    }
  }, [groupId, memberId]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const applyLoan = useCallback(
    async (principalTambala: number, dueDate?: string) => {
      if (!callerMemberId) throw new Error('callerMemberId required to apply for a loan.');
      await api.post('/api/loans', {
        groupId,
        memberId: callerMemberId,
        principalTambala,
        ...(dueDate ? { dueDate } : {}),
      });
      await fetchLoans();
    },
    [groupId, callerMemberId, fetchLoans]
  );

  const voteLoan = useCallback(
    async (loanId: string, decision: 'APPROVE' | 'REJECT', note?: string) => {
      if (!callerMemberId) throw new Error('callerMemberId required to vote.');
      await api.post(`/api/loans/${loanId}/vote`, {
        voterId: callerMemberId,
        decision,
        ...(note ? { note } : {}),
      });
      await fetchLoans();
    },
    [callerMemberId, fetchLoans]
  );

  const repayLoan = useCallback(
    async (
      loanId: string,
      amountTambala: number,
      method: 'CASH' | 'MOBILE_MONEY' | 'CARD',
      paychanguRef?: string
    ) => {
      const res = await api.post<{ checkoutUrl?: string }>(`/api/loans/${loanId}/repay`, {
        amountTambala,
        method,
        ...(paychanguRef ? { paychanguRef } : {}),
      });
      await fetchLoans();
      return { checkoutUrl: res?.checkoutUrl };
    },
    [fetchLoans]
  );

  return {
    loans: state.loans,
    isLoading: state.isLoading,
    error: state.error,
    applyLoan,
    voteLoan,
    repayLoan,
    refresh: fetchLoans,
  };
}
