import { InvestmentRequest, ApprovalLog, KPI } from './supabase';

// AI Insight Types
export interface AIInsight {
  id: string;
  type: 'improvement' | 'warning' | 'prediction' | 'optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  confidence: number; // 0-100
  category: 'financial' | 'process' | 'compliance' | 'strategic';
  actionable: boolean;
  estimatedTimeToImplement?: string;
  potentialSavings?: number;
}

export interface DelayPrediction {
  predictedDelayDays: number;
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
  similarCases: number;
}

export interface BusinessCaseOptimization {
  suggestedTypes: string[];
  reasoning: string;
  confidenceScore: number;
  potentialBenefits: string[];
}

export interface CapExPhasing {
  suggestedPhases: Array<{
    phase: number;
    year: number;
    amount: number;
    description: string;
    benefits: string[];
  }>;
  totalSavings: number;
  riskReduction: number;
}

// Rule-based AI Analysis Engine
export class AIInsightsEngine {
  
  // Analyze investment request and generate insights
  static analyzeInvestmentRequest(
    request: InvestmentRequest,
    allRequests: InvestmentRequest[],
    approvalLogs: ApprovalLog[],
    kpis: KPI[]
  ): AIInsight[] {
    const insights: AIInsight[] = [];

    // Financial Analysis
    insights.push(...this.analyzeFinancials(request, allRequests, kpis));
    
    // Business Case Analysis
    insights.push(...this.analyzeBusinessCase(request));
    
    // Compliance Analysis
    insights.push(...this.analyzeCompliance(request));
    
    // Process Optimization
    insights.push(...this.analyzeProcess(request, allRequests));
    
    // Strategic Analysis
    insights.push(...this.analyzeStrategic(request, allRequests));

    return insights.sort((a, b) => {
      // Sort by severity and confidence
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aScore = severityWeight[a.severity] * (a.confidence / 100);
      const bScore = severityWeight[b.severity] * (b.confidence / 100);
      return bScore - aScore;
    });
  }

  // Predict approval delays based on historical data
  static predictApprovalDelay(
    request: InvestmentRequest,
    allRequests: InvestmentRequest[],
    approvalLogs: ApprovalLog[]
  ): DelayPrediction {
    const similarRequests = this.findSimilarRequests(request, allRequests);
    const historicalDelays = this.calculateHistoricalDelays(similarRequests, approvalLogs);
    
    let predictedDelayDays = 0;
    let confidence = 50;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyze risk factors
    const totalAmount = request.base_currency_capex + request.base_currency_opex;
    
    // Amount-based risk
    if (totalAmount > 500000) {
      predictedDelayDays += 5;
      riskFactors.push('High investment amount (>$500K) typically requires additional review');
      recommendations.push('Prepare detailed financial justification and ROI analysis');
    }
    
    // Business case complexity
    if (request.business_case_type && request.business_case_type.length > 2) {
      predictedDelayDays += 3;
      riskFactors.push('Multiple business case types increase review complexity');
      recommendations.push('Clearly separate and justify each business case type');
    }
    
    // ESG requirements
    if (request.business_case_type?.includes('ESG')) {
      if (!request.carbon_footprint_data || Object.keys(request.carbon_footprint_data).length === 0) {
        predictedDelayDays += 7;
        riskFactors.push('ESG cases without carbon footprint data face significant delays');
        recommendations.push('Complete carbon footprint assessment before submission');
      }
    }
    
    // IPO Prep requirements
    if (request.business_case_type?.includes('IPO Prep')) {
      if (!request.stock_exchange_target) {
        predictedDelayDays += 4;
        riskFactors.push('IPO Prep cases require target stock exchange specification');
        recommendations.push('Specify target stock exchange and provide market analysis');
      }
    }
    
    // Department-specific delays
    const deptDelays: Record<string, number> = {
      'IT': 2,
      'Manufacturing': 4,
      'R&D': 6,
      'Finance': 1
    };
    predictedDelayDays += deptDelays[request.department] || 3;
    
    // Historical data influence
    if (historicalDelays.averageDelay > 0) {
      predictedDelayDays = Math.round((predictedDelayDays + historicalDelays.averageDelay) / 2);
      confidence = Math.min(90, confidence + historicalDelays.dataPoints * 5);
    }
    
    // Seasonal factors
    const currentMonth = new Date().getMonth();
    if ([11, 0].includes(currentMonth)) { // December, January
      predictedDelayDays += 3;
      riskFactors.push('Year-end/New year period typically sees processing delays');
    }
    
    return {
      predictedDelayDays: Math.max(0, predictedDelayDays),
      confidence: Math.min(95, confidence),
      riskFactors,
      recommendations,
      similarCases: similarRequests.length
    };
  }

