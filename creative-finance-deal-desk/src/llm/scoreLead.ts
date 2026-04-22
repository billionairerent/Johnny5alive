import { SellerLead } from "../types/seller";
import { BuyerLead } from "../types/buyer";
import { ScoredLead } from "../types/scoredLead";
import { classifySeller } from "./classifySeller";
import { classifyBuyer } from "./classifyBuyer";

/**
 * Re-score a lead. Delegates to the seller/buyer classifier.
 */
export async function scoreLead(
  leadType: "seller" | "buyer",
  lead: SellerLead | BuyerLead
): Promise<ScoredLead> {
  if (leadType === "seller") {
    return classifySeller(lead as SellerLead);
  }
  return classifyBuyer(lead as BuyerLead);
}
