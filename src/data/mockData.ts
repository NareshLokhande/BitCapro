import { InvestmentRequest, ApprovalLog, ApprovalMatrix, KPI, SystemKPI } from '../types';

export const mockInvestmentRequests: InvestmentRequest[] = [
  {
    id: 'INV-2024-001',
    projectTitle: 'Digital Transformation Initiative',
    objective: 'Modernize IT infrastructure and improve operational efficiency',
    description: 'Comprehensive digital transformation including cloud migration, process automation, and data analytics platform implementation',
    legalEntity: 'TechCorp Solutions Ltd',
    location: 'New York, NY',
    projectStatus: 'Planning',
    purpose: 'Operational Efficiency',
    isInBudget: true,
    capEx: 250000,
    opEx: 75000,
    startYear: 2024,
    endYear: 2026,
    department: 'IT',
    submittedBy: 'Sarah Johnson',
    submittedDate: '2024-01-15T10:30:00Z',
    lastUpdated: '2024-01-20T14:15:00Z',
    priority: 'High',
    status: 'Under Review',
    category: 'Technology',
    strategicFit: true,
    riskAssessment: true,
    supplyPlan: true,
    legalFit: true,
    itFit: true,
    hsseqCompliance: true
  },
  {
    id: 'INV-2024-002',
    projectTitle: 'Manufacturing Equipment Upgrade',
    objective: 'Replace aging production line equipment',
    description: 'Complete overhaul of production line 3 with state-of-the-art manufacturing equipment to improve efficiency and product quality',
    legalEntity: 'Manufacturing Corp Inc',
    location: 'Detroit, MI',
    projectStatus: 'Planning',
    purpose: 'Capacity Expansion',
    isInBudget: false,
    capEx: 450000,
    opEx: 85000,
    startYear: 2024,
    endYear: 2025,
    department: 'Manufacturing',
    submittedBy: 'Mike Chen',
    submittedDate: '2024-01-10T09:15:00Z',
    lastUpdated: '2024-01-18T16:30:00Z',
    priority: 'Critical',
    status: 'Approved',
    category: 'Equipment',
    strategicFit: true,
    riskAssessment: true,
    supplyPlan: false,
    legalFit: true,
    itFit: false,
    hsseqCompliance: true
  },
  {
    id: 'INV-2024-003',
    projectTitle: 'Green Energy Initiative',
    objective: 'Implement renewable energy solutions',
    description: 'Solar panel installation across all facilities and implementation of energy management systems to reduce carbon footprint',
    legalEntity: 'EcoTech Industries',
    location: 'Phoenix, AZ',
    projectStatus: 'Planning',
    purpose: 'Sustainability',
    isInBudget: true,
    capEx: 320000,
    opEx: 45000,
    startYear: 2024,
    endYear: 2025,
    department: 'Facilities',
    submittedBy: 'Emily Davis',
    submittedDate: '2024-01-22T11:45:00Z',
    lastUpdated: '2024-01-22T11:45:00Z',
    priority: 'Medium',
    status: 'Submitted',
    category: 'Sustainability',
    strategicFit: true,
    riskAssessment: true,
    supplyPlan: true,
    legalFit: true,
    itFit: true,
    hsseqCompliance: true
  }
];

export const mockKPIs: KPI[] = [
  {
    id: 'KPI-001',
    requestId: 'INV-2024-001',
    roi: 28.5,
    npv: 185000,
    paybackPeriod: 2.3,
    basisOfCalculation: 'Cost savings from automation and efficiency gains over 5-year period'
  },
  {
    id: 'KPI-002',
    requestId: 'INV-2024-002',
    roi: 35.2,
    npv: 275000,
    paybackPeriod: 1.8,
    basisOfCalculation: 'Increased production capacity and reduced maintenance costs'
  },
  {
    id: 'KPI-003',
    requestId: 'INV-2024-003',
    roi: 22.1,
    npv: 145000,
    paybackPeriod: 3.2,
    basisOfCalculation: 'Energy cost savings and government incentives over 10-year period'
  }
];

export const mockApprovalLogs: ApprovalLog[] = [
  {
    id: 'LOG-001',
    requestId: 'INV-2024-001',
    approvedBy: 'John Smith',
    role: 'IT Director',
    level: 1,
    status: 'Under Review',
    comments: 'Reviewing technical feasibility and resource allocation requirements',
    timestamp: '2024-01-20T10:30:00Z'
  },
  {
    id: 'LOG-002',
    requestId: 'INV-2024-002',
    approvedBy: 'Jane Miller',
    role: 'VP Operations',
    level: 2,
    status: 'Approved',
    comments: 'Critical for maintaining production capacity. Approved for immediate implementation.',
    timestamp: '2024-01-18T14:15:00Z'
  },
  {
    id: 'LOG-003',
    requestId: 'INV-2024-002',
    approvedBy: 'Robert Johnson',
    role: 'CFO',
    level: 3,
    status: 'Approved',
    comments: 'Financial projections are sound. Budget allocation approved.',
    timestamp: '2024-01-18T16:30:00Z'
  }
];

export const mockApprovalMatrix: ApprovalMatrix[] = [
  {
    id: 'AM-001',
    level: 1,
    role: 'Department Manager',
    department: 'All',
    amountMin: 0,
    amountMax: 50000,
    active: true
  },
  {
    id: 'AM-002',
    level: 2,
    role: 'Director',
    department: 'All',
    amountMin: 50001,
    amountMax: 200000,
    active: true
  },
  {
    id: 'AM-003',
    level: 3,
    role: 'VP/CFO',
    department: 'All',
    amountMin: 200001,
    amountMax: 500000,
    active: true
  },
  {
    id: 'AM-004',
    level: 4,
    role: 'CEO',
    department: 'All',
    amountMin: 500001,
    amountMax: 999999999,
    active: true
  }
];

export const mockSystemKPIs: SystemKPI[] = [
  {
    id: 'SKPI-001',
    name: 'Total Investment Value',
    value: 1020000,
    target: 1500000,
    period: 'YTD 2024',
    trend: 'up',
    unit: '$'
  },
  {
    id: 'SKPI-002',
    name: 'Approval Rate',
    value: 68,
    target: 75,
    period: 'YTD 2024',
    trend: 'down',
    unit: '%'
  },
  {
    id: 'SKPI-003',
    name: 'Average ROI',
    value: 28.6,
    target: 25,
    period: 'YTD 2024',
    trend: 'up',
    unit: '%'
  },
  {
    id: 'SKPI-004',
    name: 'Processing Time',
    value: 8.5,
    target: 7,
    period: 'Avg Days',
    trend: 'stable',
    unit: 'days'
  }
];