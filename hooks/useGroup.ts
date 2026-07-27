'use client';

/**
 * hooks/useGroup.ts — real API integration
 *
 * GET /api/groups/[id]         → group details + member list (group.members)
 * GET /api/groups/[id]/members → paginated member list
 * GET /api/health-score/[groupId]/trend → health score trend
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { HealthScoreBreakdown } from '@/types/financial';

interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  roleInGroup: string;
  status: string;
  joinedAt: string;
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  totalPoolTambala: number;
  meetingFrequency: string;
  members: GroupMember[];
}

interface GroupState {
  group: GroupDetail | null;
  members: GroupMember[];
  groupHealth: HealthScoreBreakdown | null;
  isLoading: boolean;
  error: string | null;
}

export function useGroup(groupId: string) {
  const [state, setState] = useState<GroupState>({
    group: null,
    members: [],
    groupHealth: null,
    isLoading: true,
    error: null,
  });

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [group, healthTrend] = await Promise.all([
        api.get<GroupDetail>(`/api/groups/${groupId}`),
        api
          .get<HealthScoreBreakdown[]>(`/api/health-score/${groupId}/trend`)
          .catch(() => null), // health score is non-critical
      ]);
      setState({
        group,
        members: (group.members ?? []).map((m: any) => ({
          ...m,
          fullName: m.user?.fullName ?? 'Unknown Member',
          avatarUrl: m.user?.avatarUrl ?? null,
          phoneNumber: m.user?.phoneNumber ?? m.phoneNumber ?? 'N/A'
        })),
        groupHealth: healthTrend && healthTrend.length > 0 ? healthTrend[0] : null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load group.';
      setState((s) => ({ ...s, isLoading: false, error: msg }));
    }
  }, [groupId]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  return {
    group: state.group,
    groupId,
    groupName: state.group?.name ?? '',
    members: state.members,
    groupHealth: state.groupHealth,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchGroup,
  };
}
