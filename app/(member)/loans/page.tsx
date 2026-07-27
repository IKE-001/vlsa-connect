'use client';

import React from "react";
import { MemberLoansTemplate } from "@/components/templates/MemberLoansTemplate/MemberLoansTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useGroup } from "@/hooks/useGroup";
import { useLoans } from "@/hooks/useLoans";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MemberLoansPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members } = useGroup(groupId);

  const myMemberId = members.find((m) => m.userId === profile?.userId)?.id;

  const { loans, isLoading, applyLoan, repayLoan } = useLoans({
    groupId,
    memberId: myMemberId,
    callerMemberId: myMemberId,
  });

  const handleApply = async (principalTambala: number) => {
    await applyLoan(principalTambala);
  };

  const handleRepay = async (loanId: string, amountTambala: number, method: "CASH" | "MOBILE_MONEY") => {
    const result = await repayLoan(loanId, amountTambala, method);
    if (result?.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    }
  };

  return (
    <MemberLoansTemplate
      loans={loans}
      isLoading={isLoading}
      onApplyLoan={handleApply}
      onRepay={handleRepay}
    />
  );
}