  // Suggest business case optimizations
  static optimizeBusinessCase(request: InvestmentRequest): BusinessCaseOptimization {
    const suggestedTypes: string[] = [];
    const potentialBenefits: string[] = [];
    let reasoning = '';
    let confidenceScore = 70;

    const totalAmount = request.base_currency_capex + request.base_currency_opex;
    const currentTypes = request.business_case_type || [];

    // Analyze project characteristics
    const description = request.description.toLowerCase();
    const objective = request.objective.toLowerCase();
    const purpose = request.purpose.toLowerCase();

    // ESG suggestions
    if (!currentTypes.includes('ESG')) {
      if (description.includes('energy') || description.includes('sustainable') || 
          description.includes('green') || description.includes('carbon') ||
          description.includes('environment')) {
        suggestedTypes.push('ESG');
        potentialBenefits.push('Access to green financing options');
        potentialBenefits.push('Improved ESG ratings and stakeholder perception');
        reasoning += 'Project shows environmental benefits that qualify for ESG classification. ';
        confidenceScore += 15;
      }
    }

    // Cost Control suggestions
    if (!currentTypes.includes('Cost Control')) {
      if (description.includes('efficiency') || description.includes('automation') ||
          description.includes('reduce cost') || description.includes('optimize') ||
          purpose.includes('efficiency')) {
        suggestedTypes.push('Cost Control');
        potentialBenefits.push('Faster approval for cost-saving initiatives');
        potentialBenefits.push('Potential for accelerated depreciation benefits');
        reasoning += 'Project demonstrates clear cost reduction potential. ';
        confidenceScore += 10;
      }
    }

    // Expansion suggestions
    if (!currentTypes.includes('Expansion')) {
      if (description.includes('capacity') || description.includes('growth') ||
          description.includes('market') || description.includes('expansion') ||
          totalAmount > 200000) {
        suggestedTypes.push('Expansion');
        potentialBenefits.push('Strategic priority status for growth initiatives');
        potentialBenefits.push('Potential for additional funding allocation');
        reasoning += 'Project scale and scope suggest expansion benefits. ';
        confidenceScore += 12;
      }
    }

    // Compliance suggestions
    if (!currentTypes.includes('Compliance')) {
      if (description.includes('regulatory') || description.includes('compliance') ||
          description.includes('safety') || description.includes('security') ||
          request.hsseq_compliance) {
        suggestedTypes.push('Compliance');
        potentialBenefits.push('Regulatory risk mitigation');
        potentialBenefits.push('Potential for compliance-related tax benefits');
        reasoning += 'Project addresses regulatory or compliance requirements. ';
        confidenceScore += 8;
      }
    }

    return {
      suggestedTypes,
      reasoning: reasoning || 'Current business case types appear optimal for this project.',
      confidenceScore: Math.min(95, confidenceScore),
      potentialBenefits
    };
  }

