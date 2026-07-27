import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from 'next/server';
import { TransferOwnershipSchema } from '@/lib/validations/groups';
import { GroupsController } from '@/controllers/groups/groups.controller';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const { id: groupId } = await params;
    
    const body = await req.json();
    const parsed = TransferOwnershipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const updatedGroup = await GroupsController.transferOwnership(groupId, userId, parsed.data.newChairpersonId);
    
    return NextResponse.json({ success: true, data: updatedGroup }, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/groups/:id/transfer-ownership]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
