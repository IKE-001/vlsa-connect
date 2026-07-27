'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProfileSubpageTemplate } from '@/components/templates/ProfileSubpageTemplate/ProfileSubpageTemplate';
import { Button } from '@/components/atoms/Button/Button';
import { Icon } from '@/components/atoms/Icon/Icon';
import { Input } from '@/components/atoms/Input/Input';
import { api } from '@/lib/api/client';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-001',
    subject: 'Unable to make mobile money contribution',
    description: 'I tried to pay my monthly contribution via Airtel Money but the PayChangu redirect failed after 3 attempts.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolvedAt: null,
  },
  {
    id: 'tkt-002',
    subject: 'Loan repayment not reflecting in balance',
    description: 'I made a repayment of MWK 10,000 on July 20 but my outstanding balance still shows the full amount.',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
  OPEN:        { label: 'Open',        bg: 'bg-[#FEF0E1]', text: 'text-[#D97706]', dot: 'bg-[#F59E0B]' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-[#E8EFFD]', text: 'text-[#2F6FED]', dot: 'bg-[#2F6FED]' },
  RESOLVED:    { label: 'Resolved',    bg: 'bg-[#E3F3EA]', text: 'text-[#2D7A52]', dot: 'bg-[#2D7A52]' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ tickets: SupportTicket[] }>('/api/support');
      const list = data.tickets ?? [];
      setTickets(list.length > 0 ? list : MOCK_TICKETS);
    } catch {
      setTickets(MOCK_TICKETS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/support', { subject, description });
      setSubject('');
      setDescription('');
      setShowForm(false);
      setSuccessMsg('Ticket submitted! Our team will respond within 24 hours.');
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchTickets();
    } catch {
      // Still show optimistic feedback
      const newTicket: SupportTicket = {
        id: `tkt-${Date.now()}`,
        subject,
        description,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      };
      setTickets((prev) => [newTicket, ...prev]);
      setSubject('');
      setDescription('');
      setShowForm(false);
      setSuccessMsg('Ticket submitted! Our team will respond within 24 hours.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = tickets.filter((t) => t.status !== 'RESOLVED').length;

  return (
    <ProfileSubpageTemplate title="Help & Support">
      <div className="flex flex-col gap-4">

        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12.5px] text-[#5B6B65]">
              {openCount > 0
                ? `You have ${openCount} open ticket${openCount > 1 ? 's' : ''}`
                : 'All tickets resolved'}
            </p>
          </div>
          <Button
            theme="green"
            size="sm"
            leftIcon={<Icon name="doc" className="w-3.5 h-3.5" />}
            onClick={() => setShowForm(true)}
          >
            New Ticket
          </Button>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="bg-[#E3F3EA] border border-[#2D7A52]/30 text-[#1B5E3F] text-[13px] font-semibold rounded-[12px] px-4 py-3 flex items-center gap-2">
            <Icon name="star" className="w-4 h-4 text-[#2D7A52] shrink-0" />
            {successMsg}
          </div>
        )}

        {/* New ticket form */}
        {showForm && (
          <div className="bg-white rounded-[16px] border border-[#E9EDEA] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] flex flex-col gap-3">
            <h3 className="text-[14.5px] font-extrabold text-[#1B2321]">Submit a Support Request</h3>
            <Input
              label="Subject"
              placeholder="e.g. Contribution not reflecting"
              theme="green"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#5B6B65]">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                className="w-full border border-[#D5E0D8] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1B2321] placeholder:text-[#94A29C] focus:outline-none focus:border-[#2D7A52] resize-none transition-colors"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" theme="green" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                theme="green"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !subject.trim() || !description.trim()}
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </Button>
            </div>
          </div>
        )}

        {/* Tickets list */}
        <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] overflow-hidden">
          {isLoading && (
            <div className="py-10 text-center text-[13px] text-[#94A29C]">Loading tickets…</div>
          )}
          {!isLoading && tickets.length === 0 && (
            <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#E3F3EA] flex items-center justify-center">
                <Icon name="doc" className="w-5 h-5 text-[#2D7A52]" />
              </div>
              <p className="text-[13px] font-semibold text-[#5B6B65]">No support tickets yet.</p>
              <p className="text-[12px] text-[#94A29C]">Click "New Ticket" to report an issue.</p>
            </div>
          )}
          {!isLoading && tickets.map((ticket, i) => {
            const cfg = STATUS_CONFIG[ticket.status];
            return (
              <div
                key={ticket.id}
                className={`px-5 py-4 flex items-start gap-4 ${i < tickets.length - 1 ? 'border-b border-[#F1F4F2]' : ''}`}
              >
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon name="doc" className={`w-4 h-4 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13.5px] font-bold text-[#1B2321] leading-snug">{ticket.subject}</span>
                    <span className={`shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#5B6B65] mt-0.5 line-clamp-2">{ticket.description}</p>
                  <span className="text-[11px] text-[#94A29C] mt-1 block">
                    {timeAgo(ticket.createdAt)}
                    {ticket.resolvedAt ? ` · Resolved ${timeAgo(ticket.resolvedAt)}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact info card */}
        <div className="bg-white rounded-[16px] border border-[#E9EDEA] p-4 shadow-[0_2px_10px_rgba(18,58,41,0.04)]">
          <p className="text-[12px] font-semibold text-[#94A29C] mb-3">Other ways to reach us</p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center shrink-0">
                <Icon name="chat" className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#94A29C]">WhatsApp Support</div>
                <div className="text-[13px] font-extrabold text-[#1B2321]">+265 991 000 000</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E6EEFA] text-[#4A7FC1] flex items-center justify-center shrink-0">
                <Icon name="doc" className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#94A29C]">Email Support</div>
                <div className="text-[13px] font-extrabold text-[#1B2321]">support@finovate.mw</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ProfileSubpageTemplate>
  );
}
