import { SellerLead } from "../types/seller";
import { BuyerLead } from "../types/buyer";
import { CloserPacket } from "../types/closerPacket";
import { packageDeal } from "../llm/packageDeal";
import { saveCloserPacket } from "../adapters/storageAdapter";
import { validate } from "../lib/schemaValidator";
import { logger } from "../lib/logger";
import * as fs from "fs";
import * as path from "path";

export interface HandoffResult {
  success: boolean;
  workflow: "handoffCloserWorkflow";
  packet?: CloserPacket;
  savedPath?: string;
  error?: string;
  details?: string[];
}

/**
 * Produce and persist a closer packet from a matched seller + buyer.
 */
export async function handoffCloserWorkflow(
  seller: SellerLead,
  buyer: BuyerLead
): Promise<HandoffResult> {
  try {
    const packet = await packageDeal(seller, buyer);
    const { valid, errors } = validate("closerPacket", packet);
    if (!valid) {
      return {
        success: false,
        workflow: "handoffCloserWorkflow",
        error: "Closer packet failed validation",
        details: errors,
      };
    }

    const markdown = renderPacketMarkdown(packet);
    const savedPath = await saveCloserPacket(`${packet.packetId}.md`, markdown);

    return {
      success: true,
      workflow: "handoffCloserWorkflow",
      packet,
      savedPath,
    };
  } catch (err) {
    logger.error("handoffCloserWorkflow error", { error: (err as Error).message });
    return {
      success: false,
      workflow: "handoffCloserWorkflow",
      error: (err as Error).message,
    };
  }
}

function renderPacketMarkdown(packet: CloserPacket): string {
  const templatePath = path.resolve(__dirname, "..", "templates", "closerPacket.md");
  const template = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, "utf-8")
    : defaultTemplate();

  const replacements: Record<string, string> = {
    packetId: packet.packetId,
    createdAt: packet.createdAt,
    propertySnapshot: packet.propertySnapshot,
    sellerSnapshot: packet.sellerSnapshot,
    buyerSnapshot: packet.buyerSnapshot,
    knownNumbers: formatKnownNumbers(packet.knownNumbers),
    missingNumbers: packet.missingNumbers.length
      ? packet.missingNumbers.map((m) => `- ${m}`).join("\n")
      : "_None_",
    opportunitySummary: packet.opportunitySummary,
    riskFlags: packet.riskFlags.length
      ? packet.riskFlags.map((r) => `- ${r}`).join("\n")
      : "_None_",
    recommendedNextMove: packet.recommendedNextMove,
  };

  return template.replace(/{{\s*(\w+)\s*}}/g, (_m, key) => replacements[key] ?? "");
}

function formatKnownNumbers(nums: Record<string, unknown>): string {
  return Object.entries(nums)
    .map(([k, v]) => `- **${k}**: ${v ?? "—"}`)
    .join("\n");
}

function defaultTemplate(): string {
  return "# Closer Packet {{packetId}}\n{{opportunitySummary}}\n";
}
