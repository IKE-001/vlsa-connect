// =============================================================================
// controllers/loans/handleRepayLoan.ts
// Owned by: Jabari (Financial Logic)
//
// Business rules:
//   1. Loan must be DISBURSED or REPAYING
//   2. Repayment must not exceed remaining balance
//   3. For CASH: ledger CREDIT + instalment insert + amountRepaid increment atomically
//   4. For MOBILE_MONEY/CARD: initiate PayChangu checkout, record PaymentTransaction
//      → webhook will complete the ledger when payment confirms
//   5. Mark REPAID when balance is cleared
//   6. Trigger Health Score recompute
// =============================================================================

import db from '@/lib/db';
import { appendLedgerEntry } from '@/services/ledger/appendLedgerEntry';
import { computeHealthScore } from '@/services/healthScore/computeHealthScore';
import { saveHealthScore } from '@/services/healthScore/saveHealthScore';
import { RepayLoanInput } from '@/lib/validations/loans';
import { ApiResponse } from '@/types/financial';
import { LOAN_RULES } from '@/config/loanRules';
import { PaymentsController } from '@/controllers/payments/payments.controller';

type HandleRepayLoanArgs = RepayLoanInput & {
  loanId: string;
  /** GroupMember.id of the caller — must be the loan owner */
  callerMemberId: string;
};

export async function handleRepayLoan(
  args: HandleRepayLoanArgs
): Promise<ApiResponse<{ loanStatus: string; remainingDueTambala: number; checkoutUrl?: string }>> {
  const { loanId, amountTambala, method, paychanguRef, idempotencyKey, callerMemberId } = args;

  // Validate OUTSIDE transaction (no side effects).
  const loan = await db.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true, status: true, groupId: true, memberId: true,
      totalDueTambala: true, amountRepaidTambala: true, principalTambala: true,
    },
  });
  if (!loan) return { success: false, error: 'Loan not found.', code: 'NOT_FOUND' };

  // Security: only the loan owner may submit repayments.
  if (loan.memberId !== callerMemberId) {
    return { success: false, error: 'You can only repay your own loan.', code: 'FORBIDDEN' };
  }

  if (!['DISBURSED', 'REPAYING'].includes(loan.status)) {
    return { success: false, error: `Cannot repay a loan with status ${loan.status}.`, code: 'INVALID_STATE' };
  }

  const totalDue = loan.totalDueTambala ?? loan.principalTambala;
  const alreadyRepaid = loan.amountRepaidTambala;
  const remaining = totalDue - alreadyRepaid;

  if (amountTambala > remaining) {
    return {
      success: false,
      error: `Repayment (${amountTambala}) exceeds remaining balance (${remaining}).`,
      code: 'OVERPAYMENT',
    };
  }

  // For MOBILE_MONEY or CARD — initiate PayChangu checkout.
  // Webhook will complete the ledger entry when payment confirms.
  if (method === 'MOBILE_MONEY' || method === 'CARD') {
    const member = await db.groupMember.findUnique({
      where: { id: callerMemberId },
      include: { user: { select: { email: true, fullName: true } } },
    });

    const names = (member?.user?.fullName || 'VSLA Member').split(' ');
    const firstName = names[0] || 'VSLA';
    const lastName = names.slice(1).join(' ') || 'Member';
    const txRef = idempotencyKey || `repay-${loanId}-${Date.now()}`;

    const paychanguRes = await PaymentsController.initializeTransaction({
      amountTambala,
      email: member?.user?.email || 'member@vslaconnect.com',
      firstName,
      lastName,
      txRef,
      description: `Loan repayment — ${amountTambala / 100} MWK`,
    });

    if (paychanguRes.success && paychanguRes.checkoutUrl) {
      // Record pending payment transaction
      await db.paymentTransaction.create({
        data: {
          idempotencyKey: txRef,
          entityType: 'LOAN_REPAYMENT',
          entityId: loan.id,
          amountTambala,
          status: 'INITIATED',
        },
      });

      return {
        success: true,
        data: {
          loanStatus: loan.status,
          remainingDueTambala: remaining,
          checkoutUrl: paychanguRes.checkoutUrl,
        },
      };
    }

    // If PayChangu fails, fall through to record CASH-style
    console.warn('PayChangu checkout failed, falling back to manual recording.');
  }

  // CASH path (or PayChangu fallback): ledger write + repayment insert + loan update atomically.
  const { newRemaining, newStatus } = await db.$transaction(async (tx) => {
    await appendLedgerEntry(
      {
        groupId: loan.groupId,
        entryType: 'LOAN_REPAYMENT',
        referenceId: loan.id,
        amountTambala,
        direction: 'CREDIT',
      },
      tx
    );

    await tx.loanRepayment.create({
      data: {
        loanId,
        amountTambala,
        method,
        idempotencyKey: idempotencyKey ?? null,
        paychanguRef: paychanguRef ?? null,
      },
    });

    const newAmountRepaid = alreadyRepaid + amountTambala;
    const computedRemaining = totalDue - newAmountRepaid;
    const resolvedStatus: 'REPAYING' | 'REPAID' = computedRemaining <= 0 ? 'REPAID' : 'REPAYING';

    await tx.loan.update({
      where: { id: loanId },
      data: {
        amountRepaidTambala: { increment: amountTambala },
        status: resolvedStatus,
        ...(resolvedStatus === 'REPAID' ? { repaidAt: new Date() } : {}),
      },
    });

    return { newRemaining: Math.max(computedRemaining, 0), newStatus: resolvedStatus };
  });

  // Recompute health score (fire-and-forget).
  computeHealthScore(loan.groupId)
    .then((b) => saveHealthScore(loan.groupId, b))
    .catch(console.error);

  return { success: true, data: { loanStatus: newStatus, remainingDueTambala: newRemaining } };
}
