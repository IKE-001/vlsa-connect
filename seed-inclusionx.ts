import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding InclusionX group...');

  // 1. Check if it already exists
  let group = await prisma.vslaGroup.findFirst({
    where: { name: { contains: 'InclusionX', mode: 'insensitive' } }
  });

  if (group) {
    console.log(`Group already exists with ID: ${group.id}. Wiping its data to re-seed...`);
    // Delete members, contributions, etc. Cascade will handle most of it if we just delete the group.
    await prisma.vslaGroup.delete({ where: { id: group.id } });
  }

  // 2. Create the InclusionX Group
  group = await prisma.vslaGroup.create({
    data: {
      name: 'InclusionX Test Group',
      description: 'A dummy group for testing financial inclusion features',
      currency: 'MWK',
      shareValueTambala: 50000, // 500 MWK per share
      maxSharesPerMember: 5,
      inviteCode: 'INC-2026-001',
      status: 'ACTIVE',
    }
  });
  console.log(`Created group: ${group.name} (${group.id})`);

  // 3. Create dummy users
  const users = [
    { fullName: 'Alice Chairperson', phone: '+265999000001', role: 'CHAIRPERSON' },
    { fullName: 'Bob Treasurer', phone: '+265999000002', role: 'TREASURER' },
    { fullName: 'Charlie Secretary', phone: '+265999000003', role: 'SECRETARY' },
    { fullName: 'Dave Member', phone: '+265999000004', role: 'MEMBER' },
    { fullName: 'Eve Member', phone: '+265999000005', role: 'MEMBER' },
  ];

  for (const u of users) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phone },
      update: {},
      create: {
        fullName: u.fullName,
        phoneNumber: u.phone,
        countryCode: 'MW',
        platformRole: 'MEMBER',
      }
    });

    // Add to group
    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        roleInGroup: u.role as any,
        status: 'ACTIVE',
      }
    });

    console.log(`Created member: ${user.fullName} (${u.role})`);

    // 4. Give them some contributions
    if (u.role !== 'CHAIRPERSON') {
      const amount = Math.floor(Math.random() * 5 + 1) * 50000; // 1-5 shares
      const contrib = await prisma.contribution.create({
        data: {
          groupId: group.id,
          memberId: member.id,
          amountTambala: amount,
          method: 'CASH',
          status: 'APPROVED',
          cyclePeriod: '2026-07',
          recordedById: user.id,
          approvedById: user.id, // For dummy purposes
        }
      });
      
      // Add ledger entry
      await prisma.ledgerEntry.create({
        data: {
          groupId: group.id,
          entryType: 'CONTRIBUTION',
          referenceId: contrib.id,
          amountTambala: amount,
          direction: 'CREDIT',
        }
      });
    }
  }

  // 5. Create a dummy health score
  await prisma.healthScore.create({
    data: {
      groupId: group.id,
      score: 85,
      savingsComponent: 25,
      repaymentComponent: 30,
      attendanceComponent: 15,
      governanceComponent: 15,
    }
  });

  console.log('Successfully seeded InclusionX with dummy data!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
