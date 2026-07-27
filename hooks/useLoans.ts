'use client';

/**
 * hooks/useLoans.ts — real API integration
 *
 * GET  /api/loans?groupId=&memberId= → list loans
 * POST /api/loans                    → request a loan
 * POST /api/loans/[id]/vote          → cast vote (chairperson/treasurer/secretary)
 * POST /api/loans/[id]/repay         → make repayment
 *
 * Requires:
 *   - vsla_token cookie (middleware injects x-caller-member-id etc.)
 *   - x-active-group-id in localStorage (api client injects it)
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { LoanWithVotes } from '@/types/financial';

interface UseLoansOptions {
  groupId: string;
  memberId?: string;
  /** Caller's GroupMember.id — used to authorise self-service requests */
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
    if (!groupId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ groupId });
      if (memberId) params.set('memberId', memberId);
      const data = await api.get<{ items: LoanWithVotes[]; total: number }>(
        `/api/loans?${params}`
      );
      setState({ loans: data.items ?? [], isLoading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load loans.';
      setState((s) => ({ ...s, isLoading: false, error: msg }));
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
