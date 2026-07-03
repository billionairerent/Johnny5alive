import { NextRequest, NextResponse } from 'next/server';
import { createEntry, readAll } from '@/lib/db';

export async function GET() {
  const entries = readAll();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = createEntry(body);
  return NextResponse.json(entry, { status: 201 });
}
