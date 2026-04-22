export interface DealMatch {
  matchId: string;
  sellerLeadId: string;
  buyerLeadId: string;
  propertyAddress: string;
  fitScore: number;
  matchStatus: string;
  reasonsForFit: string[];
  missingInformation: string[];
  riskFlags: string[];
  recommendedNextStep: string;
  closerSummary: string;
}
