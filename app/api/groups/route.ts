import { NextRequest, NextResponse } from 'next/server';
import { CreateGroupSchema } from '@/lib/validations/groups';
import { GroupsController } from '@/controllers/groups/groups.controller';
import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const body = await req.json();
    const parsed = CreateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const group = await GroupsController.create({
      ...parsed.data,
      chairpersonId: userId,
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/groups]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    // Fetch all groups the user is a member of
    const groups = await db.vslaGroup.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          where: { userId } // include the member object for this user to get their role
        }
      }
    });

    return NextResponse.json({ success: true, data: groups }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/groups]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
