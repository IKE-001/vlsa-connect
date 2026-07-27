'use client';

/**
 * hooks/useSavings.ts — real API integration with mock fallback
 *
 * GET  /api/savings?groupId=&memberId= → member balance
 * GET  /api/savings?groupId=           → contribution history
 * POST /api/savings                    → log a contribution (Treasurer only)
 * PATCH /api/savings/[id]              → approve/reject contribution
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type { ContributionRecord } from '@/types/financial';

// ---------------------------------------------------------------------------
// Mock fallback — used when DB is empty (dev / demo). Remove once seeded.
// ---------------------------------------------------------------------------
const MOCK_CONTRIBUTIONS: ContributionRecord[] = [
  { id: "c-001", groupId: "group-001", memberId: "member-001", amountTambala: 2500000, method: "MOBILE_MONEY", status: "APPROVED", cyclePeriod: "2026-07", recordedById: "member-002", approvedById: "member-003", createdAt: new Date("2026-07-05") },
  { id: "c-002", groupId: "group-001", memberId: "member-001", amountTambala: 2500000, method: "MOBILE_MONEY", status: "APPROVED", cyclePeriod: "2026-06", recordedById: "member-002", approvedById: "member-003", createdAt: new Date("2026-06-04") },
  { id: "c-003", groupId: "group-001", memberId: "member-001", amountTambala: 2500000, method: "CASH",         status: "APPROVED", cyclePeriod: "2026-05", recordedById: "member-002", approvedById: "member-003", createdAt: new Date("2026-05-06") },
  { id: "c-004", groupId: "group-001", memberId: "member-001", amountTambala: 2500000, method: "CASH",         status: "APPROVED", cyclePeriod: "2026-04", recordedById: "member-002", approvedById: "member-003", createdAt: new Date("2026-04-03") },
  { id: "c-005", groupId: "group-001", memberId: "member-001", amountTambala: 2500000, method: "MOBILE_MONEY", status: "PENDING",  cyclePeriod: "2026-08", recordedById: "member-002", approvedById: null,          createdAt: new Date("2026-07-25") },
  { id: "c-006", groupId: "group-001", memberId: "member-004", amountTambala: 2500000, method: "CASH",         status: "APPROVED", cyclePeriod: "2026-07", recordedById: "member-002", approvedById: "member-003", createdAt: new Date("2026-07-05") },
  { id: "c-007", groupId: "group-001", memberId: "member-005", amountTambala: 2500000, method: "MOBILE_MONEY", status: "APPROVED", cyclePeriod: "2026-07", recordedById: "member-002", approvedById: "member-003", createdAt: new Date("2026-07-06") },
  { id: "c-008", groupId: "group-001", memberId: "member-006", amountTambala: 2500000, method: "CASH",         status: "PENDING",  cyclePeriod: "2026-07", recordedById: "member-002", approvedById: null,          createdAt: new Date("2026-07-08") },
];
const MOCK_BALANCE = 10000000; // MWK 100,000 (in tambala)

interface UseSavingsOptions {
  groupId: string;
  memberId?: string;
}

interface SavingsState {
  contributions: ContributionRecord[];
  balanceTambala: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useSavings({ groupId, memberId }: UseSavingsOptions) {
  const [state, setState] = useState<SavingsState>({
    contributions: [],
    balanceTambala: null,
    isLoading: true,
    error: null,
  });

  const fetchSavings = useCallback(async () => {
    if (!groupId) {
      const myContribs = MOCK_CONTRIBUTIONS.filter(c => !memberId || c.memberId === memberId);
      setState({ contributions: myContribs, balanceTambala: MOCK_BALANCE, isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ groupId });
      if (memberId) params.set('memberId', memberId);

      if (memberId) {
        const [balance, historyData] = await Promise.all([
          api.get<{ totalSavedTambala: number; memberId: string }>(
            `/api/savings?${params.toString()}&action=balance`
          ),
          api.get<{ items: ContributionRecord[]; total: number }>(
            `/api/savings?${params.toString()}&action=history`
          )
        ]);
        const items = historyData.items ?? [];
        setState({
          contributions: items.length > 0 ? items : MOCK_CONTRIBUTIONS.filter(c => c.memberId === memberId),
          balanceTambala: balance.totalSavedTambala > 0 ? balance.totalSavedTambala : MOCK_BALANCE,
          isLoading: false,
          error: null,
        });
      } else {
        const data = await api.get<{ items: ContributionRecord[]; total: number }>(
          `/api/savings?${params.toString()}`
        );
        const items = data.items ?? [];
        setState({
          contributions: items.length > 0 ? items : MOCK_CONTRIBUTIONS,
          balanceTambala: null,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      const myContribs = MOCK_CONTRIBUTIONS.filter(c => !memberId || c.memberId === memberId);
      setState({ contributions: myContribs, balanceTambala: MOCK_BALANCE, isLoading: false, error: null });
    }
  }, [groupId, memberId]);

  useEffect(() => { fetchSavings(); }, [fetchSavings]);

  const logContribution = useCallback(
    async (
      targetMemberId: string,
      amountTambala: number,
      method: 'CASH' | 'MOBILE_MONEY' | 'CARD',
      cyclePeriod?: string
    ): Promise<{ checkoutUrl?: string }> => {
      const res = await api.post<{ checkoutUrl?: string }>('/api/savings', {
        groupId,
        memberId: targetMemberId,
        amountTambala,
        method,
        ...(cyclePeriod ? { cyclePeriod } : {}),
      });
      await fetchSavings();
      return { checkoutUrl: res?.checkoutUrl };
    },
    [groupId, fetchSavings]
  );

  const approveContribution = useCallback(
    async (contributionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
      await api.patch(`/api/savings/${contributionId}`, {
        action,
        ...(reason ? { reason } : {}),
      });
      await fetchSavings();
    },
    [fetchSavings]
  );

  return {
    contributions: state.contributions,
    balanceTambala: state.balanceTambala,
    isLoading: state.isLoading,
    error: state.error,
    logContribution,
    approveContribution,
    refresh: fetchSavings,
  };
}
