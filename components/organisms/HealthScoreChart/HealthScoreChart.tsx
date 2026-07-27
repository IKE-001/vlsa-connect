import React from 'react';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Activity, ShieldCheck, TrendingUp, Users, Award } from 'lucide-react';

export interface HealthScoreData {
  score: number;
  savingsComponent?: number;
  repaymentComponent?: number;
  attendanceComponent?: number;
  governanceComponent?: number;
  computedAt?: Date | string;
  trend?: number;
  label?: string;
}

export interface HealthScoreChartProps {
  scoreData: HealthScoreData;
  groupName?: string;
}

export const HealthScoreChart: React.FC<HealthScoreChartProps> = ({
  scoreData,
  groupName = 'VSLA Group',
}) => {
  const getRatingLabel = (score: number) => {
    if (score >= 90) return { label: 'AAA Prime Credit', variant: 'emerald' as const };
    if (score >= 80) return { label: 'AA High Liquidity', variant: 'success' as const };
    if (score >= 70) return { label: 'A Moderate Risk', variant: 'warning' as const };
    return { label: 'B Underperforming', variant: 'danger' as const };
  };

  const rating = getRatingLabel(scoreData.score);

  const metrics = [
    {
      label: 'Savings Compliance',
      score: scoreData.savingsComponent ?? 0,
      max: 35,
      icon: <TrendingUp className="w-4 h-4 text-[#2D7A52]" />,
      color: 'bg-[#2D7A52]',
    },
    {
      label: 'Loan Repayment Rate',
      score: scoreData.repaymentComponent ?? 0,
      max: 35,
      icon: <ShieldCheck className="w-4 h-4 text-[#3B7DDB]" />,
      color: 'bg-[#3B7DDB]',
    },
    {
      label: 'Meeting Attendance',
      score: scoreData.attendanceComponent ?? 0,
      max: 20,
      icon: <Users className="w-4 h-4 text-[#E8873A]" />,
      color: 'bg-[#E8873A]',
    },
    {
      label: 'Governance & Audit',
      score: scoreData.governanceComponent ?? 0,
      max: 10,
      icon: <Award className="w-4 h-4 text-[#8B6FC7]" />,
      color: 'bg-[#8B6FC7]',
    },
  ];

  return (
    <Card className="space-y-5 border border-[#E9EDEA] bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#1B2321] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2D7A52]" />
            Group Credit &amp; Financial Health Score
          </h3>
          <p className="text-xs text-[#5B6B65]">
            {groupName}{scoreData.computedAt ? ` • Computed on ${new Date(scoreData.computedAt).toLocaleDateString()}` : ''}
          </p>
        </div>
        <Badge variant={rating.variant} size="md">
          {rating.label}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-[16px] bg-[#E3F3EA] border border-[#2D7A52]/20 text-[#1B2321]">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#2D7A52] bg-white shrink-0 shadow-xs">
          <div className="text-center">
            <span className="text-3xl font-extrabold text-[#2D7A52]">
              {scoreData.score}
            </span>
            <span className="block text-[9.5px] text-[#5B6B65] font-extrabold uppercase tracking-wider">
              Out of 100
            </span>
          </div>
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-extrabold text-[#123A29]">
            Financial Creditworthiness Rating
          </h4>
          <p className="text-xs text-[#5B6B65] max-w-md leading-relaxed">
            This composite health score determines group bank loan eligibility, interest rate subsidies, and financial inclusion tier.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A29C]">
          Component Breakdown
        </h4>
        {metrics.map((m) => {
          const pct = Math.round((m.score / m.max) * 100);
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1B2321] flex items-center gap-1.5">
                  {m.icon}
                  {m.label}
                </span>
                <span className="font-bold text-[#1B2321]">
                  {m.score} / {m.max} ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F1F4F2] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
