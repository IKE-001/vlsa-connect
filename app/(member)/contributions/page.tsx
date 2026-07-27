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
  
  const myMember = members.find((m) => m.userId === profile?.userId);
  const myMemberId = myMember?.id;

  const { contributions, balanceTambala, isLoading, logContribution } = useSavings({
    groupId,
    memberId: myMemberId,
  });

  const handleContribute = async (amountTambala: number, phone: string, method: "MOBILE_MONEY" | "CASH") => {
    if (!myMemberId) return;

    const result = await logContribution(myMemberId, amountTambala, method);

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
