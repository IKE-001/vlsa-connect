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
    const group = await GroupsController.getById(id);

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found.' }, { status: 404 });
    }

    // Verify user is in the group before returning full details
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: group }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/groups/:id]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
