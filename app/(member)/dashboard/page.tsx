'use client';

import React from "react";
import { MemberDashboardTemplate } from "@/components/templates/MemberDashboardTemplate/MemberDashboardTemplate";
import { GroupOnboarding } from "@/components/templates/GroupOnboarding/GroupOnboarding";
import { useProfile } from "@/hooks/useProfile";
import { useSavings } from "@/hooks/useSavings";
import { useLoans } from "@/hooks/useLoans";
import { useMeetings } from "@/hooks/useMeetings";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MemberDashboardPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile, isLoading: profileLoading } = useProfile();

  // If profile is still loading, show nothing (prevents onboarding flash)
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F4F2]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#2E7D46', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // No group context → show onboarding to create or join a group
  if (!groupId) {
    return <GroupOnboarding userName={profile?.fullName} />;
  }

  return <MemberDashboardWithGroup groupId={groupId} profile={profile} />;
}

/** Separated so hooks only run when a real groupId is available */
function MemberDashboardWithGroup({
  groupId,
  profile,
}: {
  groupId: string;
  profile: ReturnType<typeof useProfile>['profile'];
}) {
  const { contributions, balanceTambala } = useSavings({ groupId, memberId: profile?.userId });
  const { loans } = useLoans({ groupId, callerMemberId: profile?.userId });
  const { meetings } = useMeetings(groupId);
  const { groupName, members, group } = useGroup(groupId);

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
    />
  );
}
