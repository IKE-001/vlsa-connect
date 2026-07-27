"use client";

import { MobileBottomNav } from "@/components/organisms/MobileBottomNav/MobileBottomNav";
import React, { useState } from "react";
import { MemberSidebar } from "@/components/organisms/MemberSidebar/MemberSidebar";
import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Icon, IconName } from "@/components/atoms/Icon/Icon";
import Link from "next/link";
import { UserProfile } from "@/hooks/useProfile";

export interface MemberProfileTemplateProps {
  profile: UserProfile | null;
  groupName: string;
  isLoading: boolean;
}

export const MemberProfileTemplate: React.FC<MemberProfileTemplateProps> = ({
  profile,
  groupName,
  isLoading,
}) => {
  const [mobileTab, setMobileTab] = useState("profile");

  const fullName = profile?.fullName ?? "Member";
  const phone = profile?.phoneNumber ?? "";
  const initials = (fullName || "User").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen font-sans antialiased flex flex-col md:flex-row bg-[#F1F4F2]">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className="hidden md:block">
        <MemberSidebar activePath="/profile" />
      </div>

      {/* ===== DESKTOP PROFILE VIEW ===== */}
      <div className="hidden md:flex flex-1 min-w-0 flex-col pb-12">
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#E9EDEA] px-7 py-4">
          <h1 className="text-[19px] font-extrabold text-[#1B2321]">Member Profile</h1>
          <p className="text-[12.5px] text-[#5B6B65] mt-0.5">Manage personal details, security, and group membership</p>
        </header>

        <main className="p-7 flex flex-col gap-5 max-w-4xl">
          <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] flex items-center gap-5">
            <Avatar initials={initials} theme="green" size="xl" />
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-extrabold text-[#1B2321]">{fullName}</h2>
                <Badge variant="green" dot>Verified Member</Badge>
              </div>
              <p className="text-[12.5px] text-[#5B6B65] mt-0.5">{groupName || "VSLA Group"} · {profile?.roleInGroup ?? profile?.platformRole ?? "Member"}</p>
            </div>
            <Button theme="green" variant="outline">Edit Photo</Button>
          </div>

          {isLoading && (
            <div className="bg-white rounded-[18px] p-6 border border-[#E9EDEA] text-center text-sm text-[#94A29C]">Loading profile…</div>
          )}
          {!isLoading && (
            <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#E9EDEA] flex flex-col gap-4">
              <h3 className="text-[15px] font-extrabold text-[#1B2321]">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={fullName} theme="green" fullWidth />
                <Input label="Phone Number" defaultValue={phone} theme="green" fullWidth />
                <Input label="Email" defaultValue={profile?.email ?? ""} theme="green" fullWidth />
                <Input label="Role" defaultValue={profile?.roleInGroup ?? profile?.platformRole ?? "Member"} theme="green" fullWidth />
                <Input label="Home Address" defaultValue={profile?.homeAddress ?? ""} theme="green" fullWidth />
              </div>
              <div className="flex justify-end mt-2">
                <Button theme="green">Save Changes</Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== MOBILE WHATSAPP-STYLE PROFILE VIEW (BRAND COLORS) ===== */}
      <div className="flex md:hidden flex-col w-full min-h-screen bg-[#F1F4F2] pb-24">
        
        {/* Header */}
        <header className="bg-gradient-to-b from-[#123A29] to-[#164A34] text-white px-5 pt-4 pb-16 relative">
          <div className="flex items-center justify-between mb-4">
            <button className="p-1 -ml-1 active:scale-95 transition-transform">
              <Icon name="chevron-down" className="w-[20px] h-[20px] rotate-90" />
            </button>
            <div className="text-[16px] font-extrabold">Profile</div>
            <div className="flex items-center gap-4">
              <button className="active:scale-95"><Icon name="search" className="w-[18px] h-[18px]" /></button>
            </div>
          </div>
        </header>

        {/* Profile Card (Overlapping header) */}
        <div className="mx-4 -mt-12 bg-white rounded-[20px] shadow-[0_4px_16px_rgba(18,58,41,0.08)] p-6 relative z-10 border border-[#EBEFED] flex flex-col items-center">
          <div className="absolute top-4 right-4 bg-[#E3F3EA] text-[#1B5E3F] px-2.5 py-1 rounded-full text-[10.5px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E3F] animate-ping" />
            Verified
          </div>
          
          <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-tr from-[#123A29] to-[#2D7A52] text-white flex items-center justify-center text-[32px] font-extrabold shadow-[0_4px_12px_rgba(45,122,82,0.3)] border-4 border-white mt-2">
            {initials}
          </div>

          <h2 className="text-[20px] font-extrabold text-[#1B2321] mt-3">{fullName}</h2>
          <p className="text-[12.5px] text-[#5B6B65] mt-0.5">{groupName || "VSLA Group"} · {profile?.roleInGroup ?? profile?.platformRole ?? "Member"}</p>
          <p className="text-[12px] font-mono text-[#94A29C] mt-1 bg-[#F1F4F2] px-3 py-1 rounded-full">{profile?.userId ? `ID: ${profile?.userId?.substring(0, 12)}` : "Loading…"}</p>
        </div>

        {/* Settings List */}
        <div className="mt-5 mx-4 flex flex-col bg-white rounded-[20px] shadow-[0_2px_10px_rgba(18,58,41,0.04)] border border-[#EBEFED] overflow-hidden">
          {[
            {
              icon: "user" as IconName,
              title: "Personal Information",
              desc: "Name, phone, national ID, address",
              href: "/profile/personal-info",
              color: "text-[#2D7A52]", bg: "bg-[#E3F3EA]"
            },
            {
              icon: "users" as IconName,
              title: "Group Membership",
              desc: "View group details and rules",
              href: "/profile/group",
              color: "text-[#4A7FC1]", bg: "bg-[#E6EEFA]"
            },
            {
              icon: "wallet" as IconName,
              title: "Payment Methods",
              desc: "Mobile money & bank accounts",
              href: "/profile/payments",
              color: "text-[#E8873A]", bg: "bg-[#FCEADC]"
            },
            {
              icon: "shield-alert" as IconName,
              title: "Security",
              desc: "PIN, password, biometrics",
              href: "/profile/security",
              color: "text-[#DC4B3F]", bg: "bg-[#FCEAE9]"
            },
            {
              icon: "bell" as IconName,
              title: "Notifications",
              desc: "SMS, email and app alerts",
              href: "/profile/notifications",
              color: "text-[#8B6FC7]", bg: "bg-[#EFE9F9]"
            },
            {
              icon: "support" as IconName,
              title: "Help & Support",
              desc: "Contact support, FAQs",
              href: "/profile/support",
              color: "text-[#5B6B65]", bg: "bg-[#F1F4F2]"
            },
            {
              icon: "logout" as IconName,
              title: "Logout",
              desc: "Sign out of your account",
              href: "/logout",
              color: "text-[#DC4B3F]", bg: "bg-[#FCEAE9]"
            }
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center gap-4 px-5 py-4 active:bg-[#F7F9F8] transition-colors w-full text-left border-b border-[#EBEFED] last:border-0 group">
              <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                <Icon name={item.icon} className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[14.5px] text-[#1B2321] font-bold leading-tight group-hover:text-[#2D7A52] transition-colors">{item.title}</span>
                <span className="text-[12.5px] text-[#5B6B65] mt-0.5">{item.desc}</span>
              </div>
              <Icon name="chevron-down" className="w-[16px] h-[16px] text-[#94A29C] -rotate-90" />
            </Link>
          ))}
        </div>

      </div>

      <MobileBottomNav />


    </div>
  );
};
