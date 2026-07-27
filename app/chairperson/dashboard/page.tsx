'use client';

import React from 'react';
import { ChairpersonShell } from '@/components/templates/ChairpersonShell';
import { DashboardStats } from '@/components/organisms/DashboardStats';
import { LoanVotingPanel } from '@/components/organisms/LoanVotingPanel';
import { GroupDirectory } from '@/components/organisms/GroupDirectory';
import { HealthScoreChart } from '@/components/organisms/HealthScoreChart';
import { UpcomingMeetings } from '@/components/organisms/UpcomingMeetings';
import { useLoans } from '@/hooks/useLoans';
import { useGroup } from '@/hooks/useGroup';
import { useMeetings } from '@/hooks/useMeetings';
import { useProfile } from '@/hooks/useProfile';
import { setActiveGroupId } from '@/lib/api/client';
import { CheckSquare, Users, Activity, Calendar } from 'lucide-react';

// Chairperson reads their active group from localStorage (set at login / group select).
function getStoredGroupId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vsla_active_group_id') ?? '';
}

export default function ChairpersonDashboardPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members, groupHealth, groupName } = useGroup(groupId);
  const { meetings, confirmAttendance } = useMeetings(groupId);

  // callerMemberId must be GroupMember.id (not User.id)
  const myMember = members.find((m) => m.userId === profile?.userId);
  const callerMemberId = myMember?.id ?? '';

  const { loans, voteLoan } = useLoans({ groupId, callerMemberId });
  const pendingLoans = loans.filter((l) => l.status === 'PENDING');
  // SCHEDULED maps to what was previously called UPCOMING in mock
  const scheduledMeetings = meetings.filter((m) => m.status === 'SCHEDULED');

  const stats = [
    {
      label: 'Pending Votes',
      value: String(pendingLoans.length),
      subtext: 'Loan applications awaiting committee vote',
      icon: <CheckSquare className="w-5 h-5 text-emerald-600" />,
      trend: 'neutral' as const,
      trendText: 'Requires immediate action',
    },
    {
      label: 'Group Members',
      value: String(members.length),
      subtext: `In ${groupName}`,
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      trend: 'up' as const,
      trendText: members.length > 0 ? `${members.length} active members` : 'Loading…',
    },
    {
      label: 'Health Score',
      value: groupHealth ? `${groupHealth.score}/100` : 'N/A',
      subtext: 'Group creditworthiness rating',
      icon: <Activity className="w-5 h-5 text-emerald-600" />,
      trend: 'up' as const,
      trendText: groupHealth ? 'Score Up to Date' : 'Loading…',
    },
    {
      label: 'Scheduled Meetings',
      value: String(scheduledMeetings.length),
      subtext: 'Upcoming share-out assemblies',
      icon: <Calendar className="w-5 h-5 text-emerald-600" />,
      trend: 'neutral' as const,
      trendText: 'Next upcoming assembly',
    },
  ];

  return (
    <ChairpersonShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Chairperson Governance Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Oversee approvals, member compliance, attendance, and group financial health
          </p>
        </div>

        <DashboardStats stats={stats} columns={4} />

        {groupHealth && (
          <HealthScoreChart
            scoreData={groupHealth}
            groupName={groupName}
          />
        )}

        <LoanVotingPanel
          pendingLoans={pendingLoans}
          members={members}
          onVote={voteLoan}
        />

        <GroupDirectory members={members.map((m) => ({
          id: m.id,
          name: m.fullName,
          phone: m.phoneNumber,
          role: m.roleInGroup,
          avatarUrl: m.avatarUrl,
          email: null,
        }))} />

        <UpcomingMeetings meetings={meetings} onRSVP={(id) => { void confirmAttendance(id, ''); }} />
      </div>
    </ChairpersonShell>
  );
}
