// OpenAI API Integration for BitCapro
// This file handles AI-powered text generation and analysis

export interface OpenAIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BusinessCaseSummary {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  riskFactors: string[];
}

export interface DocumentAnalysis {
  missingElements: string[];
  suggestions: string[];
  complianceScore: number;
  completenessScore: number;
}

export class OpenAIService {
  private static apiKey: string | null = null;
  private static baseUrl = 'https://api.openai.com/v1';

  static initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  private static async makeRequest(
    endpoint: string,
    data: any,
  ): Promise<OpenAIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Generate business case summary
  static async generateBusinessCaseSummary(
    projectTitle: string,
    description: string,
    objective: string,
    businessCaseTypes: string[],
    financialData: {
      capex: number;
      opex: number;
      roi?: number;
      paybackPeriod?: number;
    },
  ): Promise<BusinessCaseSummary> {
    const prompt = `
Generate a comprehensive business case summary for the following investment request:

Project: ${projectTitle}
Description: ${description}
Objective: ${objective}
Business Case Types: ${businessCaseTypes.join(', ')}
Financial Data:
- CapEx: $${financialData.capex.toLocaleString()}
- OpEx: $${financialData.opex.toLocaleString()}
- ROI: ${financialData.roi || 'N/A'}%
- Payback Period: ${financialData.paybackPeriod || 'N/A'} years

Please provide:
1. A concise executive summary (2-3 sentences)
2. Key points that support this investment
3. Specific recommendations for approval
4. Potential risk factors to consider

Format the response as JSON with the following structure:
{
  "summary": "executive summary here",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskFactors": ["risk 1", "risk 2"]
}
`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial analyst specializing in investment request analysis. Provide clear, actionable insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    if (!response.success) {
      throw new Error(
        response.error || 'Failed to generate business case summary',
      );
    }

    try {
      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed as BusinessCaseSummary;
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }

  // Analyze document completeness
  static async analyzeDocumentCompleteness(
    projectData: any,
    businessCaseTypes: string[],
  ): Promise<DocumentAnalysis> {
    const prompt = `
Analyze the completeness of this investment request document:

Project Data: ${JSON.stringify(projectData, null, 2)}
Business Case Types: ${businessCaseTypes.join(', ')}

For each business case type, identify:
1. Missing required elements
2. Suggestions for improvement
3. Compliance score (0-100)
4. Overall completeness score (0-100)

Format the response as JSON:
{
  "missingElements": ["missing item 1", "missing item 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "complianceScore": 85,
  "completenessScore": 78
}
`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a compliance expert analyzing investment request documents for completeness and regulatory compliance.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze document');
    }

    try {
      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed as DocumentAnalysis;
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }

  // Generate approval recommendation
  static async generateApprovalRecommendation(
    requestData: any,
    approvalHistory: any[],
    userRole: string,
  ): Promise<string> {
    const prompt = `
As a ${userRole}, analyze this investment request and provide a recommendation:

Request Data: ${JSON.stringify(requestData, null, 2)}
Approval History: ${JSON.stringify(approvalHistory, null, 2)}

Provide a concise recommendation (approve/reject/hold) with brief reasoning.
Focus on your role's specific concerns and requirements.
Keep the response under 200 words.
`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a ${userRole} reviewing investment requests. Provide clear, professional recommendations.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate recommendation');
    }

    return response.data.choices[0].message.content;
  }

  // Enhanced ROI impact analysis
  static async analyzeROIImpact(
    baseROI: number,
    delayDays: number,
    projectData: any,
  ): Promise<{
    adjustedROI: number;
    impactAnalysis: string;
    recommendations: string[];
  }> {
    const prompt = `
Analyze the impact of approval delays on ROI:

Base ROI: ${baseROI}%
Delay: ${delayDays} days
Project Data: ${JSON.stringify(projectData, null, 2)}

Calculate the adjusted ROI considering:
- Time value of money
- Market conditions
- Opportunity costs
- Project-specific factors

Provide:
1. Adjusted ROI percentage
2. Impact analysis explanation
3. Recommendations to mitigate delays

Format as JSON:
{
  "adjustedROI": 18.4,
  "impactAnalysis": "explanation here",
  "recommendations": ["rec 1", "rec 2"]
}
`;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial analyst specializing in ROI analysis and delay impact assessment.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze ROI impact');
    }

    try {
      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      throw new Error('Failed to parse AI response');
    }
  }
}

// Environment variable setup
if (typeof window !== 'undefined') {
  // Client-side: use environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    OpenAIService.initialize(apiKey);
  }
}
