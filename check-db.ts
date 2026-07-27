import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- LATEST CONTRIBUTIONS ---');
  const contributions = await prisma.contribution.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      member: {
        include: { user: true }
      }
    }
  });

  contributions.forEach((c) => {
    console.log(`[${c.status}] ${c.amountTambala / 100} MWK by ${c.member?.user?.fullName || 'Unknown'} via ${c.method}`);
    console.log(`  PayChangu Ref: ${c.paychanguRef || 'N/A'}`);
    console.log(`  Date: ${c.createdAt}\n`);
  });

  console.log('--- LATEST PAYMENT TRANSACTIONS ---');
  const transactions = await prisma.paymentTransaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  transactions.forEach((t) => {
    console.log(`[${t.status}] ${t.entityType} for ${t.amountTambala / 100} MWK`);
    console.log(`  TxRef: ${t.idempotencyKey}`);
    console.log(`  ProviderRef: ${t.providerRef || 'N/A'}`);
    console.log(`  Date: ${t.createdAt}\n`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
