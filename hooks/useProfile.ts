'use client';

/**
 * hooks/useProfile.ts — real API integration
 *
 * GET /api/auth/me → current user's own profile (from session cookie)
 *
 * Profile updates are not yet implemented in the backend.
 * PATCH /api/groups/[id]/members/[memberId]/role → role changes (admin only)
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentSession, type SessionUser } from '@/lib/auth/session';

export interface UserProfile extends SessionUser {
  fullName?: string;
  phoneNumber?: string;
  email?: string | null;
  avatarUrl?: string | null;
  roleInGroup?: string;
  homeAddress?: string | null;
}

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (!json.success || !json.data) {
        setState({ profile: null, isLoading: false, error: 'Not authenticated.' });
        return;
      }
      setState({ profile: json.data as UserProfile, isLoading: false, error: null });
    } catch {
      setState({ profile: null, isLoading: false, error: 'Failed to load profile.' });
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchProfile,
  };
}
