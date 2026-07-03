'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RespondentType, Sentiment, Channel, DiaryDay, Status, AssignedTo, NextAction, ResponseEntry } from '@/lib/types';
import { suggestNextAction, getFollowUpPacket } from '@/lib/routing';

const RESPONDENT_TYPES: RespondentType[] = [
  'Aquarian Conspirator', 'Media', 'Funder / Investor', 'Academic',
  'Political figure', 'Institutional leader', 'Clergy / Spiritual leader',
  'Community organizer', 'Artist / Cultural figure', 'Referral', 'Unknown',
];
const SENTIMENTS: Sentiment[] = ['Enthusiastic', 'Interested', 'Cautious', 'Skeptical', 'Declined', 'No response'];
const CHANNELS: Channel[] = ['Email', 'Web form', 'Social media DM', 'Phone call', 'Text / SMS', 'In-person / event', 'Third-party referral'];
const DIARY_DAYS: DiaryDay[] = ['Day 4 – June 26', 'Day 5 – June 27', 'Day 9 – July 1'];
const ASSIGNED_TOS: AssignedTo[] = ['Dr. Chinyelu', 'Yakini', 'Jabari', 'Other'];
const NEXT_ACTIONS: NextAction[] = [
  'Schedule call – Dr. Chinyelu', 'Schedule call – Yakini', 'Send follow-up packet',
  'Log objection – holding', 'Flag for book review', 'No action needed',
];

const blank = (): Omit<ResponseEntry, 'id' | 'createdAt'> => ({
  fullName: '', titleRole: '', organization: '', respondentType: 'Unknown',
  contactEmail: '', contactPhone: '', locationCity: '', howReceivedProposal: '',
  dateReceived: '', dateResponded: '', channelOfResponse: 'Email',
  responseSummary: '', verbatimQuote: '', bookWorthy: false, diaryDayTarget: '',
  sentiment: 'Interested', keyQuestion: '', specificInterestArea: '',
  assignedTo: 'Jabari', nextAction: 'Send follow-up packet', nextActionDueDate: '',
  followUpPacketSent: false, meetingScheduled: false, meetingDate: '', status: 'New', notes: '',
});

