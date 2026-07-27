import db from '@/lib/db';
import { VslaGroup } from '@prisma/client';

export async function getGroupById(groupId: string) {
  return await db.vslaGroup.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
            },
          },
        },
      },
    },
  });
}
