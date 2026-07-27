import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// app/api/auth/2fa/setup/route.ts
// Requires full authenticated session (middleware enforces this).
import { NextRequest, NextResponse } from 'next/server';
import { handleSetup2fa } from '@/controllers/auth/handleSetup2fa';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req) ?? '';
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthenticated.' }, { status: 401 });
    const result = await handleSetup2fa(userId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error('[POST /api/auth/2fa/setup]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
