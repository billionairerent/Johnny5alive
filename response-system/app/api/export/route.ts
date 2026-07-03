import { NextRequest, NextResponse } from 'next/server';
import { readAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get('day');

  let entries = readAll().filter(e => e.bookWorthy);
  if (day) entries = entries.filter(e => e.diaryDayTarget === day);

  const lines: string[] = [
    'THE MANHATTAN PROJECT 2 — ELEVEN-DAY DIARY',
    day ? `Content Queue: ${day}` : 'All Book-Worthy Responses',
    `Exported: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT`,
    '',
    '═'.repeat(72),
    '',
  ];

  entries.forEach((e, i) => {
    lines.push(`[${i + 1}] ${e.fullName}`);
    if (e.titleRole || e.organization) lines.push(`     ${[e.titleRole, e.organization].filter(Boolean).join(' · ')}`);
    lines.push(`     ${e.channelOfResponse} · ${e.dateResponded || e.createdAt.slice(0, 10)}`);
    if (e.diaryDayTarget) lines.push(`     Target: ${e.diaryDayTarget}`);
    lines.push('');
    if (e.verbatimQuote) {
      lines.push(`     "${e.verbatimQuote}"`);
      lines.push('');
    }
    if (e.responseSummary) {
      lines.push(`     Summary: ${e.responseSummary}`);
      lines.push('');
    }
    if (e.keyQuestion) lines.push(`     Question raised: ${e.keyQuestion}`);
    if (e.notes) lines.push(`     Notes: ${e.notes}`);
    lines.push('─'.repeat(72));
    lines.push('');
  });

  if (entries.length === 0) lines.push('No book-worthy entries found for this filter.');

  const text = lines.join('\n');
  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="diary-export-${day ? day.replace(/[^a-z0-9]/gi, '-') : 'all'}.txt"`,
    },
  });
}
