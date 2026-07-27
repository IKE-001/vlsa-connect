'use client';

/**
 * hooks/useChat.ts — real API integration
 *
 * NOTE: The chat API (/api/chat) uses a non-standard response envelope
 * { data: ... } instead of { success: true, data: ... }.
 * We use raw fetch here to match that contract exactly.
 *
 * GET  /api/chat?groupId=&limit=  → fetch messages
 * POST /api/chat                  → send a message
 */

import { useState, useEffect, useCallback } from 'react';
import { setActiveGroupId } from '@/lib/api/client';

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName?: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

export function useChat(groupId: string, limit = 50) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: true,
    isSending: false,
    error: null,
  });

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ groupId, limit: String(limit) });
      const res = await fetch(`/api/chat?${params}`, {
        headers: { 'x-active-group-id': groupId },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? 'Failed to fetch messages.');
      }
      const json = await res.json();
      const msgs: ChatMessage[] = json.data ?? [];
      setState({ messages: msgs, isLoading: false, isSending: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load messages.';
      setState((s) => ({ ...s, isLoading: false, error: msg }));
    }
  }, [groupId, limit]);

  useEffect(() => {
    // Ensure the active group header is kept in sync.
    if (groupId) setActiveGroupId(groupId);
    fetchMessages();
  }, [fetchMessages, groupId]);

  const sendMessage = useCallback(
    async (body: string, mediaUrl?: string, mediaType?: 'image' | 'document') => {
      if (!groupId || (!body.trim() && !mediaUrl)) return;
      setState((s) => ({ ...s, isSending: true }));
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-active-group-id': groupId,
          },
          body: JSON.stringify({ groupId, body, mediaUrl, mediaType }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error ?? 'Failed to send message.');
        }
        const json = await res.json();
        const newMsg: ChatMessage = json.data;
        setState((s) => ({
          ...s,
          messages: [...s.messages, newMsg],
          isSending: false,
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send message.';
        setState((s) => ({ ...s, isSending: false, error: msg }));
      }
    },
    [groupId]
  );

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isSending: state.isSending,
    error: state.error,
    sendMessage,
    refresh: fetchMessages,
  };
}
