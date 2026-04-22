import {
  dailyFollowupWorkflow,
  nextTouch,
} from "../src/workflows/dailyFollowupWorkflow";
import { FollowupTask } from "../src/types/followupTask";
import {
  createFollowupTask,
  createSellerLead,
} from "../src/adapters/airtableAdapter";

describe("dailyFollowupWorkflow", () => {
  test("returns success with zero tasks when nothing is due", async () => {
    const result = await dailyFollowupWorkflow();
    expect(result.success).toBe(true);
    expect(result.workflow).toBe("dailyFollowupWorkflow");
    expect(typeof result.processed).toBe("number");
    expect(typeof result.sent).toBe("number");
    expect(typeof result.failed).toBe("number");
  });

  test("processes a due follow-up task", async () => {
    await createSellerLead({
      leadId: "seller_followup_1",
      createdAt: "2026-04-01T00:00:00Z",
      name: "Follow Up Seller",
      phone: "555-9999",
      propertyAddress: "789 Elm St",
      askingPrice: 200000,
      timeline: "30 days",
      flexibleTermsInterest: "yes",
      notes: "",
    });

    const task: FollowupTask = {
      taskId: "task_due",
      leadId: "seller_followup_1",
      leadType: "seller",
      dueAt: "2020-01-01T00:00:00Z",
      channel: "sms",
      status: "pending",
      message: "Hi! Just checking in.",
      createdAt: "2020-01-01T00:00:00Z",
    };
    await createFollowupTask(task);

    const result = await dailyFollowupWorkflow();
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(result.sent).toBeGreaterThanOrEqual(1);
  });
});

describe("nextTouch", () => {
  test("advances a task by the specified days", () => {
    const base: FollowupTask = {
      taskId: "t",
      leadId: "l",
      leadType: "seller",
      dueAt: "2026-04-10T00:00:00Z",
      channel: "sms",
      status: "pending",
      message: "hi",
      createdAt: "2026-04-01T00:00:00Z",
    };
    const advanced = nextTouch(base, 7);
    const newDate = new Date(advanced.dueAt);
    expect(newDate.getTime()).toBeGreaterThan(Date.now());
  });
});
