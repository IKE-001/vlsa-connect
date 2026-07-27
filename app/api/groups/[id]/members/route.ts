import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { GroupsController } from '@/controllers/groups/groups.controller';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { id } = await params;

    // First verify the caller is actually in this group
    const group = await GroupsController.getById(id);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found.' }, { status: 404 });
    }

    const callerIsMember = group.members.some((m: any) => m.userId === userId);
    const platformRole = req.headers.get('x-caller-platform-role') || '';
    const isPrivileged = ['BANK_OFFICER', 'ADMIN'].includes(platformRole);

    if (!callerIsMember && !isPrivileged) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const members = await GroupsController.getMembers(id);

    return NextResponse.json({ success: true, data: members }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/groups/:id/members]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
