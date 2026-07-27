// =============================================================================
// app/api/withdrawals/[id]/vote/route.ts
//
// POST /api/withdrawals/:id/vote — Active member casts a vote; auto-resolves at quorum
// When quorum is reached and APPROVED, triggers a PayChangu Mobile Money payout
// to the requesting member's phone number.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleCastWithdrawalVote } from '@/controllers/withdrawals/handleCastWithdrawalVote';
import { handleResolveWithdrawal } from '@/controllers/withdrawals/handleResolveWithdrawal';
import { PaymentsController } from '@/controllers/payments/payments.controller';
import { CastWithdrawalVoteSchema } from '@/lib/validations/withdrawals';
import db from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const body = await req.json();
    const parsed = CastWithdrawalVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    // 1. Record the vote.
    const voteResult = await handleCastWithdrawalVote({ requestId, ...parsed.data });
    if (!voteResult.success) {
      const status = voteResult.code === 'FORBIDDEN' ? 403 : voteResult.code === 'DUPLICATE_VOTE' ? 409 : 400;
      return NextResponse.json(voteResult, { status });
    }

    // 2. Check quorum and resolve if reached.
    const resolution = await handleResolveWithdrawal(requestId);

    // 3. If just resolved to APPROVED — trigger PayChangu Mobile Money payout.
    let payoutResult = null;
    if (resolution.success && resolution.data?.resolved && resolution.data?.request?.status === 'APPROVED') {
      try {
        const request = await db.withdrawalRequest.findUnique({
          where: { id: requestId },
          include: {
            member: {
              include: {
                user: { select: { phoneNumber: true, fullName: true } },
              },
            },
          },
        });

        if (request && request.member?.user?.phoneNumber) {
          const chargeId = `withdrawal-${requestId}-${randomUUID().slice(0, 8)}`;
          const payout = await PaymentsController.triggerMobileMoneyPayout(
            request.member.user.phoneNumber,
            request.amountTambala,
            chargeId
          );

          // Record payment transaction
          await db.paymentTransaction.create({
            data: {
              idempotencyKey: chargeId,
              entityType: 'WITHDRAWAL',
              entityId: request.id,
              amountTambala: request.amountTambala,
              status: payout.success ? 'PENDING' : 'FAILED',
              failureReason: !payout.success ? JSON.stringify(payout.error) : null,
              providerPayload: payout.success ? payout.data : null,
            },
          });

          // Link payout reference to withdrawal
          if (payout.success) {
            await db.withdrawalRequest.update({
              where: { id: requestId },
              data: { paychanguRef: chargeId },
            });
          }

          payoutResult = { success: payout.success, chargeId };
        }
      } catch (payoutErr) {
        // Payout failure is non-blocking — log but don't fail the response
        console.error('[Withdrawal Payout Error]', payoutErr);
        payoutResult = { success: false, error: 'Payout could not be initiated. Treasurer must disburse manually.' };
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          vote: voteResult.data,
          resolution: resolution.success ? resolution.data : null,
          payout: payoutResult,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/withdrawals/:id/vote]', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
