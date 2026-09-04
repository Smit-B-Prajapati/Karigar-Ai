import { getMarketPriceObservations } from './marketData.service.js';

/**
 * Validate and clean numeric cost input
 * @param {any} value 
 * @param {string} fieldName 
 * @returns {number}
 */
function validateNumericCost(value, fieldName) {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed * 100) / 100;
}

/**
 * Format price to realistic Indian e-commerce price points (ending in 99, 49, 90, 00)
 * @param {number} val 
 * @returns {number}
 */
function formatToPricePoint(val) {
  const rounded = Math.round(val);
  if (rounded <= 200) {
    return Math.round(rounded / 10) * 10;
  }
  if (rounded <= 1000) {
    // Round to nearest 49 or 99
    const baseHundred = Math.floor(rounded / 100) * 100;
    const remainder = rounded - baseHundred;
    if (remainder < 35) return baseHundred;
    if (remainder < 75) return baseHundred + 49;
    return baseHundred + 99;
  }
  // Above 1000: round to e.g. 1199, 1299, 1399, 1549, 1599
  const baseHundred = Math.floor(rounded / 100) * 100;
  const remainder = rounded - baseHundred;
  if (remainder < 30) return baseHundred - 1; // e.g. 1199
  if (remainder < 70) return baseHundred + 49; // e.g. 1249
  return baseHundred + 99; // e.g. 1299
}

/**
 * Calculate Craft & Material Value Signals
 * @param {string} material 
 * @param {string} craftType 
 * @param {string} description 
 * @returns {{ materialTier: string, craftComplexity: string, positioningMultiplier: number, reasons: string[] }}
 */
function analyzeProductValueSignals(material = '', craftType = '', description = '') {
  const cleanMat = (material || '').toLowerCase();
  const cleanCraft = (craftType || '').toLowerCase();
  const cleanDesc = (description || '').toLowerCase();

  let positioningMultiplier = 1.35; // Standard 35% base artisan margin
  let materialTier = 'Standard Artisan Grade';
  let craftComplexity = 'Traditional Handcrafted';
  const reasons = [];

  // Material Tier Analysis
  if (
    cleanMat.includes('silk') ||
    cleanMat.includes('pashmina') ||
    cleanMat.includes('brass') ||
    cleanMat.includes('bronze') ||
    cleanMat.includes('silver') ||
    cleanMat.includes('teak') ||
    cleanMat.includes('rosewood')
  ) {
    materialTier = 'Premium Authentic Material';
    positioningMultiplier += 0.08;
    reasons.push(`Premium material (${material || 'Artisan Material'}) warrants higher perceived value`);
  } else if (
    cleanMat.includes('cotton') ||
    cleanMat.includes('linen') ||
    cleanMat.includes('jute') ||
    cleanMat.includes('terracotta') ||
    cleanMat.includes('clay')
  ) {
    materialTier = 'Natural Organic Material';
    positioningMultiplier += 0.04;
    reasons.push(`Natural, eco-friendly material (${material || 'Handmade'}) with strong sustainable appeal`);
  }

  // Craft Complexity Analysis
  if (
    cleanCraft.includes('bandhani') ||
    cleanCraft.includes('pattachitra') ||
    cleanCraft.includes('dhokra') ||
    cleanCraft.includes('madhubani') ||
    cleanCraft.includes('filigree') ||
    cleanCraft.includes('zari') ||
    cleanCraft.includes('handloom') ||
    cleanDesc.includes('tie-dye') ||
    cleanDesc.includes('hand-painted')
  ) {
    craftComplexity = 'High-Skill Heritage Technique';
    positioningMultiplier += 0.08;
    reasons.push(`Intricate traditional technique (${craftType || 'Artisan Handcraft'}) requires intensive manual labor`);
  } else {
    reasons.push(`Handcrafted artisan technique (${craftType || 'Handmade'})`);
  }

  return {
    materialTier,
    craftComplexity,
    positioningMultiplier: Math.min(positioningMultiplier, 1.55),
    reasons,
  };
}

/**
 * Main Explainable Dynamic Pricing Engine
 * @param {object} input 
 * @returns {Promise<object>}
 */
