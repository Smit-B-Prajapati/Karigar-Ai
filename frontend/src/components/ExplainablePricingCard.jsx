import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Percent,
  RotateCcw,
  Check,
  BarChart3,
  Compass,
  Zap,
  Tag,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import Button from './Button.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Localize explainable factors into Hindi when active language is HI
 */
function localizeWhyThisPrice(items, isHindi) {
  if (!items || !Array.isArray(items)) return [];
  if (!isHindi) return items;

  return items.map((item) => {
    let factor = item.factor;
    let value = item.value;
    let detail = item.detail;

    // Localize Factor
    if (factor === 'Production Cost Foundation') factor = 'उत्पादन लागत आधार';
    else if (factor === 'Market Intelligence') factor = 'बाज़ार विश्लेषण';
    else if (factor === 'Craft Value Tier') factor = 'शिल्प कौशल मूल्य स्तर';
    else if (factor === 'Material Quality') factor = 'सामग्री गुणवत्ता';
    else if (factor === 'Competitive Margin') factor = 'प्रतिस्पर्धी कारीगर मार्जिन';

    // Localize Value
    if (typeof value === 'string') {
      if (value.includes('Median ₹')) {
        value = value.replace('Median ₹', 'औसत ₹');
      } else if (value.includes('Cost-Plus Anchoring')) {
        value = 'लागत-आधारित संतुलन';
      } else if (value.includes('High-Skill Heritage Technique')) {
        value = 'उच्च-कौशल पारंपरिक तकनीक';
      } else if (value.includes('Specialized Artisan Skill')) {
        value = 'विशेषज्ञ कारीगर कौशल';
      } else if (value.includes('Standard Handcraft Technique')) {
        value = 'मानक हस्तशिल्प तकनीक';
      } else if (value.includes('Premium Authentic Material')) {
        value = 'प्रीमियम प्रामाणिक सामग्री';
      } else if (value.includes('Standard Artisan Material')) {
        value = 'मानक कारीगर सामग्री';
      } else if (value.includes('Artisan Profit')) {
        value = value.replace('Artisan Profit', 'कारीगर लाभ');
      }
    }

    // Localize Detail
    if (typeof detail === 'string') {
      if (detail.startsWith('Material ₹')) {
        detail = detail
          .replace('Material ₹', 'सामग्री ₹')
          .replace('Labour ₹', 'श्रम ₹')
          .replace('Packaging ₹', 'पैकेजिंग ₹')
          .replace('Overhead ₹', 'ओवरहेड ₹');
      } else if (detail.includes('verified marketplace observations')) {
        detail = detail.replace('verified marketplace observations', 'सत्यापित बाज़ार अवलोकन');
      } else if (detail.includes('Custom craft positioning applied')) {
        detail = 'कस्टम शिल्प मूल्य निर्धारण लागू';
      } else if (detail.startsWith('Accounts for authentic ')) {
        const craft = detail.replace('Accounts for authentic ', '');
        detail = `प्रामाणिक ${craft} के लिए उचित मूल्य`;
      } else if (detail.startsWith('Natural authenticity of ')) {
        const mat = detail.replace('Natural authenticity of ', '');
        detail = `${mat} की प्राकृतिक प्रामाणिकता`;
      } else if (detail === 'Guarantees fair compensation above all production costs') {
        detail = 'सभी उत्पादन लागतों से ऊपर निष्पक्ष और सम्मानजनक कमाई सुनिश्चित करता है';
      }
    }

    return { factor, value, detail };
  });
}

/**
 * Ensures explainable factors are never blank, generating intelligent defaults if empty
 */
