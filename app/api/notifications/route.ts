import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// =============================================================================
// app/api/notifications/route.ts
// Owned by: Orama (Auth & Governance)
//
// GET /api/notifications — fetch in-app notifications for the logged in user
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/services/notifications/getNotifications';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate caller
    const userId = await getCallerUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const notifications = await getNotifications(userId, limit);
    return NextResponse.json({ success: true, data: notifications }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
