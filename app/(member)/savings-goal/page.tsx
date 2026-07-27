'use client';

import React from "react";
import { MemberSavingsGoalTemplate } from "@/components/templates/MemberSavingsGoalTemplate/MemberSavingsGoalTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useSavings } from "@/hooks/useSavings";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function SavingsGoalPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();

  // Fetch both balance (with memberId) AND contribution history (without memberId)
  const { balanceTambala } = useSavings({ groupId, memberId: profile?.userId });
  const { contributions } = useSavings({ groupId }); // history list

  return (
    <MemberSavingsGoalTemplate
      savedTambala={balanceTambala ?? 0}
      contributions={contributions}
    />
  );
}
