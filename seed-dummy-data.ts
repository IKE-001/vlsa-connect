import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const groupId = '19893c89-eca9-48bb-a6a8-115de9f9ccee';

  console.log('Fetching InclusionX group...');
  const group = await prisma.vslaGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: true } } }
  });

  if (!group) {
    console.error('Group not found!');
    return;
  }

  console.log(`Found group: ${group.name} with ${group.members.length} members`);

  // Create some dummy members if there are none, but we need users first.
  // Actually, we can just use the existing members, or create new ones if needed.
  if (group.members.length === 0) {
     console.log("No members found, creating dummy members...");
     for (let i = 1; i <= 3; i++) {
        const user = await prisma.user.create({
           data: {
              email: `dummy${i}@inclusionx.com`,
              fullName: `Dummy Member ${i}`,
              passwordHash: 'dummy',
           }
        });
        await prisma.groupMember.create({
           data: {
              groupId: group.id,
              userId: user.id,
              roleInGroup: i === 1 ? 'CHAIRPERSON' : 'MEMBER',
           }
        });
     }
  }

  // Refetch members
  const members = await prisma.groupMember.findMany({ where: { groupId } });

  console.log('Seeding dummy contributions and loans...');
  for (const m of members) {
    // Add Contribution
    const contrib = await prisma.contribution.create({
      data: {
        groupId,
        memberId: m.id,
        amountTambala: 15000, // 150 MWK
        method: 'CASH',
        status: 'APPROVED',
        cyclePeriod: '2026-07',
        approvedById: group.chairpersonId,
        recordedById: group.chairpersonId,
      }
    });

    await prisma.ledgerEntry.create({
      data: {
        groupId,
        entryType: 'CONTRIBUTION',
        referenceId: contrib.id,
        amountTambala: 15000,
        direction: 'CREDIT',
      }
    });

    // Add Loan
    const loan = await prisma.loan.create({
      data: {
        groupId,
        memberId: m.id,
        principalTambala: 50000, // 500 MWK
        interestRate: 10,
        status: 'DISBURSED',
      }
    });

    await prisma.ledgerEntry.create({
      data: {
        groupId,
        entryType: 'LOAN_DISBURSEMENT',
        referenceId: loan.id,
        amountTambala: 50000,
        direction: 'DEBIT',
      }
    });
  }

  // Add Health Score
  await prisma.healthScore.create({
    data: {
      groupId,
      score: 85,
      savingsComponent: 25,
      repaymentComponent: 30,
      attendanceComponent: 15,
      governanceComponent: 15,
    }
  });

  console.log('Successfully added dummy data to InclusionX!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
