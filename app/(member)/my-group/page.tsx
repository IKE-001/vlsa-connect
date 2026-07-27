'use client';

import React from "react";
import { MemberMyGroupTemplate } from "@/components/templates/MemberMyGroupTemplate/MemberMyGroupTemplate";
import { useGroup } from "@/hooks/useGroup";
import { useMeetings } from "@/hooks/useMeetings";
import { useProfile } from "@/hooks/useProfile";
import { setActiveGroupId, api } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MemberMyGroupPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { group, members, groupHealth, isLoading, refresh } = useGroup(groupId);
  const { meetings } = useMeetings(groupId);

  // Find the current user's role in this group
  const myMember = members.find((m) => m.userId === profile?.userId);
  const currentUserRole = myMember?.roleInGroup;

  const handleUpdateRole = async (memberId: string, role: string) => {
    await api.patch(`/api/groups/${groupId}/members/${memberId}/role`, { role });
    await refresh();
  };

  return (
    <MemberMyGroupTemplate
      group={group}
      members={members}
      meetings={meetings}
      groupHealth={groupHealth}
      isLoading={isLoading}
      currentUserId={profile?.userId}
      currentUserRole={currentUserRole}
      onUpdateRole={handleUpdateRole}
    />
  );
}
