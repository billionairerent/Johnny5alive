import { SellerLead } from "../types/seller";
import { BuyerLead } from "../types/buyer";
import { DealMatch } from "../types/dealMatch";
import { FollowupTask } from "../types/followupTask";
import { logger } from "../lib/logger";
import { isPast } from "../lib/dateUtils";

/**
 * Airtable adapter with a pluggable transport.
 *
 * For local / test environments this uses an in-memory store. In production,
 * call `setAirtableTransport(...)` with an implementation that talks to the
 * Airtable REST API (or the `airtable` npm package).
 *
 * Keeping this thin keeps the surface area testable and avoids locking the
 * project to a single Airtable client.
 */

export interface AirtableTransport {
  createRecord(table: string, fields: Record<string, unknown>): Promise<string>;
  updateRecord(table: string, id: string, fields: Record<string, unknown>): Promise<void>;
  listRecords(table: string): Promise<Array<{ id: string; fields: Record<string, unknown> }>>;
}

class InMemoryTransport implements AirtableTransport {
  private tables: Record<string, Map<string, Record<string, unknown>>> = {};
  private counters: Record<string, number> = {};

  private table(name: string): Map<string, Record<string, unknown>> {
    if (!this.tables[name]) this.tables[name] = new Map();
    return this.tables[name];
  }

  async createRecord(table: string, fields: Record<string, unknown>): Promise<string> {
    const idField = fields.leadId ?? fields.matchId ?? fields.taskId;
    const id = typeof idField === "string"
      ? idField
      : `rec_${table}_${(this.counters[table] = (this.counters[table] ?? 0) + 1)}`;
    this.table(table).set(id, { ...fields });
    return id;
  }

  async updateRecord(
    table: string,
    id: string,
    fields: Record<string, unknown>
  ): Promise<void> {
    const t = this.table(table);
    const existing = t.get(id) ?? {};
    t.set(id, { ...existing, ...fields });
  }

  async listRecords(
    table: string
  ): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
    const t = this.table(table);
    return Array.from(t.entries()).map(([id, fields]) => ({ id, fields }));
  }
}

let transport: AirtableTransport = new InMemoryTransport();

export function setAirtableTransport(t: AirtableTransport): void {
  transport = t;
}

export function getAirtableTransport(): AirtableTransport {
  return transport;
}

function sellersTable() {
  return process.env.AIRTABLE_SELLERS_TABLE || "Sellers";
}
function buyersTable() {
  return process.env.AIRTABLE_BUYERS_TABLE || "Buyers";
}
function matchesTable() {
  return process.env.AIRTABLE_MATCHES_TABLE || "Matches";
}
function tasksTable() {
  return process.env.AIRTABLE_TASKS_TABLE || "Tasks";
}

export async function createSellerLead(lead: SellerLead): Promise<string> {
  logger.info("airtable.createSellerLead", { leadId: lead.leadId });
  return transport.createRecord(sellersTable(), lead as unknown as Record<string, unknown>);
}

export async function updateSellerLead(
  id: string,
  patch: Partial<SellerLead> & Record<string, unknown>
): Promise<void> {
  logger.info("airtable.updateSellerLead", { id });
  await transport.updateRecord(sellersTable(), id, patch);
}

export async function createBuyerLead(lead: BuyerLead): Promise<string> {
  logger.info("airtable.createBuyerLead", { leadId: lead.leadId });
  return transport.createRecord(buyersTable(), lead as unknown as Record<string, unknown>);
}

export async function updateBuyerLead(
  id: string,
  patch: Partial<BuyerLead> & Record<string, unknown>
): Promise<void> {
  logger.info("airtable.updateBuyerLead", { id });
  await transport.updateRecord(buyersTable(), id, patch);
}

export async function createDealMatch(match: DealMatch): Promise<string> {
  logger.info("airtable.createDealMatch", { matchId: match.matchId });
  return transport.createRecord(matchesTable(), match as unknown as Record<string, unknown>);
}

export async function createFollowupTask(task: FollowupTask): Promise<string> {
  logger.info("airtable.createFollowupTask", { taskId: task.taskId });
  return transport.createRecord(tasksTable(), task as unknown as Record<string, unknown>);
}

export async function findLeadsDueForFollowup(): Promise<FollowupTask[]> {
  const rows = await transport.listRecords(tasksTable());
  return rows
    .map((r) => r.fields as unknown as FollowupTask)
    .filter((t) => t && t.status !== "completed" && isPast(t.dueAt));
}

export async function getSellerById(leadId: string): Promise<SellerLead | null> {
  const rows = await transport.listRecords(sellersTable());
  const match = rows.find((r) => (r.fields as unknown as SellerLead).leadId === leadId);
  return match ? (match.fields as unknown as SellerLead) : null;
}

export async function getBuyerById(leadId: string): Promise<BuyerLead | null> {
  const rows = await transport.listRecords(buyersTable());
  const match = rows.find((r) => (r.fields as unknown as BuyerLead).leadId === leadId);
  return match ? (match.fields as unknown as BuyerLead) : null;
}