  // Suggest CapEx phasing optimization
  static optimizeCapExPhasing(request: InvestmentRequest): CapExPhasing {
    const totalCapEx = request.capex;
    const projectDuration = request.end_year - request.start_year + 1;
    
    if (totalCapEx < 100000 || projectDuration <= 1) {
      return {
        suggestedPhases: [],
        totalSavings: 0,
        riskReduction: 0
      };
    }

    const phases: CapExPhasing['suggestedPhases'] = [];
    let remainingAmount = totalCapEx;
    let totalSavings = 0;

    // Phase 1: Initial implementation (40% of budget)
    const phase1Amount = Math.round(totalCapEx * 0.4);
    phases.push({
      phase: 1,
      year: request.start_year,
      amount: phase1Amount,
      description: 'Initial implementation and core infrastructure',
      benefits: [
        'Reduced initial capital requirement',
        'Early validation of project assumptions',
        'Lower financial risk exposure'
      ]
    });
    remainingAmount -= phase1Amount;

    // Phase 2: Expansion (35% of budget)
    if (projectDuration >= 2) {
      const phase2Amount = Math.round(totalCapEx * 0.35);
      phases.push({
        phase: 2,
        year: request.start_year + 1,
        amount: phase2Amount,
        description: 'Scaling and optimization based on Phase 1 learnings',
        benefits: [
          'Incorporate lessons learned from Phase 1',
          'Improved cost efficiency through experience',
          'Better vendor negotiations for larger scale'
        ]
      });
      remainingAmount -= phase2Amount;
    }

    // Phase 3: Completion (remaining budget)
    if (remainingAmount > 0 && projectDuration >= 3) {
      phases.push({
        phase: 3,
        year: request.start_year + 2,
        amount: remainingAmount,
        description: 'Final implementation and optimization',
        benefits: [
          'Maximized learning from previous phases',
          'Optimal resource allocation',
          'Reduced technology obsolescence risk'
        ]
      });
    }

    // Calculate potential savings
    if (phases.length > 1) {
      // Assume 5-15% savings from phased approach
      totalSavings = Math.round(totalCapEx * 0.08);
    }

    return {
      suggestedPhases: phases,
      totalSavings,
      riskReduction: phases.length > 1 ? 25 : 0 // 25% risk reduction for phased approach
    };
  }

  // Private helper methods
  private static analyzeFinancials(
    request: InvestmentRequest,
    allRequests: InvestmentRequest[],
    kpis: KPI[]
  ): AIInsight[] {
    const insights: AIInsight[] = [];
    const totalAmount = request.base_currency_capex + request.base_currency_opex;
    const requestKPIs = kpis.filter(k => k.request_id === request.id);

    // High investment amount warning
    if (totalAmount > 1000000) {
      insights.push({
        id: `financial-high-amount-${request.id}`,
        type: 'warning',
        severity: 'high',
        title: 'High Investment Amount',
        description: `Investment of $${(totalAmount / 1000000).toFixed(1)}M requires enhanced scrutiny`,
        recommendation: 'Consider phasing the investment over multiple years to reduce risk and improve cash flow',
        impact: 'May face additional approval delays and require board-level review',
        confidence: 90,
        category: 'financial',
        actionable: true,
        estimatedTimeToImplement: '1-2 weeks',
        potentialSavings: Math.round(totalAmount * 0.05)
      });
    }

    // CapEx vs OpEx ratio analysis
    const capexRatio = request.capex / (request.capex + request.opex);
    if (capexRatio > 0.8 && totalAmount > 200000) {
      insights.push({
        id: `financial-capex-heavy-${request.id}`,
        type: 'optimization',
        severity: 'medium',
        title: 'CapEx-Heavy Investment',
        description: `${(capexRatio * 100).toFixed(0)}% of investment is CapEx`,
        recommendation: 'Consider leasing or service models to convert some CapEx to OpEx for better cash flow',
        impact: 'Could improve cash flow and provide more flexibility',
        confidence: 75,
        category: 'financial',
        actionable: true,
        estimatedTimeToImplement: '2-4 weeks'
      });
    }

    // Missing KPIs warning
    if (requestKPIs.length === 0 && totalAmount > 50000) {
      insights.push({
        id: `financial-missing-kpis-${request.id}`,
        type: 'warning',
        severity: 'high',
        title: 'Missing Financial KPIs',
        description: 'No IRR, NPV, or payback period calculations provided',
        recommendation: 'Add comprehensive financial analysis including IRR, NPV, and payback period',
        impact: 'Likely to cause approval delays and reduce approval probability',
        confidence: 95,
        category: 'financial',
        actionable: true,
        estimatedTimeToImplement: '3-5 days'
      });
    }

    // Poor ROI warning
    if (requestKPIs.length > 0) {
      const avgIRR = requestKPIs.reduce((sum, kpi) => sum + kpi.irr, 0) / requestKPIs.length;
      if (avgIRR < 10) {
        insights.push({
          id: `financial-low-irr-${request.id}`,
          type: 'warning',
          severity: 'medium',
          title: 'Low Expected Returns',
          description: `Average IRR of ${avgIRR.toFixed(1)}% is below typical investment thresholds`,
          recommendation: 'Review project scope to identify additional value drivers or cost reductions',
          impact: 'May face challenges in approval process due to low returns',
          confidence: 85,
          category: 'financial',
          actionable: true,
          estimatedTimeToImplement: '1-2 weeks'
        });
      }
    }

    return insights;
  }

