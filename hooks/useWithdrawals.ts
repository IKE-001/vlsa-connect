'use client';

/**
 * hooks/useWithdrawals.ts — real API integration with mock fallback
 *
 * GET  /api/withdrawals?groupId=&memberId= → list withdrawal requests
 * POST /api/withdrawals                    → submit a withdrawal request
 * POST /api/withdrawals/[id]/vote          → cast vote
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type { WithdrawalWithVotes } from '@/types/financial';

// ---------------------------------------------------------------------------
// Mock fallback — used when DB is empty (dev / demo). Remove once seeded.
// ---------------------------------------------------------------------------
const MOCK_WITHDRAWALS: WithdrawalWithVotes[] = [
  {
    id: "w-001",
    groupId: "group-001",
    memberId: "member-001",
    amountTambala: 5000000,
    reason: "Emergency medical expenses for family member",
    status: "PENDING",
    createdAt: new Date("2026-07-22"),
    votes: [
      { id: "wv-001", requestId: "w-001", voterId: "member-002", decision: "APPROVE", note: null, votedAt: new Date("2026-07-22") },
    ],
    approveCount: 1,
    rejectCount: 0,
    quorumNeeded: 3,
  },
  {
    id: "w-002",
    groupId: "group-001",
    memberId: "member-004",
    amountTambala: 3000000,
    reason: "School fees for children — secondary school",
    status: "PENDING",
    createdAt: new Date("2026-07-24"),
    votes: [],
    approveCount: 0,
    rejectCount: 0,
    quorumNeeded: 3,
  },
  {
    id: "w-003",
    groupId: "group-001",
    memberId: "member-005",
    amountTambala: 8000000,
    reason: "Business capital for market stall",
    status: "PAID_OUT",
    createdAt: new Date("2026-06-10"),
    votes: [
      { id: "wv-002", requestId: "w-003", voterId: "member-002", decision: "APPROVE", note: null, votedAt: new Date("2026-06-11") },
      { id: "wv-003", requestId: "w-003", voterId: "member-003", decision: "APPROVE", note: null, votedAt: new Date("2026-06-11") },
      { id: "wv-004", requestId: "w-003", voterId: "member-006", decision: "APPROVE", note: null, votedAt: new Date("2026-06-12") },
    ],
    approveCount: 3,
    rejectCount: 0,
    quorumNeeded: 3,
  },
];

interface UseWithdrawalsOptions {
  groupId: string;
  memberId?: string;
  callerMemberId?: string;
}

interface WithdrawalsState {
  withdrawals: WithdrawalWithVotes[];
  isLoading: boolean;
  error: string | null;
}

export function useWithdrawals({ groupId, memberId, callerMemberId }: UseWithdrawalsOptions) {
  const [state, setState] = useState<WithdrawalsState>({
    withdrawals: [],
    isLoading: true,
    error: null,
  });

  const fetchWithdrawals = useCallback(async () => {
    if (!groupId) {
      setState({ withdrawals: MOCK_WITHDRAWALS, isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ groupId });
      if (memberId) params.set('memberId', memberId);
      const data = await api.get<{ items: WithdrawalWithVotes[]; total: number }>(
        `/api/withdrawals?${params}`
      );
      const items = data.items ?? [];
      setState({ withdrawals: items.length > 0 ? items : MOCK_WITHDRAWALS, isLoading: false, error: null });
    } catch {
      setState({ withdrawals: MOCK_WITHDRAWALS, isLoading: false, error: null });
    }
  }, [groupId, memberId]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const requestWithdrawal = useCallback(
    async (amountTambala: number, reason: string) => {
      if (!callerMemberId) throw new Error('callerMemberId required to request withdrawal.');
      await api.post('/api/withdrawals', {
        groupId,
        memberId: callerMemberId,
        amountTambala,
        reason,
      });
      await fetchWithdrawals();
    },
    [groupId, callerMemberId, fetchWithdrawals]
  );

  const voteWithdrawal = useCallback(
    async (requestId: string, decision: 'APPROVE' | 'REJECT', note?: string) => {
      if (!callerMemberId) throw new Error('callerMemberId required to vote.');
      await api.post(`/api/withdrawals/${requestId}/vote`, {
        voterId: callerMemberId,
        decision,
        ...(note ? { note } : {}),
      });
      await fetchWithdrawals();
    },
    [callerMemberId, fetchWithdrawals]
  );

  return {
    withdrawals: state.withdrawals,
    isLoading: state.isLoading,
    error: state.error,
    requestWithdrawal,
    voteWithdrawal,
    refresh: fetchWithdrawals,
  };
}
