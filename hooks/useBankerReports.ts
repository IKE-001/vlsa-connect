import { useState, useEffect } from 'react';

export interface BankerReportKPI {
  label: string;
  value: string;
  delta: string;
  color: string;
  icon: "wallet" | "hand-coin" | "trending-up" | "users";
}

const MOCK_KPIS: BankerReportKPI[] = [
  { label: "Total Group Deposits",  value: "MWK 32.8M",  delta: "+8.4% this month",  color: "#2D7A52", icon: "wallet" },
  { label: "Active Loans Portfolio",value: "MWK 18.6M",  delta: "+6.7% this month",  color: "#2F6FED", icon: "hand-coin" },
  { label: "Repayment Rate",        value: "94.2%",       delta: "+1.3% from last mo",color: "#8B5CF6", icon: "trending-up" },
  { label: "Active VSLA Members",   value: "248 Members", delta: "+18 new this month",color: "#F97316", icon: "users" },
];

export function useBankerReports() {
  const [kpis, setKpis] = useState<BankerReportKPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch('/api/banker/reports');
        if (response.ok) {
          const data = await response.json();
          const items = data.kpis ?? [];
          setKpis(items.length > 0 ? items : MOCK_KPIS);
        } else {
          setKpis(MOCK_KPIS);
        }
      } catch {
        setKpis(MOCK_KPIS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

  return { kpis, isLoading };
}
