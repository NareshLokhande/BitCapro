import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building,
  Calculator,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Leaf,
  MapPin,
  Package,
  Save,
  Scale,
  Send,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInvestmentRequests, useKPIs } from '../hooks/useSupabase';
import { CarbonFootprintData, CarbonImpactResult } from '../lib/esgCalculator';
import {
  calculateFinancialMetrics,
  estimateAnnualCashInflow,
  getDefaultDiscountRate,
} from '../lib/financialCalculator';
import { NotificationManager } from '../lib/notificationManager';
import {
  BUSINESS_CASE_TYPES,
  InvestmentRequest,
  STOCK_EXCHANGES,
  SUPPORTED_CURRENCIES,
  convertToUSD,
  getCurrencySymbol,
} from '../lib/supabase';
import { ValidationResult } from '../lib/validationRules';
import ESGImpactCalculator from './ESGImpactCalculator';
import StyledDropdown from './StyledDropdown';
import ValidationPanel from './ValidationPanel';

const SubmitRequest: React.FC = () => {
  const navigate = useNavigate();
  const { addRequest, saveDraft } = useInvestmentRequests();
  const { addKPI } = useKPIs();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    project_title: '',
    objective: '',
    description: '',
    legal_entity: '',
    location: '',
    project_status: 'Planning',
    purpose: '',
    is_in_budget: true,
    capex: '',
    opex: '',
    start_year: new Date().getFullYear(),
    end_year: new Date().getFullYear() + 1,
    department: profile?.department || '',
    priority: 'Medium',
    category: '',
    currency: 'USD',

    // Business Case Types
    business_case_type: [] as string[],

    // Checklist
    strategic_fit: false,
    risk_assessment: false,
    supply_plan: false,
    legal_fit: false,
    it_fit: false,
    hsseq_compliance: false,

    // KPI fields
    irr: '',
    npv: '',
    payback_period: '',
    basis_of_calculation: '',
    discount_rate: '',

    // Multi-year breakdown
    yearly_breakdown: {} as Record<string, { capex: number; opex: number }>,

    // Business case specific fields
    carbon_footprint_data: {} as CarbonFootprintData,
    stock_exchange_target: '',
    regulatory_requirements: {},
    cost_savings_target: '',
    market_expansion_data: {},
    asset_details: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [esgImpactResult, setEsgImpactResult] =
    useState<CarbonImpactResult | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  // Load draft data from sessionStorage when component mounts
  useEffect(() => {
    const storedDraft = sessionStorage.getItem('editingDraft');
    if (storedDraft) {
      try {
        const editingDraft = JSON.parse(storedDraft) as InvestmentRequest;
        setIsEditing(true);
        setFormData({
          project_title: editingDraft.project_title || '',
          objective: editingDraft.objective || '',
          description: editingDraft.description || '',
          legal_entity: editingDraft.legal_entity || '',
          location: editingDraft.location || '',
          project_status: editingDraft.project_status || 'Planning',
          purpose: editingDraft.purpose || '',
          is_in_budget: editingDraft.is_in_budget ?? true,
          capex: editingDraft.capex?.toString() || '',
          opex: editingDraft.opex?.toString() || '',
          start_year: editingDraft.start_year || new Date().getFullYear(),
          end_year: editingDraft.end_year || new Date().getFullYear() + 1,
          department: editingDraft.department || profile?.department || '',
          priority: editingDraft.priority || 'Medium',
          category: editingDraft.category || '',
          currency: editingDraft.currency || 'USD',
          business_case_type: editingDraft.business_case_type || [],
          strategic_fit: editingDraft.strategic_fit ?? false,
          risk_assessment: editingDraft.risk_assessment ?? false,
          supply_plan: editingDraft.supply_plan ?? false,
          legal_fit: editingDraft.legal_fit ?? false,
          it_fit: editingDraft.it_fit ?? false,
          hsseq_compliance: editingDraft.hsseq_compliance ?? false,
          irr: '',
          npv: '',
          payback_period: '',
          basis_of_calculation: '',
          discount_rate: '',
          yearly_breakdown: editingDraft.yearly_breakdown || {},
          carbon_footprint_data:
            (editingDraft.carbon_footprint_data as CarbonFootprintData) ||
            ({} as CarbonFootprintData),
          stock_exchange_target: editingDraft.stock_exchange_target || '',
          regulatory_requirements: editingDraft.regulatory_requirements || {},
          cost_savings_target:
            editingDraft.cost_savings_target?.toString() || '',
          market_expansion_data: editingDraft.market_expansion_data || {},
          asset_details: editingDraft.asset_details || {},
        });
        // Clear the stored draft after loading
        sessionStorage.removeItem('editingDraft');
      } catch (error) {
        console.error('Error parsing stored draft:', error);
        sessionStorage.removeItem('editingDraft');
      }
    }
  }, [profile?.department]);

  const steps = [
    {
      id: 1,
      name: 'Project Details',
      icon: FileText,
      description: 'Basic project information',
    },
    {
      id: 2,
      name: 'Business Case',
      icon: TrendingUp,
      description: 'Business case types and specifics',
    },
    {
      id: 3,
      name: 'Financial Data',
      icon: DollarSign,
      description: 'Investment amounts and timeline',
    },
    {
      id: 4,
      name: 'KPIs & Analysis',
      icon: BarChart3,
      description: 'Financial metrics and calculations',
    },
    {
      id: 5,
      name: 'Compliance',
      icon: Shield,
      description: 'Checklist and validation',
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      // Trigger budget validation when "Is In Budget" checkbox changes
      if (name === 'is_in_budget') {
        validateBudgetBreakdown(checked);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateBudgetBreakdown = (isInBudget: boolean) => {
    if (!isInBudget || getYearRange().length <= 1) {
      // Clear yearly breakdown error if not in budget or single year project
      setErrors((prev) => ({
        ...prev,
        yearly_breakdown: '',
      }));
      return;
    }

    const totalBudget =
      (parseFloat(formData.capex) || 0) + (parseFloat(formData.opex) || 0);
    const yearlyBreakdownTotal = Object.values(
      formData.yearly_breakdown,
    ).reduce(
      (sum, yearData) => sum + (yearData.capex || 0) + (yearData.opex || 0),
      0,
    );

    if (yearlyBreakdownTotal > totalBudget) {
      setErrors((prev) => ({
        ...prev,
        yearly_breakdown: `Total yearly breakdown amount (${formatCurrencyAmount(
          yearlyBreakdownTotal,
          formData.currency,
        )}) exceeds the available CapEx + OpEx budget (${formatCurrencyAmount(
          totalBudget,
          formData.currency,
        )}). Please revise the breakdown to stay within budget.`,
      }));
    } else {
      // Clear error if validation passes
      setErrors((prev) => ({
        ...prev,
        yearly_breakdown: '',
      }));
    }
  };

  const handleBusinessCaseTypeChange = (caseType: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      business_case_type: checked
        ? [...prev.business_case_type, caseType]
        : prev.business_case_type.filter((type) => type !== caseType),
    }));
  };

  const handleYearlyBreakdownChange = (
    year: number,
    field: 'capex' | 'opex',
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      yearly_breakdown: {
        ...prev.yearly_breakdown,
        [year]: {
          ...prev.yearly_breakdown[year],
          [field]: numValue,
        },
      },
    }));

    // Trigger budget validation if "Is In Budget" is checked
    if (formData.is_in_budget) {
      // Use setTimeout to ensure state is updated before validation
      setTimeout(() => {
        validateBudgetBreakdown(true);
      }, 0);
    }
  };

  const handleESGDataChange = (
    carbonData: CarbonFootprintData,
    impactResult: CarbonImpactResult,
  ) => {
    setFormData((prev) => ({
      ...prev,
      carbon_footprint_data: carbonData,
    }));
    setEsgImpactResult(impactResult);
  };

  const calculateFinancials = () => {
    const capex = parseFloat(formData.capex) || 0;
    const opex = parseFloat(formData.opex) || 0;
    const totalInvestment = capex + opex;

    if (totalInvestment <= 0) {
      showErrorMessage(
        'Please enter valid CapEx and OpEx amounts before calculating KPIs',
      );
      return;
    }

    try {
      // Get project duration
      const projectDuration = formData.end_year - formData.start_year + 1;

      // Get discount rate (use default if not provided)
      let discountRate = parseFloat(formData.discount_rate) / 100;
      if (!formData.discount_rate || isNaN(discountRate)) {
        discountRate = getDefaultDiscountRate(formData.business_case_type);
        setFormData((prev) => ({
          ...prev,
          discount_rate: (discountRate * 100).toFixed(1),
        }));
      }

      // Estimate annual cash inflow based on project characteristics
      const annualCashInflow = estimateAnnualCashInflow(
        totalInvestment,
        formData.business_case_type,
        projectDuration,
      );

      // Calculate financial metrics using proper formulas
      const metrics = calculateFinancialMetrics({
        initialInvestment: totalInvestment,
        discountRate,
        projectDuration,
        annualCashInflow,
        yearlyBreakdown: formData.yearly_breakdown,
      });

      // Update form with calculated values
      setFormData((prev) => ({
        ...prev,
        irr: metrics.irr.toFixed(1),
        npv: metrics.npv.toFixed(0),
        payback_period: metrics.paybackPeriod.toFixed(1),
        basis_of_calculation: `Calculated using: Initial Investment: ${getCurrencySymbol(
          formData.currency,
        )}${totalInvestment.toLocaleString()}, Annual Cash Inflow: ${getCurrencySymbol(
          formData.currency,
        )}${annualCashInflow.toFixed(0)}, Discount Rate: ${(
          discountRate * 100
        ).toFixed(
          1,
        )}%, Project Duration: ${projectDuration} years. IRR calculated using Newton-Raphson method, NPV using standard DCF formula, Payback Period with partial year interpolation.`,
      }));

      // Show success message
      showSuccessMessage();
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to calculate financial metrics';
      showErrorMessage(errorMsg);
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.project_title.trim())
          newErrors.project_title = 'Project title is required';
        if (!formData.objective.trim())
          newErrors.objective = 'Objective is required';
        if (!formData.description.trim())
          newErrors.description = 'Description is required';
        if (!formData.legal_entity.trim())
          newErrors.legal_entity = 'Legal entity is required';
        if (!formData.location.trim())
          newErrors.location = 'Location is required';
        if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
        if (!formData.department.trim())
          newErrors.department = 'Department is required';
        if (!formData.category.trim())
          newErrors.category = 'Category is required';
        break;
      case 2:
        if (formData.business_case_type.length === 0) {
          newErrors.business_case_type =
            'At least one business case type is required';
        }
        // ESG specific validation
        if (formData.business_case_type.includes('ESG')) {
          if (
            !formData.carbon_footprint_data ||
            Object.keys(formData.carbon_footprint_data).length === 0
          ) {
            newErrors.carbon_footprint_data =
              'ESG cases require carbon footprint data';
          }
        }
        // IPO Prep specific validation
        if (formData.business_case_type.includes('IPO Prep')) {
          if (!formData.stock_exchange_target) {
            newErrors.stock_exchange_target =
              'IPO Prep cases require target stock exchange';
          }
        }
        break;
      case 3:
        if (!formData.capex || parseFloat(formData.capex) < 0)
          newErrors.capex = 'Valid CapEx amount is required';
        if (!formData.opex || parseFloat(formData.opex) < 0)
          newErrors.opex = 'Valid OpEx amount is required';

        // Budget validation for yearly breakdown
        if (formData.is_in_budget && getYearRange().length > 1) {
          const totalBudget =
            (parseFloat(formData.capex) || 0) +
            (parseFloat(formData.opex) || 0);
          const yearlyBreakdownTotal = Object.values(
            formData.yearly_breakdown,
          ).reduce(
            (sum, yearData) =>
              sum + (yearData.capex || 0) + (yearData.opex || 0),
            0,
          );

          if (yearlyBreakdownTotal > totalBudget) {
            newErrors.yearly_breakdown = `Total yearly breakdown amount (${formatCurrencyAmount(
              yearlyBreakdownTotal,
              formData.currency,
            )}) exceeds the available CapEx + OpEx budget (${formatCurrencyAmount(
              totalBudget,
              formData.currency,
            )}). Please revise the breakdown to stay within budget.`;
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
  };

  const handleBackToDrafts = () => {
    navigate('/app/drafts');
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setShowError(false);

    try {
      // Get exchange rate for currency conversion
      let exchangeRate = 1.0;
      if (formData.currency !== 'USD') {
        try {
          exchangeRate = await convertToUSD(1, formData.currency);
        } catch {
          console.warn('Failed to get live exchange rate, using fallback');
          // Fallback rates
          const fallbackRates: Record<string, number> = {
            EUR: 1.18,
            GBP: 1.37,
            JPY: 0.009,
            CAD: 0.8,
            AUD: 0.74,
          };
          exchangeRate = fallbackRates[formData.currency] || 1.0;
        }
      }

      const capex = parseFloat(formData.capex) || 0;
      const opex = parseFloat(formData.opex) || 0;

      const draftData = {
        project_title: formData.project_title.trim(),
        objective: formData.objective.trim(),
        description: formData.description.trim(),
        legal_entity: formData.legal_entity.trim(),
        location: formData.location.trim(),
        project_status: formData.project_status,
        purpose: formData.purpose.trim(),
        is_in_budget: formData.is_in_budget,
        capex: capex,
        opex: opex,
        start_year: formData.start_year,
        end_year: formData.end_year,
        department: formData.department,
        priority: formData.priority,
        category: formData.category,
        currency: formData.currency,
        exchange_rate: 1 / exchangeRate,
        base_currency_capex: capex / exchangeRate,
        base_currency_opex: opex / exchangeRate,
        currency_conversion_date: new Date().toISOString(),
        status: 'Draft',
        submitted_by: profile?.name || 'Unknown User',
        strategic_fit: formData.strategic_fit,
        risk_assessment: formData.risk_assessment,
        supply_plan: formData.supply_plan,
        legal_fit: formData.legal_fit,
        it_fit: formData.it_fit,
        hsseq_compliance: formData.hsseq_compliance,
        yearly_breakdown: formData.yearly_breakdown,
        submitted_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),

        // Business case specific fields
        business_case_type: formData.business_case_type,
        supporting_documents: [],
        carbon_footprint_data: formData.carbon_footprint_data,
        stock_exchange_target: formData.stock_exchange_target || undefined,
        regulatory_requirements: formData.regulatory_requirements,
        cost_savings_target:
          parseFloat(formData.cost_savings_target) || undefined,
        market_expansion_data: formData.market_expansion_data,
        asset_details: formData.asset_details,
      };

      if (isEditing) {
        // For editing, we need to get the draft ID from the current form state
        // This is a simplified approach - in a real app, you might want to store the draft ID
        // For now, we'll create a new draft
        await saveDraft(draftData);
        showSuccessMessage();
        // Navigate back to drafts after saving
        setTimeout(() => navigate('/app/drafts'), 2000);
      } else {
        // Save new draft
        await saveDraft(draftData);
        showSuccessMessage();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to save draft. Please try again.';
      showErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setShowError(false);

    try {
      // Validate required fields for submission
      if (!isDraft) {
        if (
          !formData.project_title.trim() ||
          !formData.objective.trim() ||
          !formData.description.trim()
        ) {
          throw new Error('Please fill in all required project details');
        }
        if (
          !formData.legal_entity.trim() ||
          !formData.location.trim() ||
          !formData.department.trim()
        ) {
          throw new Error(
            'Please complete all entity and location information',
          );
        }
        if (!formData.capex || !formData.opex) {
          throw new Error('Please enter valid financial amounts');
        }
        if (formData.business_case_type.length === 0) {
          throw new Error('Please select at least one business case type');
        }
      }

      // Get exchange rate for currency conversion
      let exchangeRate = 1.0;
      if (formData.currency !== 'USD') {
        try {
          exchangeRate = await convertToUSD(1, formData.currency);
        } catch {
          console.warn('Failed to get live exchange rate, using fallback');
          // Fallback rates
          const fallbackRates: Record<string, number> = {
            EUR: 1.18,
            GBP: 1.37,
            JPY: 0.009,
            CAD: 0.8,
            AUD: 0.74,
          };
          exchangeRate = fallbackRates[formData.currency] || 1.0;
        }
      }

      const capex = parseFloat(formData.capex) || 0;
      const opex = parseFloat(formData.opex) || 0;

      const requestData = {
        project_title: formData.project_title.trim(),
        objective: formData.objective.trim(),
        description: formData.description.trim(),
        legal_entity: formData.legal_entity.trim(),
        location: formData.location.trim(),
        project_status: formData.project_status,
        purpose: formData.purpose.trim(),
        is_in_budget: formData.is_in_budget,
        capex: capex,
        opex: opex,
        start_year: formData.start_year,
        end_year: formData.end_year,
        department: formData.department,
        priority: formData.priority,
        category: formData.category,
        currency: formData.currency,
        exchange_rate: 1 / exchangeRate,
        base_currency_capex: capex / exchangeRate,
        base_currency_opex: opex / exchangeRate,
        currency_conversion_date: new Date().toISOString(),
        status: isDraft ? 'Draft' : 'Submitted',
        submitted_by: profile?.name || 'Unknown User',
        strategic_fit: formData.strategic_fit,
        risk_assessment: formData.risk_assessment,
        supply_plan: formData.supply_plan,
        legal_fit: formData.legal_fit,
        it_fit: formData.it_fit,
        hsseq_compliance: formData.hsseq_compliance,
        yearly_breakdown: formData.yearly_breakdown,
        submitted_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),

        // Business case specific fields
        business_case_type: formData.business_case_type,
        supporting_documents: [],
        carbon_footprint_data: formData.carbon_footprint_data,
        stock_exchange_target: formData.stock_exchange_target || undefined,
        regulatory_requirements: formData.regulatory_requirements,
        cost_savings_target:
          parseFloat(formData.cost_savings_target) || undefined,
        market_expansion_data: formData.market_expansion_data,
        asset_details: formData.asset_details,
      };

      console.log('Submitting request data:', requestData);

      // Create new request (since we're not tracking draft IDs in this simplified version)
      const newRequest = await addRequest(requestData);

      console.log('Request submitted successfully:', newRequest);

      // Send notifications to approvers
      try {
        console.log('Sending notifications for request:', {
          id: newRequest.id,
          title: newRequest.project_title,
          amount: capex + opex,
          currency: formData.currency,
          requester: profile?.name,
          businessCaseTypes: formData.business_case_type,
        });

        await NotificationManager.notifyApprovers(
          newRequest.id,
          newRequest.project_title,
          capex + opex,
          formData.currency,
          profile?.name || 'Unknown User',
          formData.business_case_type,
        );
        console.log('Notifications sent to approvers successfully');
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the submission for notification errors
      }

      // Add KPI data if provided
      if (formData.irr || formData.npv || formData.payback_period) {
        try {
          const kpiData = {
            request_id: newRequest.id,
            irr: parseFloat(formData.irr) || 0,
            npv: parseFloat(formData.npv) || 0,
            payback_period: parseFloat(formData.payback_period) || 0,
            basis_of_calculation:
              formData.basis_of_calculation || 'User provided calculations',
          };

          console.log('Submitting KPI data:', kpiData);
          await addKPI(kpiData);
          console.log('KPI data submitted successfully');
        } catch (kpiError) {
          console.error('Error submitting KPI data:', kpiError);
          // Don't fail the whole submission for KPI errors
        }
      }

      // Show success message
      showSuccessMessage();

      // Reset form if not draft
      if (!isDraft) {
        setFormData({
          project_title: '',
          objective: '',
          description: '',
          legal_entity: '',
          location: '',
          project_status: 'Planning',
          purpose: '',
          is_in_budget: true,
          capex: '',
          opex: '',
          start_year: new Date().getFullYear(),
          end_year: new Date().getFullYear() + 1,
          department: profile?.department || '',
          priority: 'Medium',
          category: '',
          currency: 'USD',
          business_case_type: [],
          strategic_fit: false,
          risk_assessment: false,
          supply_plan: false,
          legal_fit: false,
          it_fit: false,
          hsseq_compliance: false,
          irr: '',
          npv: '',
          payback_period: '',
          basis_of_calculation: '',
          discount_rate: '',
          yearly_breakdown: {},
          carbon_footprint_data: {} as CarbonFootprintData,
          stock_exchange_target: '',
          regulatory_requirements: {},
          cost_savings_target: '',
          market_expansion_data: {},
          asset_details: {},
        });
        setCurrentStep(1);
        setErrors({});
        setEsgImpactResult(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to submit request. Please try again.';
      showErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost =
    (parseFloat(formData.capex) || 0) + (parseFloat(formData.opex) || 0);
  const checklistComplete = [
    formData.strategic_fit,
    formData.risk_assessment,
    formData.supply_plan,
    formData.legal_fit,
    formData.it_fit,
    formData.hsseq_compliance,
  ].filter(Boolean).length;

  const getYearRange = () => {
    const years = [];
    for (let year = formData.start_year; year <= formData.end_year; year++) {
      years.push(year);
    }
    return years;
  };

  const getBusinessCaseIcon = (caseType: string) => {
    switch (caseType) {
      case 'ESG':
        return <Leaf className="w-4 h-4" />;
      case 'IPO Prep':
        return <TrendingUp className="w-4 h-4" />;
      case 'Compliance':
        return <Scale className="w-4 h-4" />;
      case 'Expansion':
        return <Globe className="w-4 h-4" />;
      case 'Asset Creation':
        return <Package className="w-4 h-4" />;
      case 'Cost Control':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatCurrencyAmount = (amount: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 max-w-md">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">Success!</p>
              <p className="text-green-700 text-sm mt-1">
                {isEditing
                  ? 'Draft updated successfully!'
                  : 'Investment request has been submitted successfully and saved to the database.'}
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 max-w-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
        {/* Removed the absolute black overlay */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBackToDrafts}
                  className="flex items-center text-blue-100 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Drafts
                </button>
                {isEditing && (
                  <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white text-sm rounded-xl backdrop-blur-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Editing Draft
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-3">
                {isEditing
                  ? 'Edit Investment Request'
                  : 'Submit Investment Request'}
              </h1>
              <p className="text-blue-100 text-lg">
                {isEditing
                  ? 'Update your draft investment proposal with any changes'
                  : 'Create a comprehensive investment proposal with detailed analysis and ESG impact assessment'}
              </p>
              {profile && (
                <div className="mt-6 flex items-center bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
                  <span className="text-blue-200">Submitting as:</span>
                  <span className="ml-2 font-semibold text-white">
                    {profile.name}
                  </span>
                  <span className="ml-2 text-blue-200">
                    ({profile.department})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-14 rounded-2xl border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600 text-white shadow-lg scale-120'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-600 text-white shadow-lg'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <Icon className="w-8 h-8" />
                  )}
                </div>
                <div className="ml-4 hidden md:block">
                  <p
                    className={`text-sm font-bold ${
                      isActive
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-4 flex items-center">
                    <ChevronRight
                      className={`w-5 h-5 mx-2 transition-colors duration-300 ${
                        isCompleted ? 'text-green-500' : 'text-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Step 1: Project Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Project Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="project_title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Title *
                </label>
                <input
                  type="text"
                  id="project_title"
                  name="project_title"
                  value={formData.project_title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.project_title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter project title"
                />
                {errors.project_title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.project_title}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="objective"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Objective *
                </label>
                <input
                  type="text"
                  id="objective"
                  name="objective"
                  value={formData.objective}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.objective ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter project objective"
                />
                {errors.objective && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.objective}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="legal_entity"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Legal Entity *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="legal_entity"
                    name="legal_entity"
                    value={formData.legal_entity}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.legal_entity ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter legal entity"
                  />
                </div>
                {errors.legal_entity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.legal_entity}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.location ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter location"
                  />
                </div>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Department *
                </label>
                <StyledDropdown
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  error={!!errors.department}
                  placeholder="Select Department"
                >
                  <option value="IT">IT</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Logistics">Logistics</option>
                  <option value="R&D">R&D</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                </StyledDropdown>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <StyledDropdown
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  error={!!errors.category}
                  placeholder="Select Category"
                >
                  <option value="Technology">Technology</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Automation">Automation</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Process Improvement">
                    Process Improvement
                  </option>
                  <option value="R&D">R&D</option>
                  <option value="Maintenance">Maintenance</option>
                </StyledDropdown>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="purpose"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Purpose *
                </label>
                <input
                  type="text"
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.purpose ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter project purpose"
                />
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Priority
                </label>
                <StyledDropdown
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </StyledDropdown>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the project in detail"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Case */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Business Case Types
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Business Case Types * (Choose all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BUSINESS_CASE_TYPES.map((caseType) => (
                    <div
                      key={caseType.value}
                      className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        id={`business_case_${caseType.value}`}
                        checked={formData.business_case_type.includes(
                          caseType.value,
                        )}
                        onChange={(e) =>
                          handleBusinessCaseTypeChange(
                            caseType.value,
                            e.target.checked,
                          )
                        }
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          {getBusinessCaseIcon(caseType.value)}
                          <label
                            htmlFor={`business_case_${caseType.value}`}
                            className="ml-2 block text-sm font-semibold text-gray-900"
                          >
                            {caseType.label}
                          </label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {caseType.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.business_case_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.business_case_type}
                  </p>
                )}
              </div>

              {/* ESG Specific Fields */}
              {formData.business_case_type.includes('ESG') && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <Leaf className="w-5 h-5 mr-2" />
                    ESG Impact Assessment
                  </h3>
                  <ESGImpactCalculator
                    onDataChange={handleESGDataChange}
                    initialData={formData.carbon_footprint_data}
                    projectAmount={totalCost}
                  />
                  {errors.carbon_footprint_data && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.carbon_footprint_data}
                    </p>
                  )}
                </div>
              )}

              {/* IPO Prep Specific Fields */}
              {formData.business_case_type.includes('IPO Prep') && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    IPO Preparation Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="stock_exchange_target"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Target Stock Exchange *
                      </label>
                      <StyledDropdown
                        id="stock_exchange_target"
                        name="stock_exchange_target"
                        value={formData.stock_exchange_target}
                        onChange={handleInputChange}
                        error={!!errors.stock_exchange_target}
                        placeholder="Select Stock Exchange"
                      >
                        {STOCK_EXCHANGES.map((exchange) => (
                          <option key={exchange.value} value={exchange.value}>
                            {exchange.label}
                          </option>
                        ))}
                      </StyledDropdown>
                      {errors.stock_exchange_target && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.stock_exchange_target}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Control Specific Fields */}
              {formData.business_case_type.includes('Cost Control') && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Cost Control Details
                  </h3>
                  <div>
                    <label
                      htmlFor="cost_savings_target"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Annual Cost Savings Target ($)
                    </label>
                    <input
                      type="number"
                      id="cost_savings_target"
                      name="cost_savings_target"
                      value={formData.cost_savings_target}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter expected annual savings"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Financial Data */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Financial Information
                </h2>
                <p className="text-gray-600">
                  Enter investment amounts and project timeline
                </p>
              </div>
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <input
                  type="checkbox"
                  id="is_in_budget"
                  name="is_in_budget"
                  checked={formData.is_in_budget}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_in_budget"
                  className="ml-2 block text-sm font-medium text-blue-900"
                >
                  Is In Budget
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Financial Inputs */}
              <div className="lg:col-span-2 space-y-8">
                {/* Currency and Basic Financials */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                    <DollarSign className="w-5 h-5 mr-3 text-blue-600" />
                    Investment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="currency"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Currency
                      </label>
                      <StyledDropdown
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </StyledDropdown>
                    </div>

                    <div>
                      <label
                        htmlFor="capex"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Capital Expenditure (CapEx) * (
                        {getCurrencySymbol(formData.currency)})
                      </label>
                      <input
                        type="number"
                        id="capex"
                        name="capex"
                        value={formData.capex}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.capex ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      {errors.capex && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.capex}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="opex"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Operating Expenditure (OpEx) * (
                        {getCurrencySymbol(formData.currency)})
                      </label>
                      <input
                        type="number"
                        id="opex"
                        name="opex"
                        value={formData.opex}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.opex ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      {errors.opex && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.opex}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Cost ({getCurrencySymbol(formData.currency)})
                      </label>
                      <div className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg text-center">
                        {formatCurrencyAmount(totalCost, formData.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-green-900 mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-green-600" />
                    Project Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="start_year"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Start Year
                      </label>
                      <input
                        type="number"
                        id="start_year"
                        name="start_year"
                        value={formData.start_year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 10}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="end_year"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        End Year
                      </label>
                      <input
                        type="number"
                        id="end_year"
                        name="end_year"
                        value={formData.end_year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min={formData.start_year}
                        max={new Date().getFullYear() + 15}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded-xl">
                    <div className="text-sm text-green-800">
                      <strong>Project Duration:</strong>{' '}
                      {formData.end_year - formData.start_year + 1} year
                      {formData.end_year - formData.start_year + 1 > 1
                        ? 's'
                        : ''}
                    </div>
                  </div>
                </div>

                {/* Multi-year breakdown */}
                {getYearRange().length > 1 && (
                  <div
                    className={`bg-gradient-to-br from-purple-50 to-indigo-50 border rounded-2xl p-6 shadow-sm ${
                      errors.yearly_breakdown
                        ? 'border-red-300 bg-red-50'
                        : 'border-purple-200'
                    }`}
                  >
                    <h3 className="text-lg font-bold text-purple-900 mb-6 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-3 text-purple-600" />
                      Yearly Investment Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                      <table
                        className={`min-w-full divide-y divide-purple-200 border rounded-xl bg-white shadow-sm ${
                          errors.yearly_breakdown
                            ? 'border-red-300'
                            : 'border-purple-200'
                        }`}
                      >
                        <thead className="bg-gradient-to-r from-purple-500 to-indigo-500">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Year
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              CapEx ({getCurrencySymbol(formData.currency)})
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              OpEx ({getCurrencySymbol(formData.currency)})
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                              Total ({getCurrencySymbol(formData.currency)})
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-purple-100">
                          {getYearRange().map((year) => {
                            const yearData = formData.yearly_breakdown[
                              year
                            ] || {
                              capex: 0,
                              opex: 0,
                            };
                            return (
                              <tr
                                key={year}
                                className={`hover:bg-purple-50 transition-colors ${
                                  errors.yearly_breakdown
                                    ? 'hover:bg-red-50'
                                    : ''
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {year}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={yearData.capex || ''}
                                    onChange={(e) =>
                                      handleYearlyBreakdownChange(
                                        year,
                                        'capex',
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                      errors.yearly_breakdown
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={yearData.opex || ''}
                                    onChange={(e) =>
                                      handleYearlyBreakdownChange(
                                        year,
                                        'opex',
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                      errors.yearly_breakdown
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatCurrencyAmount(
                                    yearData.capex + yearData.opex,
                                    formData.currency,
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {errors.yearly_breakdown && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                          <p className="text-red-700 text-sm">
                            {errors.yearly_breakdown}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Budget Summary */}
                    {formData.is_in_budget && getYearRange().length > 1 && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">
                          Budget Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Total Budget:</span>
                            <span className="font-semibold text-blue-900">
                              {formatCurrencyAmount(
                                (parseFloat(formData.capex) || 0) +
                                  (parseFloat(formData.opex) || 0),
                                formData.currency,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">
                              Yearly Breakdown Total:
                            </span>
                            <span
                              className={`font-semibold ${
                                Object.values(formData.yearly_breakdown).reduce(
                                  (sum, yearData) =>
                                    sum +
                                    (yearData.capex || 0) +
                                    (yearData.opex || 0),
                                  0,
                                ) >
                                (parseFloat(formData.capex) || 0) +
                                  (parseFloat(formData.opex) || 0)
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {formatCurrencyAmount(
                                Object.values(formData.yearly_breakdown).reduce(
                                  (sum, yearData) =>
                                    sum +
                                    (yearData.capex || 0) +
                                    (yearData.opex || 0),
                                  0,
                                ),
                                formData.currency,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Validation Panel */}
              <div className="lg:col-span-1">
                <ValidationPanel
                  capex={parseFloat(formData.capex) || 0}
                  opex={parseFloat(formData.opex) || 0}
                  totalCost={totalCost}
                  category={formData.category}
                  currency={formData.currency}
                  onValidationChange={setValidationResult}
                />
              </div>
            </div>

            {/* Validation Error Summary */}
            {validationResult && !validationResult.isValid && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-4 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-red-800 font-bold text-lg mb-3">
                      Validation Errors
                    </h3>
                    <ul className="text-red-700 text-sm space-y-2">
                      {validationResult.errors.map(
                        (error: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {error}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: KPIs & Analysis */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Key Performance Indicators
                </h2>
                <p className="text-gray-600">
                  Calculate and review financial metrics for your investment
                </p>
              </div>
              <button
                type="button"
                onClick={calculateFinancials}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate KPIs
              </button>
            </div>

            {/* Discount Rate Input */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-3 text-blue-600" />
                Discount Rate Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label
                    htmlFor="discount_rate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Discount Rate (Cost of Capital) (%)
                  </label>
                  <input
                    type="number"
                    id="discount_rate"
                    name="discount_rate"
                    value={formData.discount_rate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="10.0"
                    step="0.1"
                    min="0"
                    max="50"
                  />
                  <p className="text-sm text-gray-600 mt-2 p-3 bg-blue-100 rounded-lg">
                    {formData.business_case_type.length > 0
                      ? `Default rate for ${formData.business_case_type.join(
                          ', ',
                        )}: ${(
                          getDefaultDiscountRate(formData.business_case_type) *
                          100
                        ).toFixed(1)}%`
                      : 'Enter your cost of capital or leave blank for default rate'}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center bg-white p-6 rounded-2xl shadow-sm border border-blue-200">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {formData.discount_rate
                        ? parseFloat(formData.discount_rate).toFixed(1)
                        : (
                            getDefaultDiscountRate(
                              formData.business_case_type,
                            ) * 100
                          ).toFixed(1)}
                      %
                    </div>
                    <div className="text-sm font-semibold text-blue-700">
                      Effective Rate
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Used for NPV calculations
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-3 text-slate-600" />
                Financial Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <label
                    htmlFor="irr"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Internal Rate of Return (IRR) (%)
                  </label>
                  <input
                    type="number"
                    id="irr"
                    name="irr"
                    value={formData.irr}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg font-semibold"
                    placeholder="0.0"
                    step="0.1"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Annualized return rate
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <label
                    htmlFor="npv"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Net Present Value (NPV) (
                    {getCurrencySymbol(formData.currency)})
                  </label>
                  <input
                    type="number"
                    id="npv"
                    name="npv"
                    value={formData.npv}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg font-semibold"
                    placeholder="0"
                    step="1"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Present value of cash flows
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <label
                    htmlFor="payback_period"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Payback Period (Years)
                  </label>
                  <input
                    type="number"
                    id="payback_period"
                    name="payback_period"
                    value={formData.payback_period}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg font-semibold"
                    placeholder="0.0"
                    step="0.1"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Time to recover investment
                  </div>
                </div>
              </div>
            </div>

            {/* Calculation Basis */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-3 text-green-600" />
                Calculation Basis
              </h3>
              <div>
                <label
                  htmlFor="basis_of_calculation"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Basis of Calculation
                </label>
                <textarea
                  id="basis_of_calculation"
                  name="basis_of_calculation"
                  rows={4}
                  value={formData.basis_of_calculation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Explain the basis for your financial calculations and assumptions"
                />
              </div>
            </div>

            {/* ESG Impact Summary */}
            {esgImpactResult && formData.business_case_type.includes('ESG') && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-green-900 mb-6 flex items-center">
                  <Leaf className="w-5 h-5 mr-3 text-green-600" />
                  ESG Impact Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {esgImpactResult.totalEmissions.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-700">tons CO₂e</div>
                    <div className="text-xs text-gray-600">Total Emissions</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {esgImpactResult.reductionPotential.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-700">tons CO₂e</div>
                    <div className="text-xs text-gray-600">
                      Reduction Potential
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      ${formatNumber(esgImpactResult.offsetCost)}
                    </div>
                    <div className="text-sm text-green-700">USD</div>
                    <div className="text-xs text-gray-600">Offset Cost</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {esgImpactResult.esgScore}/100
                    </div>
                    <div className="text-sm text-green-700">ESG Score</div>
                    <div className="text-xs text-gray-600">Impact Rating</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Compliance */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Compliance Checklist
              </h2>
              <div className="text-sm text-gray-600">
                {checklistComplete}/6 Complete
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="strategic_fit"
                  name="strategic_fit"
                  checked={formData.strategic_fit}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <label
                    htmlFor="strategic_fit"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Strategic Fit
                  </label>
                  <p className="text-sm text-gray-600">
                    Project aligns with company strategy and objectives
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="risk_assessment"
                  name="risk_assessment"
                  checked={formData.risk_assessment}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <label
                    htmlFor="risk_assessment"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Risk Assessment
                  </label>
                  <p className="text-sm text-gray-600">
                    Comprehensive risk analysis has been completed
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="supply_plan"
                  name="supply_plan"
                  checked={formData.supply_plan}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <label
                    htmlFor="supply_plan"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Supply Plan
                  </label>
                  <p className="text-sm text-gray-600">
                    Supply chain plan has been verified and approved
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="legal_fit"
                  name="legal_fit"
                  checked={formData.legal_fit}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <label
                    htmlFor="legal_fit"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    Legal Fit
                  </label>
                  <p className="text-sm text-gray-600">
                    Legal requirements and compliance have been reviewed
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="it_fit"
                  name="it_fit"
                  checked={formData.it_fit}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <label
                    htmlFor="it_fit"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    IT Fit
                  </label>
                  <p className="text-sm text-gray-600">
                    IT compatibility and integration have been assessed
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="hsseq_compliance"
                  name="hsseq_compliance"
                  checked={formData.hsseq_compliance}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <label
                    htmlFor="hsseq_compliance"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    HSSEQ Compliance
                  </label>
                  <p className="text-sm text-gray-600">
                    Health, Safety, Security, Environment & Quality compliance
                    verified
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span className="font-medium">Checklist Progress</span>
                <span className="font-semibold">
                  {Math.round((checklistComplete / 6) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(checklistComplete / 6) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Complete all checklist items before submitting your request
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-xl transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Draft' : 'Save as Draft'}
                </>
              )}
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {isEditing ? 'Update & Submit' : 'Submit Request'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitRequest;
