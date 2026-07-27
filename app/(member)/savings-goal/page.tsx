'use client';

import React from "react";
import { MemberSavingsGoalTemplate } from "@/components/templates/MemberSavingsGoalTemplate/MemberSavingsGoalTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useSavings } from "@/hooks/useSavings";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function SavingsGoalPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members } = useGroup(groupId);

  const myMemberId = members.find((m) => m.userId === profile?.userId)?.id;

  // Fetch both balance (with memberId) AND contribution history (without memberId)
  const { balanceTambala } = useSavings({ groupId, memberId: myMemberId });
  const { contributions } = useSavings({ groupId }); // history list

  return (
    <MemberSavingsGoalTemplate
      savedTambala={balanceTambala ?? 0}
      contributions={contributions}
    />
  );
}
