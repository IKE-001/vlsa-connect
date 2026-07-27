'use client';

import React from "react";
import { MemberMessagesTemplate } from "@/components/templates/MemberMessagesTemplate/MemberMessagesTemplate";
import { useProfile } from "@/hooks/useProfile";
import { useChat } from "@/hooks/useChat";
import { useGroup } from "@/hooks/useGroup";
import { setActiveGroupId } from "@/lib/api/client";

function getStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("vsla_active_group_id") ?? "";
}

export default function MessagesPage() {
  const groupId = getStoredGroupId();
  if (groupId) setActiveGroupId(groupId);

  const { profile } = useProfile();
  const { messages, isSending, sendMessage } = useChat(groupId);
  const { groupName, members } = useGroup(groupId);

  return (
    <MemberMessagesTemplate
      messages={messages}
      isSending={isSending}
      currentUserId={profile?.userId ?? ""}
      currentUserName={profile?.fullName ?? "You"}
      groupName={groupName}
      membersCount={members.length}
      onSendMessage={sendMessage}
    />
  );
}
