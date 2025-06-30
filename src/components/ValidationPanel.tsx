import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle,
  DollarSign,
  Info,
  Shield,
} from 'lucide-react';
import React from 'react';
import { formatNumber, getCurrencySymbol } from '../lib/supabase';
import { ValidationResult, getValidationSummary } from '../lib/validationRules';

interface ValidationPanelProps {
  capex: number;
  opex: number;
  totalCost: number;
  category: string;
  currency: string;
  onValidationChange?: (result: ValidationResult) => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  capex,
  opex,
  totalCost,
  category,
  currency,
  onValidationChange,
}) => {
  const validationData = {
    capex,
    opex,
    totalCost,
    projectType: category,
    category,
    currency,
  };

  const validationResult = getValidationSummary(validationData);
  const { totalRules, passedRules, failedRules, applicableRules } =
    validationResult;

  // Get validation status
  const isFullyValid = failedRules === 0;
  const hasWarnings = totalRules > passedRules;
  const progressPercentage =
    totalRules > 0 ? (passedRules / totalRules) * 100 : 100;

  // Get currency-specific thresholds
  const getCurrencyThresholds = () => {
    const thresholds = {
      USD: { high: 10000000, small: 500000 },
      EUR: { high: 8500000, small: 425000 },
      GBP: { high: 7300000, small: 365000 },
      JPY: { high: 1500000000, small: 75000000 },
      CAD: { high: 12500000, small: 625000 },
      AUD: { high: 13500000, small: 675000 },
    };
    return thresholds[currency as keyof typeof thresholds] || thresholds.USD;
  };

  const thresholds = getCurrencyThresholds();

  // Notify parent component of validation changes
  React.useEffect(() => {
    if (onValidationChange) {
      const result: ValidationResult = {
        isValid: isFullyValid,
        errors: applicableRules
          .filter((rule) => !rule.condition(validationData))
          .map((rule) => {
            const errorMessage =
              typeof rule.errorMessage === 'function'
                ? rule.errorMessage(validationData)
                : rule.errorMessage;
            return errorMessage;
          }),
        warnings: [],
      };
      onValidationChange(result);
    }
  }, [capex, opex, totalCost, category, currency, onValidationChange]);

  const getStatusIcon = () => {
    if (isFullyValid) {
      return <Award className="w-5 h-5 text-green-600" />;
    } else if (hasWarnings) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = () => {
    if (isFullyValid) {
      return 'All rules passed';
    } else if (hasWarnings) {
      return `${failedRules} rule${failedRules > 1 ? 's' : ''} failed`;
    } else {
      return 'Validation failed';
    }
  };

  return (
    <div className="space-y-4">
      {/* Minimal Validation Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2 text-sm font-medium text-gray-900">
              {getStatusText()}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {passedRules}/{totalRules}
          </span>
        </div>

        {/* Simple Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isFullyValid
                ? 'bg-green-500'
                : hasWarnings
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Minimal Cost Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <DollarSign className="w-4 h-4 mr-2 text-gray-600" />
          Cost Breakdown
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CAPEX:</span>
            <span className="font-medium">
              {getCurrencySymbol(currency)}
              {formatNumber(capex)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">OPEX:</span>
            <span className="font-medium">
              {getCurrencySymbol(currency)}
              {formatNumber(opex)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between text-sm font-semibold">
            <span className="text-gray-900">Total:</span>
            <span className="text-blue-600">
              {getCurrencySymbol(currency)}
              {formatNumber(totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Minimal Validation Rules */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-gray-600" />
          Validation Rules
        </h4>
        <div className="space-y-2">
          {applicableRules.map((rule) => {
            const isPassed = rule.condition(validationData);
            return (
              <div
                key={rule.id}
                className={`flex items-start p-2 rounded-lg text-sm ${
                  isPassed ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isPassed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="ml-2 flex-1">
                  <div className="text-gray-900 font-medium">
                    {rule.description}
                  </div>
                  {!isPassed && (
                    <div className="text-red-700 text-xs mt-1">
                      {typeof rule.errorMessage === 'function'
                        ? rule.errorMessage(validationData)
                        : rule.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimal Business Insights */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2 text-gray-600" />
          Insights
        </h4>
        <div className="space-y-2 text-sm">
          {category === 'Infrastructure' && (
            <div className="text-blue-700 bg-blue-50 p-2 rounded">
              Infrastructure projects typically require significant CAPEX
            </div>
          )}
          {category === 'R&D' && (
            <div className="text-blue-700 bg-blue-50 p-2 rounded">
              R&D projects focus on operational costs
            </div>
          )}
          {category === 'Maintenance' && (
            <div className="text-blue-700 bg-blue-50 p-2 rounded">
              Maintenance projects should be OPEX-only
            </div>
          )}
          {totalCost > thresholds.high && capex === 0 && (
            <div className="text-yellow-700 bg-yellow-50 p-2 rounded">
              Large projects typically require CAPEX
            </div>
          )}
          {totalCost < thresholds.small && capex > 0 && (
            <div className="text-yellow-700 bg-yellow-50 p-2 rounded">
              Small projects are typically OPEX-only
            </div>
          )}
        </div>
      </div>

      {/* Minimal Threshold Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Thresholds</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            High-value: {getCurrencySymbol(currency)}
            {formatNumber(thresholds.high)}+
          </div>
          <div>
            Small projects: {getCurrencySymbol(currency)}
            {formatNumber(thresholds.small)}-
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPanel;
