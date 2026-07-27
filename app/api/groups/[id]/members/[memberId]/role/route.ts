import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { UpdateRoleSchema } from '@/lib/validations/groups';
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
    
    // Auth Check: Only Chairperson can change roles
    const group = await db.vslaGroup.findUnique({ where: { id: groupId } });
    if (!group || group.chairpersonId !== userId) {
      return NextResponse.json({ success: false, error: 'Only the Chairperson can change member roles.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    // Don't allow changing someone to CHAIRPERSON through this endpoint, use transfer-ownership instead
    if (parsed.data.role === 'CHAIRPERSON') {
      return NextResponse.json({ success: false, error: 'Use the transfer-ownership endpoint to change the Chairperson.' }, { status: 400 });
    }

    const updated = await GroupsController.updateRole(memberId, groupId, parsed.data.role);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Member not found in this group.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error('[PATCH /api/groups/:id/members/:memberId/role]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
