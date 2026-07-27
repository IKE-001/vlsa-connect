import { useState, useEffect } from 'react';

export interface BankerRiskFlag {
  id: string;
  group: string;
  issue: string;
  severity: "high" | "medium" | "low";
  date: string;
  loans: string;
  savings: string;
}

export interface BankerRiskMetrics {
  highRiskCount: string;
  mediumRiskCount: string;
  complianceScore: string;
  breakdown: Array<{ label: string; pct: number }>;
}

const MOCK_FLAGS: BankerRiskFlag[] = [
  { id: "rf-001", group: "Mapalo Savings Circle",   issue: "Overdue loan repayments — 3 consecutive missed payments",  severity: "high",   date: "2026-07-20", loans: "MWK 150,000", savings: "MWK 210,000" },
  { id: "rf-002", group: "Thousand Smiles VSLA",    issue: "Attendance dropping — below 60% quorum in last 2 meetings", severity: "medium", date: "2026-07-18", loans: "MWK 200,000", savings: "MWK 290,000" },
  { id: "rf-003", group: "Umodzi Cooperative",      issue: "Loan-to-savings ratio above 80% threshold",                severity: "medium", date: "2026-07-15", loans: "MWK 310,000", savings: "MWK 380,000" },
  { id: "rf-004", group: "Tikondane Women Group",   issue: "Chairperson changed without proper election documentation",  severity: "low",    date: "2026-07-10", loans: "MWK 180,000", savings: "MWK 320,000" },
];

const MOCK_METRICS: BankerRiskMetrics = {
  highRiskCount: "1 Group",
  mediumRiskCount: "2 Groups",
  complianceScore: "87%",
  breakdown: [
    { label: "Compliant",    pct: 83 },
    { label: "Medium Risk",  pct: 12 },
    { label: "High Risk",    pct: 5  },
  ],
};

export function useBankerRisk() {
  const [flags, setFlags] = useState<BankerRiskFlag[]>([]);
  const [metrics, setMetrics] = useState<BankerRiskMetrics>({
    highRiskCount: "0",
    mediumRiskCount: "0",
    complianceScore: "0%",
    breakdown: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRisk() {
      try {
        const response = await fetch('/api/banker/risk');
        if (response.ok) {
          const data = await response.json();
          const flagItems = data.flags ?? [];
          setFlags(flagItems.length > 0 ? flagItems : MOCK_FLAGS);
          setMetrics(data.metrics ?? MOCK_METRICS);
        } else {
          setFlags(MOCK_FLAGS);
          setMetrics(MOCK_METRICS);
        }
      } catch {
        setFlags(MOCK_FLAGS);
        setMetrics(MOCK_METRICS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRisk();
  }, []);

  return { flags, metrics, isLoading };
}
