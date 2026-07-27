"use client";

import React, { useState, useRef } from "react";
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

interface PendingAttachment {
  file: File;
  previewUrl: string;   // object URL for images, empty string for docs
  mediaType: "image" | "document";
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Bug 2 fix: pending attachment preview state
  const [pending, setPending] = useState<PendingAttachment | null>(null);

  const docInputRef  = useRef<HTMLInputElement>(null);
  const imgInputRef  = useRef<HTMLInputElement>(null);

  // Bug 2 fix: pick file → show preview, don't upload yet
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>, mediaType: "image" | "document") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous object URL to avoid memory leaks
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);

    const previewUrl = mediaType === "image" ? URL.createObjectURL(file) : "";
    setPending({ file, previewUrl, mediaType });
    setUploadError(null);
    // Reset input so same file can be re-picked after removal
    e.target.value = "";
  };

  const removePending = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setUploadError(null);
  };

  // Bug 3 fix: handleSend uploads attachment first if pending, then sends
  const handleSend = async () => {
    const hasText = inputMsg.trim().length > 0;
    const hasAttachment = !!pending;
    // Block if nothing to send, or already in flight
    if ((!hasText && !hasAttachment) || isSending || isUploading) return;

    let mediaUrl: string | undefined;
    let mediaType: "image" | "document" | undefined;

    if (pending) {
      setIsUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", pending.file);
        const res = await fetch("/api/media/upload", { method: "POST", body: formData });
        const json = await res.json();

        if (!res.ok || !json.success) {
          // Bug 1 fix: show inline error, don't just console.error
          throw new Error(json.error || "Upload failed");
        }
        mediaUrl  = json.url;
        mediaType = pending.mediaType;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload. Try again.";
        setUploadError(msg);
        setIsUploading(false);
        return; // Don't send if upload failed
      } finally {
        setIsUploading(false);
      }
    }

    await onSendMessage(inputMsg.trim(), mediaUrl, mediaType);
    setInputMsg("");
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setUploadError(null);
  };

  const getInitials = (name: string) =>
    (name || "User").split(" ").filter(Boolean).map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const THEMES = ["green", "blue", "purple", "orange", "red"] as const;
  const getTheme = (id?: string) => THEMES[(id ?? "x").charCodeAt(0) % THEMES.length];

  const busy = isSending || isUploading;

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

          {/* ── Compose area ── */}
          <footer className="bg-white border-t border-[#E9EDEA] shrink-0">

            {/* Bug 1 fix: inline upload error banner */}
            {uploadError && (
              <div className="mx-4 mt-3 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[12px] bg-red-50 text-red-600 border border-red-200">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                {uploadError}
                <button type="button" onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            {/* Bug 2 fix: attachment preview strip */}
            {pending && (
              <div className="mx-4 mt-3 flex items-center gap-3 p-2.5 rounded-[12px] bg-[#F1F4F2] border border-[#E9EDEA]">
                {pending.mediaType === "image" && pending.previewUrl ? (
                  <img src={pending.previewUrl} alt="Preview" className="h-14 w-14 rounded-[8px] object-cover border border-[#E9EDEA]" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-[#E3F3EA]">
                    <svg className="h-7 w-7 text-[#2D7A52]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-[#1B2321]">{pending.file.name}</p>
                  <p className="text-[11px] text-[#94A29C]">{(pending.file.size / 1024).toFixed(1)} KB · {pending.mediaType}</p>
                </div>
                {/* Remove attachment */}
                <button
                  type="button"
                  onClick={removePending}
                  className="shrink-0 rounded-full p-1 text-[#94A29C] hover:bg-[#E9EDEA] hover:text-[#5B6B65] transition-colors"
                  title="Remove attachment"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}

            <div className="p-4 flex items-center gap-3">
              {/* Bug 4 fix: use refs + pointer-events on label instead of disabled on input */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Hidden file inputs */}
                <input
                  ref={docInputRef}
                  type="file"
                  onChange={(e) => handleFilePick(e, "document")}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
                <input
                  ref={imgInputRef}
                  type="file"
                  onChange={(e) => handleFilePick(e, "image")}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => !busy && docInputRef.current?.click()}
                  disabled={busy}
                  className="cursor-pointer text-[#94A29C] hover:text-[#5B6B65] transition-colors p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Attach Document"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => !busy && imgInputRef.current?.click()}
                  disabled={busy}
                  className="cursor-pointer text-[#94A29C] hover:text-[#5B6B65] transition-colors p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Attach Photo"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
              </div>

              <Input
                placeholder={`Message #${activeChannel}...`}
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                theme="green"
                fullWidth
              />
              <Button
                theme="green"
                onClick={handleSend}
                disabled={busy || (!inputMsg.trim() && !pending)}
              >
                {isUploading ? "Uploading…" : isSending ? "Sending…" : "Send"}
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
