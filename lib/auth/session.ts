/**
 * lib/auth/session.ts
 *
 * Client-side session utilities.
 *
 * The JWT lives in an httpOnly cookie (vsla_token) — JS cannot read it.
 * We instead expose a server action / API route to decode the user's own
 * identity. This file provides the client hook that fetches /api/auth/me.
 *
 * The middleware injects role headers for server-side code. On the client,
 * we hit /api/auth/me (added here) to get the same info.
 */

export interface SessionUser {
  userId: string;
  platformRole: string;
  sessionId: string;
  type: 'session' | 'pending_2fa';
}

/**
 * Fetches the current session user from the API.
 * Returns null if not authenticated (no valid cookie).
 * Called once on mount by useAuth.
 */
export async function fetchCurrentSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch('/api/auth/me', { method: 'GET' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    return json.data as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Maps a platform role to its dashboard route.
 * Route groups like (member), (chairperson) etc. are transparent to the URL —
 * Next.js resolves them to the path *inside* the group.
 */
export function roleToDashboardPath(role: string): string {
  const map: Record<string, string> = {
    MEMBER: '/dashboard',
    CHAIRPERSON: '/dashboard',
    TREASURER: '/dashboard',
    SECRETARY: '/dashboard',
    BANK_OFFICER: '/bank-officer/dashboard',
    ADMIN: '/admin/dashboard',
  };
  return map[role] ?? '/dashboard';
}
