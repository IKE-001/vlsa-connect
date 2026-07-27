'use client';

import React from "react";
import { MemberProfileTemplate } from "@/components/templates/MemberProfileTemplate/MemberProfileTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MemberProfilePage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile, isLoading } = useProfile();
  const { groupName, members } = useGroup(groupId);

  // Find the current user's role in the group from members list
  const myMembership = members.find((m) => m.userId === profile?.userId);
  const enrichedProfile = profile
    ? { ...profile, roleInGroup: myMembership?.roleInGroup ?? profile.platformRole }
    : null;

  return (
    <MemberProfileTemplate
      profile={enrichedProfile}
      groupName={groupName}
      isLoading={isLoading}
    />
  );
}
