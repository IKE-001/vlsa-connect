// =============================================================================
// lib/validations/chat.ts
// Owned by: Orama 
// Zod schemas for chats
// =============================================================================


import { z } from "zod";

export const sendMessageSchema = z.object({
  groupId: z.string().uuid({ message: "Invalid group ID" }),
  body: z
    .string()
    .trim()
    .max(2000, { message: "Message cannot exceed 2000 characters" })
    .default(""),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "document"]).optional(),
}).refine(
  (data) => data.body.length > 0 || !!data.mediaUrl,
  { message: "Message must have text or an attachment" }
);

export type SendMessageInput = z.infer<typeof sendMessageSchema>;