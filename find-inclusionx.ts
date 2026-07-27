import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.vslaGroup.findMany({
    where: {
      name: {
        contains: 'inclusionx',
        mode: 'insensitive',
      }
    }
  });
  console.log("Found groups:", groups);
}

main().catch(console.error).finally(() => prisma.$disconnect());
