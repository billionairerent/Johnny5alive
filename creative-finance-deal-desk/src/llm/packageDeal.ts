import { SellerLead } from "../types/seller";
import { BuyerLead } from "../types/buyer";
import { CloserPacket } from "../types/closerPacket";
import { renderPrompt, loadPrompt } from "../lib/promptLoader";
import { validate } from "../lib/schemaValidator";
import { getLLMClient, extractJson, StubLLMClient } from "./client";
import { logger } from "../lib/logger";
import { nowIso } from "../lib/dateUtils";
import { generateId, safeString } from "../lib/textUtils";

/**
 * Build a closer-ready packet from a seller and buyer.
 */
export async function packageDeal(
  seller: SellerLead,
  buyer: BuyerLead
): Promise<CloserPacket> {
  const client = getLLMClient();
  if (!(client instanceof StubLLMClient)) {
    try {
      const system = loadPrompt("core_system_prompt");
      const user = renderPrompt("package_deal", {
        sellerLead: seller,
        buyerLead: buyer,
      });
      const res = await client.complete({ system, user, json: true });
      const parsed = extractJson(res.text) as Partial<CloserPacket>;
      const candidate: CloserPacket = {
        packetId: safeString(parsed.packetId, generateId("packet")),
        createdAt: safeString(parsed.createdAt, nowIso()),
        propertySnapshot: safeString(parsed.propertySnapshot, defaultPropertySnapshot(seller)),
        sellerSnapshot: safeString(parsed.sellerSnapshot, defaultSellerSnapshot(seller)),
        buyerSnapshot: safeString(parsed.buyerSnapshot, defaultBuyerSnapshot(buyer)),
        knownNumbers: parsed.knownNumbers ?? defaultKnownNumbers(seller, buyer),
        missingNumbers: parsed.missingNumbers ?? defaultMissingNumbers(seller, buyer),
        opportunitySummary: safeString(
          parsed.opportunitySummary,
          "Seller and buyer show alignment on area and timeline. Review for fit."
        ),
        riskFlags: parsed.riskFlags ?? [],
        recommendedNextMove: safeString(
          parsed.recommendedNextMove,
          "Hand to closer for fit confirmation and structure discussion."
        ),
      };
      const { valid, errors } = validate("closerPacket", candidate);
      if (valid) return candidate;
      logger.warn("packageDeal LLM output failed schema; falling back", { errors });
    } catch (err) {
      logger.warn("packageDeal LLM call failed; falling back", {
        error: (err as Error).message,
      });
    }
  }

  return fallbackPacket(seller, buyer);
}

export function fallbackPacket(seller: SellerLead, buyer: BuyerLead): CloserPacket {
  return {
    packetId: generateId("packet"),
    createdAt: nowIso(),
    propertySnapshot: defaultPropertySnapshot(seller),
    sellerSnapshot: defaultSellerSnapshot(seller),
    buyerSnapshot: defaultBuyerSnapshot(buyer),
    knownNumbers: defaultKnownNumbers(seller, buyer),
    missingNumbers: defaultMissingNumbers(seller, buyer),
    opportunitySummary:
      "Seller and buyer appear aligned on area and timeline. Numbers need closer review before terms discussion.",
    riskFlags: [],
    recommendedNextMove: "Hand to closer for fit confirmation and structure discussion.",
  };
}

function defaultPropertySnapshot(seller: SellerLead): string {
  const parts = [
    seller.propertyAddress,
    seller.occupancy ? `(${seller.occupancy})` : null,
    seller.condition ? `Condition: ${seller.condition}` : null,
  ].filter(Boolean);
  return parts.join(" ").trim();
}

function defaultSellerSnapshot(seller: SellerLead): string {
  return [
    `${seller.name} — ${seller.phone}`,
    `Asking ${seller.askingPrice}`,
    seller.mortgageBalance ? `Mortgage balance ${seller.mortgageBalance}` : null,
    seller.monthlyPayment ? `Payment ${seller.monthlyPayment}` : null,
    `Timeline: ${seller.timeline}`,
    `Flex terms: ${seller.flexibleTermsInterest}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function defaultBuyerSnapshot(buyer: BuyerLead): string {
  return [
    `${buyer.name} — ${buyer.phone}`,
    `Target ${buyer.targetArea}`,
    `Budget ${buyer.budget}`,
    `Down ${buyer.downPayment}`,
    buyer.monthlyIncome ? `Income ${buyer.monthlyIncome}` : null,
    `Timeline: ${buyer.timeline}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function defaultKnownNumbers(
  seller: SellerLead,
  buyer: BuyerLead
): Record<string, unknown> {
  return {
    askingPrice: seller.askingPrice,
    mortgageBalance: seller.mortgageBalance ?? null,
    monthlyPayment: seller.monthlyPayment ?? null,
    buyerBudget: buyer.budget,
    buyerDownPayment: buyer.downPayment,
    buyerMonthlyIncome: buyer.monthlyIncome ?? null,
  };
}

function defaultMissingNumbers(seller: SellerLead, buyer: BuyerLead): string[] {
  const missing: string[] = [];
  if (!seller.mortgageBalance) missing.push("seller mortgage balance");
  if (!seller.monthlyPayment) missing.push("seller monthly payment");
  if (!buyer.monthlyIncome) missing.push("buyer monthly income");
  return missing;
}
