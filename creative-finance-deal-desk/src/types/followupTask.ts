export type FollowupChannel = "sms" | "email" | "call";

export interface FollowupTask {
  taskId: string;
  leadId: string;
  leadType: "seller" | "buyer";
  dueAt: string;
  channel: FollowupChannel;
  status: string;
  message: string;
  assignedAgent?: string | null;
  createdAt?: string;
}
