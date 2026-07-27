/**
 * lib/api/client.ts
 *
 * Typed fetch wrapper for all frontend → backend calls.
 *
 * Auto-injects on every request:
 *   x-active-group-id    — from localStorage (required by all group-scoped APIs)
 *   x-caller-group-role  — from localStorage (required by role guards on the server)
 *   x-caller-member-id   — from localStorage (required by member-scoped writes)
 *
 * Call setActiveGroup({ id, role, memberId }) after login / group hydration.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string | object;
  code?: string;
}

type ApiResult<T> = ApiSuccess<T> | ApiFailure;

// ── LocalStorage key constants ────────────────────────────────────────────
const KEY_GROUP_ID    = 'vsla_active_group_id';
const KEY_GROUP_ROLE  = 'vsla_caller_group_role';
const KEY_MEMBER_ID   = 'vsla_caller_member_id';

function ls(key: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(key) ?? '';
}

// ── Group context setters (call after login + group hydration) ────────────

export function setActiveGroupId(groupId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_GROUP_ID, groupId);
  }
}

export function setCallerGroupRole(role: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_GROUP_ROLE, role);
  }
}

export function setCallerMemberId(memberId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY_MEMBER_ID, memberId);
  }
}

/** Convenience: set all group context values at once. */
export function setActiveGroup(ctx: { id: string; role: string; memberId: string }) {
  setActiveGroupId(ctx.id);
  setCallerGroupRole(ctx.role);
  setCallerMemberId(ctx.memberId);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const groupId   = ls(KEY_GROUP_ID);
  const groupRole = ls(KEY_GROUP_ROLE);
  const memberId  = ls(KEY_MEMBER_ID);

  if (groupId)   headers['x-active-group-id']   = groupId;
  if (groupRole) headers['x-caller-group-role']  = groupRole;
  if (memberId)  headers['x-caller-member-id']   = memberId;

  const res = await fetch(path, { ...options, headers });
  const json: ApiResult<T> = await res.json();

  if (!json.success) {
    const msg =
      typeof json.error === 'string'
        ? json.error
        : 'An unexpected error occurred.';
    throw new ApiError(res.status, (json as ApiFailure).code ?? 'UNKNOWN', msg);
  }

  return (json as ApiSuccess<T>).data;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
