import fs from 'fs';
import path from 'path';
import { ResponseEntry } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'responses.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

export function readAll(): ResponseEntry[] {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as ResponseEntry[];
}

export function writeAll(entries: ResponseEntry[]) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(entries, null, 2));
}

export function createEntry(entry: Omit<ResponseEntry, 'id' | 'createdAt'>): ResponseEntry {
  const entries = readAll();
  const newEntry: ResponseEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
  };
  entries.push(newEntry);
  writeAll(entries);
  return newEntry;
}

export function updateEntry(id: string, patch: Partial<ResponseEntry>): ResponseEntry | null {
  const entries = readAll();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...patch };
  writeAll(entries);
  return entries[idx];
}

export function deleteEntry(id: string): boolean {
  const entries = readAll();
  const next = entries.filter(e => e.id !== id);
  if (next.length === entries.length) return false;
  writeAll(next);
  return true;
}
