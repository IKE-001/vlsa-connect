'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveGroupId } from '@/lib/api/client';
import { Key, PlusCircle, CheckCircle, Hand } from 'lucide-react';

/* ─── Design tokens ────────────────────────────────────────────── */
const brandGreen = '#2E7D46';
const btnGreen = '#1E3D28';
const inkColor = '#151A17';
const inkSoft = '#6B7280';
const lineColor = '#E4E7E5';

/* ─── Shared field helpers ─────────────────────────────────────── */
function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[12.5px] font-semibold" style={{ color: inkColor }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11.5px]" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none transition-shadow';

function useInputStyle() {
  return {
    base: { borderColor: lineColor, color: inkColor, fontFamily: 'inherit' } as React.CSSProperties,
    focus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = brandGreen;
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,125,70,0.12)';
    },
    blur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = lineColor;
      e.currentTarget.style.boxShadow = 'none';
    },
  };
}

/* ─── Error banner ─────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-3 flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[12px]"
      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
    >
      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
      </svg>
      {message}
    </div>
  );
}

/* ─── Join Group Panel ─────────────────────────────────────────── */
function JoinGroupPanel({ onSuccess }: { onSuccess: (groupId: string) => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputStyle = useInputStyle();

  const handleJoin = async () => {
    if (!code.trim()) { setError('Enter an invite code.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(typeof json.error === 'string' ? json.error : 'Invalid invite code or group is closed.');
        return;
      }
      onSuccess(json.data.groupId);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Field label="Invite Code" error={error ?? undefined}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. A3F9C2"
          maxLength={12}
          className={`${inputCls} tracking-widest font-mono uppercase`}
          style={inputStyle.base}
          onFocus={inputStyle.focus}
          onBlur={inputStyle.blur}
        />
      </Field>
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="w-full rounded-full py-3 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: btnGreen, border: 'none', fontFamily: 'inherit' }}
      >
        {loading ? 'Joining…' : 'Join Group'}
      </button>
    </div>
  );
}

/* ─── Create Group Panel ───────────────────────────────────────── */
function CreateGroupPanel({ onSuccess }: { onSuccess: (groupId: string, inviteCode: string) => void }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    contributionAmountTambala: '',
    interestRate: '',
    cycleFrequency: 'MONTHLY',
    meetingLocation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputStyle = useInputStyle();

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async () => {
    setError(null);
    if (!form.name.trim()) { setError('Group name is required.'); return; }
    const contrib = parseInt(form.contributionAmountTambala, 10);
    if (!contrib || contrib < 1) { setError('Enter a valid contribution amount.'); return; }
    const rate = parseFloat(form.interestRate);
    if (isNaN(rate) || rate < 0 || rate > 100) { setError('Enter a valid interest rate (0–100%).'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          contributionAmountTambala: contrib,
          interestRate: rate,
          cycleFrequency: form.cycleFrequency,
          meetingLocation: form.meetingLocation.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(typeof json.error === 'string' ? json.error : 'Failed to create group.');
        return;
      }
      onSuccess(json.data.id, json.data.inviteCode);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-3">
        <div className="sm:col-span-2">
          <Field label="Group Name">
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Thandizani Savings Group"
              className={inputCls}
              style={inputStyle.base}
              onFocus={inputStyle.focus}
              onBlur={inputStyle.blur}
            />
          </Field>
        </div>

        <Field label="Weekly Contribution (MWK tambala)">
          <input
            type="number"
            value={form.contributionAmountTambala}
            onChange={(e) => set('contributionAmountTambala', e.target.value)}
            placeholder="e.g. 500000"
            className={inputCls}
            style={inputStyle.base}
            onFocus={inputStyle.focus}
            onBlur={inputStyle.blur}
          />
        </Field>

        <Field label="Loan Interest Rate (%)">
          <input
            type="number"
            value={form.interestRate}
            onChange={(e) => set('interestRate', e.target.value)}
            placeholder="e.g. 10"
            className={inputCls}
            style={inputStyle.base}
            onFocus={inputStyle.focus}
            onBlur={inputStyle.blur}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Meeting Cycle">
            <select
              value={form.cycleFrequency}
              onChange={(e) => set('cycleFrequency', e.target.value)}
              className={`${inputCls} bg-white`}
              style={inputStyle.base}
              onFocus={inputStyle.focus}
              onBlur={inputStyle.blur}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Meeting Location (optional)">
            <input
              value={form.meetingLocation}
              onChange={(e) => set('meetingLocation', e.target.value)}
              placeholder="e.g. Lilongwe Community Hall"
              className={inputCls}
              style={inputStyle.base}
              onFocus={inputStyle.focus}
              onBlur={inputStyle.blur}
            />
          </Field>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="w-full rounded-full py-3 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: btnGreen, border: 'none', fontFamily: 'inherit' }}
      >
        {loading ? 'Creating Group…' : 'Create Group'}
      </button>
    </div>
  );
}

/* ─── Success Modal ─────────────────────────────────────────────── */
function GroupCreatedModal({ inviteCode, onContinue }: { inviteCode: string; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-[20px] bg-white p-7 shadow-2xl">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(46,125,70,0.12)' }}
        >
          <svg className="h-7 w-7" fill="none" stroke={brandGreen} strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="mb-1 text-center text-[18px] font-extrabold flex items-center justify-center gap-2" style={{ color: inkColor }}>
          <CheckCircle className="text-[#2E7D46]" size={20} /> Group Created!
        </h2>
        <p className="mb-5 text-center text-[13px]" style={{ color: inkSoft }}>
          Share this invite code with your group members so they can join.
        </p>

        <div
          className="mb-5 flex items-center justify-between rounded-[12px] px-4 py-3"
          style={{ background: '#F0F7F3', border: `1.5px dashed ${brandGreen}` }}
        >
          <span className="font-mono text-[22px] font-extrabold tracking-widest" style={{ color: brandGreen }}>
            {inviteCode}
          </span>
          <button
            type="button"
            onClick={copy}
            className="ml-3 rounded-[8px] px-3 py-1.5 text-[12px] font-bold transition-colors"
            style={{
              background: copied ? brandGreen : 'transparent',
              color: copied ? '#fff' : brandGreen,
              border: `1px solid ${brandGreen}`,
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full py-3 text-[13.5px] font-bold text-white"
          style={{ background: btnGreen, border: 'none', fontFamily: 'inherit' }}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ONBOARDING SCREEN — shown when user has no active group         */
/* ═══════════════════════════════════════════════════════════════ */
export function GroupOnboarding({ userName }: { userName?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleGroupReady = (groupId: string) => {
    setActiveGroupId(groupId);
    router.refresh();
  };

  const handleCreated = (groupId: string, inviteCode: string) => {
    setActiveGroupId(groupId);
    setCreatedInviteCode(inviteCode);
  };

  return (
    <>
      {createdInviteCode && (
        <GroupCreatedModal
          inviteCode={createdInviteCode}
          onContinue={() => { setCreatedInviteCode(null); router.refresh(); }}
        />
      )}

      <div className="flex min-h-screen items-center justify-center bg-[#F1F4F2] p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: brandGreen }}
            >
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-[22px] font-extrabold flex items-center justify-center gap-2" style={{ color: inkColor }}>
              Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! <Hand className="text-gray-500" size={22} />
            </h1>
            <p className="mt-1.5 text-[13.5px]" style={{ color: inkSoft }}>
              You&apos;re not in any VSLA group yet. Join an existing group or create your own.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[20px] bg-white p-6 shadow-lg">
            {/* Tabs */}
            <div
              className="mb-5 flex rounded-[12px] p-1"
              style={{ background: '#F1F4F2' }}
            >
              {(['join', 'create'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setJoinError(null); }}
                  className="flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? inkColor : inkSoft,
                    boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {t === 'join' ? (
                      <>
                        <Key size={15} /> Join a Group
                      </>
                    ) : (
                      <>
                        <PlusCircle size={15} /> Create a Group
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {tab === 'join' ? (
              <JoinGroupPanel
                onSuccess={(groupId) => { handleGroupReady(groupId); }}
              />
            ) : (
              <CreateGroupPanel onSuccess={handleCreated} />
            )}
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[12.5px]" style={{ color: inkSoft }}>
            You can also join later from the notifications page once a chairperson sends you an invite.
          </p>
        </div>
      </div>
    </>
  );
}
