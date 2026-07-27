// =============================================================================
// controllers/loans/handleCheckLoanResult.ts
// Owned by: Jabari (Financial Logic)
//
// Called after every loan vote is cast.
// Rules:
//   - Any single REJECT → status = REJECTED immediately
//   - All 3 required voters APPROVE → status = APPROVED, totalDueTambala set
//   - Fewer than 3 votes cast → no state change yet
// =============================================================================

import db from '@/lib/db';
import { getLoanVotes } from '@/services/loans/getLoanVotes';
import { updateLoanStatus } from '@/services/loans/updateLoanStatus';
import { calcTotalDue } from '@/lib/utils/money';
import { LOAN_RULES } from '@/config/loanRules';
import { sendFanOutNotification } from '@/services/notifications/sendFanOutNotification';
import { ApiResponse, LoanRecord } from '@/types/financial';

/**
 * Evaluates all votes cast so far and resolves the loan if a decision is reachable.
 * Returns the updated loan (or unchanged loan if not yet resolved).
 */
export async function handleCheckLoanResult(
  loanId: string
): Promise<ApiResponse<{ resolved: boolean; loan: LoanRecord }>> {
  const loan = await db.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      status: true,
      principalTambala: true,
      interestRate: true,
      member: { select: { userId: true } },
    },
  });
  if (!loan) return { success: false, error: 'Loan not found.', code: 'NOT_FOUND' };
  if (loan.status !== 'PENDING') {
    return { success: false, error: `Loan already ${loan.status}.`, code: 'INVALID_STATE' };
  }

  const votes = await getLoanVotes(loanId);
  const rejections = votes.filter((v) => v.decision === 'REJECT');
  const approvals = votes.filter((v) => v.decision === 'APPROVE');
  const required = LOAN_RULES.requiredVoterRoles.length; // 3

  const mwkAmount = (loan.principalTambala / 100).toLocaleString();

  // Any REJECT → immediate rejection.
  if (rejections.length > 0) {
    const updated = await updateLoanStatus({
      loanId,
      status: 'REJECTED',
      rejectionReason: 'Rejected by one or more voting officers.',
    });

    if (loan.member?.userId) {
      sendFanOutNotification({
        userId: loan.member.userId,
        title: 'Loan Application Rejected',
        message: `Your loan application for ${mwkAmount} MWK was rejected by committee vote.`,
      }).catch(console.error);
    }

    return { success: true, data: { resolved: true, loan: updated } };
  }

  // All 3 APPROVEs → approve and set total due.
  if (approvals.length >= required) {
    const totalDueTambala = calcTotalDue(loan.principalTambala, Number(loan.interestRate));
    const updated = await updateLoanStatus({
      loanId,
      status: 'APPROVED',
      totalDueTambala,
      approvedAt: new Date(),
    });

    if (loan.member?.userId) {
      sendFanOutNotification({
        userId: loan.member.userId,
        title: 'Loan Application Approved!',
        message: `Congratulations! Your loan request for ${mwkAmount} MWK has been approved by committee vote.`,
      }).catch(console.error);
    }

    return { success: true, data: { resolved: true, loan: updated } };
  }

  return { success: true, data: { resolved: false, loan: loan as unknown as LoanRecord } };
}
