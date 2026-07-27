/**
 * prisma/seed.ts — VSLA Connect Database Seed
 *
 * Creates a complete demo dataset matching the exact Prisma schema:
 *   9 users, 1 group, 7 memberships, contributions, loans, withdrawals,
 *   meetings, notifications, bank loan applications, health score, support ticket
 *
 * Run:  npm run db:seed
 *       npx prisma db seed
 *
 * Demo credentials (password same format for all):
 *   admin@vslaconnect.mw     / Admin@1234
 *   banker@fnbmalawi.mw      / Banker@1234
 *   grace@tikondane.mw       / Grace@1234      (Chairperson)
 *   beatrice@tikondane.mw    / Beatrice@1234   (Treasurer)
 *   ruth@tikondane.mw        / Ruth@1234       (Secretary)
 *   chisomo@tikondane.mw     / Member@1234
 *   mphatso@tikondane.mw     / Member@1234
 *   tadala@tikondane.mw      / Member@1234
 *   zanele@tikondane.mw      / Member@1234
 */

import {
  PrismaClient,
  PlatformRole,
  GroupRole,
  MembershipStatus,
  ContributionMethod,
  ContributionStatus,
  LoanStatus,
  WithdrawalStatus,
  VoteDecision,
  TicketStatus,
  NotificationChannel,
  NotificationStatus,
  BankLoanStatus,
  AttendanceStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const tambala = (mwk: number) => Math.round(mwk * 100); // 1 MWK = 100 tambala

async function main() {
  console.log('🌱 Starting VSLA Connect seed…\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════
  console.log('👤 Creating users…');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vslaconnect.mw' },
    update: {},
    create: { email: 'admin@vslaconnect.mw', passwordHash: hash('Admin@1234'), fullName: 'System Administrator', platformRole: PlatformRole.ADMIN, isEmailVerified: true },
  });

  const banker = await prisma.user.upsert({
    where: { email: 'banker@fnbmalawi.mw' },
    update: {},
    create: { email: 'banker@fnbmalawi.mw', passwordHash: hash('Banker@1234'), fullName: 'James Mbewe', phoneNumber: '+265991000010', platformRole: PlatformRole.BANK_OFFICER, isEmailVerified: true },
  });

  const grace = await prisma.user.upsert({
    where: { email: 'grace@tikondane.mw' },
    update: {},
    create: { email: 'grace@tikondane.mw', passwordHash: hash('Grace@1234'), fullName: 'Grace Phiri', phoneNumber: '+265999111001', platformRole: PlatformRole.CHAIRPERSON, isEmailVerified: true },
  });

  const beatrice = await prisma.user.upsert({
    where: { email: 'beatrice@tikondane.mw' },
    update: {},
    create: { email: 'beatrice@tikondane.mw', passwordHash: hash('Beatrice@1234'), fullName: 'Beatrice Mwale', phoneNumber: '+265999111002', platformRole: PlatformRole.TREASURER, isEmailVerified: true },
  });

  const ruth = await prisma.user.upsert({
    where: { email: 'ruth@tikondane.mw' },
    update: {},
    create: { email: 'ruth@tikondane.mw', passwordHash: hash('Ruth@1234'), fullName: 'Ruth Banda', phoneNumber: '+265999111003', platformRole: PlatformRole.SECRETARY, isEmailVerified: true },
  });

  const chisomo = await prisma.user.upsert({
    where: { email: 'chisomo@tikondane.mw' },
    update: {},
    create: { email: 'chisomo@tikondane.mw', passwordHash: hash('Member@1234'), fullName: 'Chisomo Tembo', phoneNumber: '+265999111004', platformRole: PlatformRole.MEMBER, isEmailVerified: true },
  });

  const mphatso = await prisma.user.upsert({
    where: { email: 'mphatso@tikondane.mw' },
    update: {},
    create: { email: 'mphatso@tikondane.mw', passwordHash: hash('Member@1234'), fullName: 'Mphatso Chirwa', phoneNumber: '+265999111005', platformRole: PlatformRole.MEMBER, isEmailVerified: true },
  });

  const tadala = await prisma.user.upsert({
    where: { email: 'tadala@tikondane.mw' },
    update: {},
    create: { email: 'tadala@tikondane.mw', passwordHash: hash('Member@1234'), fullName: 'Tadala Nkosi', phoneNumber: '+265999111006', platformRole: PlatformRole.MEMBER, isEmailVerified: true },
  });

  const zanele = await prisma.user.upsert({
    where: { email: 'zanele@tikondane.mw' },
    update: {},
    create: { email: 'zanele@tikondane.mw', passwordHash: hash('Member@1234'), fullName: 'Zanele Mvula', phoneNumber: '+265999111007', platformRole: PlatformRole.MEMBER, isEmailVerified: true },
  });

  console.log('  ✓ 9 users created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 2. VSLA GROUP
  // ═══════════════════════════════════════════════════════════════
  console.log('🏦 Creating VSLA group…');

  const group = await prisma.vslaGroup.upsert({
    where: { inviteCode: 'TKD-2026' },
    update: {},
    create: {
      name: 'Tikondane Women Group',
      description: 'A savings group empowering women in Lilongwe through collective savings and affordable credit.',
      inviteCode: 'TKD-2026',
      chairpersonId: grace.id,
      contributionAmountTambala: tambala(2500), // MWK 25,000
      interestRate: 10.0,
      loanMultipleCap: 3.0,
      withdrawalQuorumPct: 50.0,
      cycleFrequency: 'MONTHLY',
      meetingLocation: 'Lilongwe Community Hall, Area 18',
    },
  });

  console.log(`  ✓ Group "${group.name}" created.\n`);

  // ═══════════════════════════════════════════════════════════════
  // 3. GROUP MEMBERSHIPS
  // ═══════════════════════════════════════════════════════════════
  console.log('👥 Creating group memberships…');

  const upsertMember = async (userId: string, role: GroupRole) => {
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) return existing;
    return prisma.groupMember.create({
      data: { groupId: group.id, userId, roleInGroup: role, status: MembershipStatus.ACTIVE },
    });
  };

  const gmGrace    = await upsertMember(grace.id,    GroupRole.CHAIRPERSON);
  const gmBeatrice = await upsertMember(beatrice.id, GroupRole.TREASURER);
  const gmRuth     = await upsertMember(ruth.id,     GroupRole.SECRETARY);
  const gmChisomo  = await upsertMember(chisomo.id,  GroupRole.MEMBER);
  const gmMphatso  = await upsertMember(mphatso.id,  GroupRole.MEMBER);
  const gmTadala   = await upsertMember(tadala.id,   GroupRole.MEMBER);
  const gmZanele   = await upsertMember(zanele.id,   GroupRole.MEMBER);

  console.log('  ✓ 7 group memberships created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 4. CONTRIBUTIONS  (5 months × 6 members = 30 approved + 2 pending)
  // ═══════════════════════════════════════════════════════════════
  console.log('💰 Creating contributions…');

  const months = ['2026-03','2026-04','2026-05','2026-06','2026-07'];
  const approvedMembers = [gmGrace.id, gmBeatrice.id, gmRuth.id, gmChisomo.id, gmMphatso.id, gmTadala.id];

  for (const memberId of approvedMembers) {
    for (const month of months) {
      const exists = await prisma.contribution.findFirst({ where: { groupId: group.id, memberId, cyclePeriod: month } });
      if (!exists) {
        await prisma.contribution.create({
          data: {
            groupId: group.id, memberId,
            amountTambala: tambala(2500),
            method: ContributionMethod.CASH,
            status: ContributionStatus.APPROVED,
            cyclePeriod: month,
            recordedById: beatrice.id,
            approvedById: grace.id,
          },
        });
      }
    }
  }

  // 2 pending for August (current cycle)
  for (const memberId of [gmChisomo.id, gmZanele.id]) {
    const exists = await prisma.contribution.findFirst({ where: { groupId: group.id, memberId, cyclePeriod: '2026-08' } });
    if (!exists) {
      await prisma.contribution.create({
        data: {
          groupId: group.id, memberId,
          amountTambala: tambala(2500),
          method: ContributionMethod.MOBILE_MONEY,
          status: ContributionStatus.PENDING,
          cyclePeriod: '2026-08',
          recordedById: beatrice.id,
        },
      });
    }
  }

  console.log('  ✓ 32 contributions created (30 approved, 2 pending).\n');

  // ═══════════════════════════════════════════════════════════════
  // 5. LOANS
  // ═══════════════════════════════════════════════════════════════
  console.log('🏦 Creating loans…');

  // REPAYING — Grace
  let loan1 = await prisma.loan.findFirst({ where: { groupId: group.id, memberId: gmGrace.id, status: LoanStatus.REPAYING } });
  if (!loan1) {
    loan1 = await prisma.loan.create({
      data: {
        groupId: group.id, memberId: gmGrace.id,
        principalTambala: tambala(50000),
        interestRate: 10.0,
        totalDueTambala: tambala(55000),
        amountRepaidTambala: tambala(15000),
        status: LoanStatus.REPAYING,
        requestedAt: new Date('2026-06-01'),
        approvedAt: new Date('2026-06-03'),
        disbursedAt: new Date('2026-06-04'),
        dueDate: new Date('2026-09-04'),
      },
    });
  }
  // Repayment record
  const repayExists = await prisma.loanRepayment.findFirst({ where: { loanId: loan1.id } });
  if (!repayExists) {
    await prisma.loanRepayment.create({ data: { loanId: loan1.id, amountTambala: tambala(15000), method: ContributionMethod.CASH } });
  }
  // Loan votes
  for (const voterId of [gmBeatrice.id, gmRuth.id]) {
    const voteExists = await prisma.loanVote.findUnique({ where: { loanId_voterId: { loanId: loan1.id, voterId } } });
    if (!voteExists) await prisma.loanVote.create({ data: { loanId: loan1.id, voterId, decision: VoteDecision.APPROVE } });
  }

  // PENDING — Chisomo
  const loan2Exists = await prisma.loan.findFirst({ where: { groupId: group.id, memberId: gmChisomo.id, status: LoanStatus.PENDING } });
  if (!loan2Exists) {
    await prisma.loan.create({
      data: {
        groupId: group.id, memberId: gmChisomo.id,
        principalTambala: tambala(30000),
        interestRate: 10.0,
        status: LoanStatus.PENDING,
        requestedAt: new Date('2026-07-20'),
      },
    });
  }

  // REPAID — Beatrice
  const loan3Exists = await prisma.loan.findFirst({ where: { groupId: group.id, memberId: gmBeatrice.id, status: LoanStatus.REPAID } });
  if (!loan3Exists) {
    await prisma.loan.create({
      data: {
        groupId: group.id, memberId: gmBeatrice.id,
        principalTambala: tambala(20000),
        interestRate: 10.0,
        totalDueTambala: tambala(22000),
        amountRepaidTambala: tambala(22000),
        status: LoanStatus.REPAID,
        requestedAt: new Date('2026-04-01'),
        approvedAt: new Date('2026-04-03'),
        disbursedAt: new Date('2026-04-04'),
        dueDate: new Date('2026-07-04'),
        repaidAt: new Date('2026-07-01'),
      },
    });
  }

  // OVERDUE — Mphatso
  const loan4Exists = await prisma.loan.findFirst({ where: { groupId: group.id, memberId: gmMphatso.id, status: LoanStatus.OVERDUE } });
  if (!loan4Exists) {
    await prisma.loan.create({
      data: {
        groupId: group.id, memberId: gmMphatso.id,
        principalTambala: tambala(75000),
        interestRate: 10.0,
        totalDueTambala: tambala(82500),
        amountRepaidTambala: 0,
        status: LoanStatus.OVERDUE,
        requestedAt: new Date('2026-03-01'),
        approvedAt: new Date('2026-03-05'),
        disbursedAt: new Date('2026-03-06'),
        dueDate: new Date('2026-06-06'),
      },
    });
  }

  console.log('  ✓ 4 loans created (REPAYING, PENDING, REPAID, OVERDUE).\n');

  // ═══════════════════════════════════════════════════════════════
  // 6. WITHDRAWAL REQUESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('📤 Creating withdrawal requests…');

  // PENDING with 1 vote — Grace
  let w1 = await prisma.withdrawalRequest.findFirst({ where: { groupId: group.id, memberId: gmGrace.id, status: WithdrawalStatus.PENDING } });
  if (!w1) {
    w1 = await prisma.withdrawalRequest.create({
      data: {
        groupId: group.id, memberId: gmGrace.id,
        amountTambala: tambala(50000),
        reason: 'Emergency medical expenses for family member',
        status: WithdrawalStatus.PENDING,
      },
    });
  }
  const wv1Exists = await prisma.withdrawalVote.findFirst({ where: { requestId: w1.id, voterId: gmBeatrice.id } });
  if (!wv1Exists) {
    await prisma.withdrawalVote.create({ data: { requestId: w1.id, voterId: gmBeatrice.id, decision: VoteDecision.APPROVE } });
  }

  // PENDING — Ruth
  const w2Exists = await prisma.withdrawalRequest.findFirst({ where: { groupId: group.id, memberId: gmRuth.id, status: WithdrawalStatus.PENDING } });
  if (!w2Exists) {
    await prisma.withdrawalRequest.create({
      data: {
        groupId: group.id, memberId: gmRuth.id,
        amountTambala: tambala(30000),
        reason: 'School fees for children — secondary school',
        status: WithdrawalStatus.PENDING,
      },
    });
  }

  // PAID_OUT — Tadala
  const w3Exists = await prisma.withdrawalRequest.findFirst({ where: { groupId: group.id, memberId: gmTadala.id, status: WithdrawalStatus.PAID_OUT } });
  if (!w3Exists) {
    await prisma.withdrawalRequest.create({
      data: {
        groupId: group.id, memberId: gmTadala.id,
        amountTambala: tambala(80000),
        reason: 'Business capital for market stall',
        status: WithdrawalStatus.PAID_OUT,
        paidOutAt: new Date('2026-06-15'),
        createdAt: new Date('2026-06-10'),
      },
    });
  }

  console.log('  ✓ 3 withdrawal requests created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 7. MEETINGS  (schema: scheduledAt, agenda, location, minutes, recordedById)
  // ═══════════════════════════════════════════════════════════════
  console.log('📅 Creating meetings…');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // Upcoming
  const m1Exists = await prisma.meeting.findFirst({ where: { groupId: group.id, scheduledAt: { gte: new Date() } } });
  if (!m1Exists) {
    await prisma.meeting.create({
      data: {
        groupId: group.id,
        scheduledAt: tomorrow,
        location: 'Lilongwe Community Hall, Area 18',
        agenda: '1. Monthly contributions review\n2. Loan applications\n3. Withdrawal requests\n4. AOB',
        recordedById: ruth.id,
      },
    });
  }

  // Completed — July
  const m2Exists = await prisma.meeting.findFirst({ where: { groupId: group.id, scheduledAt: { gte: new Date('2026-07-01'), lte: new Date('2026-07-31') } } });
  if (!m2Exists) {
    await prisma.meeting.create({
      data: {
        groupId: group.id,
        scheduledAt: new Date('2026-07-06T09:00:00'),
        location: 'Lilongwe Community Hall, Area 18',
        agenda: 'Monthly contributions review. Loan approvals.',
        minutes: 'All 7 members present. Contributions for June reviewed and approved. Grace Phiri\'s loan application of MWK 50,000 approved unanimously.',
        recordedById: ruth.id,
      },
    });
  }

  // Completed — June Emergency
  const m3Exists = await prisma.meeting.findFirst({ where: { groupId: group.id, scheduledAt: { gte: new Date('2026-06-01'), lte: new Date('2026-06-30') } } });
  if (!m3Exists) {
    await prisma.meeting.create({
      data: {
        groupId: group.id,
        scheduledAt: new Date('2026-06-20T14:00:00'),
        location: 'Online — WhatsApp call',
        agenda: 'Review of overdue loan. Discussion of repayment plan.',
        minutes: 'Emergency meeting convened to discuss Mphatso\'s overdue loan. New repayment plan agreed: 3 installments of MWK 27,500.',
        recordedById: ruth.id,
      },
    });
  }

  console.log('  ✓ 3 meetings created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 8. NOTIFICATIONS  (schema: userId, channel, title, message, status, readAt)
  // ═══════════════════════════════════════════════════════════════
  console.log('🔔 Creating notifications…');

  const notifs = [
    { userId: grace.id,  title: 'Loan Approved ✅',          message: 'Your loan request of MWK 50,000 has been approved. Funds will be disbursed shortly.',                status: NotificationStatus.SENT },
    { userId: grace.id,  title: 'Contribution Received 💰',  message: 'Your contribution of MWK 25,000 for July 2026 has been recorded and approved by the Treasurer.',   status: NotificationStatus.SENT },
    { userId: grace.id,  title: 'Payment Successful 🎉',     message: 'PayChangu payment of MWK 25,000 confirmed. Contribution for August 2026 has been recorded.',        status: NotificationStatus.SENT },
    { userId: grace.id,  title: 'Meeting Reminder 📅',       message: 'Group meeting is tomorrow at 9:00 AM — Lilongwe Community Hall. Please confirm attendance.',          status: NotificationStatus.READ, readAt: new Date(Date.now() - 3600000) },
    { userId: grace.id,  title: 'New Message 💬',            message: "Beatrice Mwale: 'Reminder to all members — contribution deadline is this Friday!'",                  status: NotificationStatus.READ, readAt: new Date(Date.now() - 7200000) },
    { userId: banker.id, title: 'New Credit Application 📋', message: 'Tikondane Women Group has submitted a credit application for MWK 200,000. Health score: 78/100.',  status: NotificationStatus.SENT },
  ];

  for (const n of notifs) {
    const exists = await prisma.notification.findFirst({ where: { userId: n.userId, title: n.title } });
    if (!exists) {
      await prisma.notification.create({
        data: { userId: n.userId, channel: NotificationChannel.IN_APP, title: n.title, message: n.message, status: n.status, readAt: n.readAt ?? null },
      });
    }
  }

  console.log('  ✓ 6 notifications created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 9. BANK LOAN APPLICATIONS
  // ═══════════════════════════════════════════════════════════════
  console.log('🏛️  Creating bank loan applications…');

  const bl1Exists = await prisma.bankLoanApplication.findFirst({ where: { groupId: group.id, status: BankLoanStatus.PENDING } });
  if (!bl1Exists) {
    await prisma.bankLoanApplication.create({
      data: {
        groupId: group.id,
        officerId: banker.id,
        amountTambala: tambala(200000), // MWK 2,000,000
        purpose: 'Group expansion capital for agricultural inputs — 2026 planting season.',
        status: BankLoanStatus.PENDING,
        score: 78,
      },
    });
  }

  const bl2Exists = await prisma.bankLoanApplication.findFirst({ where: { groupId: group.id, status: BankLoanStatus.APPROVED } });
  if (!bl2Exists) {
    await prisma.bankLoanApplication.create({
      data: {
        groupId: group.id,
        officerId: banker.id,
        amountTambala: tambala(100000), // MWK 1,000,000
        purpose: 'Purchase of bulk goods for resale — cooperative trading.',
        status: BankLoanStatus.APPROVED,
        score: 82,
        createdAt: new Date('2026-04-15'),
      },
    });
  }

  console.log('  ✓ 2 bank loan applications created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 10. HEALTH SCORE
  // ═══════════════════════════════════════════════════════════════
  console.log('📊 Creating health score…');

  const hsExists = await prisma.healthScore.findFirst({ where: { groupId: group.id } });
  if (!hsExists) {
    await prisma.healthScore.create({
      data: {
        groupId: group.id,
        score: 78,
        savingsComponent: 28,
        repaymentComponent: 25,
        attendanceComponent: 16,
        governanceComponent: 9,
      },
    });
  }

  console.log('  ✓ Health score (78/100) created.\n');

  // ═══════════════════════════════════════════════════════════════
  // 11. SUPPORT TICKET
  // ═══════════════════════════════════════════════════════════════
  console.log('🎫 Creating support tickets…');

  const ticketExists = await prisma.supportTicket.findFirst({ where: { reporterId: chisomo.id } });
  if (!ticketExists) {
    await prisma.supportTicket.create({
      data: {
        reporterId: chisomo.id,
        subject: 'Unable to make mobile money contribution',
        description: 'I tried to pay my July contribution via Airtel Money but the PayChangu redirect failed after 3 attempts.',
        status: TicketStatus.IN_PROGRESS,
      },
    });
  }

  console.log('  ✓ 1 support ticket created.\n');

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('✅ ═══════════════════════════════════════════════════');
  console.log('   VSLA Connect seed complete!');
  console.log('');
  console.log('   Demo credentials:');
  console.log('   Admin:        admin@vslaconnect.mw   / Admin@1234');
  console.log('   Banker:       banker@fnbmalawi.mw    / Banker@1234');
  console.log('   Chairperson:  grace@tikondane.mw     / Grace@1234');
  console.log('   Treasurer:    beatrice@tikondane.mw  / Beatrice@1234');
  console.log('   Secretary:    ruth@tikondane.mw      / Ruth@1234');
  console.log('   Member:       chisomo@tikondane.mw   / Member@1234');
  console.log('   Group code:   TKD-2026');
  console.log('   ═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
