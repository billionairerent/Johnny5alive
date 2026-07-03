'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ResponseEntry } from '@/lib/types';

const SENTIMENT_COLORS: Record<string, string> = {
  Enthusiastic: 'text-emerald-400',
  Interested: 'text-sky-400',
  Cautious: 'text-amber-400',
  Skeptical: 'text-orange-400',
  Declined: 'text-red-400',
  'No response': 'text-stone-500',
};

export default function Dashboard() {
  const [entries, setEntries] = useState<ResponseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/responses').then(r => r.json()).then((d: ResponseEntry[]) => {
      setEntries(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-stone-400 py-12 text-center">Loading...</div>;

  const total = entries.length;
  const byType = groupBy(entries, 'respondentType');
  const bySentiment = groupBy(entries, 'sentiment');
  const byChannel = groupBy(entries, 'channelOfResponse');
  const bookFlagged = entries.filter(e => e.bookWorthy).length;
  const needsAction = entries.filter(e => {
    if (e.status === 'Complete' || e.status === 'Declined') return false;
    if (!e.nextActionDueDate) return false;
    return new Date(e.nextActionDueDate) <= new Date(Date.now() + 86400000);
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Response Dashboard</h1>
          <p className="text-stone-400 text-sm mt-1">The Manhattan Project 2 · June 23 – July 3, 2026</p>
        </div>
        <Link href="/intake" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded text-sm transition-colors">
          + Log New Response
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Total Responses" value={total} />
        <Tile label="Book-Flagged" value={bookFlagged} accent="text-amber-400" />
        <Tile label="Action Due ≤24h" value={needsAction} accent={needsAction > 0 ? 'text-red-400' : undefined} />
        <Tile label="Enthusiastic" value={bySentiment['Enthusiastic'] || 0} accent="text-emerald-400" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <BreakdownCard title="By Respondent Type" data={byType} />
        <BreakdownCard title="By Sentiment" data={bySentiment} colors={SENTIMENT_COLORS} />
        <BreakdownCard title="By Channel" data={byChannel} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-stone-200 mb-3">Recent Entries</h2>
        {entries.length === 0 ? (
          <div className="text-stone-500 text-sm border border-stone-800 rounded-lg p-8 text-center">
            No responses yet.{' '}
            <Link href="/intake" className="text-amber-400 hover:underline">Log the first one →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().slice(0, 10).map(e => (
              <div key={e.id} className="flex items-center justify-between bg-stone-900 border border-stone-800 rounded-lg px-4 py-3 hover:border-stone-600 transition-colors">
                <div>
                  <span className="font-medium text-stone-100">{e.fullName || '(unnamed)'}</span>
                  <span className="text-stone-500 text-sm ml-2">{e.respondentType}</span>
                  {e.bookWorthy && (
                    <span className="ml-2 text-xs bg-amber-900 text-amber-300 rounded px-1.5 py-0.5">Book</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={SENTIMENT_COLORS[e.sentiment] || 'text-stone-400'}>{e.sentiment}</span>
                  <StatusBadge status={e.status} />
                  <Link href={`/queue?highlight=${e.id}`} className="text-stone-500 hover:text-white text-xs">View →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupBy(arr: ResponseEntry[], key: keyof ResponseEntry): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, e) => {
    const val = String(e[key] ?? 'Unknown');
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function Tile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <div className={`text-3xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
      <div className="text-stone-400 text-sm mt-1">{label}</div>
    </div>
  );
}

function BreakdownCard({ title, data, colors }: { title: string; data: Record<string, number>; colors?: Record<string, string> }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 className="text-stone-300 font-medium text-sm mb-3">{title}</h3>
      {sorted.length === 0 ? (
        <div className="text-stone-600 text-sm">No data yet</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-sm">
              <span className={colors?.[k] ?? 'text-stone-300'}>{k}</span>
              <span className="text-stone-400 font-mono">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    New: 'bg-blue-900 text-blue-300',
    'In progress': 'bg-purple-900 text-purple-300',
    Complete: 'bg-green-900 text-green-300',
    Declined: 'bg-red-900 text-red-300',
    Holding: 'bg-stone-700 text-stone-300',
  };
  return (
    <span className={`text-xs rounded px-1.5 py-0.5 ${map[status] ?? 'bg-stone-700 text-stone-300'}`}>
      {status}
    </span>
  );
}
