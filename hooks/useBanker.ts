import { useState, useEffect, useCallback } from 'react';

export interface BankerGroupSummary {
  code: string;
  name: string;
  members: number;
  savings: string;
  loans: string;
  status: 'active' | 'flagged';
  risk: 'low' | 'medium' | 'high';
  theme: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'gray';
}

export interface BankerCreditApproval {
  id: string;
  group: string;
  amount: string;
  purpose: string;
  members: number;
  savings: string;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
}

// ---------------------------------------------------------------------------
// Mock data — used as fallback when the DB has no seeded BankLoanApplication
// rows (e.g. dev / demo environment). Remove once real data is seeded.
// ---------------------------------------------------------------------------
const MOCK_APPROVALS: BankerCreditApproval[] = [
  {
    id: "BLA-001",
    group: "Tikondane Women Group",
    amount: "MWK 500,000",
    purpose: "Agricultural inputs for maize season",
    members: 18,
    savings: "MWK 320,000",
    status: "pending",
    score: 82,
  },
  {
    id: "BLA-002",
    group: "Chisomo Community VSLA",
    amount: "MWK 750,000",
    purpose: "Small business stock replenishment",
    members: 22,
    savings: "MWK 610,000",
    status: "pending",
    score: 74,
  },
  {
    id: "BLA-003",
    group: "Mapalo Savings Circle",
    amount: "MWK 300,000",
    purpose: "School fees support for members",
    members: 14,
    savings: "MWK 210,000",
    status: "pending",
    score: 58,
  },
  {
    id: "BLA-004",
    group: "Chipembere Women Group",
    amount: "MWK 1,200,000",
    purpose: "Poultry farming startup capital",
    members: 30,
    savings: "MWK 980,000",
    status: "approved",
    score: 91,
  },
  {
    id: "BLA-005",
    group: "Thousand Smiles VSLA",
    amount: "MWK 450,000",
    purpose: "Market stall construction",
    members: 16,
    savings: "MWK 290,000",
    status: "rejected",
    score: 43,
  },
];

const MOCK_GROUPS: BankerGroupSummary[] = [
  { code: "GRP-001", name: "Tikondane Women Group",   members: 18, savings: "MWK 320,000",   loans: "MWK 180,000", status: "active",  risk: "low",    theme: "green"  },
  { code: "GRP-002", name: "Chisomo Community VSLA",  members: 22, savings: "MWK 610,000",   loans: "MWK 380,000", status: "active",  risk: "low",    theme: "blue"   },
  { code: "GRP-003", name: "Mapalo Savings Circle",   members: 14, savings: "MWK 210,000",   loans: "MWK 150,000", status: "flagged", risk: "high",   theme: "red"    },
  { code: "GRP-004", name: "Chipembere Women Group",  members: 30, savings: "MWK 980,000",   loans: "MWK 620,000", status: "active",  risk: "low",    theme: "purple" },
  { code: "GRP-005", name: "Thousand Smiles VSLA",    members: 16, savings: "MWK 290,000",   loans: "MWK 200,000", status: "active",  risk: "medium", theme: "orange" },
  { code: "GRP-006", name: "Umodzi Cooperative",      members: 20, savings: "MWK 450,000",   loans: "MWK 310,000", status: "active",  risk: "low",    theme: "green"  },
];

export function useBanker() {
  const [groups, setGroups] = useState<BankerGroupSummary[]>([]);
  const [approvals, setApprovals] = useState<BankerCreditApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [portfolioRes, approvalsRes] = await Promise.all([
        fetch("/api/banker/portfolio"),
        fetch("/api/banker/approvals")
      ]);

      let portfolioLoaded = false;
      let approvalsLoaded = false;

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        if (Array.isArray(portfolioData.groups) && portfolioData.groups.length > 0) {
          setGroups(portfolioData.groups);
          portfolioLoaded = true;
        }
      }

      if (approvalsRes.ok) {
        const approvalsData = await approvalsRes.json();
        if (Array.isArray(approvalsData.approvals) && approvalsData.approvals.length > 0) {
          setApprovals(approvalsData.approvals);
          approvalsLoaded = true;
        }
      }

      if (!portfolioLoaded) setGroups(MOCK_GROUPS);
      if (!approvalsLoaded) setApprovals(MOCK_APPROVALS);

    } catch (error) {
      console.error("Failed to fetch banker data:", error);
      setGroups(MOCK_GROUPS);
      setApprovals(MOCK_APPROVALS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    groups,
    approvals,
    isLoading,
    refresh: fetchData,
  };
}