  private static analyzeBusinessCase(request: InvestmentRequest): AIInsight[] {
    const insights: AIInsight[] = [];
    const businessCaseTypes = request.business_case_type || [];

    // No business case type selected
    if (businessCaseTypes.length === 0) {
      insights.push({
        id: `business-case-missing-${request.id}`,
        type: 'warning',
        severity: 'critical',
        title: 'Missing Business Case Type',
        description: 'No business case type selected for this investment',
        recommendation: 'Select at least one appropriate business case type to enable proper routing',
        impact: 'Request cannot be properly routed for approval',
        confidence: 100,
        category: 'process',
        actionable: true,
        estimatedTimeToImplement: '5 minutes'
      });
    }

    // Too many business case types
    if (businessCaseTypes.length > 3) {
      insights.push({
        id: `business-case-too-many-${request.id}`,
        type: 'optimization',
        severity: 'medium',
        title: 'Multiple Business Case Types',
        description: `${businessCaseTypes.length} business case types selected`,
        recommendation: 'Focus on 1-2 primary business case types for clearer approval path',
        impact: 'May complicate approval routing and extend review time',
        confidence: 70,
        category: 'process',
        actionable: true,
        estimatedTimeToImplement: '10 minutes'
      });
    }

    return insights;
  }

  private static analyzeCompliance(request: InvestmentRequest): AIInsight[] {
    const insights: AIInsight[] = [];
    const businessCaseTypes = request.business_case_type || [];

    // ESG compliance checks
    if (businessCaseTypes.includes('ESG')) {
      if (!request.carbon_footprint_data || Object.keys(request.carbon_footprint_data).length === 0) {
        insights.push({
          id: `compliance-esg-carbon-${request.id}`,
          type: 'warning',
          severity: 'high',
          title: 'Missing Carbon Footprint Data',
          description: 'ESG business case requires carbon footprint assessment',
          recommendation: 'Complete carbon footprint analysis including baseline, methodology, and reduction targets',
          impact: 'Will cause significant delays in ESG approval process',
          confidence: 95,
          category: 'compliance',
          actionable: true,
          estimatedTimeToImplement: '1-2 weeks'
        });
      }

      if (!request.supporting_documents || request.supporting_documents.length === 0) {
        insights.push({
          id: `compliance-esg-docs-${request.id}`,
          type: 'warning',
          severity: 'high',
          title: 'Missing ESG Documentation',
          description: 'ESG business case requires supporting documentation',
          recommendation: 'Upload ESG reports, sustainability plans, or environmental impact assessments',
          impact: 'ESG approval cannot proceed without proper documentation',
          confidence: 90,
          category: 'compliance',
          actionable: true,
          estimatedTimeToImplement: '3-5 days'
        });
      }
    }

    // IPO Prep compliance checks
    if (businessCaseTypes.includes('IPO Prep')) {
      if (!request.stock_exchange_target) {
        insights.push({
          id: `compliance-ipo-exchange-${request.id}`,
          type: 'warning',
          severity: 'high',
          title: 'Missing Stock Exchange Target',
          description: 'IPO Prep business case requires target stock exchange specification',
          recommendation: 'Specify target stock exchange (NYSE, NASDAQ, etc.) and provide market analysis',
          impact: 'IPO preparation approval cannot proceed without exchange target',
          confidence: 100,
          category: 'compliance',
          actionable: true,
          estimatedTimeToImplement: '1 day'
        });
      }
    }

    // Compliance business case checks
    if (businessCaseTypes.includes('Compliance')) {
      if (!request.regulatory_requirements || Object.keys(request.regulatory_requirements).length === 0) {
        insights.push({
          id: `compliance-regulatory-${request.id}`,
          type: 'warning',
          severity: 'high',
          title: 'Missing Regulatory Requirements',
          description: 'Compliance business case requires regulatory requirements documentation',
          recommendation: 'Document specific regulatory requirements, deadlines, and compliance frameworks',
          impact: 'Compliance approval requires clear regulatory justification',
          confidence: 90,
          category: 'compliance',
          actionable: true,
          estimatedTimeToImplement: '2-3 days'
        });
      }
    }

    // General compliance checklist
    const complianceItems = [
      { field: 'strategic_fit', name: 'Strategic Fit' },
      { field: 'risk_assessment', name: 'Risk Assessment' },
      { field: 'supply_plan', name: 'Supply Plan' },
      { field: 'legal_fit', name: 'Legal Fit' },
      { field: 'it_fit', name: 'IT Fit' },
      { field: 'hsseq_compliance', name: 'HSSEQ Compliance' }
    ];

    const incompleteItems = complianceItems.filter(item => !request[item.field as keyof InvestmentRequest]);
    
    if (incompleteItems.length > 2) {
      insights.push({
        id: `compliance-checklist-${request.id}`,
        type: 'warning',
        severity: 'medium',
        title: 'Incomplete Compliance Checklist',
        description: `${incompleteItems.length} compliance items not completed`,
        recommendation: `Complete the following items: ${incompleteItems.map(i => i.name).join(', ')}`,
        impact: 'May delay approval process and require additional review cycles',
        confidence: 80,
        category: 'compliance',
        actionable: true,
        estimatedTimeToImplement: '1-2 days'
      });
    }

    return insights;
  }

