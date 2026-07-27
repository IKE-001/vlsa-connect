import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// =============================================================================
// app/api/notifications/[id]/read/route.ts
// Owned by: Orama (Auth & Governance)
//
// POST /api/notifications/:id/read — marks a notification as read
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead } from '@/services/notifications/markNotificationRead';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { id } = await params;
    const updated = await markNotificationRead(id, userId);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Notification not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/notifications/:id/read]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
