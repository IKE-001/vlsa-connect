'use client';

import React, { useState, useEffect } from "react";
import { MemberDashboardTemplate } from "@/components/templates/MemberDashboardTemplate/MemberDashboardTemplate";
import { GroupOnboarding } from "@/components/templates/GroupOnboarding/GroupOnboarding";
import { LoanVotingPanel } from "@/components/organisms/LoanVotingPanel";
import { GroupDirectory } from "@/components/organisms/GroupDirectory";
import { HealthScoreChart } from "@/components/organisms/HealthScoreChart";
import { UpcomingMeetings } from "@/components/organisms/UpcomingMeetings";
import { useProfile } from "@/hooks/useProfile";
import { useSavings } from "@/hooks/useSavings";
import { useLoans } from "@/hooks/useLoans";
import { useMeetings } from "@/hooks/useMeetings";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId, api } from "@/lib/api/client";

export default function MemberDashboardPage() {
  const { profile, isLoading: profileLoading } = useProfile();
  const [userGroupId, setUserGroupId] = useState<string | null>(null);
  const [checkingGroups, setCheckingGroups] = useState(true);

  useEffect(() => {
    async function checkUserGroups() {
      try {
        const res = await fetch("/api/groups");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // User belongs to at least 1 group
          const storedId = localStorage.getItem("vsla_active_group_id");
          const belongsToStored = json.data.some((g: any) => g.id === storedId);
          const activeId = belongsToStored ? storedId : json.data[0].id;
          
          setActiveGroupId(activeId);
          setUserGroupId(activeId);
        } else {
          // User belongs to NO groups -> clear stale localStorage ID
          localStorage.removeItem("vsla_active_group_id");
          setUserGroupId(null);
        }
      } catch (err) {
        console.error("Failed to check user groups:", err);
      } finally {
        setCheckingGroups(false);
      }
    }

    if (!profileLoading) {
      checkUserGroups();
    }
  }, [profileLoading]);

  if (profileLoading || checkingGroups) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F4F2]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#2E7D46', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // If user has no active group, render Create or Join Group Onboarding!
  if (!userGroupId) {
    return <GroupOnboarding userName={profile?.fullName} />;
  }

  return <MemberDashboardWithGroup groupId={userGroupId} profile={profile} />;
}

/** Separated so hooks only run when a real groupId is available */
function MemberDashboardWithGroup({
  groupId,
  profile,
}: {
  groupId: string;
  profile: ReturnType<typeof useProfile>['profile'];
}) {
  const { groupName, members, group, groupHealth, refresh } = useGroup(groupId);
  const myMember = members.find((m) => m.userId === profile?.userId);
  const myMemberId = myMember?.id;
  const myRole = myMember?.roleInGroup ?? 'MEMBER';

  const { contributions, balanceTambala } = useSavings({ groupId, memberId: myMemberId });
  const { loans, voteLoan } = useLoans({ groupId, callerMemberId: myMemberId });
  const { meetings, confirmAttendance, scheduleMeeting, refresh: refreshMeetings } = useMeetings(groupId);

  const pendingLoans = loans.filter((l) => l.status === 'PENDING');
  const isGovernanceRole = myRole === 'CHAIRPERSON' || myRole === 'TREASURER' || myRole === 'SECRETARY';
  const isChairperson = myRole === 'CHAIRPERSON';
  const canSchedule = myRole === 'CHAIRPERSON' || myRole === 'SECRETARY';

  const handleUpdateRole = async (memberId: string, role: string) => {
    await api.patch(`/api/groups/${groupId}/members/${memberId}/role`, { role });
    await refresh();
  };

  const handleScheduleMeeting = async (title: string, scheduledAt: string, location: string, agenda: string) => {
    await scheduleMeeting({ title, scheduledAt: new Date(scheduledAt).toISOString(), location, agendaNotes: agenda });
  };

  const handleSaveMinutes = async (meetingId: string, minutes: string) => {
    await api.post(`/api/meetings/${meetingId}/minutes`, { minutes });
    await refreshMeetings();
  };

  const governanceWidgets = isGovernanceRole ? (
    <>
      {groupHealth && (
        <HealthScoreChart scoreData={groupHealth} groupName={groupName} />
      )}
      <LoanVotingPanel
        pendingLoans={pendingLoans}
        members={members}
        onVote={voteLoan}
      />
      <GroupDirectory
        members={members.map((m) => ({
          id: m.id,
          fullName: m.fullName,
          phoneNumber: m.phoneNumber,
          roleInGroup: m.roleInGroup,
          avatarUrl: m.avatarUrl,
          email: null,
        }))}
        isChairperson={isChairperson}
        onUpdateRole={handleUpdateRole}
      />
      <UpcomingMeetings
        meetings={meetings}
        onRSVP={(id) => { void confirmAttendance(id, myMemberId ?? ''); }}
        onScheduleMeeting={canSchedule ? handleScheduleMeeting : undefined}
        onSaveMinutes={canSchedule ? handleSaveMinutes : undefined}
      />
    </>
  ) : undefined;

  return (
    <MemberDashboardTemplate
      user={profile}
      groupName={groupName}
      inviteCode={group?.inviteCode ?? "N/A"}
      membersCount={members.length}
      memberBalances={
        balanceTambala !== null
          ? {
              memberId: profile?.userId ?? "",
              groupId,
              totalContributedTambala: balanceTambala,
              approvedContributions: contributions.filter((c) => c.status === "APPROVED").length,
              pendingContributions: contributions.filter((c) => c.status === "PENDING").length,
            }
          : null
      }
      contributions={contributions}
      loans={loans}
      meetings={meetings}
      totalGroupSavings={group?.totalPoolTambala ?? 0}
      governanceWidgets={governanceWidgets}
    />
  );
}
