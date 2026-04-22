import { matchDealWorkflow } from "../src/workflows/matchDealWorkflow";
import { SellerLead } from "../src/types/seller";
import { BuyerLead } from "../src/types/buyer";

const seller: SellerLead = {
  leadId: "seller_test_1",
  createdAt: "2026-04-14T00:00:00Z",
  name: "Jane Seller",
  phone: "555-1000",
  propertyAddress: "100 Main St, Austin TX",
  askingPrice: 250000,
  mortgageBalance: 120000,
  monthlyPayment: 1400,
  occupancy: "vacant",
  timeline: "30 days",
  flexibleTermsInterest: "yes",
  notes: "motivated",
};

const buyerGoodFit: BuyerLead = {
  leadId: "buyer_test_1",
  createdAt: "2026-04-14T00:00:00Z",
  name: "John Buyer",
  phone: "555-2000",
  targetArea: "Austin TX",
  budget: 260000,
  downPayment: 40000,
  monthlyIncome: 8000,
  timeline: "30 days",
  notes: "ready",
};

const buyerBadFit: BuyerLead = {
  leadId: "buyer_test_2",
  createdAt: "2026-04-14T00:00:00Z",
  name: "Mismatch Buyer",
  phone: "555-3000",
  targetArea: "Seattle WA",
  budget: 50000,
  downPayment: 0,
  timeline: "no rush",
  notes: "just browsing",
};

describe("matchDealWorkflow", () => {
  test("produces a strong match for aligned seller/buyer", async () => {
    const result = await matchDealWorkflow(seller, buyerGoodFit);
    expect(result.success).toBe(true);
    expect(result.match).toBeDefined();
    expect(result.match!.fitScore).toBeGreaterThanOrEqual(6);
    expect(["Strong", "Workable"]).toContain(result.match!.matchStatus);
  });

  test("produces a weak or no-fit match for misaligned pair", async () => {
    const result = await matchDealWorkflow(seller, buyerBadFit);
    expect(result.success).toBe(true);
    expect(result.match).toBeDefined();
    expect(result.match!.fitScore).toBeLessThanOrEqual(5);
  });

  test("match has required fields", async () => {
    const result = await matchDealWorkflow(seller, buyerGoodFit);
    const m = result.match!;
    expect(m.matchId).toBeTruthy();
    expect(m.sellerLeadId).toBe("seller_test_1");
    expect(m.buyerLeadId).toBe("buyer_test_1");
    expect(m.propertyAddress).toBe("100 Main St, Austin TX");
    expect(m.reasonsForFit.length).toBeGreaterThan(0);
  });
});
