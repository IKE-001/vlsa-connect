"use client";
import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React from "react";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { QuickInfoTile } from "@/components/molecules/QuickInfoTile/QuickInfoTile";
import { NextMeetingCard } from "@/components/organisms/NextMeetingCard/NextMeetingCard";
import { HealthScoreBreakdown } from "@/types/financial";
import { MeetingRecord } from "@/hooks/useMeetings";
import { format, parseISO } from "date-fns";

interface GroupMember {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  roleInGroup: string;
  status: string;
  joinedAt: string;
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  totalPoolTambala: number;
  meetingFrequency: string;
  members: GroupMember[];
}

export interface MemberMyGroupTemplateProps {
  group: GroupDetail | null;
  members: GroupMember[];
  meetings: MeetingRecord[];
  groupHealth: HealthScoreBreakdown | null;
  isLoading: boolean;
}

const AVATAR_THEMES = ["green", "blue", "purple", "orange", "red", "gray"] as const;
const getTheme = (index: number) => AVATAR_THEMES[index % AVATAR_THEMES.length];
const getInitials = (name: string) =>
  (name || "User").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

export const MemberMyGroupTemplate: React.FC<MemberMyGroupTemplateProps> = ({
  group,
  members,
  meetings,
  groupHealth,
  isLoading,
}) => {
  const nextMeeting = meetings.find((m) => m.status === "SCHEDULED");
  const groupName = group?.name ?? "Your Group";
  const inviteCode = group?.inviteCode ?? "—";

  return (
    <div className="min-h-screen bg-[#F1F4F2] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block"><MemberSidebar activePath="/my-group" /></div>
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Sticky header */}
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-[#1B2321]">My Group</h1>
            <p className="text-[12.5px] text-[#5B6B65] mt-0.5">{groupName} · {inviteCode}</p>
          </div>
          <Badge variant="green" dot>Active Group</Badge>
        </header>

        {/* Scrollable main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-7 flex flex-col gap-5 pb-12">

          {/* Group banner */}
          <div className="bg-gradient-to-r from-[#123A29] to-[#2D7A52] rounded-[18px] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-white/18 border border-white/40 flex items-center justify-center font-extrabold text-[20px] shrink-0">
              {getInitials(groupName)}
            </div>
            <div className="flex-1">
              <div className="text-[20px] font-extrabold">{groupName}</div>
              <div className="text-[12.5px] text-[#B9D4C6] mt-0.5">
                {group?.description ?? "Malawi · Active Group"}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-white/18 backdrop-blur-xs text-white text-[11.5px] font-bold px-3 py-1 rounded-full">VSLA Model</span>
                <span className="bg-white/18 backdrop-blur-xs text-white text-[11.5px] font-bold px-3 py-1 rounded-full">{members.length} Members</span>
                <span className="bg-white/18 backdrop-blur-xs text-white text-[11.5px] font-bold px-3 py-1 rounded-full">{group?.meetingFrequency ?? "Regular Meetings"}</span>
              </div>
            </div>
            {groupHealth && (
              <div className="text-center shrink-0">
                <div className="text-[28px] font-extrabold">{groupHealth.score}</div>
                <div className="text-[11px] text-[#B9D4C6]">Health Score</div>
              </div>
            )}
          </div>

          {/* Quick info grid */}
          <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
            <QuickInfoTile icon="tag"      label="Group Name"    value={groupName} />
            <QuickInfoTile icon="hash"     label="Group Code"    value={inviteCode} />
            <QuickInfoTile icon="calendar" label="Meetings"      value={group?.meetingFrequency ?? "Scheduled"} />
            <QuickInfoTile icon="vote"     label="Group Type"    value="VSLA" />
            <QuickInfoTile icon="users"    label="Members"       value={`${members.length} Members`} />
            <QuickInfoTile icon="goal"     label="Health Score"  value={groupHealth ? `${groupHealth.score}/100` : "N/A"} />
          </div>

          {/* Members table */}
          <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9EDEA]">
              <h2 className="text-[15px] font-extrabold text-[#1B2321]">Group Members</h2>
              <span className="text-[12px] text-[#94A29C] font-semibold">{members.length} total</span>
            </div>
            <div className="overflow-x-auto">
              {isLoading && <div className="py-8 text-center text-sm text-[#94A29C]">Loading members…</div>}
              {!isLoading && members.length === 0 && (
                <div className="py-8 text-center text-sm text-[#94A29C]">No members found.</div>
              )}
              {members.length > 0 && (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-[#F7F9F8] text-[11.5px] font-bold text-[#94A29C] text-left">
                      <th className="px-5 py-3">Member</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Phone</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr key={m.id} className="border-t border-[#F1F4F2] hover:bg-[#F7F9F8] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={getInitials(m.fullName)} theme={getTheme(i)} size="sm" />
                            <span className="font-semibold text-[#1B2321]">{m.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#5B6B65] font-medium">{m.roleInGroup}</td>
                        <td className="px-5 py-3.5 text-[#5B6B65]">{m.phoneNumber}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={m.status === "ACTIVE" ? "green" : "red"} size="sm" dot>{m.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Next meeting */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA]">
              <h3 className="text-[15px] font-extrabold text-[#1B2321] mb-4">Upcoming Meetings</h3>
              {meetings.filter(m => m.status === "SCHEDULED").length === 0 && (
                <p className="text-sm text-[#94A29C]">No upcoming meetings scheduled.</p>
              )}
              {meetings.filter(m => m.status === "SCHEDULED").map((meeting) => (
                <div key={meeting.id} className="flex items-start gap-2.5 py-2.5 border-b border-[#F1F4F2] last:border-0">
                  <span className="w-5 h-5 rounded-full bg-[#E3F3EA] text-[#2D7A52] flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">📅</span>
                  <div>
                    <div className="text-[13px] text-[#1B2321] font-semibold">{meeting.title}</div>
                    <div className="text-[11.5px] text-[#5B6B65]">{format(parseISO(meeting.scheduledAt), "EEE, d MMM yyyy · p")}</div>
                  </div>
                </div>
              ))}
            </div>
            <NextMeetingCard date={nextMeeting ? format(parseISO(nextMeeting.scheduledAt), "EEEE, d MMMM yyyy · p") : "No upcoming meetings"} />
          </div>
        </main>
      </div>
    
      <MobileBottomNav />
    </div>
  );
};

