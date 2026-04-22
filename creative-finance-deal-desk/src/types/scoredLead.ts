export interface ScoredLead {
  leadId: string;
  leadType: string;
  status: string;
  score: number;
  knownFacts: string[];
  missingFacts: string[];
  riskFlags: string[];
  nextAction: string;
  followupWindow: string;
  suggestedScript: string;
  escalation: string;
}
