import React from 'react';
import { Card } from '@/components/atoms/Card';
import { VoteCard } from '@/components/molecules/VoteCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { LoanWithVotes } from '@/types/financial';
import { CheckSquare } from 'lucide-react';

interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
}

export interface LoanVotingPanelProps {
  pendingLoans: LoanWithVotes[];
  members?: GroupMember[];
  onVote: (loanId: string, decision: 'APPROVE' | 'REJECT', note?: string) => void;
}

export const LoanVotingPanel: React.FC<LoanVotingPanelProps> = ({
  pendingLoans,
  members = [],
  onVote,
}) => {
  const getMemberName = (memberId: string) => {
    const m = members.find((mem) => mem.id === memberId);
    return m?.fullName ?? `Member #${memberId.substring(0, 6)}`;
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            Pending Governance Votes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loans awaiting committee and member approval votes
          </p>
        </div>
      </div>

      {pendingLoans.length === 0 ? (
        <EmptyState
          title="No pending votes"
          description="All requested loans have been voted on or resolved."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingLoans.map((loan) => (
            <VoteCard
              key={loan.id}
              id={loan.id}
              applicantName={getMemberName(loan.memberId)}
              type="LOAN"
              amountTambala={loan.principalTambala}
              requestedDate={new Date(loan.requestedAt).toLocaleDateString()}
              votes={loan.votes}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
