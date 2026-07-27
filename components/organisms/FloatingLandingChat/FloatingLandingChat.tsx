'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minus, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isTyping?: boolean;
}

const TypewriterMessage = ({ content, isTyping, onComplete }: { content: string, isTyping?: boolean, onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState(isTyping ? '' : content);
  
  useEffect(() => {
    if (!isTyping) {
      setDisplayed(content);
      return;
    }
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(content.slice(0, i + 1));
      i++;
      if (i >= content.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [content, isTyping]);

  return <>{displayed}</>;
};

export const FloatingLandingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 }); // Offset from bottom right
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  
  const systemInstruction = `You are a helpful and welcoming AI assistant strictly for 'VSLA Connect' (Village Savings and Loan Association).
SECURITY AND BOUNDARIES: You MUST politely refuse to answer ANY question that is not related to VSLA Connect, savings groups, loans, USSD, or financial inclusion. If asked about general knowledge, math, coding, or anything off-topic, politely say: "I can only answer questions related to VSLA Connect."
FORMATTING: Your primary goal is to filter and provide precise, bite-sized answers. DO NOT use markdown asterisks (*) for bullet points. Instead, use a simple hyphen (-) or a standard bullet dot (•), and format your lists with clear line breaks. Never output more than 3-4 short sentences or bullet points at a time.`;

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: "Hello! I'm your VLSA Connect assistant. Want to know how we help communities digitize savings and unlock formal finance? Ask me anything!" }
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only allow drag on header, not buttons
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX,
      y: e.clientY
    });
    setStartPos({
      x: e.clientX,
      y: e.clientY
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = dragOffset.x - e.clientX;
    const dy = dragOffset.y - e.clientY;
    
    setDragOffset({ x: e.clientX, y: e.clientY });
    setPosition(prev => ({
      x: Math.max(0, prev.x + dx), // Prevent dragging completely off screen
      y: Math.max(0, prev.y + dy)
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory.map(({ role, content }) => ({ role, content })),
          systemInstruction
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newHistory, { role: 'assistant', content: data.reply, isTyping: true }]);
      } else {
        setMessages([...newHistory, { role: 'assistant', content: 'Oops! I had trouble connecting. Please try again.', isTyping: true }]);
      }
    } catch (err) {
      setMessages([...newHistory, { role: 'assistant', content: 'Network error. Please try again.', isTyping: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isClosed) return null;

  return (
    <>
      {/* Floating Button (when closed) */}
      {!isOpen && (
        <div 
          className="fixed z-50 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center gap-2"
          style={{
            bottom: `${position.y}px`,
            right: `${position.x}px`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => {
            handlePointerUp(e);
            // If we barely moved, treat it as a click to open
            if (Math.abs(e.clientX - startPos.x) < 5 && Math.abs(e.clientY - startPos.y) < 5) {
              setIsOpen(true);
            }
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsClosed(true);
            }} 
            className="p-1 bg-white rounded-full shadow-md text-zinc-500 hover:text-red-500 no-drag -mb-1"
            title="Remove AI Assistant"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            className="p-4 bg-[#0F4C36] hover:bg-[#0c3d2c] text-white rounded-full shadow-2xl hover:scale-105 transition-transform no-drag pointer-events-none"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatRef}
          className="fixed z-50 flex flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 sm:w-[380px] w-full h-[100dvh] sm:h-[550px] sm:bottom-auto sm:right-auto sm:top-auto sm:left-auto touch-none"
          style={{
            bottom: typeof window !== 'undefined' && window.innerWidth > 640 ? `${position.y}px` : '0',
            right: typeof window !== 'undefined' && window.innerWidth > 640 ? `${position.x}px` : '0',
            top: typeof window !== 'undefined' && window.innerWidth <= 640 ? '0' : 'auto',
            left: typeof window !== 'undefined' && window.innerWidth <= 640 ? '0' : 'auto',
            height: isMinimized ? 'auto' : undefined,
            transition: isDragging ? 'none' : 'height 0.2s ease-in-out'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#E6F0E6] rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#0F4C36]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900">VSLA Connect Guide</h3>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 no-drag text-zinc-400">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-slate-100 hover:text-zinc-700 rounded-full transition-colors hidden sm:block"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-2 hover:bg-slate-100 hover:text-zinc-700 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white touch-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-[#0F4C36] text-white rounded-tr-sm shadow-sm' 
                          : 'bg-slate-50 text-zinc-800 rounded-tl-sm border border-slate-100'
                      }`}
                    >
                      {msg.role === 'assistant' && msg.isTyping ? (
                        <TypewriterMessage 
                          content={msg.content} 
                          isTyping={true} 
                          onComplete={() => {
                            setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isTyping: false } : m));
                          }} 
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-zinc-500 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0F4C36]" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-100 no-drag">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about VSLA Connect..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5 text-sm outline-none focus:border-[#0F4C36] focus:bg-white transition-colors text-zinc-900"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-11 h-11 flex items-center justify-center bg-[#0F4C36] text-white rounded-full hover:bg-[#0c3d2c] disabled:opacity-50 transition-colors shrink-0 shadow-sm"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
