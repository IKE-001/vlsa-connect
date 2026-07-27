import React, { useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Calendar, Clock, MapPin, CheckCircle2, Plus, FileText } from 'lucide-react';

export interface MeetingDisplay {
  id: string;
  title: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
  location?: string | null;
  status: string;
  agendaNotes?: string | null;
  agenda?: string;
  minutes?: string | null;
}

export interface UpcomingMeetingsProps {
  meetings: MeetingDisplay[];
  onRSVP?: (meetingId: string, memberId?: string) => void;
  onScheduleMeeting?: (title: string, scheduledAt: string, location: string, agenda: string) => Promise<void>;
  onSaveMinutes?: (meetingId: string, minutes: string) => Promise<void>;
}

export const UpcomingMeetings: React.FC<UpcomingMeetingsProps> = ({
  meetings,
  onRSVP,
  onScheduleMeeting,
  onSaveMinutes,
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [agenda, setAgenda] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const [minutesMeetingId, setMinutesMeetingId] = useState<string | null>(null);
  const [minutesText, setMinutesText] = useState('');
  const [savingMinutes, setSavingMinutes] = useState(false);

  const handleScheduleSubmit = async () => {
    if (!title || !scheduledAt || !onScheduleMeeting) return;
    setScheduling(true);
    try {
      await onScheduleMeeting(title, scheduledAt, location, agenda);
      setShowScheduleModal(false);
      setTitle('');
      setScheduledAt('');
      setLocation('');
      setAgenda('');
    } finally {
      setScheduling(false);
    }
  };

  const handleMinutesSubmit = async () => {
    if (!minutesMeetingId || !onSaveMinutes) return;
    setSavingMinutes(true);
    try {
      await onSaveMinutes(minutesMeetingId, minutesText);
      setMinutesMeetingId(null);
      setMinutesText('');
    } finally {
      setSavingMinutes(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            VSLA Group Meetings &amp; Share-Outs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scheduled share purchases, voting assemblies, and audit checks
          </p>
        </div>

        {onScheduleMeeting && (
          <Button size="sm" theme="green" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowScheduleModal(true)}>
            Schedule Meeting
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {meetings.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">No meetings scheduled.</p>
        )}
        {meetings.map((m) => {
          const dateObj = m.scheduledAt ? new Date(m.scheduledAt) : null;
          const displayDate = dateObj ? dateObj.toLocaleDateString() : (m.date ?? '');
          const displayTime = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (m.time ?? '');
          const displayAgenda = m.agendaNotes ?? m.agenda ?? '';
          const isActive = m.status === 'UPCOMING' || m.status === 'SCHEDULED';
          
          return (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {m.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {displayDate}
                    </span>
                    {displayTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" /> {displayTime}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {m.location || 'TBD'}
                    </span>
                  </div>
                </div>
                <Badge variant={isActive ? 'success' : 'neutral'}>
                  {m.status}
                </Badge>
              </div>

              {displayAgenda && (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <strong className="text-slate-800 dark:text-slate-200">Agenda: </strong>
                  {displayAgenda}
                </div>
              )}

              {m.minutes && (
                <div className="text-xs text-[#2D7A52] bg-[#E3F3EA] p-2.5 rounded-lg border border-emerald-200">
                  <strong>Minutes: </strong>{m.minutes}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {onSaveMinutes && (
                  <button
                    onClick={() => { setMinutesMeetingId(m.id); setMinutesText(m.minutes || ''); }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> {m.minutes ? 'Edit Minutes' : 'Add Minutes'}
                  </button>
                )}

                {isActive && onRSVP && (
                  <button
                    onClick={() => onRSVP(m.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Attendance
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Schedule Group Meeting</h3>
            <Input label="Meeting Title" placeholder="e.g. Monthly Share-Out & Voting Assembly" theme="green" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input label="Date & Time" type="datetime-local" theme="green" fullWidth value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <Input label="Location / Venue" placeholder="e.g. Community Center Hall / Kwa Manga" theme="green" fullWidth value={location} onChange={(e) => setLocation(e.target.value)} />
            
            <div className="flex flex-col gap-1">
              <label className="text-[12.5px] font-semibold text-[#5B6B65]">Agenda &amp; Notes</label>
              <textarea
                rows={3}
                placeholder="Share purchase cycle, loan reviews..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                className="w-full text-[13px] p-2.5 border border-[#E9EDEA] rounded-[10px] focus:outline-none focus:border-[#2D7A52]"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button theme="green" onClick={handleScheduleSubmit} disabled={scheduling}>
                {scheduling ? "Scheduling…" : "Schedule Meeting"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Minutes Modal */}
      {minutesMeetingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-[17px] font-extrabold text-[#1B2321]">Record Meeting Minutes</h3>
            <textarea
              rows={5}
              placeholder="Enter decisions made, attendance notes, and share-out summaries..."
              value={minutesText}
              onChange={(e) => setMinutesText(e.target.value)}
              className="w-full text-[13px] p-3 border border-[#E9EDEA] rounded-[10px] focus:outline-none focus:border-[#2D7A52]"
            />
            <div className="flex gap-3 justify-end mt-2">
              <Button variant="outline" theme="green" onClick={() => setMinutesMeetingId(null)}>Cancel</Button>
              <Button theme="green" onClick={handleMinutesSubmit} disabled={savingMinutes}>
                {savingMinutes ? "Saving…" : "Save Minutes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
