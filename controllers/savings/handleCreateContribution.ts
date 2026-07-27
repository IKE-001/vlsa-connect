// =============================================================================
// controllers/savings/handleCreateContribution.ts
// Owned by: Jabari (Financial Logic)
//
// Business rule: Only a GroupRole.TREASURER may log a contribution,
// EXCEPT for MOBILE_MONEY or CARD contributions which members can log for themselves
// to trigger online checkout.
// =============================================================================

import db from '@/lib/db';
import { createContribution } from '@/services/savings/createContribution';
import { CreateContributionInput } from '@/lib/validations/savings';
import { ApiResponse, ContributionRecord } from '@/types/financial';
import { PaymentsController } from '@/controllers/payments/payments.controller';

interface HandleCreateContributionArgs extends CreateContributionInput {
  /** GroupMember.roleInGroup of the caller — must be GroupRole.TREASURER unless self-service */
  callerGroupRole: string;
  /** User.id of the user logging the contribution */
  callerUserId: string;
}

export async function handleCreateContribution(
  args: HandleCreateContributionArgs
): Promise<ApiResponse<ContributionRecord & { checkoutUrl?: string }>> {
  const { callerGroupRole, callerUserId, ...input } = args;

  // Retrieve user membership
  const member = await db.groupMember.findUnique({
    where: { id: input.memberId },
    select: { userId: true },
  });

  const isSelfService = (input.method === 'MOBILE_MONEY' || input.method === 'CARD') && member?.userId === callerUserId;

  // Group-role guard — only GroupRole.TREASURER may log contributions unless it's self-service online payment.
  if (callerGroupRole !== 'TREASURER' && !isSelfService) {
    return {
      success: false,
      error: 'Only a Treasurer can record a contribution, or members can initiate their own online payments.',
      code: 'FORBIDDEN',
    };
  }

  // Create contribution (starts as PENDING)
  const contribution = await createContribution({
    ...input,
    recordedById: callerUserId,
  });

  // If it's online payment, trigger PayChangu checkout flow
  if (input.method === 'MOBILE_MONEY' || input.method === 'CARD') {
    const user = await db.user.findUnique({
      where: { id: callerUserId },
      select: { email: true, fullName: true },
    });

    const names = (user?.fullName || 'VSLA Member').split(' ');
    const firstName = names[0] || 'VSLA';
    const lastName = names.slice(1).join(' ') || 'Member';
    const txRef = `contrib-${contribution.id}-${Date.now()}`;

    const paychanguRes = await PaymentsController.initializeTransaction({
      amountTambala: input.amountTambala,
      email: user?.email || 'member@vslaconnect.com',
      firstName,
      lastName,
      txRef,
      description: `Contribution for VSLA Cycle ${input.cyclePeriod || ''}`,
    });

    if (paychanguRes.success && paychanguRes.checkoutUrl) {
      // Record payment transaction
      await db.paymentTransaction.create({
        data: {
          idempotencyKey: txRef,
          entityType: 'CONTRIBUTION',
          entityId: contribution.id,
          amountTambala: input.amountTambala,
          status: 'INITIATED',
        },
      });

      // Link transaction reference to contribution
      await db.contribution.update({
        where: { id: contribution.id },
        data: { idempotencyKey: txRef },
      });

      return {
        success: true,
        data: {
          ...contribution,
          checkoutUrl: paychanguRes.checkoutUrl,
        } as any,
      };
    }
  }

  return { success: true, data: contribution };
}
