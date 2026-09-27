export type BranchSettlementStatus = 'draft' | 'submitted' | 'received' | 'discrepancy';

export interface BranchSettlementItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string | null;
  unitAbbreviation?: string | null;
  allowsDecimals?: boolean;
  imageUrl?: string | null;
  systemQty: number;
  countedQty: number;
  keepQty: number;
  returnQty: number;
  wasteQty: number;
  receivedQty?: number | null;
  notes?: string | null;
}

export interface CashSessionSummary {
  id: string;
  userName: string;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  expectedBalance: number;
  closingBalance: number | null;
  difference: number | null;
  status: string;
}

export interface BranchSettlementIncident {
  id: string;
  productId: string | null;
  productName: string | null;
  quantity: number;
  description: string;
  status: 'open' | 'resolved' | string;
  attachmentUrls: string[];
  files?: File[];
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
}

export interface BranchSettlement {
  id: string;
  settlementNumber: string;
  branchId: string;
  branchName: string;
  businessDate: string;
  status: BranchSettlementStatus;
  notes: string | null;
  transferId?: string | null;
  transferNumber?: string | null;
  transferStatus?: string | null;
  submittedAt?: string | null;
  submittedByName?: string | null;
  createdAt: string;
  items: BranchSettlementItem[];
  cashSessions: CashSessionSummary[];
  incidents?: BranchSettlementIncident[];
}
