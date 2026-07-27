// controllers/chat/chat.controller.ts


import {
  createChatMessage,
  getGroupChatMessages,
  checkGroupMembership,
} from "@/services/chat/chat.service";

export async function handleSendMessage(
  userId: string,
  groupId: string,
  body: string,
  mediaUrl?: string,
  mediaType?: string
) {
  // Rule: Sender must be an active member of the VSLA group
  const isMember = await checkGroupMembership(groupId, userId);
  if (!isMember) {
    throw new Error("UNAUTHORIZED_GROUP_ACCESS");
  }

  const message = await createChatMessage(groupId, userId, body, mediaUrl, mediaType);
  return message;
}

export async function handleFetchMessages(
  userId: string,
  groupId: string,
  limit: number = 50,
  before?: string
) {
  // Rule: Member can only read messages from their own group
  const isMember = await checkGroupMembership(groupId, userId);
  if (!isMember) {
    throw new Error("UNAUTHORIZED_GROUP_ACCESS");
  }

  const messages = await getGroupChatMessages(groupId, limit, before);
  // Return in chronological order (oldest first) for chat UI display
  return messages.reverse();
}