  private static analyzeProcess(request: InvestmentRequest, allRequests: InvestmentRequest[]): AIInsight[] {
    const insights: AIInsight[] = [];

    // Project timeline analysis
    const projectDuration = request.end_year - request.start_year + 1;
    const totalAmount = request.base_currency_capex + request.base_currency_opex;

    if (projectDuration > 3 && totalAmount > 500000) {
      insights.push({
        id: `process-long-project-${request.id}`,
        type: 'optimization',
        severity: 'medium',
        title: 'Long Project Duration',
        description: `${projectDuration}-year project with significant investment`,
        recommendation: 'Consider breaking into phases with milestone-based funding releases',
        impact: 'Could reduce risk and improve cash flow management',
        confidence: 75,
        category: 'strategic',
        actionable: true,
        estimatedTimeToImplement: '1-2 weeks',
        potentialSavings: Math.round(totalAmount * 0.03)
      });
    }

    // Department workload analysis
    const deptRequests = allRequests.filter(r => 
      r.department === request.department && 
      r.status !== 'Rejected' && 
      r.status !== 'Approved'
    );

    if (deptRequests.length > 5) {
      insights.push({
        id: `process-dept-overload-${request.id}`,
        type: 'prediction',
        severity: 'medium',
        title: 'Department Request Overload',
        description: `${request.department} has ${deptRequests.length} pending requests`,
        recommendation: 'Consider prioritizing this request or adjusting timeline expectations',
        impact: 'May experience longer approval times due to department workload',
        confidence: 70,
        category: 'process',
        actionable: true,
        estimatedTimeToImplement: '1 day'
      });
    }

    return insights;
  }

