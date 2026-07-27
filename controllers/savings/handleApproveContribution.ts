// =============================================================================
// controllers/savings/handleApproveContribution.ts
// Owned by: Jabari (Financial Logic)
//
// Business rule: Only GroupRole.CHAIRPERSON may approve/reject a contribution.
// Guard reads GroupMember.roleInGroup — NOT User.platformRole.
// On APPROVE → write ledger entry FIRST, then flip status.
// Triggers a Health Score recompute + Fan-out Notification.
// =============================================================================

import db from '@/lib/db';
import { appendLedgerEntry } from '@/services/ledger/appendLedgerEntry';
import { computeHealthScore } from '@/services/healthScore/computeHealthScore';
import { saveHealthScore } from '@/services/healthScore/saveHealthScore';
import { sendFanOutNotification } from '@/services/notifications/sendFanOutNotification';
import { ApiResponse, ContributionRecord } from '@/types/financial';

interface HandleApproveContributionArgs {
  contributionId: string;
  action: 'APPROVE' | 'REJECT';
  /** GroupMember.roleInGroup — must be GroupRole.CHAIRPERSON */
  callerGroupRole: string;
  callerUserId: string;
  reason?: string;
}

export async function handleApproveContribution(
  args: HandleApproveContributionArgs
): Promise<ApiResponse<ContributionRecord>> {
  const { contributionId, action, callerGroupRole, callerUserId } = args;

  // Group-role guard — reads GroupMember.roleInGroup, not User.platformRole.
  if (callerGroupRole !== 'CHAIRPERSON') {
    return {
      success: false,
      error: 'Only a group Chairperson can approve contributions.',
      code: 'FORBIDDEN',
    };
  }

  // Validate existence and state OUTSIDE the transaction
  const contribution = await db.contribution.findUnique({
    where: { id: contributionId },
    select: {
      id: true,
      status: true,
      groupId: true,
      amountTambala: true,
      member: { select: { userId: true } },
    },
  });

  if (!contribution) {
    return { success: false, error: 'Contribution not found.', code: 'NOT_FOUND' };
  }
  if (contribution.status !== 'PENDING') {
    return {
      success: false,
      error: `Contribution is already ${contribution.status}.`,
      code: 'INVALID_STATE',
    };
  }

  const updated = await db.$transaction(async (tx) => {
    if (action === 'APPROVE') {
      await appendLedgerEntry(
        {
          groupId: contribution.groupId,
          entryType: 'CONTRIBUTION',
          referenceId: contribution.id,
          amountTambala: contribution.amountTambala,
          direction: 'CREDIT',
        },
        tx
      );
    }

    return tx.contribution.update({
      where: { id: contributionId },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approvedById: callerUserId,
      },
    });
  });

  // 1. Send Fan-Out Notification to member
  if (contribution.member?.userId) {
    const mwkAmount = (contribution.amountTambala / 100).toLocaleString();
    const title = action === 'APPROVE' ? 'Contribution Approved' : 'Contribution Rejected';
    const message = action === 'APPROVE'
      ? `Your cash contribution of ${mwkAmount} MWK has been verified and approved by the Chairperson.`
      : `Your contribution of ${mwkAmount} MWK was rejected.`;
    
    sendFanOutNotification({
      userId: contribution.member.userId,
      title,
      message,
    }).catch(console.error);
  }

  // 2. Health Score recompute
  computeHealthScore(contribution.groupId)
    .then((breakdown) => saveHealthScore(contribution.groupId, breakdown))
    .catch(console.error);

  return { success: true, data: updated as ContributionRecord };
}
