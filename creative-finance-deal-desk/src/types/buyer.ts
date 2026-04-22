export interface BuyerLead {
  leadId: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string | null;
  targetArea: string;
  budget: number | string;
  downPayment: number | string;
  monthlyIncome?: number | string | null;
  creditSituation?: string | null;
  selfEmployed?: boolean | string | null;
  timeline: string;
  leadSource?: string | null;
  assignedAgent?: string | null;
  notes: string;
}
