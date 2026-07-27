/**
 * lib/utils/getCallerUserId.ts
 *
 * Server-side helper to resolve the authenticated user from either:
 *  1. The `x-caller-user-id` header (injected by middleware when it runs)
 *  2. The `vsla_token` httpOnly cookie (direct JWT verification fallback)
 *
 * This dual approach keeps API routes working whether or not the middleware
 * injects identity headers (e.g. during local dev with middleware bypassed).
 *
 * Returns null if the request is unauthenticated.
 */

import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/utils/jwt';

const COOKIE_NAME = 'vsla_token';

export async function getCallerUserId(req: NextRequest): Promise<string | null> {
  // 1. Try header first (fast path — set by middleware in production)
  const headerUserId = req.headers.get('x-caller-user-id');
  if (headerUserId) return headerUserId;

  // 2. Fallback: read and verify JWT cookie directly
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyJwt(token);
    // Reject incomplete 2FA sessions — they are not fully authenticated
    if (payload.type === 'pending_2fa') return null;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
