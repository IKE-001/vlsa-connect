import { useState, useEffect } from 'react';

export interface BankerLedgerEntry {
  id: string;
  group: string;
  amount: string;
  date: string;
  type: "deposit" | "withdrawal";
  method: string;
}

export interface BankerLedgerSummary {
  depositsToday: string;
  pendingReconciliation: number;
  totalBalance: string;
}

const MOCK_LEDGER: BankerLedgerEntry[] = [
  { id: "led-001", group: "Tikondane Women Group",  amount: "MWK 25,000",  date: "2026-07-27", type: "deposit",    method: "Mobile Money" },
  { id: "led-002", group: "Chisomo Community VSLA", amount: "MWK 25,000",  date: "2026-07-27", type: "deposit",    method: "Cash" },
  { id: "led-003", group: "Chipembere Women Group", amount: "MWK 50,000",  date: "2026-07-26", type: "deposit",    method: "Mobile Money" },
  { id: "led-004", group: "Mapalo Savings Circle",  amount: "MWK 80,000",  date: "2026-07-26", type: "withdrawal", method: "Cash" },
  { id: "led-005", group: "Thousand Smiles VSLA",   amount: "MWK 30,000",  date: "2026-07-25", type: "deposit",    method: "Mobile Money" },
  { id: "led-006", group: "Umodzi Cooperative",     amount: "MWK 120,000", date: "2026-07-25", type: "deposit",    method: "Bank Transfer" },
  { id: "led-007", group: "Tikondane Women Group",  amount: "MWK 45,000",  date: "2026-07-24", type: "withdrawal", method: "Mobile Money" },
  { id: "led-008", group: "Chisomo Community VSLA", amount: "MWK 75,000",  date: "2026-07-23", type: "deposit",    method: "Cash" },
];

const MOCK_SUMMARY: BankerLedgerSummary = {
  depositsToday: "MWK 318,000",
  pendingReconciliation: 3,
  totalBalance: "MWK 32.8M",
};

export function useBankerLedger() {
  const [ledger, setLedger] = useState<BankerLedgerEntry[]>([]);
  const [summaryTotals, setSummaryTotals] = useState<BankerLedgerSummary>({
    depositsToday: "MWK 0",
    pendingReconciliation: 0,
    totalBalance: "MWK 0"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      try {
        const response = await fetch('/api/banker/ledger');
        if (response.ok) {
          const data = await response.json();
          const ledgerItems = data.ledger ?? [];
          setLedger(ledgerItems.length > 0 ? ledgerItems : MOCK_LEDGER);
          setSummaryTotals(data.summaryTotals ?? MOCK_SUMMARY);
        } else {
          setLedger(MOCK_LEDGER);
          setSummaryTotals(MOCK_SUMMARY);
        }
      } catch {
        setLedger(MOCK_LEDGER);
        setSummaryTotals(MOCK_SUMMARY);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLedger();
  }, []);

  return { ledger, summaryTotals, isLoading };
}
