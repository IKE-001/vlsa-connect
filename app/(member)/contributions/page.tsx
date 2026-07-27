'use client';

import React from "react";
import { MemberContributionsTemplate } from "@/components/templates/MemberContributionsTemplate/MemberContributionsTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useSavings } from "@/hooks/useSavings";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MemberContributionsPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members } = useGroup(groupId);
  const { contributions, balanceTambala, isLoading, logContribution } = useSavings({
    groupId,
    memberId: profile?.userId,
  });

  const handleContribute = async (amountTambala: number, phone: string, method: "MOBILE_MONEY" | "CASH") => {
    // Find the caller's GroupMember.id
    const myMember = members.find((m) => m.userId === profile?.userId);
    if (!myMember) return;

    const result = await logContribution(myMember.id, amountTambala, method);

    // If online payment — redirect to PayChangu checkout
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    }
  };

  return (
    <MemberContributionsTemplate
      contributions={contributions}
      totalContributedTambala={balanceTambala ?? 0}
      isLoading={isLoading}
      onContribute={handleContribute}
    />
  );
}
