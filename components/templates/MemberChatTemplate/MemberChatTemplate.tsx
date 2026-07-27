"use client";

import React, { useState } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { ChatMessage } from "@/hooks/useChat";
import { format, parseISO } from "date-fns";

export interface MemberChatTemplateProps {
  messages: ChatMessage[];
  isSending: boolean;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (body: string, mediaUrl?: string, mediaType?: "image" | "document") => Promise<void>;
}

export const MemberChatTemplate: React.FC<MemberChatTemplateProps> = ({
  messages,
  isSending,
  currentUserId,
  currentUserName,
  onSendMessage,
}) => {
  const [activeChannel, setActiveChannel] = useState("Group Announcements");
  const [inputMsg, setInputMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = async () => {
    if (!inputMsg.trim() || isSending) return;
    await onSendMessage(inputMsg.trim());
    setInputMsg("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "document") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload file");
      }

      await onSendMessage("", json.url, mediaType);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Get initials from sender name
  const getInitials = (name: string) =>
    (name || "User").split(" ").filter(Boolean).map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const THEMES = ["green", "blue", "purple", "orange", "red"] as const;
  const getTheme = (id?: string) => THEMES[(id ?? "x").charCodeAt(0) % THEMES.length];

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block">
        <MemberSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Chat channels sidebar */}
        <div className="w-full md:w-64 bg-white border-r border-[#E9EDEA] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#E9EDEA]">
            <h2 className="text-[15px] font-extrabold text-[#1B2321]">Group Chat</h2>
            <p className="text-[11.5px] text-[#5B6B65]">VSLA Group Channels</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {["Group Announcements", "General Discussions", "Loan Committee"].map((c) => (
              <button
                key={c}
                onClick={() => setActiveChannel(c)}
                className={`w-full text-left p-3 rounded-[10px] text-[13px] font-bold mb-1 transition-colors ${activeChannel === c ? "bg-[#E3F3EA] text-[#2D7A52]" : "text-[#5B6B65] hover:bg-[#F1F4F2]"}`}
              >
                # {c}
              </button>
            ))}
          </div>
        </div>

        {/* Chat main log */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F1F4F2]">
          <header className="bg-white border-b border-[#E9EDEA] px-6 py-4 flex items-center justify-between shrink-0">
            <h1 className="text-[16px] font-extrabold text-[#1B2321]"># {activeChannel}</h1>
            <span className="text-[12px] text-[#94A29C]">{messages.length} messages</span>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-[#94A29C]">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              const name = m.senderName ?? (isMe ? currentUserName : "Member");
              return (
                <div key={m.id} className="flex items-start gap-3 bg-white p-4 rounded-[16px] shadow-xs border border-[#E9EDEA]">
                  <Avatar initials={getInitials(name)} theme={getTheme(m.senderId)} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#1B2321]">{name}{isMe ? " (You)" : ""}</span>
                      <span className="text-[10.5px] text-[#94A29C]">
                        {format(parseISO(m.createdAt), "h:mm a")}
                      </span>
                    </div>
                    {m.mediaUrl && m.mediaType === "image" && (
                      <img src={m.mediaUrl} alt="Attached image" className="max-w-xs rounded-[8px] mt-2 mb-1 border border-[#E9EDEA]" />
                    )}
                    {m.mediaUrl && m.mediaType === "document" && (
                      <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 p-2 rounded-[8px] mt-2 mb-1 bg-[#F1F4F2] hover:bg-[#E3F3EA] text-[#2D7A52] font-semibold text-[13px] transition-colors">
                        <Icon name="doc" className="w-4 h-4 shrink-0" />
                        View Document
                      </a>
                    )}
                    {m.body && <p className="text-[13px] text-[#5B6B65] mt-1 break-words whitespace-pre-wrap [word-break:break-word]">{m.body}</p>}
                  </div>
                </div>
              );
            })}
          </main>

          <footer className="bg-white border-t border-[#E9EDEA] p-4 flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 shrink-0">
              <label className="cursor-pointer text-[#94A29C] hover:text-[#5B6B65] transition-colors p-2" title="Attach Document">
                <input type="file" onChange={(e) => handleFileUpload(e, "document")} className="hidden" accept=".pdf,.doc,.docx" disabled={isUploading || isSending} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </label>
              <label className="cursor-pointer text-[#94A29C] hover:text-[#5B6B65] transition-colors p-2" title="Attach Photo">
                <input type="file" onChange={(e) => handleFileUpload(e, "image")} className="hidden" accept="image/*" disabled={isUploading || isSending} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </label>
            </div>
            <Input
              placeholder={`Message #${activeChannel}...`}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              theme="green"
              fullWidth
            />
            <Button theme="green" onClick={handleSend} disabled={isSending || isUploading}>
              {isSending || isUploading ? "…" : "Send"}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
};

