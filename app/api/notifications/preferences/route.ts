import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// =============================================================================
// app/api/notifications/preferences/route.ts
// Owned by: Orama (Auth & Governance)
//
// GET /api/notifications/preferences
// PATCH /api/notifications/preferences
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { updateNotificationPreferences, getNotificationPreferences } from '@/services/notifications/updateNotificationPreferences';
import { z } from 'zod';

const UpdatePreferencesSchema = z.object({
  notifyInApp: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const prefs = await getNotificationPreferences(userId);
    if (!prefs) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });

    return NextResponse.json({ success: true, data: prefs }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/notifications/preferences]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const body = await req.json();
    const parsed = UpdatePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const updatedUser = await updateNotificationPreferences({ userId, ...parsed.data });
    return NextResponse.json({ 
      success: true, 
      data: {
        notifyInApp: updatedUser.notifyInApp,
        notifySms: updatedUser.notifySms,
        notifyEmail: updatedUser.notifyEmail
      } 
    }, { status: 200 });
  } catch (err) {
    console.error('[PATCH /api/notifications/preferences]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