  private static analyzeStrategic(request: InvestmentRequest, allRequests: InvestmentRequest[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const totalAmount = request.base_currency_capex + request.base_currency_opex;

    // Strategic alignment analysis
    if (!request.strategic_fit) {
      insights.push({
        id: `strategic-alignment-${request.id}`,
        type: 'warning',
        severity: 'medium',
        title: 'Strategic Alignment Not Confirmed',
        description: 'Strategic fit has not been verified for this investment',
        recommendation: 'Review and confirm alignment with company strategic objectives',
        impact: 'May face questions during approval process about strategic value',
        confidence: 80,
        category: 'strategic',
        actionable: true,
        estimatedTimeToImplement: '2-3 days'
      });
    }

    // Portfolio analysis
    const deptInvestments = allRequests.filter(r => 
      r.department === request.department && 
      r.status === 'Approved'
    );
    const deptTotalInvestment = deptInvestments.reduce((sum, r) => 
      sum + r.base_currency_capex + r.base_currency_opex, 0
    );

    if (totalAmount > deptTotalInvestment * 0.5) {
      insights.push({
        id: `strategic-portfolio-${request.id}`,
        type: 'improvement',
        severity: 'low',
        title: 'Significant Department Investment',
        description: `This investment represents ${((totalAmount / deptTotalInvestment) * 100).toFixed(0)}% of department's approved investments`,
        recommendation: 'Ensure this investment aligns with department strategic priorities and resource allocation',
        impact: 'High visibility investment that may require additional strategic justification',
        confidence: 65,
        category: 'strategic',
        actionable: true,
        estimatedTimeToImplement: '1 week'
      });
    }

    return insights;
  }

  private static findSimilarRequests(request: InvestmentRequest, allRequests: InvestmentRequest[]): InvestmentRequest[] {
    const totalAmount = request.base_currency_capex + request.base_currency_opex;
    
    return allRequests.filter(r => {
      if (r.id === request.id) return false;
      
      const rTotalAmount = r.base_currency_capex + r.base_currency_opex;
      const amountSimilar = Math.abs(totalAmount - rTotalAmount) / totalAmount < 0.5;
      const deptSimilar = r.department === request.department;
      const categorySimilar = r.category === request.category;
      const businessCaseSimilar = request.business_case_type?.some(type => 
        r.business_case_type?.includes(type)
      ) || false;
      
      return (amountSimilar && deptSimilar) || (categorySimilar && businessCaseSimilar);
    });
  }

  private static calculateHistoricalDelays(
    requests: InvestmentRequest[],
    approvalLogs: ApprovalLog[]
  ): { averageDelay: number; dataPoints: number } {
    if (requests.length === 0) return { averageDelay: 0, dataPoints: 0 };

    const delays: number[] = [];

    requests.forEach(request => {
      const requestLogs = approvalLogs
        .filter(log => log.request_id === request.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (requestLogs.length > 0) {
        const firstLog = requestLogs[0];
        const lastLog = requestLogs[requestLogs.length - 1];
        const submissionDate = new Date(request.submitted_date);
        const finalDate = new Date(lastLog.timestamp);
        
        const delayDays = Math.round((finalDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (delayDays > 0) {
          delays.push(delayDays);
        }
      }
    });

    const averageDelay = delays.length > 0 ? 
      delays.reduce((sum, delay) => sum + delay, 0) / delays.length : 0;

    return {
      averageDelay: Math.round(averageDelay),
      dataPoints: delays.length
    };
  }
}

// Export utility functions
export const generateInsights = AIInsightsEngine.analyzeInvestmentRequest;
export const predictDelay = AIInsightsEngine.predictApprovalDelay;
export const optimizeBusinessCase = AIInsightsEngine.optimizeBusinessCase;
export const optimizeCapExPhasing = AIInsightsEngine.optimizeCapExPhasing;