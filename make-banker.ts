import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'jabarichilanga@gmail.com';

  console.log(`Updating ${email} to BANK_OFFICER...`);
  
  const user = await prisma.user.update({
    where: { email },
    data: { platformRole: 'BANK_OFFICER' }
  });

  console.log(`Successfully updated user ${user.fullName} (${user.email}) to role: ${user.platformRole}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
