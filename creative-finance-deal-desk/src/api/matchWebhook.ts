import {
  getSellerById,
  getBuyerById,
} from "../adapters/airtableAdapter";
import { matchDealWorkflow, MatchDealResult } from "../workflows/matchDealWorkflow";

/**
 * Webhook handler to trigger a seller/buyer match.
 * Expects `{ sellerLeadId, buyerLeadId }` in the body.
 */
export async function matchWebhook(body: unknown): Promise<MatchDealResult> {
  const data =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const sellerLeadId = typeof data.sellerLeadId === "string" ? data.sellerLeadId : "";
  const buyerLeadId = typeof data.buyerLeadId === "string" ? data.buyerLeadId : "";

  if (!sellerLeadId || !buyerLeadId) {
    return {
      success: false,
      workflow: "matchDealWorkflow",
      error: "sellerLeadId and buyerLeadId are required",
    };
  }

  const seller = await getSellerById(sellerLeadId);
  const buyer = await getBuyerById(buyerLeadId);
  if (!seller || !buyer) {
    return {
      success: false,
      workflow: "matchDealWorkflow",
      error: "Seller or buyer not found",
    };
  }

  return matchDealWorkflow(seller, buyer);
}
