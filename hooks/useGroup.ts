'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
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

const MOCK_GROUP: GroupDetail = {
  id: "group-001",
  name: "Tikondane Women Group",
  description: "A savings group dedicated to empowering women in Lilongwe through collective savings and affordable credit.",
  inviteCode: "TKD-2026",
  totalPoolTambala: 328000000, // MWK 3,280,000
  meetingFrequency: "MONTHLY",
  members: [
    { id: "member-001", userId: "user-001", fullName: "Grace Phiri",       phoneNumber: "+265 999 111 001", avatarUrl: null, roleInGroup: "CHAIRPERSON", status: "ACTIVE", joinedAt: "2025-01-15" },
    { id: "member-002", userId: "user-002", fullName: "Beatrice Mwale",    phoneNumber: "+265 999 111 002", avatarUrl: null, roleInGroup: "TREASURER",   status: "ACTIVE", joinedAt: "2025-01-15" },
    { id: "member-003", userId: "user-003", fullName: "Ruth Banda",        phoneNumber: "+265 999 111 003", avatarUrl: null, roleInGroup: "SECRETARY",   status: "ACTIVE", joinedAt: "2025-01-15" },
    { id: "member-004", userId: "user-004", fullName: "Chisomo Tembo",     phoneNumber: "+265 999 111 004", avatarUrl: null, roleInGroup: "MEMBER",      status: "ACTIVE", joinedAt: "2025-02-01" },
    { id: "member-005", userId: "user-005", fullName: "Mphatso Chirwa",    phoneNumber: "+265 999 111 005", avatarUrl: null, roleInGroup: "MEMBER",      status: "ACTIVE", joinedAt: "2025-02-01" },
    { id: "member-006", userId: "user-006", fullName: "Tadala Nkosi",      phoneNumber: "+265 999 111 006", avatarUrl: null, roleInGroup: "MEMBER",      status: "ACTIVE", joinedAt: "2025-03-10" },
    { id: "member-007", userId: "user-007", fullName: "Zanele Mvula",      phoneNumber: "+265 999 111 007", avatarUrl: null, roleInGroup: "MEMBER",      status: "ACTIVE", joinedAt: "2025-03-10" },
    { id: "member-008", userId: "user-008", fullName: "Kondwani Ntchisi",  phoneNumber: "+265 999 111 008", avatarUrl: null, roleInGroup: "MEMBER",      status: "SUSPENDED", joinedAt: "2025-04-05" },
  ],
};

const MOCK_HEALTH: HealthScoreBreakdown = {
  score: 78,
  savingsComponent: 28,
  repaymentComponent: 25,
  attendanceComponent: 16,
  governanceComponent: 9,
  computedAt: new Date("2026-07-25"),
};

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupHealth, setGroupHealth] = useState<HealthScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) {
      setGroup(MOCK_GROUP);
      setMembers(MOCK_GROUP.members);
      setGroupHealth(MOCK_HEALTH);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [grp, healthTrend] = await Promise.all([
        api.get<GroupDetail>(`/api/groups/${groupId}`),
        api.get<HealthScoreBreakdown[]>(`/api/health-score/${groupId}/trend`).catch(() => null),
      ]);

      const resolvedGroup = grp ?? MOCK_GROUP;
      const rawMembers = (resolvedGroup.members ?? []).map((m: any) => ({
        ...m,
        fullName: m.user?.fullName ?? m.fullName ?? 'Unknown Member',
        avatarUrl: m.user?.avatarUrl ?? m.avatarUrl ?? null,
        phoneNumber: m.user?.phoneNumber ?? m.phoneNumber ?? 'N/A',
      }));

      setGroup(resolvedGroup);
      setMembers(rawMembers.length > 0 ? rawMembers : MOCK_GROUP.members);
      setGroupHealth(healthTrend && healthTrend.length > 0 ? healthTrend[0] : MOCK_HEALTH);
    } catch {
      setGroup(MOCK_GROUP);
      setMembers(MOCK_GROUP.members);
      setGroupHealth(MOCK_HEALTH);
    } finally {
      setIsLoading(false);
      setError(null);
    }
  }, [groupId]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  return {
    group,
    groupId,
    groupName: group?.name ?? MOCK_GROUP.name,
    members,
    groupHealth,
    isLoading,
    error,
    refresh: fetchGroup,
  };
}
