'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ResponseEntry, Status, AssignedTo, NextAction } from '@/lib/types';
import { getFollowUpPacket } from '@/lib/routing';

const STATUS_OPTS: Status[] = ['New', 'In progress', 'Complete', 'Declined', 'Holding'];
const ASSIGNED_OPTS: AssignedTo[] = ['Dr. Chinyelu', 'Yakini', 'Jabari', 'Other'];
const NEXT_ACTION_OPTS: NextAction[] = [
  'Schedule call – Dr. Chinyelu', 'Schedule call – Yakini', 'Send follow-up packet',
  'Log objection – holding', 'Flag for book review', 'No action needed',
];

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-900 text-blue-300',
  'In progress': 'bg-purple-900 text-purple-300',
  Complete: 'bg-green-900 text-green-300',
  Declined: 'bg-red-900 text-red-300',
  Holding: 'bg-stone-700 text-stone-300',
};

const SENTIMENT_COLORS: Record<string, string> = {
  Enthusiastic: 'text-emerald-400',
  Interested: 'text-sky-400',
  Cautious: 'text-amber-400',
  Skeptical: 'text-orange-400',
  Declined: 'text-red-400',
  'No response': 'text-stone-500',
};

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="text-stone-400 py-12 text-center">Loading queue…</div>}>
      <QueueContent />
    </Suspense>
  );
}

