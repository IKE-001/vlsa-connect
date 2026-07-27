import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// =============================================================================
// app/api/savings/route.ts
// Owned by: Jabari (Financial Logic)
//
// POST /api/savings — Treasurer logs a contribution (→ PENDING)
// GET  /api/savings — List contributions / get member balance
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleCreateContribution } from '@/controllers/savings/handleCreateContribution';
import { handleGetHistory } from '@/controllers/savings/handleGetHistory';
import { handleGetBalance } from '@/controllers/savings/handleGetBalance';
import { CreateContributionSchema, GetSavingsQuerySchema } from '@/lib/validations/savings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateContributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    // x-caller-group-role → GroupMember.roleInGroup (e.g. TREASURER)
    // x-caller-user-id    → User.id of the caller
    const callerGroupRole = req.headers.get('x-caller-group-role') ?? '';
    const callerUserId = await getCallerUserId(req) ?? '';

    const result = await handleCreateContribution({ ...parsed.data, callerGroupRole, callerUserId });
    return NextResponse.json(result, { status: result.success ? 201 : 403 });
  } catch (err) {
    console.error('[POST /api/savings]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = GetSavingsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    // If action is explicitly 'balance', return balance object
    if (parsed.data.action === 'balance' && parsed.data.memberId) {
      const balance = await handleGetBalance({
        memberId: parsed.data.memberId,
        groupId: parsed.data.groupId,
      });
      return NextResponse.json(balance, { status: 200 });
    }

    // Otherwise (or if action is 'history'), return the history list
    const history = await handleGetHistory(parsed.data);
    return NextResponse.json(history, { status: 200 });
  } catch (err) {
    console.error('[GET /api/savings]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
