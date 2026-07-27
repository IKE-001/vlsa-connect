'use client';

import React from "react";
import { MemberWithdrawalsTemplate } from "@/components/templates/MemberWithdrawalsTemplate/MemberWithdrawalsTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useWithdrawals } from "@/hooks/useWithdrawals";
import { useSavings } from "@/hooks/useSavings";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MemberWithdrawalsPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members } = useGroup(groupId);

  const myMemberId = members.find((m) => m.userId === profile?.userId)?.id;

  const { withdrawals, isLoading, requestWithdrawal, voteWithdrawal } = useWithdrawals({
    groupId,
    memberId: myMemberId,
    callerMemberId: myMemberId,
  });
  
  const { balanceTambala } = useSavings({ groupId, memberId: myMemberId });

  const handleRequest = async (amountTambala: number, reason: string) => {
    await requestWithdrawal(amountTambala, reason);
  };

  const handleVote = async (requestId: string, decision: "APPROVE" | "REJECT") => {
    await voteWithdrawal(requestId, decision);
  };

  return (
    <MemberWithdrawalsTemplate
      withdrawals={withdrawals}
      myTotalSavingsTambala={balanceTambala ?? 0}
      isLoading={isLoading}
      onRequestWithdrawal={handleRequest}
      onVote={handleVote}
    />
  );
}
