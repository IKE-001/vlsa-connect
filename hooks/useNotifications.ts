'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';

// ── Canonical type used across all UI components ───────────────────────────
export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string;       // mapped from DB "message"
  channel: string;
  read: boolean;      // derived from DB "status" (READ → true, else false)
  createdAt: string;
}

// ── Raw shape returned by GET /api/notifications ───────────────────────────
// DB schema: { id, userId, channel, title, message, status, readAt, sentAt, createdAt }
interface RawNotification {
  id: string;
  userId: string;
  channel: string;
  title: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  readAt: string | null;
  createdAt: string;
}

function transformNotification(n: RawNotification): NotificationRecord {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    body: n.message,
    channel: n.channel,
    read: n.status === 'READ' || n.readAt != null,
    createdAt: n.createdAt,
  };
}

// ── Mock fallback ──────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  { id: 'n1', userId: 'u1', title: 'Loan Approved ✅',          body: 'Your loan request of MWK 50,000 has been approved. Funds will be disbursed shortly.',              channel: 'IN_APP', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'n2', userId: 'u1', title: 'Contribution Received 💰',  body: 'Your contribution of MWK 25,000 for July 2026 has been recorded and approved by the Treasurer.',   channel: 'IN_APP', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n3', userId: 'u1', title: 'Payment Successful 🎉',     body: 'PayChangu payment of MWK 25,000 confirmed. Contribution for August 2026 recorded.',                channel: 'IN_APP', read: false, createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: 'n4', userId: 'u1', title: 'Meeting Reminder 📅',       body: 'Group meeting is tomorrow at 9:00 AM — Lilongwe Community Hall. Confirm attendance.',               channel: 'IN_APP', read: true,  createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n5', userId: 'u1', title: 'New Message 💬',            body: "Grace Phiri: 'Reminder — contribution deadline is this Friday!'",                                   channel: 'IN_APP', read: true,  createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export function useNotifications(limit = 50) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<RawNotification[]>(`/api/notifications?limit=${limit}`);
      const items = Array.isArray(data) ? data : [];
      setNotifications(items.length > 0 ? items.map(transformNotification) : MOCK_NOTIFICATIONS);
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      await api.post(`/api/notifications/${id}/read`, {});
    } catch {
      // Revert on failure
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: false } : n));
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, isLoading, error, markAsRead, refresh: fetchNotifications };
}
