import { validate } from "../src/lib/schemaValidator";

describe("schemaValidator", () => {
  test("rejects seller lead missing required fields", () => {
    const result = validate("sellerLead", { leadId: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("accepts a complete seller lead", () => {
    const result = validate("sellerLead", {
      leadId: "seller_1",
      createdAt: "2026-04-14T00:00:00Z",
      name: "Jane Doe",
      phone: "555-1234",
      propertyAddress: "123 Main St",
      askingPrice: 250000,
      timeline: "30 days",
      flexibleTermsInterest: "yes",
      notes: "open to flexible terms",
    });
    expect(result.valid).toBe(true);
  });

  test("accepts a complete buyer lead", () => {
    const result = validate("buyerLead", {
      leadId: "buyer_1",
      createdAt: "2026-04-14T00:00:00Z",
      name: "John Smith",
      phone: "555-6789",
      targetArea: "Austin TX",
      budget: 300000,
      downPayment: 30000,
      timeline: "60 days",
      notes: "self-employed",
    });
    expect(result.valid).toBe(true);
  });

  test("accepts a scored lead", () => {
    const result = validate("scoredLead", {
      leadId: "x",
      leadType: "seller",
      status: "Warm",
      score: 7,
      knownFacts: ["a"],
      missingFacts: [],
      riskFlags: [],
      nextAction: "call",
      followupWindow: "24h",
      suggestedScript: "hi",
      escalation: "NONE",
    });
    expect(result.valid).toBe(true);
  });

  test("accepts a closer packet with minimal shape", () => {
    const result = validate("closerPacket", {
      packetId: "p1",
      createdAt: "2026-04-14T00:00:00Z",
      propertySnapshot: "addr",
      sellerSnapshot: "s",
      buyerSnapshot: "b",
      knownNumbers: { askingPrice: 250000 },
      missingNumbers: [],
      opportunitySummary: "looks aligned",
      riskFlags: [],
      recommendedNextMove: "hand to closer",
    });
    expect(result.valid).toBe(true);
  });
});
