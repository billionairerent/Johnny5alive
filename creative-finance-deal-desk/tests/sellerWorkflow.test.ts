import { intakeSellerWorkflow } from "../src/workflows/intakeSellerWorkflow";

describe("intakeSellerWorkflow", () => {
  test("accepts minimal payload with coerced defaults", async () => {
    const result = await intakeSellerWorkflow({ name: "Anon" });
    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();
    expect(result.status).toBeDefined();
  });

  test("accepts a normalized payload and returns envelope", async () => {
    const result = await intakeSellerWorkflow({
      name: "Jane Doe",
      phone: "555-1234",
      property_address: "123 Main St, Austin TX",
      asking_price: 250000,
      mortgage_balance: 120000,
      monthly_payment: 1450,
      occupancy: "vacant",
      when_selling: "30 days",
      flexible_terms: "yes",
      note: "owner moved out of state",
    });
    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();
    expect(typeof result.score).toBe("number");
    expect(result.followupCreated).toBe(true);
    expect(result.escalation).toBeDefined();
  });

  test("scores a hot seller lead", async () => {
    const result = await intakeSellerWorkflow({
      name: "Hot Seller",
      phone: "555-0000",
      propertyAddress: "456 Hot Ave",
      askingPrice: 200000,
      mortgageBalance: 80000,
      monthlyPayment: 1200,
      occupancy: "vacant",
      timeline: "30 days asap",
      flexibleTermsInterest: "yes open",
      notes: "motivated",
    });
    expect(result.success).toBe(true);
    expect(["Hot", "Warm"]).toContain(result.status);
    expect(result.score).toBeGreaterThanOrEqual(7);
  });
});