function QueueContent() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');

  const [entries, setEntries] = useState<ResponseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAssigned, setFilterAssigned] = useState<string>('');
  const [selected, setSelected] = useState<ResponseEntry | null>(null);

  const load = useCallback(() => {
    fetch('/api/responses').then(r => r.json()).then((d: ResponseEntry[]) => {
      setEntries(d);
      setLoading(false);
      if (highlight) {
        const found = d.find(e => e.id === highlight);
        if (found) setSelected(found);
      }
    });
  }, [highlight]);

  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, updates: Partial<ResponseEntry>) => {
    const res = await fetch(`/api/responses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updated = await res.json() as ResponseEntry;
    setEntries(prev => prev.map(e => e.id === id ? updated : e));
    if (selected?.id === id) setSelected(updated);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/responses/${id}`, { method: 'DELETE' });
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  let filtered = entries;
  if (filterStatus) filtered = filtered.filter(e => e.status === filterStatus);
  if (filterType) filtered = filtered.filter(e => e.respondentType === filterType);
  if (filterAssigned) filtered = filtered.filter(e => e.assignedTo === filterAssigned);
  filtered = [...filtered].sort((a, b) => {
    if (!a.nextActionDueDate) return 1;
    if (!b.nextActionDueDate) return -1;
    return a.nextActionDueDate.localeCompare(b.nextActionDueDate);
  });

  const uniqueTypes = [...new Set(entries.map(e => e.respondentType))];

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left: queue list */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Routing Queue</h1>
          <Link href="/intake" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-3 py-1.5 rounded text-xs transition-colors">
            + New
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-shrink-0 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={filterCls}>
            <option value="">All statuses</option>
            {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={filterCls}>
            <option value="">All types</option>
            {uniqueTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)} className={filterCls}>
            <option value="">All assignees</option>
            {ASSIGNED_OPTS.map(a => <option key={a}>{a}</option>)}
          </select>
          <span className="text-stone-500 text-xs self-center">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div className="text-stone-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-stone-500 text-sm border border-stone-800 rounded-lg p-6 text-center">
            No entries match these filters.
          </div>
        ) : (
          <div className="overflow-y-auto space-y-2 pr-1">
            {filtered.map(e => (
              <div
                key={e.id}
                onClick={() => setSelected(e)}
                className={`cursor-pointer bg-stone-900 border rounded-lg px-4 py-3 transition-all ${selected?.id === e.id ? 'border-amber-500' : 'border-stone-800 hover:border-stone-600'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-medium text-stone-100 truncate">{e.fullName || '(unnamed)'}</span>
                    <span className="text-stone-500 text-xs ml-2">{e.respondentType}</span>
                    {e.bookWorthy && <span className="ml-1.5 text-xs bg-amber-900 text-amber-300 rounded px-1 py-0.5">Book</span>}
                  </div>
                  <span className={`text-xs rounded px-1.5 py-0.5 ml-2 flex-shrink-0 ${STATUS_COLORS[e.status] ?? 'bg-stone-700 text-stone-300'}`}>{e.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className={SENTIMENT_COLORS[e.sentiment] ?? 'text-stone-400'}>{e.sentiment}</span>
                  <span className="text-stone-600">→</span>
                  <span className="text-stone-400">{e.nextAction}</span>
                  {e.nextActionDueDate && (
                    <span className={`ml-auto ${isPast(e.nextActionDueDate) ? 'text-red-400' : 'text-stone-500'}`}>
                      Due {e.nextActionDueDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      <div className="w-96 flex-shrink-0 overflow-y-auto">
        {selected ? (
          <DetailPanel entry={selected} onPatch={patch} onDelete={deleteEntry} />
        ) : (
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 text-stone-500 text-sm text-center">
            Select an entry to view details
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ entry, onPatch, onDelete }: { entry: ResponseEntry; onPatch: (id: string, p: Partial<ResponseEntry>) => void; onDelete: (id: string) => void }) {
  const packet = getFollowUpPacket(entry.respondentType);
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{entry.fullName || '(unnamed)'}</h2>
          <div className="text-stone-400 text-sm">{[entry.titleRole, entry.organization].filter(Boolean).join(' · ')}</div>
          <div className="text-stone-500 text-xs mt-0.5">{entry.respondentType}</div>
        </div>
        <button onClick={() => onDelete(entry.id)} className="text-stone-600 hover:text-red-400 text-xs transition-colors">Delete</button>
      </div>

      {entry.contactEmail && <a href={`mailto:${entry.contactEmail}`} className="text-amber-400 text-sm hover:underline block">{entry.contactEmail}</a>}

      {/* Quick actions */}
      <div className="space-y-2">
        <p className="text-stone-500 text-xs uppercase tracking-wider">Quick Actions</p>
        <div className="flex gap-2 flex-wrap">
          <QuickBtn label="Assign → Dr. Chinyelu" onClick={() => onPatch(entry.id, { assignedTo: 'Dr. Chinyelu', status: 'In progress' })} />
          <QuickBtn label="Assign → Yakini" onClick={() => onPatch(entry.id, { assignedTo: 'Yakini', status: 'In progress' })} />
          <QuickBtn label="Mark Complete" onClick={() => onPatch(entry.id, { status: 'Complete' })} accent />
        </div>
        {entry.contactEmail && (
          <a
            href={`mailto:${entry.contactEmail}?subject=Follow-up: The Manhattan Project 2&body=Dear ${entry.fullName},%0D%0A%0D%0AThank you for your response. Here is your follow-up packet:%0D%0A${encodeURIComponent(packet)}`}
            className="block text-center text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded px-3 py-1.5 transition-colors"
          >
            Draft follow-up email →
          </a>
        )}
      </div>

      <EditableFields entry={entry} onPatch={onPatch} />

      {/* Response content */}
      {entry.responseSummary && <InfoBlock label="Summary" text={entry.responseSummary} />}
      {entry.verbatimQuote && <InfoBlock label="Verbatim Quote" text={`"${entry.verbatimQuote}"`} highlight />}
      {entry.keyQuestion && <InfoBlock label="Key Question" text={entry.keyQuestion} />}
      {entry.notes && <InfoBlock label="Notes" text={entry.notes} />}

      <div className="text-stone-600 text-xs pt-2 border-t border-stone-800">
        Logged {new Date(entry.createdAt).toLocaleString()} · {entry.channelOfResponse}
      </div>
    </div>
  );
}

function EditableFields({ entry, onPatch }: { entry: ResponseEntry; onPatch: (id: string, p: Partial<ResponseEntry>) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-stone-500 text-xs uppercase tracking-wider">Status &amp; Routing</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-stone-500 text-xs">Status</label>
          <select value={entry.status} onChange={e => onPatch(entry.id, { status: e.target.value as Status })} className={editCls}>
            {(['New', 'In progress', 'Complete', 'Declined', 'Holding'] as Status[]).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-stone-500 text-xs">Assigned To</label>
          <select value={entry.assignedTo} onChange={e => onPatch(entry.id, { assignedTo: e.target.value as AssignedTo })} className={editCls}>
            {(['Dr. Chinyelu', 'Yakini', 'Jabari', 'Other'] as AssignedTo[]).map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-stone-500 text-xs">Next Action</label>
        <select value={entry.nextAction} onChange={e => onPatch(entry.id, { nextAction: e.target.value as NextAction })} className={editCls}>
          {(['Schedule call – Dr. Chinyelu', 'Schedule call – Yakini', 'Send follow-up packet', 'Log objection – holding', 'Flag for book review', 'No action needed'] as NextAction[]).map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className="text-stone-500 text-xs">Due Date</label>
        <input type="date" value={entry.nextActionDueDate || ''} onChange={e => onPatch(entry.id, { nextActionDueDate: e.target.value })} className={editCls} />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer">
          <input type="checkbox" checked={entry.followUpPacketSent} onChange={e => onPatch(entry.id, { followUpPacketSent: e.target.checked })} className="accent-amber-400" />
          Packet sent
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer">
          <input type="checkbox" checked={entry.meetingScheduled} onChange={e => onPatch(entry.id, { meetingScheduled: e.target.checked })} className="accent-amber-400" />
          Meeting scheduled
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer">
          <input type="checkbox" checked={entry.bookWorthy} onChange={e => onPatch(entry.id, { bookWorthy: e.target.checked })} className="accent-amber-400" />
          Book-worthy
        </label>
      </div>
    </div>
  );
}

function QuickBtn({ label, onClick, accent }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} className={`text-xs px-2.5 py-1.5 rounded transition-colors ${accent ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200' : 'bg-stone-800 hover:bg-stone-700 text-stone-300'}`}>
      {label}
    </button>
  );
}

function InfoBlock({ label, text, highlight }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'text-amber-300 italic' : 'text-stone-300'}`}>{text}</p>
    </div>
  );
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date();
}

const filterCls = 'bg-stone-800 border border-stone-700 text-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500';
const editCls = 'w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500 mt-0.5';
