import { initiatePayment, verifyPayment, InitiatePaymentOptions, getMobileMoneyOperators, initiateMobileMoneyPayout, getSupportedBanks, initiateBankPayout } from '@/providers/paychangu';
import db from '@/lib/db';
import { appendLedgerEntry } from '@/services/ledger/appendLedgerEntry';
import { computeHealthScore } from '@/services/healthScore/computeHealthScore';
import { saveHealthScore } from '@/services/healthScore/saveHealthScore';
import { sendFanOutNotification } from '@/services/notifications/sendFanOutNotification';

/**
 * Payments Controller
 * Orchestrates transactions via PayChangu.
 */
export class PaymentsController {
  
  /**
   * Initializes a payment (e.g., a member contribution or loan repayment)
   * Returns a checkout URL.
   */
  static async initializeTransaction(options: InitiatePaymentOptions) {
    return await initiatePayment(options);
  }

  /**
   * Verifies the status of a transaction.
   */
  static async checkStatus(txRef: string) {
    return await verifyPayment({ txRef });
  }

  /**
   * Processes the async webhook callback from PayChangu.
   */
  static async processWebhook(payload: any) {
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    const status = payload?.status || payload?.data?.status;
    const txRef = payload?.tx_ref || payload?.data?.tx_ref;
    const chargeId = payload?.charge_id || payload?.data?.charge_id || payload?.reference;

    if (!txRef) {
      console.warn('Webhook received without transaction reference.');
      return { success: false, error: 'No transaction reference.' };
    }

    // 1. Fetch transaction record
    const transaction = await db.paymentTransaction.findUnique({
      where: { idempotencyKey: txRef },
    });

    if (!transaction) {
      console.warn(`No matching transaction found for reference: ${txRef}`);
      return { success: false, error: 'Transaction not found.' };
    }

    if (transaction.status === 'SUCCESS') {
      return { success: true, message: 'Transaction already processed.' };
    }

    if (status !== 'success' && status !== 'successful') {
      await db.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          failureReason: payload?.message || 'Payment failed or cancelled',
          providerPayload: payload,
        },
      });
      return { success: true, message: 'Transaction marked as failed.' };
    }

    // 2. Mark payment transaction as successful
    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        providerRef: chargeId,
        providerPayload: payload,
      },
    });

    // 3. Process business logic based on entity type
    try {
      if (transaction.entityType === 'CONTRIBUTION') {
        const contribution = await db.contribution.findUnique({
          where: { id: transaction.entityId },
          include: { member: { select: { userId: true } } },
        });

        if (contribution && contribution.status !== 'APPROVED') {
          await db.$transaction(async (tx) => {
            // Write ledger entry
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

            // Update status and reference
            await tx.contribution.update({
              where: { id: contribution.id },
              data: {
                status: 'APPROVED',
                paychanguRef: chargeId,
              },
            });
          });

          // Send Fan-out Notification
          if (contribution.member?.userId) {
            const mwk = (contribution.amountTambala / 100).toLocaleString();
            sendFanOutNotification({
              userId: contribution.member.userId,
              title: 'Payment Successful',
              message: `Your online payment of ${mwk} MWK for group contribution was received and approved!`,
            }).catch(console.error);
          }

          // Recompute health score
          computeHealthScore(contribution.groupId)
            .then((breakdown) => saveHealthScore(contribution.groupId, breakdown))
            .catch(console.error);
        }
      } else if (transaction.entityType === 'LOAN_REPAYMENT') {
        const loan = await db.loan.findUnique({
          where: { id: transaction.entityId },
          include: { member: { select: { userId: true } } },
        });

        if (loan) {
          const totalDue = loan.totalDueTambala ?? loan.principalTambala;
          const alreadyRepaid = loan.amountRepaidTambala;

          await db.$transaction(async (tx) => {
            // Write ledger entry
            await appendLedgerEntry(
              {
                groupId: loan.groupId,
                entryType: 'LOAN_REPAYMENT',
                referenceId: loan.id,
                amountTambala: transaction.amountTambala,
                direction: 'CREDIT',
              },
              tx
            );

            // Record repayment
            await tx.loanRepayment.create({
              data: {
                loanId: loan.id,
                amountTambala: transaction.amountTambala,
                method: 'MOBILE_MONEY',
                idempotencyKey: txRef,
                paychanguRef: chargeId,
              },
            });

            // Update loan
            const newAmountRepaid = alreadyRepaid + transaction.amountTambala;
            const resolvedStatus = newAmountRepaid >= totalDue ? 'REPAID' : 'REPAYING';

            await tx.loan.update({
              where: { id: loan.id },
              data: {
                amountRepaidTambala: { increment: transaction.amountTambala },
                status: resolvedStatus,
                ...(resolvedStatus === 'REPAID' ? { repaidAt: new Date() } : {}),
              },
            });
          });

          // Send Fan-out Notification
          if (loan.member?.userId) {
            const mwk = (transaction.amountTambala / 100).toLocaleString();
            sendFanOutNotification({
              userId: loan.member.userId,
              title: 'Loan Repayment Received',
              message: `Your payment of ${mwk} MWK towards your loan has been successfully recorded.`,
            }).catch(console.error);
          }

          // Recompute health score
          computeHealthScore(loan.groupId)
            .then((breakdown) => saveHealthScore(loan.groupId, breakdown))
            .catch(console.error);
        }
      } else if (transaction.entityType === 'WITHDRAWAL') {
        const withdrawal = await db.withdrawalRequest.findUnique({
          where: { id: transaction.entityId },
          include: { member: { select: { userId: true } } },
        });

        if (withdrawal && withdrawal.status !== 'PAID_OUT') {
          await db.withdrawalRequest.update({
            where: { id: withdrawal.id },
            data: {
              status: 'PAID_OUT',
              paidOutAt: new Date(),
              paychanguRef: chargeId,
            },
          });

          if (withdrawal.member?.userId) {
            const mwk = (withdrawal.amountTambala / 100).toLocaleString();
            sendFanOutNotification({
              userId: withdrawal.member.userId,
              title: 'Withdrawal Paid Out',
              message: `Your withdrawal request of ${mwk} MWK has been transferred to your mobile money account.`,
            }).catch(console.error);
          }
        }
      }
      
      return { success: true, processed: true };
    } catch (err: any) {
      console.error('Error applying business logic from webhook:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Helper to trigger a Mobile Money Payout/Transfer via PayChangu.
   */
  static async triggerMobileMoneyPayout(phoneNumber: string, amountTambala: number, chargeId: string) {
    const rawPhone = phoneNumber.replace(/^\+/, '');
    const localNumber = rawPhone.startsWith('265') ? rawPhone.substring(3) : rawPhone;

    const opsResult = await getMobileMoneyOperators();
    if (!opsResult.success || !opsResult.operators) {
      throw new Error(opsResult.error || 'Failed to fetch operators list from PayChangu');
    }

    let isAirtel = false;
    let isTnm = false;

    if (localNumber.startsWith('99') || localNumber.startsWith('98') || localNumber.startsWith('91')) {
      isAirtel = true;
    } else if (localNumber.startsWith('88') || localNumber.startsWith('31')) {
      isTnm = true;
    }

    let selectedOp = null;
    if (isAirtel) {
      selectedOp = opsResult.operators.find((op: any) => op.name.toLowerCase().includes('airtel'));
    } else if (isTnm) {
      selectedOp = opsResult.operators.find((op: any) => op.name.toLowerCase().includes('tnm') || op.name.toLowerCase().includes('mpamba'));
    }

    if (!selectedOp) {
      selectedOp = opsResult.operators[0];
    }

    if (!selectedOp) {
      throw new Error('No active mobile money operators found on PayChangu');
    }

    const payout = await initiateMobileMoneyPayout({
      mobile: localNumber,
      amountTambala,
      operatorRefId: selectedOp.ref_id,
      chargeId,
    });

    return payout;
  }
}
