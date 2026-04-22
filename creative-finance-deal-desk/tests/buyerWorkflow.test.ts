import { intakeBuyerWorkflow } from "../src/workflows/intakeBuyerWorkflow";

describe("intakeBuyerWorkflow", () => {
  test("accepts minimal payload with coerced defaults", async () => {
    const result = await intakeBuyerWorkflow({ name: "Anon" });
    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();
    expect(result.status).toBeDefined();
  });

  test("accepts a normalized payload and returns envelope", async () => {
    const result = await intakeBuyerWorkflow({
      full_name: "John Smith",
      phone_number: "555-6789",
      area: "Austin TX",
      budget_range: 300000,
      dp: 30000,
      income: 8000,
      when_moving: "60 days",
      comments: "self-employed plumber",
    });
    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();
    expect(typeof result.score).toBe("number");
    expect(result.followupCreated).toBe(true);
  });

  test("scores a strong buyer", async () => {
    const result = await intakeBuyerWorkflow({
      name: "Strong Buyer",
      phone: "555-0001",
      targetArea: "Austin TX",
      budget: 250000,
      downPayment: 50000,
      monthlyIncome: 9000,
      timeline: "30 days asap",
      notes: "ready to move",
    });
    expect(result.success).toBe(true);
    expect(["Hot", "Warm"]).toContain(result.status);
    expect(result.score).toBeGreaterThanOrEqual(7);
  });

  test("flags buyer expecting guaranteed approval", async () => {
    const result = await intakeBuyerWorkflow({
      name: "Risky Buyer",
      phone: "555-0002",
      targetArea: "Dallas TX",
      budget: 200000,
      downPayment: 5000,
      timeline: "whenever",
      notes: "wants guaranteed pre-approved financing",
    });
    expect(result.success).toBe(true);
    expect(result.escalation).toBeDefined();
  });
});
