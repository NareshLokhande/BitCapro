// ESG Impact Calculator
export interface CarbonFootprintData {
  energyConsumption: {
    electricity: number; // kWh per year
    naturalGas: number; // therms per year
    fuel: number; // gallons per year
  };
  materials: {
    steel: number; // tons
    concrete: number; // tons
    aluminum: number; // tons
    plastic: number; // tons
  };
  transportation: {
    shipping: number; // miles
    trucking: number; // miles
    airFreight: number; // miles
  };
  waste: {
    landfill: number; // tons
    recycled: number; // tons
    composted: number; // tons
  };
  waterUsage: number; // gallons per year
  scope3Emissions: number; // tons CO2e (optional, for advanced users)
}

export interface CarbonImpactResult {
  totalEmissions: number; // tons CO2e per year
  breakdown: {
    energy: number;
    materials: number;
    transportation: number;
    waste: number;
    water: number;
    scope3: number;
  };
  reductionPotential: number; // tons CO2e that could be reduced
  offsetCost: number; // USD to offset emissions
  esgScore: number; // 0-100 ESG impact score
  recommendations: string[];
}

export interface CarbonOffsetOption {
  id: string;
  name: string;
  type: 'forestry' | 'renewable' | 'technology' | 'community';
  pricePerTon: number; // USD per ton CO2e
  description: string;
  certification: string;
  location: string;
  additionalBenefits: string[];
  minimumPurchase: number; // tons
  deliveryTimeframe: string;
}

// Carbon emission factors (tons CO2e per unit)
const EMISSION_FACTORS = {
  electricity: 0.000709, // per kWh (US average)
  naturalGas: 0.0053, // per therm
  gasoline: 0.00887, // per gallon
  diesel: 0.01021, // per gallon
  steel: 1.85, // per ton
  concrete: 0.93, // per ton
  aluminum: 11.09, // per ton
  plastic: 1.8, // per ton
  shipping: 0.000021, // per mile
  trucking: 0.000161, // per mile
  airFreight: 0.000678, // per mile
  landfillWaste: 0.57, // per ton
  water: 0.000004, // per gallon
};

// Carbon offset options database
const CARBON_OFFSET_OPTIONS: CarbonOffsetOption[] = [
  {
    id: 'forest-conservation',
    name: 'Forest Conservation Project',
    type: 'forestry',
    pricePerTon: 12,
    description: 'Protect existing forests from deforestation in the Amazon rainforest',
    certification: 'Verified Carbon Standard (VCS)',
    location: 'Brazil',
    additionalBenefits: ['Biodiversity protection', 'Indigenous community support', 'Water conservation'],
    minimumPurchase: 1,
    deliveryTimeframe: '3-6 months'
  },
  {
    id: 'reforestation',
    name: 'Reforestation Initiative',
    type: 'forestry',
    pricePerTon: 18,
    description: 'Plant new trees in degraded agricultural land',
    certification: 'Gold Standard',
    location: 'Kenya',
    additionalBenefits: ['Soil restoration', 'Local employment', 'Wildlife habitat creation'],
    minimumPurchase: 5,
    deliveryTimeframe: '6-12 months'
  },
  {
    id: 'wind-energy',
    name: 'Wind Energy Development',
    type: 'renewable',
    pricePerTon: 25,
    description: 'Support new wind farm construction in developing regions',
    certification: 'Clean Development Mechanism (CDM)',
    location: 'India',
    additionalBenefits: ['Clean energy access', 'Job creation', 'Energy independence'],
    minimumPurchase: 10,
    deliveryTimeframe: '1-2 months'
  },
  {
    id: 'solar-cookstoves',
    name: 'Solar Cookstove Distribution',
    type: 'community',
    pricePerTon: 22,
    description: 'Distribute solar cookstoves to replace wood-burning stoves',
    certification: 'Gold Standard',
    location: 'Uganda',
    additionalBenefits: ['Health improvements', 'Women empowerment', 'Deforestation reduction'],
    minimumPurchase: 2,
    deliveryTimeframe: '2-4 months'
  },
  {
    id: 'direct-air-capture',
    name: 'Direct Air Capture Technology',
    type: 'technology',
    pricePerTon: 150,
    description: 'Advanced technology that directly removes CO2 from the atmosphere',
    certification: 'Puro.earth',
    location: 'Iceland',
    additionalBenefits: ['Permanent storage', 'Technology advancement', 'Scalable solution'],
    minimumPurchase: 1,
    deliveryTimeframe: '1 month'
  },
  {
    id: 'biochar-production',
    name: 'Biochar Production',
    type: 'technology',
    pricePerTon: 45,
    description: 'Convert agricultural waste into biochar for soil improvement',
    certification: 'Verified Carbon Standard (VCS)',
    location: 'United States',
    additionalBenefits: ['Soil health improvement', 'Agricultural productivity', 'Waste reduction'],
    minimumPurchase: 5,
    deliveryTimeframe: '2-3 months'
  }
];

export class ESGCalculator {
  
