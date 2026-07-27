import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { GroupsController } from '@/controllers/groups/groups.controller';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { id: groupId } = await params;
    
    const updatedMember = await GroupsController.leave(userId, groupId);
    
    if (!updatedMember) {
      return NextResponse.json({ success: false, error: 'Member not found in this group.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedMember }, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/groups/:id/leave]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