export default function IntakePage() {
  const router = useRouter();
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: unknown) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'respondentType' || k === 'sentiment') {
        next.nextAction = suggestNextAction(
          k === 'respondentType' ? v as RespondentType : prev.respondentType,
          k === 'sentiment' ? v as Sentiment : prev.sentiment
        );
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { router.push('/queue'); }, 1200);
  };

  const packet = getFollowUpPacket(form.respondentType);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Log New Response</h1>
        <p className="text-stone-400 text-sm mt-1">Every channel feeds this form. Fill in what you have.</p>
      </div>

      {saved && (
        <div className="bg-emerald-900 border border-emerald-700 text-emerald-200 rounded-lg px-4 py-3 mb-4 text-sm">
          Response saved. Redirecting to queue…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="Identity">
          <Row>
            <Field label="Full Name *" required>
              <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} required className={inputCls} placeholder="Full name as provided" />
            </Field>
            <Field label="Title / Role">
              <input type="text" value={form.titleRole} onChange={e => set('titleRole', e.target.value)} className={inputCls} placeholder="Current position" />
            </Field>
          </Row>
          <Row>
            <Field label="Organization">
              <input type="text" value={form.organization} onChange={e => set('organization', e.target.value)} className={inputCls} placeholder="Employer or affiliation" />
            </Field>
            <Field label="Respondent Type *" required>
              <select value={form.respondentType} onChange={e => set('respondentType', e.target.value as RespondentType)} className={inputCls}>
                {RESPONDENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Contact Email">
              <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className={inputCls} />
            </Field>
          </Row>
          <Row>
            <Field label="Location / City">
              <input type="text" value={form.locationCity} onChange={e => set('locationCity', e.target.value)} className={inputCls} />
            </Field>
            <Field label="How They Received Proposal">
              <input type="text" value={form.howReceivedProposal} onChange={e => set('howReceivedProposal', e.target.value)} className={inputCls} placeholder="Direct / referral / social / etc." />
            </Field>
          </Row>
          <Row>
            <Field label="Date Proposal Received">
              <input type="date" value={form.dateReceived} onChange={e => set('dateReceived', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Date Responded">
              <input type="date" value={form.dateResponded} onChange={e => set('dateResponded', e.target.value)} className={inputCls} />
            </Field>
          </Row>
          <Field label="Response Channel">
            <select value={form.channelOfResponse} onChange={e => set('channelOfResponse', e.target.value as Channel)} className={inputCls}>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Response Content">
          <Field label="Sentiment *" required>
            <select value={form.sentiment} onChange={e => set('sentiment', e.target.value as Sentiment)} className={inputCls}>
              {SENTIMENTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Response Summary">
            <textarea value={form.responseSummary} onChange={e => set('responseSummary', e.target.value)} className={inputCls} rows={3} placeholder="2–3 sentences describing what they said" />
          </Field>
          <Field label="Verbatim Quote">
            <textarea value={form.verbatimQuote} onChange={e => set('verbatimQuote', e.target.value)} className={inputCls} rows={2} placeholder="Exact words — capture if book-worthy" />
          </Field>
          <Field label="Key Question Raised">
            <input type="text" value={form.keyQuestion} onChange={e => set('keyQuestion', e.target.value)} className={inputCls} placeholder="What did they ask or challenge?" />
          </Field>
          <Field label="Specific Interest Area">
            <input type="text" value={form.specificInterestArea} onChange={e => set('specificInterestArea', e.target.value)} className={inputCls} placeholder="What aspect resonated?" />
          </Field>
          <div className="flex items-start gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.bookWorthy} onChange={e => set('bookWorthy', e.target.checked)} className="w-4 h-4 accent-amber-400" />
              <span className="text-stone-200 text-sm font-medium">Flag for Book (Eleven-Day Diary)</span>
            </label>
          </div>
          {form.bookWorthy && (
            <Field label="Diary Day Target">
              <select value={form.diaryDayTarget} onChange={e => set('diaryDayTarget', e.target.value as DiaryDay)} className={inputCls}>
                <option value="">-- Select Day --</option>
                {DIARY_DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          )}
        </Section>

        <Section title="Action">
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm text-stone-300 mb-2">
            <span className="text-stone-500">Suggested follow-up packet: </span>{packet}
          </div>
          <Row>
            <Field label="Assigned To">
              <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value as AssignedTo)} className={inputCls}>
                {ASSIGNED_TOS.map(a => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Next Action">
              <select value={form.nextAction} onChange={e => set('nextAction', e.target.value as NextAction)} className={inputCls}>
                {NEXT_ACTIONS.map(a => <option key={a}>{a}</option>)}
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Next Action Due Date">
              <input type="date" value={form.nextActionDueDate} onChange={e => set('nextActionDueDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as Status)} className={inputCls}>
                {(['New', 'In progress', 'Complete', 'Declined', 'Holding'] as Status[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </Row>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-300">
              <input type="checkbox" checked={form.followUpPacketSent} onChange={e => set('followUpPacketSent', e.target.checked)} className="w-4 h-4 accent-amber-400" />
              Follow-up packet sent
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-300">
              <input type="checkbox" checked={form.meetingScheduled} onChange={e => set('meetingScheduled', e.target.checked)} className="w-4 h-4 accent-amber-400" />
              Meeting scheduled
            </label>
          </div>
          {form.meetingScheduled && (
            <Field label="Meeting Date">
              <input type="date" value={form.meetingDate} onChange={e => set('meetingDate', e.target.value)} className={inputCls} />
            </Field>
          )}
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} rows={3} placeholder="Internal notes" />
          </Field>
        </Section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving || saved} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-6 py-2.5 rounded text-sm transition-colors">
            {saving ? 'Saving…' : 'Save Response'}
          </button>
          <button type="button" onClick={() => setForm(blank())} className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2.5 rounded text-sm transition-colors">
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-stone-600';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 space-y-4">
      <h2 className="text-amber-400 text-xs font-bold uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-stone-400 text-xs font-medium">{label}{required && <span className="text-amber-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}
