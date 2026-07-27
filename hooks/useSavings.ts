'use client';

/**
 * hooks/useSavings.ts — real API integration
 *
 * GET  /api/savings?groupId=&memberId= → member balance (when memberId provided)
 * GET  /api/savings?groupId=           → contribution history list
 * POST /api/savings                    → log a contribution (Treasurer only)
 * PATCH /api/savings/[id]              → approve/reject contribution (Chairperson only)
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';
import type { ContributionRecord } from '@/types/financial';

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
    if (!groupId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ groupId });
      if (memberId) params.set('memberId', memberId);

      if (memberId) {
        // Returns balance object
        const balance = await api.get<{ totalSavedTambala: number; memberId: string }>(
          `/api/savings?${params}`
        );
        setState((s) => ({
          ...s,
          balanceTambala: balance.totalSavedTambala,
          isLoading: false,
          error: null,
        }));
      } else {
        // Returns paginated contribution list
        const data = await api.get<{ items: ContributionRecord[]; total: number }>(
          `/api/savings?${params}`
        );
        setState({
          contributions: data.items ?? [],
          balanceTambala: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load savings.';
      setState((s) => ({ ...s, isLoading: false, error: msg }));
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
