'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';

// ── Our canonical MeetingRecord type used across all UI components ──────────
// The DB schema stores: scheduledAt, agenda, location, minutes (no title/status)
// We derive title from the agenda or scheduledAt, and derive status from
// whether scheduledAt is in the past.
export interface MeetingRecord {
  id: string;
  groupId: string;
  title: string;             // derived: first line of agenda or formatted date
  scheduledAt: string;
  location: string | null;
  agendaNotes: string | null; // mapped from DB "agenda" field
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'; // derived from scheduledAt
  recordedById: string | null;
  createdAt: string;
}

// ── Raw shape returned by GET /api/meetings ─────────────────────────────────
interface RawMeeting {
  id: string;
  groupId: string;
  scheduledAt: string;
  agenda: string | null;
  location: string | null;
  minutes: string | null;
  recordedById: string | null;
  createdAt: string;
  updatedAt: string;
}

// Transform raw DB row → MeetingRecord the UI understands
function transformMeeting(m: RawMeeting): MeetingRecord {
  const isPast = new Date(m.scheduledAt) < new Date();
  const firstLine = m.agenda?.split('\n')[0]?.replace(/^\d+\.\s*/, '') ?? null;
  const dateLabel = new Date(m.scheduledAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return {
    id: m.id,
    groupId: m.groupId,
    title: firstLine ?? `Group Meeting — ${dateLabel}`,
    scheduledAt: m.scheduledAt,
    location: m.location,
    agendaNotes: m.agenda,
    status: m.minutes ? 'COMPLETED' : isPast ? 'COMPLETED' : 'SCHEDULED',
    recordedById: m.recordedById,
    createdAt: m.createdAt,
  };
}

// ── Mock fallback ──────────────────────────────────────────────────────────
const MOCK_MEETINGS: MeetingRecord[] = [
  {
    id: 'meet-001',
    groupId: 'group-001',
    title: 'Monthly Savings Meeting — August 2026',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    location: 'Lilongwe Community Hall, Area 18',
    agendaNotes: '1. Monthly contributions review\n2. Loan applications\n3. Withdrawal requests\n4. AOB',
    status: 'SCHEDULED',
    recordedById: 'member-002',
    createdAt: new Date('2026-07-20').toISOString(),
  },
  {
    id: 'meet-002',
    groupId: 'group-001',
    title: 'Monthly Savings Meeting — July 2026',
    scheduledAt: new Date('2026-07-06T09:00:00').toISOString(),
    location: 'Lilongwe Community Hall, Area 18',
    agendaNotes: 'Monthly contributions review. Loan approvals.',
    status: 'COMPLETED',
    recordedById: 'member-002',
    createdAt: new Date('2026-06-28').toISOString(),
  },
  {
    id: 'meet-003',
    groupId: 'group-001',
    title: 'Emergency Meeting — Loan Default Review',
    scheduledAt: new Date('2026-06-20T14:00:00').toISOString(),
    location: 'Online — WhatsApp call',
    agendaNotes: 'Review of overdue loan. Discussion of repayment plan.',
    status: 'COMPLETED',
    recordedById: 'member-003',
    createdAt: new Date('2026-06-18').toISOString(),
  },
];

export function useMeetings(groupId: string) {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    if (!groupId) { setMeetings(MOCK_MEETINGS); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await api.get<RawMeeting[]>(`/api/meetings?groupId=${groupId}`);
      const items = Array.isArray(data) ? data : [];
      setMeetings(items.length > 0 ? items.map(transformMeeting) : MOCK_MEETINGS);
    } catch {
      setMeetings(MOCK_MEETINGS);
    } finally {
      setIsLoading(false);
      setError(null);
    }
  }, [groupId]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  // scheduleMeeting maps our UI payload → API schema (agenda, no title)
  const scheduleMeeting = useCallback(
    async (payload: { title: string; scheduledAt: string; location?: string; agendaNotes?: string }) => {
      await api.post('/api/meetings', {
        groupId,
        scheduledAt: payload.scheduledAt,
        agenda: payload.agendaNotes ?? payload.title,
        location: payload.location,
      });
      await fetchMeetings();
    },
    [groupId, fetchMeetings]
  );

  const confirmAttendance = useCallback(
    async (meetingId: string, memberId: string) => {
      await api.post(`/api/meetings/${meetingId}/attendance`, { memberId });
      await fetchMeetings();
    },
    [fetchMeetings]
  );

  return { meetings, isLoading, error, scheduleMeeting, confirmAttendance, refresh: fetchMeetings };
}
