export interface CloserPacket {
  packetId: string;
  createdAt: string;
  propertySnapshot: string;
  sellerSnapshot: string;
  buyerSnapshot: string;
  knownNumbers: Record<string, unknown>;
  missingNumbers: string[];
  opportunitySummary: string;
  riskFlags: string[];
  recommendedNextMove: string;
}
