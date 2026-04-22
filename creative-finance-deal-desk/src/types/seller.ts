export interface SellerLead {
  leadId: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string | null;
  propertyAddress: string;
  askingPrice: number | string;
  mortgageBalance?: number | string | null;
  monthlyPayment?: number | string | null;
  occupancy?: string | null;
  condition?: string | null;
  timeline: string;
  flexibleTermsInterest: string;
  leadSource?: string | null;
  assignedAgent?: string | null;
  notes: string;
}
