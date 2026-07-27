// app/api/chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sendMessageSchema } from "@/lib/validations/chat";
import {
  handleSendMessage,
  handleFetchMessages,
} from "@/controllers/chat/chat.controller";
import { getCallerUserId } from "@/lib/utils/getCallerUserId";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const limitParam = searchParams.get("limit");
    const before = searchParams.get("before") || undefined;

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId parameter is required" },
        { status: 400 }
      );
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const messages = await handleFetchMessages(userId, groupId, limit, before);
    return NextResponse.json({ data: messages }, { status: 200 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_GROUP_ACCESS") {
      return NextResponse.json(
        { error: "You are not an active member of this group" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = sendMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId, body: messageBody, mediaUrl, mediaType } = validationResult.data;

    const newMessage = await handleSendMessage(userId, groupId, messageBody, mediaUrl, mediaType);
    return NextResponse.json({ data: newMessage }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_GROUP_ACCESS") {
      return NextResponse.json(
        { error: "You are not an active member of this group" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send chat message" },
      { status: 500 }
    );
  }
}