import { NextRequest, NextResponse } from 'next/server';
import { JoinGroupSchema } from '@/lib/validations/groups';
import { GroupsController } from '@/controllers/groups/groups.controller';
import { getCallerUserId } from '@/lib/utils/getCallerUserId';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const body = await req.json();
    const parsed = JoinGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const member = await GroupsController.join(userId, parsed.data.inviteCode);
    
    if (!member) {
      return NextResponse.json({ success: false, error: 'Invalid invite code or group closed.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: member }, { status: 200 });
  } catch (err: any) {
    console.error('[POST /api/groups/join]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
