"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
}

const MALAWI_FINANCE_SYSTEM_INSTRUCTION = `You are the lead AI Financial Advisor for VSLA Connect in Malawi (powered by Groq Llama-3 70B).
Your mission is to provide expert, practical, and culturally resonant financial advice tailored specifically to Village Savings and Loans Associations (VSLAs) and community members in Malawi.

Key advisory guidelines to enforce in your answers:
1. CURRENCY & MONETARY CONTEXT: Always work in Malawian Kwacha (MWK). Understand that 1 MWK = 100 Tambala.
2. VSLA SAVINGS & SHARE MODEL: VSLAs operate on weekly/monthly share purchases. Members buy between 1 to 5 shares per meeting (e.g., MWK 500 or MWK 1,000 per share).
3. LOAN RULES & ELIGIBILITY:
   - Maximum loan borrowing cap: 3x a member's total cumulative savings.
   - Interest rate: Typically 10% to 15% per month (flat or reducing).
   - Approval quorum: Requires votes from group officers (Chairperson, Treasurer, Secretary).
4. SEASONAL AGRICULTURAL FINANCIAL PLANNING:
   - Maize & Harvest Season (April–June): Ideal time for share-outs, debt clearing, and agricultural profit banking.
   - Planting & Input Season (October–December): High demand for agricultural loans (fertilizer, seeds, FISP/AIP inputs).
5. DIGITAL PAYMENTS & MOBILE MONEY: Explain how Airtel Money (+26599/98) and TNM Mpamba (+26588/31) integrate with PayChangu for instant deposit verification.
6. BILINGUAL SUPPORT: Respond fluently in English or Chichewa based on the user's language (e.g. "Muli bwanji", "Ndalama", "Zokolola", "Kusunga ndalama").
7. ENCOURAGING & PRACTICAL TONE: Provide step-by-step guidance. Never use complex jargon. Keep answers concise, actionable, and encouraging.`;

export const MemberAiAssistantTemplate: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "ai", text: "Muli bwanji! I am your VSLA AI Financial Advisor powered by Groq. Ask me anything about VSLA savings rules, loan eligibility (3x cap), agricultural season budgeting, or mobile money in English or Chichewa!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!inputVal.trim() || isThinking) return;
    const userText = inputVal.trim();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text: userText, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsThinking(true);

    try {
      const updatedMessages = [...messages, userMsg];
      const history = updatedMessages.slice(1).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, systemInstruction: MALAWI_FINANCE_SYSTEM_INSTRUCTION }),
      });

      const data = await res.json();
      const replyText = data.reply || "I'm sorry, I couldn't process your financial query right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "Zikomo. Having trouble connecting right now. Please check your connection and try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block">
        <MemberSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/90 backdrop-blur-md border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">VSLA Groq AI Financial Advisor</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Malawi community banking guidance &amp; Chichewa support</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isThinking ? "bg-[#F97316] animate-pulse" : "bg-[#2D7A52]"}`} />
            <span className="text-[11.5px] font-semibold text-[#5B6B65]">{isThinking ? "Thinking..." : "Groq Llama-3 Online"}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              {m.sender === "ai" && (
                <div className="w-8 h-8 rounded-full bg-[#2D7A52] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Icon name="sparkle" className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-[16px] p-4 text-[13.5px] ${m.sender === "user" ? "bg-[#2D7A52] text-white" : "bg-white text-[#1B2321] shadow-xs border border-[#E9EDEA]"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <div className={`text-[10px] mt-1.5 text-right ${m.sender === "user" ? "text-white/70" : "text-[#94A29C]"}`}>{m.time}</div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-[#2D7A52] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Icon name="sparkle" className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-[16px] p-4 border border-[#E9EDEA] shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#2D7A52] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#2D7A52] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#2D7A52] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        <footer className="bg-white border-t border-[#E9EDEA] p-4 flex items-center gap-3 shrink-0">
          <Input
            placeholder="Ask about savings, loans (3x cap), maize season budgeting, or Chichewa translation..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            theme="green"
            fullWidth
          />
          <Button theme="green" onClick={handleSend} disabled={isThinking || !inputVal.trim()} rightIcon={<Icon name="arrow-right" className="w-4 h-4" />}>
            Send
          </Button>
        </footer>
      </div>
    </div>
  );
};
