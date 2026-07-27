import React, { useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Users, Phone, Mail } from 'lucide-react';

export interface GroupMemberDisplay {
  id: string;
  fullName?: string;
  name?: string;
  roleInGroup?: string;
  role?: string;
  phoneNumber?: string;
  phone?: string;
  email?: string | null;
  avatarUrl?: string | null;
  status?: string;
}

export interface GroupDirectoryProps {
  members: GroupMemberDisplay[];
  isChairperson?: boolean;
  onUpdateRole?: (memberId: string, newRole: string) => Promise<void>;
}

const ASSIGNABLE_ROLES = ["MEMBER", "TREASURER", "SECRETARY"];

export const GroupDirectory: React.FC<GroupDirectoryProps> = ({ members, isChairperson, onUpdateRole }) => {
  const [query, setQuery] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!onUpdateRole) return;
    setUpdatingMemberId(memberId);
    try {
      await onUpdateRole(memberId, newRole);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const filtered = members.filter(
    (m) => {
      const displayName = m.fullName ?? m.name ?? '';
      const displayRole = m.roleInGroup ?? m.role ?? '';
      const contact = m.phoneNumber ?? m.phone ?? m.email ?? '';
      return (
        displayName.toLowerCase().includes(query.toLowerCase()) ||
        displayRole.toLowerCase().includes(query.toLowerCase()) ||
        contact.toLowerCase().includes(query.toLowerCase())
      );
    }
  );

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Group Member Roster ({members.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registered VSLA members and role assignments
            {isChairperson && <span className="ml-2 font-semibold text-emerald-600">(Chairperson Mode — Role Assignment Active)</span>}
          </p>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Search roster..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => {
          const displayName = member.fullName ?? member.name ?? '';
          const displayRole = member.roleInGroup ?? member.role ?? '';
          const contact = member.phoneNumber ?? member.phone ?? '';
          return (
            <div
              key={member.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={displayName} src={member.avatarUrl ?? undefined} size="md" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {displayName}
                    </h4>
                    <Badge size="sm" variant={displayRole === 'MEMBER' ? 'neutral' : 'emerald'}>
                      {displayRole}
                    </Badge>
                  </div>
                </div>

                {/* Chairperson Role Selector */}
                {isChairperson && onUpdateRole && (
                  <div>
                    {displayRole === "CHAIRPERSON" ? (
                      <span className="text-[11px] text-slate-400 italic">Chair</span>
                    ) : (
                      <select
                        value={displayRole}
                        disabled={updatingMemberId === member.id}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-[11px] font-bold border border-emerald-200 rounded-lg px-2 py-1 text-slate-800 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <p className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5" /> {member.email || 'N/A'}
                </p>
                <p className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5" /> {contact || 'N/A'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
