import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Calculator,
  TrendingDown,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Recycle,
  Droplets,
  Truck,
  Factory,
  ChevronDown,
  ChevronUp,
  Target,
  Globe,
  TreePine,
  Wind,
  Users,
  Cpu
} from 'lucide-react';
import {
  CarbonFootprintData,
  CarbonImpactResult,
  CarbonOffsetOption,
  ESGCalculator,
  formatEmissions,
  getEmissionCategory,
  getESGScoreColor
} from '../lib/esgCalculator';

interface ESGImpactCalculatorProps {
  onDataChange?: (data: CarbonFootprintData, result: CarbonImpactResult) => void;
  initialData?: Partial<CarbonFootprintData>;
  projectAmount?: number;
}

const ESGImpactCalculator: React.FC<ESGImpactCalculatorProps> = ({
  onDataChange,
  initialData,
  projectAmount = 0
}) => {
  const [carbonData, setCarbonData] = useState<CarbonFootprintData>({
    energyConsumption: {
      electricity: initialData?.energyConsumption?.electricity || 0,
      naturalGas: initialData?.energyConsumption?.naturalGas || 0,
      fuel: initialData?.energyConsumption?.fuel || 0
    },
    materials: {
      steel: initialData?.materials?.steel || 0,
      concrete: initialData?.materials?.concrete || 0,
      aluminum: initialData?.materials?.aluminum || 0,
      plastic: initialData?.materials?.plastic || 0
    },
    transportation: {
      shipping: initialData?.transportation?.shipping || 0,
      trucking: initialData?.transportation?.trucking || 0,
      airFreight: initialData?.transportation?.airFreight || 0
    },
    waste: {
      landfill: initialData?.waste?.landfill || 0,
      recycled: initialData?.waste?.recycled || 0,
      composted: initialData?.waste?.composted || 0
    },
    waterUsage: initialData?.waterUsage || 0,
    scope3Emissions: initialData?.scope3Emissions || 0
  });

  const [impactResult, setImpactResult] = useState<CarbonImpactResult | null>(null);
  const [offsetOptions, setOffsetOptions] = useState<CarbonOffsetOption[]>([]);
  const [selectedOffsets, setSelectedOffsets] = useState<Array<{ optionId: string; percentage: number }>>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('energy');
  const [showOffsetCalculator, setShowOffsetCalculator] = useState(false);

  useEffect(() => {
    calculateImpact();
  }, [carbonData]);

  useEffect(() => {
    if (impactResult) {
      const options = ESGCalculator.getOffsetRecommendations(impactResult.totalEmissions);
      setOffsetOptions(options.slice(0, 6)); // Show top 6 options
    }
  }, [impactResult]);

  const calculateImpact = () => {
    const result = ESGCalculator.calculateCarbonFootprint(carbonData);
    setImpactResult(result);
    
    if (onDataChange) {
      onDataChange(carbonData, result);
    }
  };

  const updateCarbonData = (section: keyof CarbonFootprintData, field: string, value: number) => {
    setCarbonData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' ? {
        ...prev[section],
        [field]: value
      } : value
    }));
  };

  const handleOffsetSelection = (optionId: string, percentage: number) => {
    setSelectedOffsets(prev => {
      const existing = prev.find(s => s.optionId === optionId);
      if (existing) {
        return prev.map(s => s.optionId === optionId ? { ...s, percentage } : s);
      } else {
        return [...prev, { optionId, percentage }];
      }
    });
  };

  const calculateOffsetPortfolio = () => {
    if (!impactResult || selectedOffsets.length === 0) return null;
    
    const totalPercentage = selectedOffsets.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage === 0) return null;

    return ESGCalculator.calculateOffsetPortfolio(impactResult.totalEmissions, selectedOffsets);
  };

  const getOffsetTypeIcon = (type: CarbonOffsetOption['type']) => {
    switch (type) {
      case 'forestry': return <TreePine className="w-4 h-4" />;
      case 'renewable': return <Wind className="w-4 h-4" />;
      case 'technology': return <Cpu className="w-4 h-4" />;
      case 'community': return <Users className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const offsetPortfolio = calculateOffsetPortfolio();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Leaf className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-xl font-bold">ESG Impact Calculator</h3>
              <p className="text-green-100">Calculate carbon footprint and explore offset options</p>
            </div>
          </div>
          {impactResult && (
            <div className="text-right">
              <div className="text-2xl font-bold">{formatEmissions(impactResult.totalEmissions)}</div>
              <div className="text-green-100 text-sm">Total Emissions</div>
            </div>
          )}
        </div>
      </div>

      {/* Impact Summary */}
      {impactResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Emissions</p>
                <p className="text-lg font-bold text-gray-900">{formatEmissions(impactResult.totalEmissions)}</p>
              </div>
              <div className={`p-2 rounded-lg ${getEmissionCategory(impactResult.totalEmissions).color}`}>
                <Factory className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reduction Potential</p>
                <p className="text-lg font-bold text-green-600">{formatEmissions(impactResult.reductionPotential)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offset Cost</p>
                <p className="text-lg font-bold text-blue-600">${impactResult.offsetCost.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ESG Score</p>
                <p className="text-lg font-bold">{impactResult.esgScore}/100</p>
              </div>
              <div className={`p-2 rounded-lg ${getESGScoreColor(impactResult.esgScore)}`}>
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Sections */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Carbon Footprint Inputs
          </h4>
          <p className="text-sm text-gray-600 mt-1">Enter project data to calculate environmental impact</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Energy Consumption */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedSection(expandedSection === 'energy' ? null : 'energy')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-600 mr-3" />
                <span className="font-medium">Energy Consumption</span>
                {impactResult && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({formatEmissions(impactResult.breakdown.energy)})
                  </span>
                )}
              </div>
              {expandedSection === 'energy' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSection === 'energy' && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Electricity (kWh/year)
                    </label>
                    <input
                      type="number"
                      value={carbonData.energyConsumption.electricity}
                      onChange={(e) => updateCarbonData('energyConsumption', 'electricity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Natural Gas (therms/year)
                    </label>
                    <input
                      type="number"
                      value={carbonData.energyConsumption.naturalGas}
                      onChange={(e) => updateCarbonData('energyConsumption', 'naturalGas', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel (gallons/year)
                    </label>
                    <input
                      type="number"
                      value={carbonData.energyConsumption.fuel}
                      onChange={(e) => updateCarbonData('energyConsumption', 'fuel', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Materials */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedSection(expandedSection === 'materials' ? null : 'materials')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Factory className="w-5 h-5 text-gray-600 mr-3" />
                <span className="font-medium">Materials</span>
                {impactResult && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({formatEmissions(impactResult.breakdown.materials)})
                  </span>
                )}
              </div>
              {expandedSection === 'materials' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSection === 'materials' && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Steel (tons)
                    </label>
                    <input
                      type="number"
                      value={carbonData.materials.steel}
                      onChange={(e) => updateCarbonData('materials', 'steel', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concrete (tons)
                    </label>
                    <input
                      type="number"
                      value={carbonData.materials.concrete}
                      onChange={(e) => updateCarbonData('materials', 'concrete', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aluminum (tons)
                    </label>
                    <input
                      type="number"
                      value={carbonData.materials.aluminum}
                      onChange={(e) => updateCarbonData('materials', 'aluminum', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plastic (tons)
                    </label>
                    <input
                      type="number"
                      value={carbonData.materials.plastic}
                      onChange={(e) => updateCarbonData('materials', 'plastic', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transportation */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedSection(expandedSection === 'transportation' ? null : 'transportation')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Truck className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium">Transportation</span>
                {impactResult && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({formatEmissions(impactResult.breakdown.transportation)})
                  </span>
                )}
              </div>
              {expandedSection === 'transportation' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expandedSection === 'transportation' && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping (miles)
                    </label>
                    <input
                      type="number"
                      value={carbonData.transportation.shipping}
                      onChange={(e) => updateCarbonData('transportation', 'shipping', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trucking (miles)
                    </label>
                    <input
                      type="number"
                      value={carbonData.transportation.trucking}
                      onChange={(e) => updateCarbonData('transportation', 'trucking', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Air Freight (miles)
                    </label>
                    <input
                      type="number"
                      value={carbonData.transportation.airFreight}
                      onChange={(e) => updateCarbonData('transportation', 'airFreight', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Waste & Water */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setExpandedSection(expandedSection === 'waste' ? null : 'waste')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Recycle className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium">Waste</span>
                  {impactResult && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({formatEmissions(impactResult.breakdown.waste)})
                    </span>
                  )}
                </div>
                {expandedSection === 'waste' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {expandedSection === 'waste' && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Landfill (tons)
                      </label>
                      <input
                        type="number"
                        value={carbonData.waste.landfill}
                        onChange={(e) => updateCarbonData('waste', 'landfill', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recycled (tons)
                      </label>
                      <input
                        type="number"
                        value={carbonData.waste.recycled}
                        onChange={(e) => updateCarbonData('waste', 'recycled', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Composted (tons)
                      </label>
                      <input
                        type="number"
                        value={carbonData.waste.composted}
                        onChange={(e) => updateCarbonData('waste', 'composted', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <Droplets className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium">Water Usage</span>
                  {impactResult && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({formatEmissions(impactResult.breakdown.water)})
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Water Usage (gallons/year)
                  </label>
                  <input
                    type="number"
                    value={carbonData.waterUsage}
                    onChange={(e) => updateCarbonData('waterUsage', '', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {impactResult && impactResult.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {impactResult.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start text-blue-800">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Carbon Offset Options */}
      {impactResult && impactResult.totalEmissions > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Carbon Offset Options
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Achieve net-zero emissions by purchasing carbon offsets
                </p>
              </div>
              <button
                onClick={() => setShowOffsetCalculator(!showOffsetCalculator)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {showOffsetCalculator ? 'Hide Calculator' : 'Show Calculator'}
              </button>
            </div>
          </div>

          {showOffsetCalculator && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {offsetOptions.map((option) => (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          {getOffsetTypeIcon(option.type)}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{option.name}</h5>
                          <p className="text-xs text-gray-500">{option.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${option.pricePerTon}
                        </div>
                        <div className="text-xs text-gray-500">per ton</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{option.description}</p>
                    
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-1">Certification: {option.certification}</div>
                      <div className="text-xs text-gray-600">Delivery: {option.deliveryTimeframe}</div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Percentage of emissions to offset
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={selectedOffsets.find(s => s.optionId === option.id)?.percentage || 0}
                        onChange={(e) => handleOffsetSelection(option.id, parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span className="font-medium">
                          {selectedOffsets.find(s => s.optionId === option.id)?.percentage || 0}%
                        </span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {option.additionalBenefits.slice(0, 2).map((benefit, index) => (
                        <span key={index} className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {benefit}
                        </span>
                      ))}
                      {option.additionalBenefits.length > 2 && (
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{option.additionalBenefits.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Offset Portfolio Summary */}
              {offsetPortfolio && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-3">Offset Portfolio Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        ${offsetPortfolio.totalCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Total Cost</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {offsetPortfolio.breakdown.reduce((sum, item) => sum + item.tons, 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-green-700">Tons CO₂e Offset</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        ${offsetPortfolio.averagePricePerTon}
                      </div>
                      <div className="text-sm text-green-700">Avg Price/Ton</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {offsetPortfolio.totalAdditionalBenefits.length}
                      </div>
                      <div className="text-sm text-green-700">Co-benefits</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {offsetPortfolio.breakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                        <div className="flex items-center">
                          <div className="p-1 bg-green-100 rounded mr-3">
                            {getOffsetTypeIcon(item.option.type)}
                          </div>
                          <div>
                            <div className="font-medium">{item.option.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.tons} tons CO₂e ({item.percentage}%)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${item.cost.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {offsetPortfolio.totalAdditionalBenefits.length > 0 && (
                    <div className="mt-4">
                      <h6 className="font-medium text-green-900 mb-2">Additional Benefits</h6>
                      <div className="flex flex-wrap gap-2">
                        {offsetPortfolio.totalAdditionalBenefits.map((benefit, index) => (
                          <span key={index} className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ESGImpactCalculator;