export async function calculateDynamicPricing(input = {}) {
  const {
    materialCost = 0,
    labourCost = 0,
    packagingCost = 0,
    otherCost = 0,
    category = '',
    productType = 'Artisan Craft',
    material = '',
    craftType = '',
    description = '',
    keywords = [],
  } = input;

  // 1. Validate all cost components
  const validMaterial = validateNumericCost(materialCost, 'Material Cost');
  const validLabour = validateNumericCost(labourCost, 'Labour Cost');
  const validPackaging = validateNumericCost(packagingCost, 'Packaging Cost');
  const validOther = validateNumericCost(otherCost, 'Other Overhead');

  // Production Cost = Material + Labour + Packaging + Other Overhead
  const productionCost = Math.round((validMaterial + validLabour + validPackaging + validOther) * 100) / 100;

  if (productionCost <= 0) {
    throw new Error('Total production cost must be greater than zero to calculate pricing recommendations.');
  }

  // 2. Fetch real market observations from Market Data Service abstraction
  const marketResult = await getMarketPriceObservations({
    category,
    productType,
    craftType,
    material,
    keywords,
  });

  const hasMarketData = marketResult.available && marketResult.data !== null;
  const marketData = hasMarketData ? marketResult.data : null;

  // 3. Analyze Product Value Signals (Material & Craft Complexity)
  const valueSignals = analyzeProductValueSignals(material, craftType, description);

  // 4. Calculate Explainable Recommended, Minimum Viable, and Premium Prices
  let recommendedPrice = 0;
  let minimumPrice = 0;
  let premiumPrice = 0;
  let confidenceScore = 65; // Base confidence
  const explanationList = [];

  explanationList.push(`Production cost foundation: ₹${productionCost.toLocaleString('en-IN')} (Material ₹${validMaterial} + Labour ₹${validLabour} + Packaging ₹${validPackaging} + Overhead ₹${validOther})`);

  if (hasMarketData) {
    // Real Market Data Available: Blend cost-plus with market median
    const costBasedRecommended = productionCost * valueSignals.positioningMultiplier;
    
    // Anchor responsibly: ensure we don't price below cost + 25% margin, and align with market median
    const blendedPrice = Math.max(
      productionCost * 1.25,
      (costBasedRecommended * 0.45) + (marketData.medianPrice * 0.55)
    );

    recommendedPrice = formatToPricePoint(blendedPrice);
    
    // Minimum Viable: lower bound of market or cost + 15%
    const minRaw = Math.max(productionCost * 1.15, Math.min(marketData.minPrice, recommendedPrice * 0.88));
    minimumPrice = formatToPricePoint(minRaw);

    // Premium Price: upper tier based on craft heritage and market max
    const maxRaw = Math.max(recommendedPrice * 1.15, Math.min(marketData.maxPrice, recommendedPrice * 1.25));
    premiumPrice = formatToPricePoint(maxRaw);

    explanationList.push(`Verified market observations indicate a median of ₹${marketData.medianPrice.toLocaleString('en-IN')} (Range: ₹${marketData.minPrice.toLocaleString('en-IN')} – ₹${marketData.maxPrice.toLocaleString('en-IN')} based on ${marketData.sampleSize} comparable listings)`);
    explanationList.push(`Positioned with ${valueSignals.materialTier} and ${valueSignals.craftComplexity}`);
    explanationList.push(`Recommended price balances production cost with competitive market range`);

    // High confidence due to full cost breakdown + verified market observations
    confidenceScore = 82;
    if (material && craftType && description && description.length > 20) {
      confidenceScore = 88;
    }
  } else {
    // Market Data Unavailable: Use Pure Cost-Plus with Transparent Product Positioning
    const costPlusMultiplier = valueSignals.positioningMultiplier;
    
    recommendedPrice = formatToPricePoint(productionCost * costPlusMultiplier);
    minimumPrice = formatToPricePoint(productionCost * 1.18); // 18% minimum margin
    premiumPrice = formatToPricePoint(productionCost * (costPlusMultiplier + 0.20)); // High value tier

    explanationList.push(`Live market data unavailable for this specific custom craft. Price is calculated based on fair cost-plus margins`);
    explanationList.push(`Incorporates ${valueSignals.materialTier} and ${valueSignals.craftComplexity}`);
    explanationList.push(`Secures a sustainable artisan gross profit margin above base production costs`);

    // Medium confidence because cost is accurate but market data is absent
    confidenceScore = (material && craftType) ? 72 : 62;
  }

  // Mandatory Safety Rule: recommendedPrice must ALWAYS be greater than productionCost
  if (recommendedPrice <= productionCost) {
    recommendedPrice = formatToPricePoint(productionCost * 1.25);
  }
  if (minimumPrice <= productionCost) {
    minimumPrice = formatToPricePoint(productionCost * 1.12);
  }
  if (premiumPrice <= recommendedPrice) {
    premiumPrice = formatToPricePoint(recommendedPrice * 1.18);
  }

  // 5. Profit & Margin Metrics
  const estimatedProfit = Math.round((recommendedPrice - productionCost) * 100) / 100;
  const profitMargin = recommendedPrice > 0 
    ? Math.round((estimatedProfit / recommendedPrice) * 1000) / 10 
    : 0;

  // Scenario calculations (Budget, Recommended, Premium)
  const budgetProfit = Math.round((minimumPrice - productionCost) * 100) / 100;
  const budgetMargin = minimumPrice > 0 ? Math.round((budgetProfit / minimumPrice) * 1000) / 10 : 0;

  const premiumProfit = Math.round((premiumPrice - productionCost) * 100) / 100;
  const premiumMargin = premiumPrice > 0 ? Math.round((premiumProfit / premiumPrice) * 1000) / 10 : 0;

  // Tight recommended range around recommended price
  const rangeMin = Math.max(minimumPrice, formatToPricePoint(recommendedPrice * 0.92));
  const rangeMax = Math.min(premiumPrice, formatToPricePoint(recommendedPrice * 1.08));

  return {
    success: true,
    recommendationType: 'AI-Assisted Price Recommendation',
    pricing: {
      productionCost,
      recommendedPrice,
      minimumPrice,
      premiumPrice,
      recommendedRange: {
        min: rangeMin,
        max: rangeMax,
        formatted: `₹${rangeMin.toLocaleString('en-IN')} – ₹${rangeMax.toLocaleString('en-IN')}`,
      },
      estimatedProfit,
      profitMargin,
      confidence: confidenceScore,
      confidenceLevel: confidenceScore >= 75 ? 'High' : confidenceScore >= 60 ? 'Medium' : 'Low',
    },
    marketData: {
      available: hasMarketData,
      status: hasMarketData ? 'Available' : 'Unavailable',
      minPrice: hasMarketData ? marketData.minPrice : null,
      medianPrice: hasMarketData ? marketData.medianPrice : null,
      maxPrice: hasMarketData ? marketData.maxPrice : null,
      sampleSize: hasMarketData ? marketData.sampleSize : 0,
      formattedRange: hasMarketData ? `₹${marketData.minPrice.toLocaleString('en-IN')} – ₹${marketData.maxPrice.toLocaleString('en-IN')}` : 'Market comparison data unavailable',
      source: hasMarketData ? marketData.source : 'Live market data unavailable',
      notice: hasMarketData 
        ? 'Based on verified Indian handicraft marketplace observations.' 
        : 'Recommendation based primarily on production cost and product positioning.',
    },
    costBreakdown: {
      materialCost: validMaterial,
      labourCost: validLabour,
      packagingCost: validPackaging,
      otherCost: validOther,
      productionCost,
    },
    scenarios: {
      budget: {
        label: 'Budget / Minimum Viable Price',
        price: minimumPrice,
        profit: budgetProfit,
        margin: `${budgetMargin}%`,
        description: 'Covers all production costs with basic 12-18% artisan margin for volume sales.'
      },
      recommended: {
        label: 'AI Recommended Price',
        price: recommendedPrice,
        profit: estimatedProfit,
        margin: `${profitMargin}%`,
        description: 'Optimal balance of market competitiveness and sustainable artisan earnings.'
      },
      premium: {
        label: 'Premium / Exclusive Edition',
        price: premiumPrice,
        profit: premiumProfit,
        margin: `${premiumMargin}%`,
        description: 'Positioned for luxury gift buyers, boutique galleries, or export orders.'
      }
    },
    whyThisPrice: [
      {
        factor: 'Production Cost Foundation',
        value: `₹${productionCost.toLocaleString('en-IN')}`,
        detail: `Material ₹${validMaterial} + Labour ₹${validLabour} + Packaging ₹${validPackaging} + Overhead ₹${validOther}`
      },
      {
        factor: 'Market Intelligence',
        value: hasMarketData ? `Median ₹${marketData.medianPrice.toLocaleString('en-IN')}` : 'Cost-Plus Anchoring',
        detail: hasMarketData ? `${marketData.sampleSize} verified marketplace observations` : 'Custom craft positioning applied'
      },
      {
        factor: 'Craft Value Tier',
        value: valueSignals.craftComplexity,
        detail: `Accounts for authentic ${craftType || 'traditional manual technique'}`
      },
      {
        factor: 'Material Quality',
        value: valueSignals.materialTier,
        detail: `Natural authenticity of ${material || 'artisan material'}`
      },
      {
        factor: 'Competitive Margin',
        value: `${profitMargin}% Artisan Profit`,
        detail: 'Guarantees fair compensation above all production costs'
      }
    ],
    explanation: explanationList,
    productContext: {
      productType,
      category,
      material,
      craftType,
      description,
    },
  };
}

export default {
  calculateDynamicPricing,
};
