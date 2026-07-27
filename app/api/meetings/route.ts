import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { ScheduleMeetingSchema } from '@/lib/validations/meetings';
import { MeetingsController } from '@/controllers/meetings/meetings.controller';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const body = await req.json();
    const parsed = ScheduleMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    // Auth check: Must be Chairperson or Secretary to schedule
    const member = await db.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parsed.data.groupId,
          userId,
        },
      },
    });

    if (!member || !['CHAIRPERSON', 'SECRETARY'].includes(member.roleInGroup)) {
      return NextResponse.json({ success: false, error: 'Only Chairperson or Secretary can schedule meetings.' }, { status: 403 });
    }

    const meeting = await MeetingsController.schedule({
      ...parsed.data,
      recordedById: userId,
    });

    return NextResponse.json({ success: true, data: meeting }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/meetings]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'groupId is required.' }, { status: 400 });
    }

    // Verify user is in the group
    const isMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const meetings = await MeetingsController.getByGroup(groupId);
    return NextResponse.json({ success: true, data: meetings }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/meetings]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
