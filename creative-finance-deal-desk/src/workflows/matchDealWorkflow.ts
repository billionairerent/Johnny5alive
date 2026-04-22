import { SellerLead } from "../types/seller";
import { BuyerLead } from "../types/buyer";
import { DealMatch } from "../types/dealMatch";
import { createDealMatch } from "../adapters/airtableAdapter";
import { packageDeal } from "../llm/packageDeal";
import { generateId, safeString } from "../lib/textUtils";
import { config } from "../config";
import { logger } from "../lib/logger";
import { handoffCloserWorkflow } from "./handoffCloserWorkflow";

export interface MatchDealResult {
  success: boolean;
  workflow: "matchDealWorkflow";
  match?: DealMatch;
  packetSaved?: boolean;
  error?: string;
}

/**
 * Compare a seller and buyer, score fit, and if strong enough, package the
 * deal into a closer packet and notify the closer.
 */
export async function matchDealWorkflow(
  seller: SellerLead,
  buyer: BuyerLead
): Promise<MatchDealResult> {
  try {
    const match = scoreFit(seller, buyer);
    await createDealMatch(match);

    let packetSaved = false;
    if (match.fitScore >= config.thresholds.matchFitScore) {
      const handoff = await handoffCloserWorkflow(seller, buyer);
      packetSaved = handoff.success;
    }

    return { success: true, workflow: "matchDealWorkflow", match, packetSaved };
  } catch (err) {
    logger.error("matchDealWorkflow error", { error: (err as Error).message });
    return {
      success: false,
      workflow: "matchDealWorkflow",
      error: (err as Error).message,
    };
  }
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function scoreFit(seller: SellerLead, buyer: BuyerLead): DealMatch {
  const reasons: string[] = [];
  const missing: string[] = [];
  const risks: string[] = [];
  let fit = 0;

  // geography: naive substring check in both directions
  const sellerArea = safeString(seller.propertyAddress).toLowerCase();
  const buyerArea = safeString(buyer.targetArea).toLowerCase();
  if (sellerArea && buyerArea) {
    const buyerTerms = buyerArea.split(/[\s,]+/).filter((t) => t.length >= 3);
    const matched = buyerTerms.some((t) => sellerArea.includes(t));
    if (matched) {
      fit += 3;
      reasons.push("geography overlap");
    } else {
      risks.push("geography mismatch");
    }
  } else {
    missing.push("geography data");
  }

  // price alignment
  const ask = asNumber(seller.askingPrice);
  const budget = asNumber(buyer.budget);
  if (ask !== null && budget !== null) {
    const delta = Math.abs(ask - budget) / Math.max(ask, 1);
    if (delta <= 0.1) {
      fit += 3;
      reasons.push("budget within 10% of asking");
    } else if (delta <= 0.2) {
      fit += 2;
      reasons.push("budget within 20% of asking");
    } else if (delta <= 0.35) {
      fit += 1;
      reasons.push("budget in range");
    } else {
      risks.push("price gap > 35%");
    }
  } else {
    missing.push("price / budget");
  }

  // timeline
  const sellerTimeline = safeString(seller.timeline).toLowerCase();
  const buyerTimeline = safeString(buyer.timeline).toLowerCase();
  if (sellerTimeline && buyerTimeline) {
    const urgencyMatch =
      /asap|immediately|30|month/.test(sellerTimeline) &&
      /asap|immediately|30|month/.test(buyerTimeline);
    if (urgencyMatch) {
      fit += 2;
      reasons.push("timelines aligned (urgent)");
    } else {
      fit += 1;
      reasons.push("timelines present");
    }
  } else {
    missing.push("timeline data");
  }

  // flexibility
  const sellerFlex = safeString(seller.flexibleTermsInterest).toLowerCase();
  if (/yes|open|willing/.test(sellerFlex)) {
    fit += 2;
    reasons.push("seller open to flexible terms");
  }

  const dp = asNumber(buyer.downPayment);
  if (dp !== null && dp > 0) {
    fit += 1;
    reasons.push(`buyer has down payment`);
  } else {
    missing.push("buyer down payment");
  }

  const matchStatus =
    fit >= 9 ? "Strong" : fit >= 6 ? "Workable" : fit >= 3 ? "Weak" : "No fit";

  return {
    matchId: generateId("match"),
    sellerLeadId: seller.leadId,
    buyerLeadId: buyer.leadId,
    propertyAddress: seller.propertyAddress,
    fitScore: Math.min(10, fit),
    matchStatus,
    reasonsForFit: reasons,
    missingInformation: missing,
    riskFlags: risks,
    recommendedNextStep:
      fit >= config.thresholds.matchFitScore
        ? "Package for closer review"
        : "Gather missing data and re-evaluate",
    closerSummary: `${seller.propertyAddress} for ${buyer.name} — fit ${fit}/10 (${matchStatus})`,
  };
}

// re-export for convenience in tests
export const __private = { scoreFit, packageDeal };
