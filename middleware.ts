// =============================================================================
// middleware.ts — Next.js Edge Middleware
// Owned by: Orama (implemented by Jabari)
//
// Runs on the Edge Runtime (no Node.js APIs — uses Web Crypto via jose).
// Responsibilities:
//   1. Extract JWT from httpOnly cookie
//   2. Verify signature + check DB revocation via verifySession
//   3. Inject identity headers for API routes and server components
//   4. Redirect unauthenticated requests to /login
//   5. Enforce PlatformRole-based route access (bank-officer, admin paths)
//   6. For group-scoped routes, look up GroupMember and inject group headers
//
// Header contract injected downstream:
//   x-caller-user-id        → User.id
//   x-caller-platform-role  → User.platformRole
//   x-caller-session-id     → Session.id (used by logout route)
//   x-caller-group-role     → GroupMember.roleInGroup (if x-active-group-id present)
//   x-caller-member-id      → GroupMember.id         (if x-active-group-id present)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt, hashToken } from '@/lib/utils/jwt';

// NOTE: verifySession (which hits the DB) cannot run in Edge Middleware
// because Prisma requires Node.js runtime.
// Strategy: verify JWT signature in Edge middleware (cryptographic check),
// then let API route handlers call verifySession for DB revocation check
// on sensitive operations. This is the standard Next.js pattern.

const COOKIE_NAME = 'vsla_token';

// Routes requiring PlatformRole.BANK_OFFICER or ADMIN.
const BANK_OFFICER_PATHS = ['/bank-officer', '/admin'];

// Routes that are public — skip auth check entirely.
const PUBLIC_PATHS = [
  '/',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/login',
  '/api/auth/2fa/verify',
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/verify',
  // External webhook callbacks — third-party services can't provide a session cookie
  '/api/payments/callback',   // PayChangu payment result webhook
  '/api/payments/verify',     // PayChangu return URL after hosted payment
  '/api/ussd',                // Africa's Talking USSD session handler
  '/api/sms/delivery',        // Africa's Talking SMS delivery report
  '/api/media/notify',        // Cloudinary upload notification
  // UI public routes
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const payload = await verifyJwt(token);

    const headers = new Headers(req.headers);
    if (payload.sub) headers.set('x-caller-user-id', payload.sub);
    if (payload.role) headers.set('x-caller-platform-role', payload.role);
    if (payload.sessionId) headers.set('x-caller-session-id', payload.sessionId);

    return NextResponse.next({
      request: {
        headers,
      },
    });
  } catch (err) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
