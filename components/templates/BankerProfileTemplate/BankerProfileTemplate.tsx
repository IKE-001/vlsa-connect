"use client";

import React from "react";
import { BankerSidebar } from "@/components/organisms/BankerSidebar/BankerSidebar";
import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import { UserProfile } from "@/hooks/useProfile";

export interface BankerProfileTemplateProps {
  profile: UserProfile;
}

export const BankerProfileTemplate: React.FC<BankerProfileTemplateProps> = ({ profile }) => {
  const name = profile.fullName || "Bank Officer";
  const initials = (name || "Banker").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "BO";
  const email = profile.email || "No email linked";

  return (
    <div className="min-h-screen bg-[#F2F4F8] font-sans antialiased flex flex-col md:flex-row">
      <div className="hidden md:block">
        <BankerSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pb-12">
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-[#EBEEF4] px-6 py-4">
          <h1 className="text-[19px] font-extrabold text-[#182233]">Banker Profile</h1>
          <p className="text-[12.5px] text-[#5C6B85] mt-0.5 font-medium">Bank Officer identity, credentials, and managed branch details</p>
        </header>

        <main className="p-4 md:p-6 flex flex-col gap-5 max-w-4xl">
          <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_10px_rgba(11,30,58,0.04)] border border-[#EBEEF4] flex flex-col sm:flex-row items-center gap-5">
            <Avatar initials={initials} theme="blue" size="xl" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-[18px] font-extrabold text-[#182233]">{name}</h2>
                <Badge variant="blue" dot>Bank Officer</Badge>
              </div>
              <p className="text-[12.5px] text-[#5C6B85] mt-0.5">National Bank of Malawi · Southern Region Portfolio</p>
            </div>
            <Button theme="blue" variant="outline">Update Credentials</Button>
          </div>

          <div className="bg-white rounded-[18px] p-6 shadow-[0_2px_10px_rgba(11,30,58,0.04)] border border-[#EBEEF4] flex flex-col gap-4">
            <h3 className="text-[15px] font-extrabold text-[#182233]">Official Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Officer Full Name" defaultValue={name} theme="blue" fullWidth />
              <Input label="Bank Email" defaultValue={email} theme="blue" fullWidth />
              <Input label="Branch Office" defaultValue="Lilongwe Main Branch" theme="blue" fullWidth />
              <Input label="Assigned VSLAs" defaultValue="24 Groups" theme="blue" readOnly fullWidth />
            </div>
            <div className="flex justify-end mt-2">
              <Button theme="blue">Save Profile</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
