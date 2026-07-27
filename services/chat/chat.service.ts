// =============================================================================
// services/chat/chat.service.ts
// Owned by: Orama 
// =============================================================================


import db from "@/lib/db";

export async function createChatMessage(
  groupId: string,
  senderId: string,
  body: string,
  mediaUrl?: string,
  mediaType?: string
) {
  return await db.chatMessage.create({
    data: {
      groupId,
      senderId,
      body,
      ...(mediaUrl ? { mediaUrl, mediaType: mediaType ?? "document" } : {}),
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          platformRole: true,
        },
      },
    },
  });
}

export async function getGroupChatMessages(
  groupId: string,
  limit: number = 50,
  before?: string
) {
  return await db.chatMessage.findMany({
    where: {
      groupId,
      ...(before
        ? {
            sentAt: {
              lt: new Date(before),
            },
          }
        : {}),
    },
    take: limit,
    orderBy: {
      sentAt: "desc",
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          platformRole: true,
        },
      },
    },
  });
}

export async function checkGroupMembership(groupId: string, userId: string) {
  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  return membership !== null && membership.status === "ACTIVE";
}