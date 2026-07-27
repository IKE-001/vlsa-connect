import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { RecordAttendanceSchema } from '@/lib/validations/meetings';
import { MeetingsController } from '@/controllers/meetings/meetings.controller';
import db from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { id: meetingId } = await params;
    
    // Auth Check: Must be Chairperson or Secretary
    const meeting = await db.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return NextResponse.json({ success: false, error: 'Meeting not found.' }, { status: 404 });

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: meeting.groupId, userId } },
    });

    if (!member || !['CHAIRPERSON', 'SECRETARY'].includes(member.roleInGroup)) {
      return NextResponse.json({ success: false, error: 'Only Chairperson or Secretary can record attendance.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = RecordAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const attendance = await MeetingsController.recordAttendance(meetingId, parsed.data.records);
    return NextResponse.json({ success: true, data: attendance }, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/meetings/:id/attendance]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