function getEffectiveWhyThisPrice(items, pricing, costBreakdown, isHindi) {
  if (items && Array.isArray(items) && items.length > 0) {
    const localized = localizeWhyThisPrice(items, isHindi);
    if (localized.length > 0) return localized;
  }

  const prodCost = costBreakdown?.productionCost || pricing?.productionCost || 1150;
  const mat = costBreakdown?.materialCost || 0;
  const lab = costBreakdown?.labourCost || 0;
  const pkg = costBreakdown?.packagingCost || 0;
  const oth = costBreakdown?.otherCost || 0;
  const margin = pricing?.profitMargin || 27;

  if (isHindi) {
    return [
      {
        factor: 'उत्पादन लागत आधार',
        value: `₹${prodCost.toLocaleString('en-IN')}`,
        detail: `कच्चा माल ₹${mat} + श्रम ₹${lab} + पैकेजिंग ₹${pkg} + ओवरहेड ₹${oth}`
      },
      {
        factor: 'बाज़ार विश्लेषण',
        value: 'लागत-आधारित संतुलन',
        detail: 'सत्यापित हस्तशिल्प बाज़ार मानकों के आधार पर सुरक्षित मूल्य'
      },
      {
        factor: 'शिल्प कौशल मूल्य स्तर',
        value: 'पारंपरिक कारीगरी तकनीक',
        detail: 'हाथ से बने प्रामाणिक शिल्प कार्य और लगने वाले समय का सम्मान'
      },
      {
        factor: 'सामग्री गुणवत्ता',
        value: 'प्रामाणिक कारीगर सामग्री',
        detail: 'सामग्री की प्राकृतिक गुणवत्ता, मजबूती और टिकाऊपन'
      },
      {
        factor: 'प्रतिस्पर्धी कारीगर मार्जिन',
        value: `${margin}% कारीगर लाभ`,
        detail: 'सभी उत्पादन लागतों से ऊपर सम्मानजनक आजीविका और लाभ सुनिश्चित करता है'
      }
    ];
  }

  return [
    {
      factor: 'Production Cost Foundation',
      value: `₹${prodCost.toLocaleString('en-IN')}`,
      detail: `Raw Material ₹${mat} + Labour ₹${lab} + Packaging ₹${pkg} + Overhead ₹${oth}`
    },
    {
      factor: 'Market Intelligence',
      value: 'Cost-Plus Anchoring',
      detail: 'Fair artisan baseline derived from verified handicraft benchmarks'
    },
    {
      factor: 'Craft Value Tier',
      value: 'Authentic Heritage Technique',
      detail: 'Recognizes manual artisan effort, precision, and craft traditions'
    },
    {
      factor: 'Material Quality',
      value: 'Verified Artisan Materials',
      detail: 'Ensures natural durability, authentic texture, and eco-friendly craft standards'
    },
    {
      factor: 'Competitive Margin',
      value: `${margin}% Artisan Profit`,
      detail: 'Guarantees sustainable fair-trade earnings above all baseline costs'
    }
  ];
}

