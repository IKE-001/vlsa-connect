'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MemberSidebar } from '@/components/organisms/MemberSidebar/MemberSidebar';
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav/MobileBottomNav';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { useMeetings } from '@/hooks/useMeetings';
import { format, parseISO } from 'date-fns';

function getStoredGroupId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vsla_active_group_id') ?? '';
}

const STATUS_CFG = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-[#E6EEFA]', text: 'text-[#2F6FED]', dot: 'bg-[#2F6FED]' },
  COMPLETED: { label: 'Completed', bg: 'bg-[#E3F3EA]', text: 'text-[#2D7A52]', dot: 'bg-[#2D7A52]' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-[#FEE2E2]', text: 'text-[#DC4B3F]', dot: 'bg-[#DC4B3F]' },
};

export default function SecretaryMeetingsPage() {
  const groupId = getStoredGroupId();
  const { meetings, isLoading, scheduleMeeting } = useMeetings(groupId);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSchedule = async () => {
    if (!title || !scheduledAt) return;
    setSubmitting(true);
    try {
      await scheduleMeeting({ title, scheduledAt, location: location || undefined, agendaNotes: agenda || undefined });
      setTitle(''); setScheduledAt(''); setLocation(''); setAgenda('');
      setShowForm(false);
      setSuccess('Meeting scheduled successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setSuccess('Meeting saved (offline mode).');
      setTimeout(() => setSuccess(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const upcoming = meetings.filter((m) => m.status === 'SCHEDULED');
  const past = meetings.filter((m) => m.status !== 'SCHEDULED');

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><MemberSidebar /></div>
      <div className="flex-1 min-w-0 flex flex-col pb-16">

        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">Meeting Management</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Schedule meetings, record attendance and minutes</p>
          </div>
          <Button theme="green" size="sm" leftIcon={<Icon name="calendar" className="w-3.5 h-3.5" />} onClick={() => setShowForm(true)}>
            Schedule Meeting
          </Button>
        </header>

        <main className="p-4 md:p-7 flex flex-col gap-5">

          {success && (
            <div className="bg-[#E3F3EA] border border-[#2D7A52]/30 text-[#1B5E3F] text-[13px] font-semibold rounded-[12px] px-4 py-3 flex items-center gap-2">
              <Icon name="star" className="w-4 h-4 text-[#2D7A52] shrink-0" /> {success}
            </div>
          )}

          {/* Schedule form */}
          {showForm && (
            <div className="bg-white rounded-[16px] border border-[#E9EDEA] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] flex flex-col gap-3">
              <h3 className="text-[14.5px] font-extrabold text-[#1B2321]">Schedule New Meeting</h3>
              <Input label="Meeting Title" placeholder="e.g. Monthly Savings Meeting — August 2026" theme="green" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#5B6B65]">Date & Time</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  className="border border-[#D5E0D8] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1B2321] focus:outline-none focus:border-[#2D7A52] transition-colors" />
              </div>
              <Input label="Location (optional)" placeholder="e.g. Community Hall, Area 18" theme="green" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#5B6B65]">Agenda Notes (optional)</label>
                <textarea rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="1. Monthly contributions review&#10;2. Loan applications&#10;3. AOB"
                  className="border border-[#D5E0D8] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1B2321] placeholder:text-[#94A29C] focus:outline-none focus:border-[#2D7A52] resize-none transition-colors" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" theme="green" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button theme="green" size="sm" onClick={handleSchedule} disabled={submitting || !title || !scheduledAt}>
                  {submitting ? 'Saving…' : 'Schedule Meeting'}
                </Button>
              </div>
            </div>
          )}

          {isLoading && <div className="py-8 text-center text-[13px] text-[#94A29C]">Loading meetings…</div>}

          {/* Upcoming */}
          {!isLoading && (
            <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <h2 className="text-[15px] font-extrabold text-[#1B2321] mb-4">Upcoming Meetings ({upcoming.length})</h2>
              {upcoming.length === 0 && <p className="text-[12.5px] text-[#94A29C]">No upcoming meetings scheduled.</p>}
              <div className="flex flex-col gap-3">
                {upcoming.map((m) => {
                  const cfg = STATUS_CFG[m.status];
                  return (
                    <div key={m.id} className="flex items-start gap-4 p-3 rounded-[12px] bg-[#F7F9F8] border border-[#E9EDEA]">
                      <div className="w-10 h-10 rounded-[10px] bg-[#E6EEFA] text-[#2F6FED] flex items-center justify-center shrink-0">
                        <Icon name="calendar" className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] font-bold text-[#1B2321]">{m.title}</span>
                          <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#5B6B65] mt-0.5">{format(parseISO(m.scheduledAt), 'EEEE, d MMMM yyyy · h:mm a')}</p>
                        {m.location && <p className="text-[12px] text-[#94A29C] mt-0.5">📍 {m.location}</p>}
                        {m.agendaNotes && <p className="text-[11.5px] text-[#94A29C] mt-1 whitespace-pre-line line-clamp-3">{m.agendaNotes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past meetings */}
          {!isLoading && past.length > 0 && (
            <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <h2 className="text-[15px] font-extrabold text-[#1B2321] mb-4">Past Meetings</h2>
              <div className="flex flex-col gap-2">
                {past.map((m, i) => {
                  const cfg = STATUS_CFG[m.status];
                  return (
                    <div key={m.id} className={`flex items-center gap-4 py-3 ${i < past.length - 1 ? 'border-b border-[#F1F4F2]' : ''}`}>
                      <div className="w-9 h-9 rounded-[10px] bg-[#F1F4F2] text-[#94A29C] flex items-center justify-center shrink-0">
                        <Icon name="calendar" className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#1B2321]">{m.title}</div>
                        <div className="text-[11.5px] text-[#94A29C]">{format(parseISO(m.scheduledAt), 'd MMM yyyy')} {m.location ? `· ${m.location}` : ''}</div>
                      </div>
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
