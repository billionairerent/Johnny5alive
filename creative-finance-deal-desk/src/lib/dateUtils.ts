/**
 * Lightweight date helpers. All values returned as ISO-8601 strings.
 */

export function nowIso(): string {
  return new Date().toISOString();
}

export function addDaysIso(daysFromNow: number, base: Date = new Date()): string {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString();
}

export function addHoursIso(hoursFromNow: number, base: Date = new Date()): string {
  const d = new Date(base.getTime());
  d.setUTCHours(d.getUTCHours() + hoursFromNow);
  return d.toISOString();
}

export function isPast(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

export function daysBetween(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
  return Math.round((tb - ta) / (1000 * 60 * 60 * 24));
}