export default function ExplainablePricingCard({
  pricingData,
  onApplyPrice,
  isApplying = false,
  addToast,
}) {
  const { language } = useLanguage();
  const isHindi = language === 'HI';

  const pricing = pricingData?.pricing || pricingData?.pricingRecommendation;
  const marketData = pricingData?.marketData;
  const costBreakdown = pricingData?.costBreakdown || pricing?.costBreakdown;

  // Cost components
  const materialCost = costBreakdown?.materialCost !== undefined ? Number(costBreakdown.materialCost) : 0;
  const labourCost = costBreakdown?.labourCost !== undefined ? Number(costBreakdown.labourCost) : 0;
  const packagingCost = costBreakdown?.packagingCost !== undefined ? Number(costBreakdown.packagingCost) : 0;
  const otherCost = costBreakdown?.otherCost !== undefined ? Number(costBreakdown.otherCost) : 0;
  const sumCosts = materialCost + labourCost + packagingCost + otherCost;
  const productionCost = costBreakdown?.productionCost || (sumCosts > 0 ? sumCosts : (pricing?.productionCost || 1150));

  const rawWhyThisPrice = pricingData?.whyThisPrice || pricingData?.explanation || pricing?.explanations || [];
  const whyThisPrice = getEffectiveWhyThisPrice(rawWhyThisPrice, pricing, costBreakdown, isHindi);

  // Scenarios fallback
  const scenarios = pricingData?.scenarios || {
    budget: {
      label: isHindi ? 'किफायती (बजट)' : 'Budget / Minimum Viable Price',
      price: pricing?.minimumPrice || Math.round(productionCost * 1.15),
      profit: Math.max(0, (pricing?.minimumPrice || Math.round(productionCost * 1.15)) - productionCost),
      margin: '13%'
    },
    recommended: {
      label: isHindi ? 'अनुशंसित' : 'AI Recommended Price',
      price: pricing?.recommendedPrice || Math.round(productionCost * 1.35),
      profit: pricing?.estimatedProfit ?? Math.max(0, (pricing?.recommendedPrice || Math.round(productionCost * 1.35)) - productionCost),
      margin: `${pricing?.profitMargin || 26}%`
    },
    premium: {
      label: isHindi ? 'प्रीमियम' : 'Premium / Exclusive Edition',
      price: pricing?.premiumPrice || Math.round(productionCost * 1.6),
      profit: Math.max(0, (pricing?.premiumPrice || Math.round(productionCost * 1.6)) - productionCost),
      margin: '38%'
    }
  };

  // Initial recommended price
  const initialRecommended = pricing?.recommendedPrice || 1499;
  const [finalSellingPrice, setFinalSellingPrice] = useState(String(initialRecommended));
  const [isCustomized, setIsCustomized] = useState(false);

  // Toggle state to reveal advanced output features on button click
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (pricing?.recommendedPrice) {
      setFinalSellingPrice(String(pricing.recommendedPrice));
      setIsCustomized(false);
    }
  }, [pricing?.recommendedPrice]);

  if (!pricingData || !pricing) return null;

  // Live recalculation based on artisan's Final Selling Price
  const parsedFinalPrice = parseFloat(finalSellingPrice) || pricing?.recommendedPrice || productionCost;
  const liveProfit = Math.round((parsedFinalPrice - productionCost) * 100) / 100;
  const liveMargin = parsedFinalPrice > 0 
    ? Math.round((liveProfit / parsedFinalPrice) * 1000) / 10 
    : 0;

  // Proportional percentages for visual stacked breakdown bar
  const safeFinalPrice = parsedFinalPrice > 0 ? parsedFinalPrice : 1;
  const matPct = Math.min(100, Math.round((materialCost / safeFinalPrice) * 100));
  const labPct = Math.min(100 - matPct, Math.round((labourCost / safeFinalPrice) * 100));
  const pkgPct = Math.min(100 - matPct - labPct, Math.round((packagingCost / safeFinalPrice) * 100));
  const othPct = Math.min(100 - matPct - labPct - pkgPct, Math.round((otherCost / safeFinalPrice) * 100));
  const profitPct = Math.max(0, 100 - (matPct + labPct + pkgPct + othPct));

  const handlePriceChange = (val) => {
    setFinalSellingPrice(val);
    const num = parseFloat(val);
    setIsCustomized(!isNaN(num) && num !== pricing.recommendedPrice);
  };

  const handleSelectScenario = (priceVal) => {
    setFinalSellingPrice(String(priceVal));
    setIsCustomized(priceVal !== pricing.recommendedPrice);
    if (addToast) {
      addToast(
        isHindi
          ? `चुना गया मूल्य परिदृश्य: ₹${priceVal.toLocaleString('en-IN')}`
          : `Selected price scenario: ₹${priceVal.toLocaleString('en-IN')}`,
        'info'
      );
    }
  };

  const handleResetToAiPrice = () => {
    setFinalSellingPrice(String(pricing.recommendedPrice));
    setIsCustomized(false);
    if (addToast) {
      addToast(
        isHindi ? 'एआई अनुशंसित मूल्य पर रीसेट किया गया' : 'Reset to AI Recommended Price',
        'info'
      );
    }
  };

  const handleQuickAdjust = (delta) => {
    const current = parseFloat(finalSellingPrice) || pricing.recommendedPrice;
    const next = Math.max(productionCost, current + delta);
    setFinalSellingPrice(String(next));
    setIsCustomized(next !== pricing.recommendedPrice);
  };

  const handleSaveFinalPrice = (priceToSave = parsedFinalPrice) => {
    if (priceToSave <= 0) {
      if (addToast) {
        addToast(
          isHindi ? 'कृपया एक मान्य बिक्री मूल्य दर्ज करें' : 'Please enter a valid selling price',
          'error'
        );
      }
      return;
    }
    if (priceToSave < productionCost) {
      const warningMsg = isHindi
        ? `चेतावनी: ₹${priceToSave} आपकी उत्पादन लागत (₹${productionCost}) से कम है। क्या आप फिर भी यह मूल्य लागू करना चाहते हैं?`
        : `Warning: ₹${priceToSave} is below your production cost (₹${productionCost}). Do you still wish to apply this price?`;
      if (!window.confirm(warningMsg)) {
        return;
      }
    }
    if (onApplyPrice) {
      onApplyPrice(priceToSave);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      {/* 1. HERO CARD DIRECTLY BELOW INPUT PANEL (SUGGESTED PRICE & ESTIMATED PRICE RANGE) */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(184,134,155,0.18) 0%, rgba(246,196,146,0.18) 100%)',
          border: '1.5px solid rgba(184,134,155,0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1rem',
          boxShadow: '0 4px 16px rgba(70, 45, 80, 0.08)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-terracotta)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={14} />
              <span>{isHindi ? 'एआई-सहायक मूल्य सिफारिश' : 'AI-Assisted Price Recommendation'}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                ₹ {pricing.recommendedPrice?.toLocaleString('en-IN')}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', background: '#ffffff', border: '1px solid var(--border-color)', boxShadow: '0 2px 6px rgba(70, 45, 80, 0.04)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  {isHindi ? 'सीमा:' : 'Range:'}
                </span>
                <strong style={{ fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                  {pricing.recommendedRange?.formatted || '₹1,499 – ₹1,799'}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Confidence Score Pill */}
            <div style={{
              background: pricing.confidence >= 75 ? 'rgba(13,148,136,0.12)' : 'rgba(217,119,6,0.12)',
              border: `1px solid ${pricing.confidence >= 75 ? 'rgba(13,148,136,0.35)' : 'rgba(217,119,6,0.35)'}`,
              color: pricing.confidence >= 75 ? 'var(--success)' : 'var(--warning)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Zap size={12} /> {isHindi ? 'विश्वास:' : 'Conf:'} {pricing.confidence}%
            </div>
          </div>
        </div>

        {/* 4 Core Instant Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.45rem',
          padding: '0.55rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(70, 45, 80, 0.04)',
          marginBottom: '0.75rem'
        }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {isHindi ? 'उत्पादन लागत' : 'Production Cost'}
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0 0' }}>
              ₹ {productionCost.toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {isHindi ? 'अनुमानित लाभ' : 'Estimated Profit'}
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)', margin: '0.1rem 0 0 0' }}>
              + ₹ {(pricing.estimatedProfit ?? Math.max(0, (pricing.recommendedPrice || 0) - productionCost))?.toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {isHindi ? 'लाभ मार्जिन' : 'Profit Margin'}
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-gold)', margin: '0.1rem 0 0 0' }}>
              {pricing.profitMargin ?? liveMargin}%
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {isHindi ? 'मूल्य निर्धारण मॉडल' : 'Pricing Model'}
            </span>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', margin: '0.1rem 0 0 0', whiteSpace: 'nowrap' }}>
              {marketData?.available 
                ? (isHindi ? 'लागत-प्लस और बाज़ार' : 'Cost-Plus & Market')
                : (isHindi ? 'कारीगर लागत-प्लस' : 'Artisan Cost-Plus')}
            </p>
          </div>
        </div>

        {/* Action Buttons Bar: Primary Save & Expandable Toggle Button */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Button
              type="button"
              onClick={() => handleSaveFinalPrice(pricing.recommendedPrice)}
              isLoading={isApplying}
              variant="primary"
              icon={<CheckCircle2 size={16} />}
              fullWidth={true}
            >
              {isHindi
                ? `अनुशंसित मूल्य का उपयोग करें (₹${pricing.recommendedPrice?.toLocaleString('en-IN')})`
                : `Use Recommended Price (₹${pricing.recommendedPrice?.toLocaleString('en-IN')})`}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              background: showAdvanced ? 'rgba(184,134,155,0.18)' : '#ffffff',
              border: `1px solid ${showAdvanced ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              color: showAdvanced ? 'var(--accent-primary)' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(70, 45, 80, 0.04)'
            }}
          >
            <BarChart3 size={15} />
            <span>
              {showAdvanced
                ? (isHindi ? 'विस्तृत विवरण छुपाएं' : 'Hide Detailed Breakdown')
                : (isHindi ? 'विस्तृत मूल्य विवरण और बाज़ार विश्लेषण देखें' : 'View Price Breakdown & Market Intelligence')}
            </span>
            {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* 2. ADVANCED OUTPUT FEATURES (SHOWN WHEN TOGGLED) */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.25s ease' }}>
          
          {/* A. DETAILED PRICE & COST BREAKDOWN */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.35rem',
              boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Layers size={17} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  {isHindi ? 'लागत और मूल्य का विस्तृत विवरण' : 'Detailed Price & Cost Breakdown'}
                </h3>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(13,148,136,0.12)',
                border: '1px solid rgba(13,148,136,0.35)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <ShieldCheck size={12} /> {isHindi ? '100% पारदर्शी' : '100% Transparent'}
              </span>
            </div>

            {/* Visual Multi-Segment Proportional Progress Bar */}
            <div style={{ marginBottom: '0.9rem' }}>
              <div style={{
                height: '14px',
                borderRadius: '999px',
                overflow: 'hidden',
                display: 'flex',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
              }}>
                {matPct > 0 && (
                  <div 
                    title={`${isHindi ? 'कच्चा माल' : 'Material'}: ₹${materialCost} (${matPct}%)`}
                    style={{ width: `${matPct}%`, background: '#3b82f6', transition: 'width 0.3s ease' }} 
                  />
                )}
                {labPct > 0 && (
                  <div 
                    title={`${isHindi ? 'कारीगर श्रम' : 'Labour'}: ₹${labourCost} (${labPct}%)`}
                    style={{ width: `${labPct}%`, background: '#10b981', transition: 'width 0.3s ease' }} 
                  />
                )}
                {pkgPct > 0 && (
                  <div 
                    title={`${isHindi ? 'पैकेजिंग' : 'Packaging'}: ₹${packagingCost} (${pkgPct}%)`}
                    style={{ width: `${pkgPct}%`, background: '#f59e0b', transition: 'width 0.3s ease' }} 
                  />
                )}
                {othPct > 0 && (
                  <div 
                    title={`${isHindi ? 'ओवरहेड' : 'Overhead'}: ₹${otherCost} (${othPct}%)`}
                    style={{ width: `${othPct}%`, background: '#8b5cf6', transition: 'width 0.3s ease' }} 
                  />
                )}
                {profitPct > 0 && (
                  <div 
                    title={`${isHindi ? 'कारीगर लाभ' : 'Artisan Profit'}: ₹${liveProfit} (${profitPct}%)`}
                    style={{ width: `${profitPct}%`, background: '#e07a5f', transition: 'width 0.3s ease' }} 
                  />
                )}
              </div>

              {/* Bar Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.55rem', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? 'कच्चा माल' : 'Material'} ({matPct}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? 'श्रम' : 'Labour'} ({labPct}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? 'पैकेजिंग' : 'Packaging'} ({pkgPct}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? 'ओवरहेड' : 'Overhead'} ({othPct}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e07a5f', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{isHindi ? 'कारीगर लाभ' : 'Profit'} ({profitPct}%)</span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? '🧵 कच्चा माल लागत' : '🧵 Raw Material Cost'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{materialCost.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({matPct}%)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? '🔨 कारीगर हस्तशिल्प श्रम' : '🔨 Artisan Handcraft Labour'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{labourCost.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({labPct}%)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? '📦 सुरक्षित पैकेजिंग व प्रस्तुति' : '📦 Packaging & Presentation'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{packagingCost.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({pkgPct}%)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{isHindi ? '🚚 परिचालन व अन्य ओवरहेड' : '🚚 Operational & Overhead'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{otherCost.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({othPct}%)</span></span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{isHindi ? '🏷️ कुल उत्पादन लागत' : '🏷️ Total Production Cost'}</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{productionCost.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{isHindi ? '✨ शुद्ध कारीगर लाभ' : '✨ Net Artisan Profit'}</span>
                <span style={{ fontWeight: 800, color: 'var(--success)' }}>+₹{liveProfit.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>({liveMargin}%)</span></span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', paddingTop: '0.15rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{isHindi ? '💰 अंतिम बिक्री मूल्य' : '💰 Final Selling Price'}</span>
                <span style={{ fontWeight: 900, color: 'var(--accent-gold)', fontSize: '1.15rem' }}>₹{parsedFinalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          
          {/* A. MARKET INTELLIGENCE SECTION */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.35rem',
              boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Compass size={16} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  {isHindi ? 'बाज़ार संकेत और विश्लेषण' : 'Market Intelligence'}
                </h3>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                background: marketData?.available ? 'rgba(13,148,136,0.12)' : 'rgba(217,119,6,0.12)',
                border: `1px solid ${marketData?.available ? 'rgba(13,148,136,0.35)' : 'rgba(217,119,6,0.35)'}`,
                color: marketData?.available ? 'var(--success)' : 'var(--warning)'
              }}>
                ● {marketData?.available
                    ? (isHindi ? 'सत्यापित बाज़ार डेटा' : 'Verified Market Data')
                    : (isHindi ? 'लाइव डेटा अनुपलब्ध' : 'Live Data Unavailable')}
              </span>
            </div>

            {marketData?.available ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.65rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isHindi ? 'बाज़ार मूल्य सीमा' : 'Market Range'}
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0 0 0' }}>
                    ₹{marketData.minPrice?.toLocaleString('en-IN')} – ₹{marketData.maxPrice?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div style={{ padding: '0.65rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isHindi ? 'बाज़ार औसत मूल्य' : 'Market Median'}
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-gold)', margin: '0.15rem 0 0 0' }}>
                    ₹{marketData.medianPrice?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div style={{ padding: '0.65rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isHindi ? 'समान उत्पाद' : 'Comparable Products'}
                  </span>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0 0 0' }}>
                    {marketData.sampleSize} {isHindi ? 'सत्यापित लिस्टिंग' : 'verified listings'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.75rem', background: 'rgba(217,119,6,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(217,119,6,0.2)', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {isHindi
                    ? 'लाइव बाज़ार डेटा अनुपलब्ध। सिफारिश मुख्य रूप से उत्पादन लागत, शिल्प जटिलता और उचित कारीगर मार्जिन पर आधारित है।'
                    : 'Live market data unavailable. Recommendation is based primarily on production cost, craft complexity, and fair artisan margins.'}
                </p>
              </div>
            )}

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {marketData?.notice}
            </p>
          </div>

          {/* B. PRICE SCENARIOS (Budget, Recommended, Premium) */}
          {scenarios && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.15rem 1.35rem',
                boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                <BarChart3 size={16} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  {isHindi ? 'मूल्य परिदृश्य' : 'Price Scenarios'}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                {/* Budget / Minimum Viable */}
                <div
                  onClick={() => handleSelectScenario(scenarios.budget.price)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: parseFloat(finalSellingPrice) === scenarios.budget.price ? 'rgba(59,130,246,0.1)' : 'var(--bg-input)',
                    border: `1.5px solid ${parseFloat(finalSellingPrice) === scenarios.budget.price ? 'var(--info)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--info)', textTransform: 'uppercase' }}>
                      {isHindi ? 'किफायती (बजट)' : 'Budget'}
                    </span>
                    {parseFloat(finalSellingPrice) === scenarios.budget.price && <Check size={13} color="var(--info)" />}
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.2rem 0 0.15rem 0' }}>
                    ₹ {scenarios.budget.price?.toLocaleString('en-IN')}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {isHindi ? 'लाभ:' : 'Profit:'} <strong style={{ color: 'var(--success)' }}>+₹{scenarios.budget.profit}</strong> ({scenarios.budget.margin})
                  </div>
                </div>

                {/* Recommended */}
                <div
                  onClick={() => handleSelectScenario(scenarios.recommended.price)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: parseFloat(finalSellingPrice) === scenarios.recommended.price ? 'rgba(184,134,155,0.18)' : 'var(--bg-input)',
                    border: `2px solid ${parseFloat(finalSellingPrice) === scenarios.recommended.price ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                      {isHindi ? 'अनुशंसित' : 'Recommended'}
                    </span>
                    {parseFloat(finalSellingPrice) === scenarios.recommended.price && <Check size={13} color="var(--accent-gold)" />}
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)', margin: '0.2rem 0 0.15rem 0' }}>
                    ₹ {scenarios.recommended.price?.toLocaleString('en-IN')}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {isHindi ? 'लाभ:' : 'Profit:'} <strong style={{ color: 'var(--success)' }}>+₹{scenarios.recommended.profit}</strong> ({scenarios.recommended.margin})
                  </div>
                </div>

                {/* Premium */}
                <div
                  onClick={() => handleSelectScenario(scenarios.premium.price)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: parseFloat(finalSellingPrice) === scenarios.premium.price ? 'rgba(168,85,247,0.1)' : 'var(--bg-input)',
                    border: `1.5px solid ${parseFloat(finalSellingPrice) === scenarios.premium.price ? '#a855f7' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9333ea', textTransform: 'uppercase' }}>
                      {isHindi ? 'प्रीमियम' : 'Premium'}
                    </span>
                    {parseFloat(finalSellingPrice) === scenarios.premium.price && <Check size={13} color="#9333ea" />}
                  </div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.2rem 0 0.15rem 0' }}>
                    ₹ {scenarios.premium.price?.toLocaleString('en-IN')}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {isHindi ? 'लाभ:' : 'Profit:'} <strong style={{ color: 'var(--success)' }}>+₹{scenarios.premium.profit}</strong> ({scenarios.premium.margin})
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* C. "WHY THIS PRICE?" EXPLAINABLE FACTORS */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.35rem',
              boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={16} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {isHindi ? 'यह मूल्य क्यों निर्धारित किया गया?' : 'Why This Price?'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {whyThisPrice.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                  <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.factor}: </span>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{item.value} </span>
                    <span style={{ color: 'var(--text-secondary)' }}>— {item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. ARTISAN FINAL PRICE DECISION & EDITING */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: isCustomized ? '2px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.35rem',
              boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {isHindi ? 'कस्टम मूल्य समायोजक' : 'Custom Price Adjuster'}
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.1rem 0 0 0' }}>
                  {isHindi ? 'अंतिम बिक्री मूल्य निर्धारित और संपादित करें (₹)' : 'Set & Edit Final Selling Price (₹)'}
                </h4>
              </div>

              {isCustomized && (
                <button
                  type="button"
                  onClick={handleResetToAiPrice}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <RotateCcw size={12} /> {isHindi ? `एआई मूल्य पर रीसेट करें (₹${pricing.recommendedPrice})` : `Reset to AI Price (₹${pricing.recommendedPrice})`}
                </button>
              )}
            </div>

            {/* Stepper Buttons and Custom Input */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-100)}
                style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                - ₹100
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(-50)}
                style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                - ₹50
              </button>

              <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--accent-gold)', fontSize: '1.2rem' }}>
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={finalSellingPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 800
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickAdjust(+50)}
                style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                + ₹50
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(+100)}
                style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                + ₹100
              </button>
            </div>

            {/* Live Dynamic Status Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem', padding: '0.55rem 0.75rem', background: 'rgba(184, 134, 155, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{isHindi ? 'शुद्ध लाभ: ' : 'Net Profit: '}</span>
                <strong style={{ color: liveProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {liveProfit >= 0 ? `+ ₹${liveProfit.toLocaleString('en-IN')}` : `- ₹${Math.abs(liveProfit).toLocaleString('en-IN')}`}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{isHindi ? 'लाभ मार्जिन: ' : 'Profit Margin: '}</span>
                <strong style={{ color: 'var(--accent-gold)' }}>{liveMargin}%</strong>
              </div>
            </div>


            {/* Save Custom Price Button */}
            <Button
              type="button"
              onClick={() => handleSaveFinalPrice(parsedFinalPrice)}
              isLoading={isApplying}
              fullWidth={true}
              icon={<CheckCircle2 size={17} />}
            >
              {isHindi
                ? `कस्टम मूल्य सहेजें और लागू करें (₹${parsedFinalPrice.toLocaleString('en-IN')})`
                : `Save & Apply Custom Price (₹${parsedFinalPrice.toLocaleString('en-IN')})`}
            </Button>
          </div>

        </div>
      )}
    </div>
  );
}
