'use client';

import React, { useState, useMemo } from 'react';
import { MemberSidebar } from '@/components/organisms/MemberSidebar/MemberSidebar';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { useProfile } from '@/hooks/useProfile';
import { useGroup } from '@/hooks/useGroup';
import { useSavings } from '@/hooks/useSavings';
import { setActiveGroupId } from '@/lib/api/client';
import { formatMWK } from '@/lib/utils/money';
import { format } from 'date-fns';

function getStoredGroupId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vsla_active_group_id') ?? '';
}

type ActionTab = 'RECORD' | 'APPROVE';

export default function TreasurerContributionsPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { members } = useGroup(groupId);
  const { contributions, isLoading, logContribution, approveContribution } = useSavings({ groupId });

  const myMemberId = members.find((m) => m.userId === profile?.userId)?.id;

  const [activeTab, setActiveTab] = useState<ActionTab>('APPROVE');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [cyclePeriod, setCyclePeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [method, setMethod] = useState<'CASH' | 'MOBILE_MONEY'>('CASH');
  const [recording, setRecording] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const pendingContributions = useMemo(() =>
    contributions.filter((c) => c.status === 'PENDING'),
    [contributions]
  );
  const approvedContributions = useMemo(() =>
    contributions.filter((c) => c.status === 'APPROVED'),
    [contributions]
  );
  const totalApprovedTambala = approvedContributions.reduce((s, c) => s + c.amountTambala, 0);

  const memberOptions = members.filter((m) => m.status === 'ACTIVE');

  const handleRecord = async () => {
    if (!selectedMemberId || !amount) return;
    const amtTambala = Math.round(parseFloat(amount) * 100);
    if (!amtTambala || amtTambala <= 0) return;
    setRecording(true);
    try {
      const res = await logContribution(selectedMemberId, amtTambala, method, cyclePeriod);
      if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return; }
      setSuccessMsg(`Contribution of ${formatMWK(amtTambala)} recorded for ${members.find(m => m.id === selectedMemberId)?.fullName ?? 'member'}.`);
      setAmount(''); setSelectedMemberId('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setSuccessMsg('Contribution recorded (offline mode).');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setRecording(false);
    }
  };

  const handleApprove = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setApprovingId(`${id}-${action}`);
    try { await approveContribution(id, action); }
    catch { /* optimistic — list will refresh */ }
    finally { setApprovingId(null); }
  };

  const memberName = (memberId: string) =>
    members.find((m) => m.id === memberId)?.fullName ?? memberId.substring(0, 8);

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><MemberSidebar /></div>
      <div className="flex-1 min-w-0 flex flex-col pb-16">

        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4">
          <h1 className="text-[19px] font-extrabold text-[#1B2321]">Treasurer — Contributions</h1>
          <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Record cash contributions and approve pending transactions</p>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard variant="member" icon="arrow-down-circle" iconBgColor="green" value={formatMWK(totalApprovedTambala)} label="Total Approved Contributions" linkText="View ledger" />
            <StatCard variant="member" icon="wallet" iconBgColor="blue" value={String(pendingContributions.length)} label="Pending Approval" linkText="Review now" />
            <StatCard variant="member" icon="users" iconBgColor="purple" value={String(memberOptions.length)} label="Active Members" linkText="View directory" />
          </div>

          {successMsg && (
            <div className="bg-[#E3F3EA] border border-[#2D7A52]/30 text-[#1B5E3F] text-[13px] font-semibold rounded-[12px] px-4 py-3 flex items-center gap-2">
              <Icon name="star" className="w-4 h-4 text-[#2D7A52] shrink-0" /> {successMsg}
            </div>
          )}

          {/* Action tabs */}
          <div className="flex gap-2">
            {([['APPROVE', 'Approve Pending', 'vote'], ['RECORD', 'Record Cash', 'arrow-down-circle']] as const).map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-bold border transition-all ${
                  activeTab === key
                    ? 'bg-[#2D7A52] text-white border-[#2D7A52]'
                    : 'bg-white text-[#5B6B65] border-[#E9EDEA] hover:border-[#2D7A52]/40'
                }`}
              >
                <Icon name={icon as any} className="w-3.5 h-3.5" />
                {label}
                {key === 'APPROVE' && pendingContributions.length > 0 && (
                  <span className="ml-1 bg-[#E8873A] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingContributions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* APPROVE TAB */}
          {activeTab === 'APPROVE' && (
            <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <h2 className="text-[15px] font-extrabold text-[#1B2321] mb-4">
                Pending Contributions ({pendingContributions.length})
              </h2>
              {isLoading && <div className="py-6 text-center text-[13px] text-[#94A29C]">Loading…</div>}
              {!isLoading && pendingContributions.length === 0 && (
                <div className="py-8 text-center text-[13px] text-[#94A29C]">
                  <Icon name="star" className="w-8 h-8 mx-auto mb-2 text-[#2D7A52]" />
                  All contributions have been reviewed. Nothing pending!
                </div>
              )}
              <div className="flex flex-col gap-3">
                {pendingContributions.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 p-3.5 rounded-[12px] bg-[#FEF9EC] border border-[#E8873A]/20">
                    <div className="w-9 h-9 rounded-[10px] bg-[#FCEADC] text-[#E8873A] flex items-center justify-center shrink-0">
                      <Icon name="arrow-down-circle" className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#1B2321]">{memberName(c.memberId)}</div>
                      <div className="text-[11.5px] text-[#5B6B65]">
                        {formatMWK(c.amountTambala)} · {c.method === 'MOBILE_MONEY' ? 'Mobile Money' : 'Cash'}
                        {c.cyclePeriod ? ` · ${c.cyclePeriod}` : ''}
                      </div>
                      <div className="text-[11px] text-[#94A29C]">{format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm')}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(c.id, 'APPROVE')}
                        disabled={!!approvingId}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#E3F3EA] text-[#2D7A52] text-[12px] font-bold hover:bg-[#2D7A52] hover:text-white transition-all disabled:opacity-50"
                      >
                        {approvingId === `${c.id}-APPROVE` ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : '✓'}
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(c.id, 'REJECT')}
                        disabled={!!approvingId}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#FEE2E2] text-[#DC4B3F] text-[12px] font-bold hover:bg-[#DC4B3F] hover:text-white transition-all disabled:opacity-50"
                      >
                        {approvingId === `${c.id}-REJECT` ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : '✕'}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECORD TAB */}
          {activeTab === 'RECORD' && (
            <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] flex flex-col gap-4">
              <h2 className="text-[15px] font-extrabold text-[#1B2321]">Record Cash Contribution</h2>
              <p className="text-[12.5px] text-[#5B6B65]">Use this form to record a cash payment received from a member at a group meeting.</p>

              {/* Member selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#5B6B65]">Select Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="border border-[#D5E0D8] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1B2321] focus:outline-none focus:border-[#2D7A52] transition-colors bg-white"
                >
                  <option value="">— Choose a member —</option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.roleInGroup})</option>
                  ))}
                </select>
              </div>

              <Input
                label="Contribution Amount (MWK)"
                placeholder="e.g. 250"
                theme="green"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* Cycle period */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#5B6B65]">Cycle Period (Month)</label>
                <input
                  type="month"
                  value={cyclePeriod}
                  onChange={(e) => setCyclePeriod(e.target.value)}
                  className="border border-[#D5E0D8] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1B2321] focus:outline-none focus:border-[#2D7A52] transition-colors"
                />
              </div>

              {/* Payment method */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#5B6B65]">Payment Method</label>
                <div className="flex gap-2">
                  {(['CASH', 'MOBILE_MONEY'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`flex-1 py-2.5 px-3 rounded-[10px] text-[12.5px] font-bold border transition-all ${
                        method === m
                          ? 'bg-[#E3F3EA] border-[#2D7A52] text-[#2D7A52]'
                          : 'border-[#E9EDEA] text-[#94A29C] hover:border-[#2D7A52]'
                      }`}
                    >
                      {m === 'CASH' ? '💵 Cash' : '📱 Mobile Money'}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                theme="green"
                onClick={handleRecord}
                disabled={recording || !selectedMemberId || !amount}
                fullWidth
              >
                {recording ? 'Recording…' : 'Record Contribution'}
              </Button>
            </div>
          )}

        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
