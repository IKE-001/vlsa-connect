import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// app/api/auth/2fa/enable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleEnable2fa } from '@/controllers/auth/handleEnable2fa';
import { Enable2faSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req) ?? '';
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthenticated.' }, { status: 401 });

    const parsed = Enable2faSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await handleEnable2fa(userId, parsed.data.code);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error('[POST /api/auth/2fa/enable]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
