import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextResponse } from "next/server";
import { SupportController } from "@/controllers/support/support.controller";

export async function POST(req: Request) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, description } = await req.json();

    const result = await SupportController.create(userId, subject, description);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ticket: result.ticket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getCallerUserId(req);
    const role = req.headers.get('x-caller-platform-role') || 'MEMBER';
    
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await SupportController.list(userId, role);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ tickets: result.tickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
