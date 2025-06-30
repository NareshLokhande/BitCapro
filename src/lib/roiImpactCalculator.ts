import { formatNumber } from './supabase';

// ROI Impact Calculator with Delay Formula
export interface ROIImpactData {
  requestId: string;
  originalROI: number;
  submissionDate: string;
  finalApprovalDate?: string;
  currentDate: string;
  delayInWeeks: number;
  decayRate: number; // percentage per week
  adjustedROI: number;
  roiLoss: number;
  roiLossPercentage: number;
  projectedValue: number;
  lostValue: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ROITimelinePoint {
  date: string;
  weeksSinceSubmission: number;
  roi: number;
  cumulativeLoss: number;
}

export interface ROIImpactSummary {
  totalRequests: number;
  averageDelay: number;
  totalROILoss: number;
  averageROIDecay: number;
  fastestApproval: number;
  slowestApproval: number;
  totalValueLost: number;
}

export class ROIImpactCalculator {
  // Calculate ROI impact for a single request
  static calculateROIImpact(
    originalROI: number,
    submissionDate: string,
    finalApprovalDate: string | null | undefined,
    investmentAmount: number,
    decayRate: number = 0.75, // Default 0.75% per week
  ): ROIImpactData {
    const submission = new Date(submissionDate);
    const currentDate = new Date();
    const finalDate = finalApprovalDate
      ? new Date(finalApprovalDate)
      : currentDate;

    // Calculate delay in weeks
    const delayInWeeks = Math.max(
      0,
      (finalDate.getTime() - submission.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );

    // Apply ROI decay formula: ROI(d) = ROI₀ - (r × d)
    const roiDecay = decayRate * delayInWeeks;
    const adjustedROI = Math.max(0, originalROI - roiDecay);

    const roiLoss = originalROI - adjustedROI;
    const roiLossPercentage =
      originalROI > 0 ? (roiLoss / originalROI) * 100 : 0;

    // Calculate financial impact
    const projectedValue = investmentAmount * (originalROI / 100);
    const adjustedValue = investmentAmount * (adjustedROI / 100);
    const lostValue = projectedValue - adjustedValue;

    const status = finalApprovalDate ? 'approved' : 'pending';

    return {
      requestId: '',
      originalROI,
      submissionDate,
      finalApprovalDate: finalApprovalDate || '',
      currentDate: currentDate.toISOString(),
      delayInWeeks: Math.round(delayInWeeks * 10) / 10,
      decayRate,
      adjustedROI: Math.round(adjustedROI * 100) / 100,
      roiLoss: Math.round(roiLoss * 100) / 100,
      roiLossPercentage: Math.round(roiLossPercentage * 100) / 100,
      projectedValue: Math.round(projectedValue),
      lostValue: Math.round(lostValue),
      status,
    };
  }

  // Generate ROI timeline showing decay over time
  static generateROITimeline(
    originalROI: number,
    submissionDate: string,
    finalApprovalDate: string | null,
    decayRate: number = 0.75,
  ): ROITimelinePoint[] {
    const timeline: ROITimelinePoint[] = [];
    const submission = new Date(submissionDate);
    const endDate = finalApprovalDate
      ? new Date(finalApprovalDate)
      : new Date();

    const totalWeeks = Math.ceil(
      (endDate.getTime() - submission.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );

    for (let week = 0; week <= totalWeeks; week++) {
      const currentDate = new Date(
        submission.getTime() + week * 7 * 24 * 60 * 60 * 1000,
      );
      const roiDecay = decayRate * week;
      const currentROI = Math.max(0, originalROI - roiDecay);
      const cumulativeLoss = originalROI - currentROI;

      timeline.push({
        date: currentDate.toISOString().split('T')[0],
        weeksSinceSubmission: week,
        roi: Math.round(currentROI * 100) / 100,
        cumulativeLoss: Math.round(cumulativeLoss * 100) / 100,
      });
    }

    return timeline;
  }

  // Calculate dynamic decay rate based on request characteristics
  static calculateDynamicDecayRate(
    investmentAmount: number,
    businessCaseTypes: string[],
    department: string,
    priority: string,
  ): number {
    let baseRate = 0.75; // Base 0.75% per week

    // Adjust based on investment amount (larger investments decay faster)
    if (investmentAmount > 1000000) baseRate += 0.3;
    else if (investmentAmount > 500000) baseRate += 0.2;
    else if (investmentAmount > 100000) baseRate += 0.1;

    // Adjust based on business case type
    if (businessCaseTypes.includes('IPO Prep')) baseRate += 0.5; // Time-sensitive
    if (businessCaseTypes.includes('Compliance')) baseRate += 0.3; // Regulatory deadlines
    if (businessCaseTypes.includes('Expansion')) baseRate += 0.2; // Market opportunities
    if (businessCaseTypes.includes('ESG')) baseRate -= 0.1; // Long-term benefits

    // Adjust based on department
    const deptMultipliers: Record<string, number> = {
      IT: 0.2, // Technology moves fast
      Manufacturing: 0.1,
      'R&D': -0.1, // Research has longer timelines
      Finance: 0.15,
      Sales: 0.25, // Sales opportunities are time-sensitive
      Marketing: 0.2,
    };
    baseRate += deptMultipliers[department] || 0;

    // Adjust based on priority
    const priorityMultipliers: Record<string, number> = {
      Critical: 0.4,
      High: 0.2,
      Medium: 0,
      Low: -0.1,
    };
    baseRate += priorityMultipliers[priority] || 0;

    // Ensure rate is within reasonable bounds (0.1% to 2% per week)
    return Math.max(0.1, Math.min(2.0, baseRate));
  }

  // Calculate summary statistics for multiple requests
  static calculateSummaryStats(impacts: ROIImpactData[]): ROIImpactSummary {
    if (impacts.length === 0) {
      return {
        totalRequests: 0,
        averageDelay: 0,
        totalROILoss: 0,
        averageROIDecay: 0,
        fastestApproval: 0,
        slowestApproval: 0,
        totalValueLost: 0,
      };
    }

    const totalDelay = impacts.reduce(
      (sum, impact) => sum + impact.delayInWeeks,
      0,
    );
    const totalROILoss = impacts.reduce(
      (sum, impact) => sum + impact.roiLoss,
      0,
    );
    const totalValueLost = impacts.reduce(
      (sum, impact) => sum + impact.lostValue,
      0,
    );

    const delays = impacts
      .map((impact) => impact.delayInWeeks)
      .filter((delay) => delay > 0);

    return {
      totalRequests: impacts.length,
      averageDelay: Math.round((totalDelay / impacts.length) * 10) / 10,
      totalROILoss: Math.round(totalROILoss * 100) / 100,
      averageROIDecay: Math.round((totalROILoss / impacts.length) * 100) / 100,
      fastestApproval: delays.length > 0 ? Math.min(...delays) : 0,
      slowestApproval: delays.length > 0 ? Math.max(...delays) : 0,
      totalValueLost: Math.round(totalValueLost),
    };
  }

  // Get ROI impact severity level
  static getROIImpactSeverity(roiLossPercentage: number): {
    level: 'low' | 'medium' | 'high' | 'critical';
    color: string;
    description: string;
  } {
    if (roiLossPercentage < 5) {
      return {
        level: 'low',
        color: 'text-green-600 bg-green-100',
        description: 'Minimal impact on returns',
      };
    } else if (roiLossPercentage < 15) {
      return {
        level: 'medium',
        color: 'text-yellow-600 bg-yellow-100',
        description: 'Moderate impact on returns',
      };
    } else if (roiLossPercentage < 30) {
      return {
        level: 'high',
        color: 'text-orange-600 bg-orange-100',
        description: 'Significant impact on returns',
      };
    } else {
      return {
        level: 'critical',
        color: 'text-red-600 bg-red-100',
        description: 'Critical impact on returns',
      };
    }
  }

  // Format currency values
  static formatCurrency(amount: number): string {
    return `$${formatNumber(amount)}`;
  }

  // Format percentage with appropriate precision
  static formatPercentage(percentage: number): string {
    if (percentage < 0.1) {
      return `${percentage.toFixed(2)}%`;
    } else if (percentage < 1) {
      return `${percentage.toFixed(1)}%`;
    } else {
      return `${Math.round(percentage)}%`;
    }
  }
}

// Export utility functions
export const calculateROIImpact = ROIImpactCalculator.calculateROIImpact;
export const generateROITimeline = ROIImpactCalculator.generateROITimeline;
export const calculateDynamicDecayRate =
  ROIImpactCalculator.calculateDynamicDecayRate;
export const getROIImpactSeverity = ROIImpactCalculator.getROIImpactSeverity;
