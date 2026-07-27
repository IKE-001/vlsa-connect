'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/templates/AdminShell';
import { DashboardStats } from '@/components/organisms/DashboardStats';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { GroupDirectory } from '@/components/organisms/GroupDirectory';
import { MOCK_SYSTEM_LOGS, MOCK_ADMIN_METRICS } from '@/lib/mock/adminMock';
import { formatMWK } from '@/lib/utils/money';
import { Users, Building2, Activity, ShieldAlert, CheckCircle2, XCircle, MessageSquare, Clock } from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock support tickets for admin panel
// ---------------------------------------------------------------------------
const MOCK_ADMIN_TICKETS = [
  { id: 'tkt-001', subject: 'Unable to make mobile money contribution', user: 'Grace Phiri', group: 'Tikondane Women Group', status: 'IN_PROGRESS', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'tkt-002', subject: 'Loan repayment not reflecting in balance', user: 'Chisomo Tembo', group: 'Tikondane Women Group', status: 'RESOLVED', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'tkt-003', subject: 'Withdrawal request stuck in pending for 3 days', user: 'Mphatso Chirwa', group: 'Chisomo Community VSLA', status: 'OPEN', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'tkt-004', subject: 'Group invitation code not working', user: 'Tadala Nkosi', group: 'Mapalo Savings Circle', status: 'OPEN', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
];

const MOCK_USERS = [
  { id: 'u1', name: 'Grace Phiri',      phone: '+265 999 111 001', role: 'CHAIRPERSON', avatarUrl: null, email: 'grace@example.com' },
  { id: 'u2', name: 'Beatrice Mwale',   phone: '+265 999 111 002', role: 'TREASURER',   avatarUrl: null, email: 'beatrice@example.com' },
  { id: 'u3', name: 'Ruth Banda',       phone: '+265 999 111 003', role: 'SECRETARY',   avatarUrl: null, email: 'ruth@example.com' },
  { id: 'u4', name: 'Chisomo Tembo',    phone: '+265 999 111 004', role: 'MEMBER',      avatarUrl: null, email: 'chisomo@example.com' },
  { id: 'u5', name: 'Mphatso Chirwa',   phone: '+265 999 111 005', role: 'MEMBER',      avatarUrl: null, email: 'mphatso@example.com' },
  { id: 'u6', name: 'Tadala Nkosi',     phone: '+265 999 111 006', role: 'MEMBER',      avatarUrl: null, email: 'tadala@example.com' },
];

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
const TICKET_STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  OPEN:        { label: 'Open',        bg: 'bg-amber-50',   text: 'text-amber-600' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50',    text: 'text-blue-600' },
  RESOLVED:    { label: 'Resolved',    bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

interface AdminMetrics {
  totalUsers: number;
  activeGroups: number;
  totalSavingsTambala: number;
  healthScoreAvg: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics>(MOCK_ADMIN_METRICS);
  const [users, setUsers] = useState<any[]>(MOCK_USERS);
  const [tickets, setTickets] = useState(MOCK_ADMIN_TICKETS);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | TicketStatus>('ALL');

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsRes, usersRes] = await Promise.all([
          fetch('/api/admin/metrics'),
          fetch('/api/admin/users'),
        ]);
        if (metricsRes.ok) {
          const m = await metricsRes.json();
          if (m.data) setMetrics(m.data);
        }
        if (usersRes.ok) {
          const u = await usersRes.json();
          if (u.data?.length > 0) setUsers(u.data);
        }
      } catch {
        // keep mock data
      }
      try {
        const tRes = await fetch('/api/support');
        if (tRes.ok) {
          const t = await tRes.json();
          if (t.tickets?.length > 0) setTickets(t.tickets);
        }
      } catch { /* keep mock */ }
    }
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Registered Users',   value: metrics.totalUsers.toLocaleString(), subtext: 'Across all VSLA groups',        icon: <Users      className="w-5 h-5 text-emerald-600" />, trend: 'up' as const, trendText: '+18 this month' },
    { label: 'Active VSLA Groups',        value: String(metrics.activeGroups),         subtext: 'Verified operating circles',     icon: <Building2  className="w-5 h-5 text-emerald-600" />, trend: 'up' as const, trendText: '+3 this month' },
    { label: 'Platform Total Savings',    value: formatMWK(metrics.totalSavingsTambala), subtext: 'Across all VSLA cashboxes',  icon: <Activity   className="w-5 h-5 text-emerald-600" />, trend: 'up' as const, trendText: '+8.4% this month' },
    { label: 'Avg. Platform Health Score',value: `${metrics.healthScoreAvg}/100`,      subtext: 'Portfolio creditworthiness avg', icon: <ShieldAlert className="w-5 h-5 text-emerald-600" />, trend: 'up' as const, trendText: '+1.2 pts' },
  ];

  const filteredTickets = ticketFilter === 'ALL' ? tickets : tickets.filter((t) => t.status === ticketFilter);
  const openCount = tickets.filter((t) => t.status !== 'RESOLVED').length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">System Administration Dashboard</h1>
          <p className="text-xs text-slate-500">Full platform oversight — users, groups, security events, and system health metrics</p>
        </div>

        <DashboardStats stats={stats} columns={4} />

        {/* Support Ticket Queue */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Support Ticket Queue
              {openCount > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">{openCount} open</span>
              )}
            </h3>
            {/* Filter tabs */}
            <div className="flex gap-1.5">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTicketFilter(f)}
                  className={`px-3 py-1 rounded-[6px] text-[11px] font-bold border transition-all ${
                    ticketFilter === f
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'text-slate-500 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-[10px] border border-slate-100 dark:border-slate-800 overflow-hidden">
            {filteredTickets.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">No tickets found.</div>
            )}
            {filteredTickets.map((ticket) => {
              const cfg = TICKET_STATUS_CFG[ticket.status] ?? TICKET_STATUS_CFG['OPEN'];
              return (
                <div key={ticket.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{ticket.subject}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ticket.user} · {ticket.group}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(ticket.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* System Audit Logs */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            System Security Audit Logs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-2">Timestamp</th>
                  <th className="pb-3 px-2">Action</th>
                  <th className="pb-3 px-2">User</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">IP Address</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {MOCK_SYSTEM_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">{log.action}</td>
                    <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{log.user}</td>
                    <td className="py-3 px-2"><Badge variant="neutral" size="sm">{log.role}</Badge></td>
                    <td className="py-3 px-2 text-slate-500 font-mono text-[11px]">{log.ipAddress}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        log.status === 'SUCCESS' ? 'text-emerald-600' : log.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* User Directory */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Platform Directory ({users.length} users)
          </h3>
          <GroupDirectory members={users} />
        </div>
      </div>
    </AdminShell>
  );
}
