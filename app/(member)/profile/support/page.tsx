'use client';

import React, { useState, useEffect } from "react";
import { ProfileSubpageTemplate } from "@/components/templates/ProfileSubpageTemplate/ProfileSubpageTemplate";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Badge } from "@/components/atoms/Badge/Badge";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description }),
      });
      if (res.ok) {
        setShowModal(false);
        setSubject("");
        setDescription("");
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileSubpageTemplate title="Help & Support">
      <div className="flex flex-col gap-5">
        
        {/* Support Channels Card */}
        <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-extrabold text-[#1B2321]">Contact Finovate Support</h3>
              <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Need help with VSLA Connect? Reach out directly or submit a ticket.</p>
            </div>
            <Button theme="green" leftIcon={<Icon name="sparkle" className="w-4 h-4" />} onClick={() => setShowModal(true)}>
              Submit Ticket
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-[10px] border border-[#E9EDEA]">
              <div className="w-8 h-8 rounded-full bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center shrink-0">
                <Icon name="chat" className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#94A29C]">WhatsApp Support</div>
                <div className="text-[13px] font-extrabold text-[#1B2321]">+265 991 000 000</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-[10px] border border-[#E9EDEA]">
              <div className="w-8 h-8 rounded-full bg-[#E6EEFA] text-[#4A7FC1] flex items-center justify-center shrink-0">
                <Icon name="support" className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#94A29C]">Email Support</div>
                <div className="text-[13px] font-extrabold text-[#1B2321]">support@finovate.mw</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Support Tickets */}
        <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] flex flex-col gap-4">
          <h3 className="text-[15px] font-extrabold text-[#1B2321]">My Support Tickets</h3>

          {loading && <div className="py-8 text-center text-sm text-[#94A29C]">Loading tickets...</div>}

          {!loading && tickets.length === 0 && (
            <div className="py-8 text-center text-sm text-[#94A29C]">
              No support tickets found. Click "Submit Ticket" above if you have an issue.
            </div>
          )}

          {!loading && tickets.length > 0 && (
            <div className="flex flex-col gap-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-[12px] bg-[#F7F9F8] border border-[#E9EDEA] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#1B2321]">{t.subject}</span>
                    <Badge variant={t.status === "RESOLVED" || t.status === "CLOSED" ? "green" : "orange"} size="sm">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-[12.5px] text-[#5B6B65]">{t.description}</p>
                  <span className="text-[11px] text-[#94A29C] mt-1">Submitted on {format(new Date(t.createdAt), "MMM dd, yyyy · p")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Submit Support Ticket</h3>
            <Input label="Issue Subject" placeholder="e.g. Deposit not reflecting" theme="green" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} />
            
            <div className="flex flex-col gap-1">
              <label className="text-[12.5px] font-semibold text-[#5B6B65]">Detailed Description</label>
              <textarea
                rows={4}
                placeholder="Describe your issue or question in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-[13px] p-3 border border-[#E9EDEA] rounded-[10px] focus:outline-none focus:border-[#2D7A52]"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button theme="green" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProfileSubpageTemplate>
  );
}
