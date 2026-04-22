/**
 * Text + normalization helpers.
 *
 * The normalization map handles the most common messy field names coming in
 * from webhooks and form providers. Extend as new sources are added.
 */

const SELLER_FIELD_MAP: Record<string, string> = {
  address: "propertyAddress",
  property: "propertyAddress",
  property_address: "propertyAddress",
  propertyaddress: "propertyAddress",
  price: "askingPrice",
  ask: "askingPrice",
  asking_price: "askingPrice",
  askingprice: "askingPrice",
  mortgage: "mortgageBalance",
  mortgage_balance: "mortgageBalance",
  balance: "mortgageBalance",
  payment: "monthlyPayment",
  monthly_payment: "monthlyPayment",
  occupancy_status: "occupancy",
  occupied: "occupancy",
  property_condition: "condition",
  when_selling: "timeline",
  sell_timeline: "timeline",
  flexible: "flexibleTermsInterest",
  flexible_terms: "flexibleTermsInterest",
  terms: "flexibleTermsInterest",
  source: "leadSource",
  lead_source: "leadSource",
  agent: "assignedAgent",
  assigned_agent: "assignedAgent",
  full_name: "name",
  fullname: "name",
  phone_number: "phone",
  email_address: "email",
  note: "notes",
  comments: "notes",
};

const BUYER_FIELD_MAP: Record<string, string> = {
  area: "targetArea",
  target_area: "targetArea",
  location: "targetArea",
  budget_range: "budget",
  price_range: "budget",
  dp: "downPayment",
  down: "downPayment",
  down_payment: "downPayment",
  downpayment: "downPayment",
  income: "monthlyIncome",
  monthly_income: "monthlyIncome",
  income_range: "monthlyIncome",
  credit: "creditSituation",
  credit_situation: "creditSituation",
  self_employed: "selfEmployed",
  selfemployed: "selfEmployed",
  when_moving: "timeline",
  move_timeline: "timeline",
  source: "leadSource",
  lead_source: "leadSource",
  agent: "assignedAgent",
  full_name: "name",
  fullname: "name",
  phone_number: "phone",
  email_address: "email",
  note: "notes",
  comments: "notes",
};

function lowerKey(k: string): string {
  return k.toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeWithMap(
  input: Record<string, unknown>,
  map: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const norm = lowerKey(key);
    const target = map[norm] ?? key;
    out[target] = value;
  }
  return out;
}

export function normalizeSellerPayload(
  raw: Record<string, unknown>
): Record<string, unknown> {
  return normalizeWithMap(raw, SELLER_FIELD_MAP);
}

export function normalizeBuyerPayload(
  raw: Record<string, unknown>
): Record<string, unknown> {
  return normalizeWithMap(raw, BUYER_FIELD_MAP);
}

export function safeString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + "…";
}

export function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${rand}`;
}
