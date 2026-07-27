import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { UpdateMinutesSchema } from '@/lib/validations/meetings';
import { MeetingsController } from '@/controllers/meetings/meetings.controller';
import db from '@/lib/db';

async function handleMinutesUpdate(req: NextRequest, meetingId: string) {
  const userId = await getCallerUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const meeting = await db.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) return NextResponse.json({ success: false, error: 'Meeting not found.' }, { status: 404 });

  const member = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId: meeting.groupId, userId } },
  });

  if (!member || !['CHAIRPERSON', 'SECRETARY'].includes(member.roleInGroup)) {
    return NextResponse.json({ success: false, error: 'Only Chairperson or Secretary can update meeting minutes.' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateMinutesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await MeetingsController.updateMinutes(meetingId, parsed.data.minutes);
  return NextResponse.json({ success: true, data: updated }, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    return await handleMinutesUpdate(req, meetingId);
  } catch (err: any) {
    console.error('[PATCH /api/meetings/:id/minutes]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    return await handleMinutesUpdate(req, meetingId);
  } catch (err: any) {
    console.error('[POST /api/meetings/:id/minutes]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
