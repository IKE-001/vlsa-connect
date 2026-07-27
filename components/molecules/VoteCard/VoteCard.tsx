import React, { useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Input } from '@/components/atoms/Input';
import { formatMWK } from '@/lib/utils/money';
import { Check, X } from 'lucide-react';

export interface VoteCardProps {
  id: string;
  applicantName: string;
  type: 'LOAN' | 'WITHDRAWAL';
  amountTambala: number;
  reason?: string;
  requestedDate: string;
  votes?: Array<{ decision: 'APPROVE' | 'REJECT' }>;
  onVote: (id: string, decision: 'APPROVE' | 'REJECT', note?: string) => void;
}

export const VoteCard: React.FC<VoteCardProps> = ({
  id,
  applicantName,
  type,
  amountTambala,
  reason,
  requestedDate,
  votes = [],
  onVote,
}) => {
  const [note, setNote] = useState('');
  const [voted, setVoted] = useState(false);

  const approvals = votes.filter((v) => v.decision === 'APPROVE').length;
  const rejections = votes.filter((v) => v.decision === 'REJECT').length;
  const requiredVotes = 3;

  const handleVote = (decision: 'APPROVE' | 'REJECT') => {
    onVote(id, decision, note);
    setVoted(true);
  };

  return (
    <Card variant="hover" className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">Applicant</span>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {applicantName}
          </h4>
        </div>
        <Badge variant={type === 'LOAN' ? 'purple' : 'warning'}>{type}</Badge>
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Requested Amount</p>
          <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
            {formatMWK(amountTambala)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Requested On</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {requestedDate}
          </p>
        </div>
      </div>

      {/* Vote tally */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Check className="w-3.5 h-3.5" />
          {approvals}/{requiredVotes} Approved
        </div>
        {rejections > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
            <X className="w-3.5 h-3.5" />
            {rejections} Rejected
          </div>
        )}
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${(approvals / requiredVotes) * 100}%` }}
          />
        </div>
      </div>

      {reason && (
        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
          &ldquo;{reason}&rdquo;
        </p>
      )}

      {voted ? (
        <p className="text-xs text-emerald-600 font-semibold text-center py-2 bg-emerald-50 rounded-lg">
          Vote submitted successfully!
        </p>
      ) : (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Input
            placeholder="Add optional note/reason for vote..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-xs"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              className="flex-1"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={() => handleVote('APPROVE')}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="flex-1"
              leftIcon={<X className="w-4 h-4" />}
              onClick={() => handleVote('REJECT')}
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