  // Calculate carbon footprint from input data
  static calculateCarbonFootprint(data: CarbonFootprintData): CarbonImpactResult {
    const breakdown = {
      energy: this.calculateEnergyEmissions(data.energyConsumption),
      materials: this.calculateMaterialEmissions(data.materials),
      transportation: this.calculateTransportationEmissions(data.transportation),
      waste: this.calculateWasteEmissions(data.waste),
      water: this.calculateWaterEmissions(data.waterUsage),
      scope3: data.scope3Emissions || 0
    };

    const totalEmissions = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    
    // Calculate reduction potential (typically 20-40% for most projects)
    const reductionPotential = totalEmissions * 0.3;
    
    // Calculate offset cost (average $25/ton)
    const offsetCost = totalEmissions * 25;
    
    // Calculate ESG score (0-100, higher is better)
    const esgScore = this.calculateESGScore(totalEmissions, reductionPotential, data);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(breakdown, data);

    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      breakdown: {
        energy: Math.round(breakdown.energy * 100) / 100,
        materials: Math.round(breakdown.materials * 100) / 100,
        transportation: Math.round(breakdown.transportation * 100) / 100,
        waste: Math.round(breakdown.waste * 100) / 100,
        water: Math.round(breakdown.water * 100) / 100,
        scope3: Math.round(breakdown.scope3 * 100) / 100
      },
      reductionPotential: Math.round(reductionPotential * 100) / 100,
      offsetCost: Math.round(offsetCost),
      esgScore: Math.round(esgScore),
      recommendations
    };
  }

  // Get carbon offset recommendations
  static getOffsetRecommendations(
    emissionsToOffset: number,
    budget?: number,
    preferences?: {
      type?: CarbonOffsetOption['type'];
      location?: string;
      certification?: string;
    }
  ): CarbonOffsetOption[] {
    let options = [...CARBON_OFFSET_OPTIONS];

    // Filter by preferences
    if (preferences?.type) {
      options = options.filter(option => option.type === preferences.type);
    }

    if (preferences?.location) {
      options = options.filter(option => 
        option.location.toLowerCase().includes(preferences.location!.toLowerCase())
      );
    }

    if (preferences?.certification) {
      options = options.filter(option => 
        option.certification.toLowerCase().includes(preferences.certification!.toLowerCase())
      );
    }

    // Filter by budget if provided
    if (budget) {
      options = options.filter(option => 
        option.pricePerTon * emissionsToOffset <= budget
      );
    }

    // Filter by minimum purchase requirements
    options = options.filter(option => 
      emissionsToOffset >= option.minimumPurchase
    );

    // Sort by price (lowest first) and then by additional benefits
    options.sort((a, b) => {
      const costA = a.pricePerTon * emissionsToOffset;
      const costB = b.pricePerTon * emissionsToOffset;
      if (costA !== costB) return costA - costB;
      return b.additionalBenefits.length - a.additionalBenefits.length;
    });

    return options;
  }

  // Calculate total offset cost for multiple options
  static calculateOffsetPortfolio(
    emissionsToOffset: number,
    selectedOptions: Array<{ optionId: string; percentage: number }>
  ): {
    totalCost: number;
    breakdown: Array<{
      option: CarbonOffsetOption;
      tons: number;
      cost: number;
      percentage: number;
    }>;
    averagePricePerTon: number;
    totalAdditionalBenefits: string[];
  } {
    const breakdown = selectedOptions.map(selection => {
      const option = CARBON_OFFSET_OPTIONS.find(opt => opt.id === selection.optionId);
      if (!option) throw new Error(`Option ${selection.optionId} not found`);
      
      const tons = (emissionsToOffset * selection.percentage) / 100;
      const cost = tons * option.pricePerTon;
      
      return {
        option,
        tons: Math.round(tons * 100) / 100,
        cost: Math.round(cost),
        percentage: selection.percentage
      };
    });

    const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
    const averagePricePerTon = totalCost / emissionsToOffset;
    
    // Collect unique additional benefits
    const allBenefits = breakdown.flatMap(item => item.option.additionalBenefits);
    const totalAdditionalBenefits = [...new Set(allBenefits)];

    return {
      totalCost: Math.round(totalCost),
      breakdown,
      averagePricePerTon: Math.round(averagePricePerTon * 100) / 100,
      totalAdditionalBenefits
    };
  }

  // Private helper methods
  private static calculateEnergyEmissions(energy: CarbonFootprintData['energyConsumption']): number {
    return (
      energy.electricity * EMISSION_FACTORS.electricity +
      energy.naturalGas * EMISSION_FACTORS.naturalGas +
      energy.fuel * EMISSION_FACTORS.gasoline
    );
  }

  private static calculateMaterialEmissions(materials: CarbonFootprintData['materials']): number {
    return (
      materials.steel * EMISSION_FACTORS.steel +
      materials.concrete * EMISSION_FACTORS.concrete +
      materials.aluminum * EMISSION_FACTORS.aluminum +
      materials.plastic * EMISSION_FACTORS.plastic
    );
  }

  private static calculateTransportationEmissions(transport: CarbonFootprintData['transportation']): number {
    return (
      transport.shipping * EMISSION_FACTORS.shipping +
      transport.trucking * EMISSION_FACTORS.trucking +
      transport.airFreight * EMISSION_FACTORS.airFreight
    );
  }

  private static calculateWasteEmissions(waste: CarbonFootprintData['waste']): number {
    // Only landfill waste produces emissions; recycling and composting are carbon neutral or negative
    return waste.landfill * EMISSION_FACTORS.landfillWaste;
  }

  private static calculateWaterEmissions(waterUsage: number): number {
    return waterUsage * EMISSION_FACTORS.water;
  }

  private static calculateESGScore(
    totalEmissions: number,
    reductionPotential: number,
    data: CarbonFootprintData
  ): number {
    let score = 50; // Base score

    // Reward low emissions (per million dollars invested)
    if (totalEmissions < 100) score += 20;
    else if (totalEmissions < 500) score += 10;
    else if (totalEmissions > 1000) score -= 10;

    // Reward high reduction potential
    const reductionPercentage = (reductionPotential / totalEmissions) * 100;
    if (reductionPercentage > 40) score += 15;
    else if (reductionPercentage > 25) score += 10;
    else if (reductionPercentage < 10) score -= 5;

    // Reward sustainable practices
    const recyclingRate = data.waste.recycled / (data.waste.landfill + data.waste.recycled + data.waste.composted);
    if (recyclingRate > 0.7) score += 10;
    else if (recyclingRate > 0.5) score += 5;

    // Penalize high-emission materials
    if (data.materials.steel > 100 || data.materials.aluminum > 50) score -= 5;

    // Reward renewable energy indicators (low natural gas, high electricity from renewable sources)
    const gasToElectricityRatio = data.energyConsumption.naturalGas / data.energyConsumption.electricity;
    if (gasToElectricityRatio < 0.1) score += 10;
    else if (gasToElectricityRatio > 0.5) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private static generateRecommendations(
    breakdown: CarbonImpactResult['breakdown'],
    data: CarbonFootprintData
  ): string[] {
    const recommendations: string[] = [];
    const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    // Energy recommendations
    if (breakdown.energy / total > 0.4) {
      recommendations.push('Consider renewable energy sources to reduce energy-related emissions');
      if (data.energyConsumption.naturalGas > data.energyConsumption.electricity * 0.3) {
        recommendations.push('Electrify heating systems and switch to renewable electricity');
      }
    }

    // Materials recommendations
    if (breakdown.materials / total > 0.3) {
      recommendations.push('Explore low-carbon alternatives for high-emission materials');
      if (data.materials.steel > 50) {
        recommendations.push('Consider recycled steel or alternative structural materials');
      }
      if (data.materials.concrete > 100) {
        recommendations.push('Use low-carbon concrete mixes or alternative building materials');
      }
    }

    // Transportation recommendations
    if (breakdown.transportation / total > 0.2) {
      recommendations.push('Optimize logistics and consider local sourcing to reduce transportation emissions');
      if (data.transportation.airFreight > 1000) {
        recommendations.push('Minimize air freight and use sea/land transport where possible');
      }
    }

    // Waste recommendations
    if (breakdown.waste / total > 0.1) {
      recommendations.push('Implement comprehensive waste reduction and recycling programs');
      const recyclingRate = data.waste.recycled / (data.waste.landfill + data.waste.recycled + data.waste.composted);
      if (recyclingRate < 0.5) {
        recommendations.push('Increase recycling rate to reduce landfill emissions');
      }
    }

    // Water recommendations
    if (data.waterUsage > 100000) {
      recommendations.push('Implement water conservation measures and consider water recycling systems');
    }

    // General recommendations
    if (total > 500) {
      recommendations.push('Consider phasing the project to spread emissions over multiple years');
      recommendations.push('Explore carbon offset options to achieve net-zero emissions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Project shows good environmental performance - consider carbon offsets for net-zero impact');
    }

    return recommendations;
  }
}

// Utility functions for UI components
export const formatEmissions = (tons: number): string => {
  if (tons < 1) return `${(tons * 1000).toFixed(0)} kg CO₂e`;
  if (tons < 1000) return `${tons.toFixed(1)} tons CO₂e`;
  return `${(tons / 1000).toFixed(1)}k tons CO₂e`;
};

export const getEmissionCategory = (tons: number): {
  category: 'low' | 'medium' | 'high' | 'very-high';
  color: string;
  description: string;
} => {
  if (tons < 50) return {
    category: 'low',
    color: 'text-green-600 bg-green-100',
    description: 'Low environmental impact'
  };
  if (tons < 200) return {
    category: 'medium',
    color: 'text-yellow-600 bg-yellow-100',
    description: 'Moderate environmental impact'
  };
  if (tons < 500) return {
    category: 'high',
    color: 'text-orange-600 bg-orange-100',
    description: 'High environmental impact'
  };
  return {
    category: 'very-high',
    color: 'text-red-600 bg-red-100',
    description: 'Very high environmental impact'
  };
};

export const getESGScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-blue-600 bg-blue-100';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};