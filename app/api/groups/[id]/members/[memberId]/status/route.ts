import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { UpdateStatusSchema } from '@/lib/validations/groups';
import { GroupsController } from '@/controllers/groups/groups.controller';
import db from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, memberId: string }> }
) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { id: groupId, memberId } = await params;
    
    // Auth Check: Only Chairperson can kick/suspend members
    const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
    if (!group || group.chairpersonId !== userId) {
      return NextResponse.json({ success: false, error: 'Only the Chairperson can change member status.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await GroupsController.updateStatus(memberId, groupId, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Member not found in this group.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error('[PATCH /api/groups/:id/members/:memberId/status]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
