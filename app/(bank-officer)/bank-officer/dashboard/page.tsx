'use client';

import React from "react";
import { BankerDashboardTemplate } from "@/components/templates/BankerDashboardTemplate/BankerDashboardTemplate";
import { useBanker } from "@/hooks/useBanker";

export default function BankerDashboardPage() {
  const { groups, approvals, isLoading, refresh } = useBanker();

  return (
    <BankerDashboardTemplate
      groups={groups}
      approvals={approvals}
      isLoading={isLoading}
      onRefresh={refresh}
    />
  );
}
