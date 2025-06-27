export interface InvestmentRequest {
  id: string;
  projectTitle: string;
  objective: string;
  description: string;
  legalEntity: string;
  location: string;
  projectStatus:
    | 'Planning'
    | 'In Progress'
    | 'Completed'
    | 'On Hold'
    | 'Cancelled';
  purpose: string;
  isInBudget: boolean;
  capEx: number;
  opEx: number;
  startYear: number;
  endYear: number;
  department: string;
  submittedBy: string;
  submittedDate: string;
  lastUpdated: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status:
    | 'Draft'
    | 'Submitted'
    | 'Under Review'
    | 'Approved'
    | 'Rejected'
    | 'On Hold';
  category: string;

  // Checklist fields
  strategicFit: boolean;
  riskAssessment: boolean;
  supplyPlan: boolean;
  legalFit: boolean;
  itFit: boolean;
  hsseqCompliance: boolean;
}

export interface KPI {
  id: string;
  requestId: string;
  roi: number;
  npv: number;
  paybackPeriod: number;
  basisOfCalculation: string;
}

export interface ApprovalLog {
  id: string;
  request_id: string;
  approved_by: string;
  role: string;
  level: number;
  status: 'Approved' | 'Rejected' | 'Under Review' | 'On Hold' | 'Returned';
  comments: string;
  timestamp: string;
  user_id?: string;
  created_at?: string;
}

export interface ApprovalMatrix {
  id: string;
  level: number;
  role: string;
  department: string;
  amountMin: number;
  amountMax: number;
  active: boolean;
}

export interface SystemKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  period: string;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}
