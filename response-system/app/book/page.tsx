'use client';

import { useEffect, useState } from 'react';
import { ResponseEntry, DiaryDay } from '@/lib/types';

const DIARY_DAYS: (DiaryDay | '')[] = ['', 'Day 4 – June 26', 'Day 5 – June 27', 'Day 9 – July 1'];

const DAY_DESCRIPTIONS: Record<string, string> = {
  'Day 4 – June 26': 'What went out. Who received it. The architecture of the ask.',
  'Day 5 – June 27': 'What came back. What didn\'t. What silence means. Verbatim quotes.',
  'Day 9 – July 1': 'Ferguson named them. The Aquarian Conspirators. What they said. Who showed up.',
};

export default function BookExportPage() {
  const [entries, setEntries] = useState<ResponseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDay, setFilterDay] = useState<DiaryDay | ''>('');
  const [preview, setPreview] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetch('/api/responses').then(r => r.json()).then((d: ResponseEntry[]) => {
      setEntries(d);
      setLoading(false);
    });
  }, []);

  const bookEntries = entries.filter(e => e.bookWorthy);
  const filtered = filterDay ? bookEntries.filter(e => e.diaryDayTarget === filterDay) : bookEntries;

  const byDay = DIARY_DAYS.filter(d => d !== '').reduce((acc: Record<string, number>, d) => {
    acc[d] = bookEntries.filter(e => e.diaryDayTarget === d).length;
    return acc;
  }, {});
  const unassigned = bookEntries.filter(e => !e.diaryDayTarget).length;

  const downloadExport = async (day: DiaryDay | '') => {
    const url = `/api/export${day ? `?day=${encodeURIComponent(day)}` : ''}`;
    const res = await fetch(url);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = day ? `diary-${day.replace(/[^a-z0-9]/gi, '-')}.txt` : 'diary-all.txt';
    a.click();
  };

  const loadPreview = async () => {
    setPreviewLoading(true);
    const url = `/api/export${filterDay ? `?day=${encodeURIComponent(filterDay)}` : ''}`;
    const res = await fetch(url);
    const text = await res.text();
    setPreview(text);
    setPreviewLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Book Content Export</h1>
        <p className="text-stone-400 text-sm mt-1">The Eleven-Day Diary · June 23 – July 3, 2026</p>
      </div>

      {/* Day cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {(DIARY_DAYS.filter(d => d !== '') as DiaryDay[]).map(d => (
          <div key={d} className="bg-stone-900 border border-stone-800 rounded-lg p-4">
            <div className="text-amber-400 font-bold text-sm">{d}</div>
            <div className="text-stone-500 text-xs mt-1 mb-3">{DAY_DESCRIPTIONS[d]}</div>
            <div className="flex items-center justify-between">
              <span className="text-white text-2xl font-bold">{byDay[d] ?? 0}</span>
              <span className="text-stone-500 text-xs">entries flagged</span>
            </div>
            <button
              onClick={() => downloadExport(d)}
              className="mt-3 w-full text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded px-3 py-1.5 transition-colors"
            >
              Export Day {d.split(' ')[1]} →
            </button>
          </div>
        ))}
      </div>

      {/* Filter + preview */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-stone-200 font-semibold">Preview / Export</h2>
            <select value={filterDay} onChange={e => { setFilterDay(e.target.value as DiaryDay | ''); setPreview(''); }} className="bg-stone-800 border border-stone-700 text-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500">
              <option value="">All book-worthy entries ({bookEntries.length})</option>
              {(DIARY_DAYS.filter(d => d !== '') as DiaryDay[]).map(d => (
                <option key={d} value={d}>{d} ({byDay[d] ?? 0})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={loadPreview} disabled={previewLoading} className="text-xs bg-stone-700 hover:bg-stone-600 text-stone-200 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
              {previewLoading ? 'Loading…' : 'Preview'}
            </button>
            <button onClick={() => downloadExport(filterDay)} className="text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-3 py-1.5 rounded transition-colors">
              Download .txt
            </button>
          </div>
        </div>

        {preview ? (
          <pre className="bg-stone-950 border border-stone-700 rounded p-4 text-xs text-stone-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
            {preview}
          </pre>
        ) : (
          <div className="text-stone-600 text-sm text-center py-8">
            Click Preview to see the formatted export
          </div>
        )}
      </div>

      {/* Entry list */}
      {loading ? (
        <div className="text-stone-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-stone-500 text-sm border border-stone-800 rounded-lg p-6 text-center">
          No book-worthy entries{filterDay ? ` for ${filterDay}` : ''} yet.
          {unassigned > 0 && !filterDay && (
            <div className="mt-1 text-amber-400">{unassigned} entries flagged but not assigned to a diary day.</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-stone-300 font-medium">
            {filtered.length} {filterDay ? filterDay : 'book-worthy'} {filtered.length === 1 ? 'entry' : 'entries'}
          </h2>
          {filtered.map(e => (
            <div key={e.id} className="bg-stone-900 border border-stone-800 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-medium text-stone-100">{e.fullName}</span>
                  {e.titleRole && <span className="text-stone-500 text-sm ml-2">{e.titleRole}</span>}
                  {e.organization && <span className="text-stone-600 text-xs ml-1">· {e.organization}</span>}
                  {e.diaryDayTarget && (
                    <span className="ml-2 text-xs bg-amber-900 text-amber-300 rounded px-1.5 py-0.5">{e.diaryDayTarget}</span>
                  )}
                </div>
                <span className="text-stone-500 text-xs flex-shrink-0">{e.dateResponded || e.createdAt.slice(0, 10)}</span>
              </div>
              {e.verbatimQuote && (
                <p className="text-amber-300 text-sm italic mt-2">"{e.verbatimQuote}"</p>
              )}
              {e.responseSummary && (
                <p className="text-stone-400 text-xs mt-1">{e.responseSummary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
