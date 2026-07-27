import { getCallerUserId } from '@/lib/utils/getCallerUserId';
// =============================================================================
// app/api/savings/[id]/route.ts
// Owned by: Jabari (Financial Logic)
//
// PATCH /api/savings/:id — Chairperson approves or rejects a contribution
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleApproveContribution } from '@/controllers/savings/handleApproveContribution';
import { ApproveContributionSchema } from '@/lib/validations/savings';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = ApproveContributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    // x-caller-group-role → GroupMember.roleInGroup (must be CHAIRPERSON)
    const callerGroupRole = req.headers.get('x-caller-group-role') ?? '';
    const callerUserId = await getCallerUserId(req) ?? '';

    const result = await handleApproveContribution({
      contributionId: id,
      action: parsed.data.action,
      callerGroupRole,
      callerUserId,
    });

    const status = result.success ? 200 : result.code === 'FORBIDDEN' ? 403 : result.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(result, { status });
  } catch (err) {
    console.error('[PATCH /api/savings/:id]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
