import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ExplainablePricingCard from '../components/ExplainablePricingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getProducts } from '../services/productService.js';
import { analyzeDynamicPricing, calculateProductPricingById } from '../services/pricingService.js';
import { getBusinessAdvice } from '../services/advisorService.js';
import { mockProducts } from '../services/dummyData.js';
import {
  Sparkles,
  DollarSign,
  Lightbulb,
  Send,
  Package,
  Check,
  Copy,
  Tag,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Scissors,
  Hammer,
  Box,
  Truck
} from 'lucide-react';

const ADVISOR_QUESTIONS_EN = [
  "Which website can I sell this product on?",
  "Why should I sell this at the recommended price?",
  "How can I sell this product better?",
  "Who is the target audience?",
  "What keywords should I use?",
  "How to take better photos?"
];

const ADVISOR_QUESTIONS_HI = [
  "मैं इस उत्पाद को किस वेबसाइट पर बेच सकता हूँ?",
  "मुझे इसे अनुशंसित मूल्य पर क्यों बेचना चाहिए?",
  "मैं इस उत्पाद की बिक्री कैसे बढ़ा सकता हूँ?",
  "इस उत्पाद के लक्षित खरीदार कौन हैं?",
  "मुझे कौन से सर्च कीवर्ड्स का उपयोग करना चाहिए?",
  "उत्पाद की बेहतर फ़ोटो कैसे खींचें?"
];

/**
 * Adapt advice to Hindi display if user is viewing in Hindi
 */
function localizeAdvice(advice, isHindi) {
  if (!advice) return null;
  if (!isHindi) return advice;

  const directAnswer = advice.directAnswer;
  let localizedDirectAnswer = directAnswer;

  if (typeof directAnswer === 'string' && !/[\u0900-\u097F]/.test(directAnswer)) {
    if (directAnswer.startsWith('To sell your ') || directAnswer.includes('successfully, highlight its authentic')) {
      const match = directAnswer.match(/To sell your (.*?) successfully, highlight its authentic (.*?) heritage, use high-contrast studio photos on pure white backgrounds, and target cultural and eco-friendly buyers looking for genuine (.*?) craftsmanship\./);
      if (match) {
        localizedDirectAnswer = `अपने ${match[1]} को सफलतापूर्वक बेचने के लिए, इसकी प्रामाणिक ${match[2]} विरासत को रेखांकित करें, शुद्ध सफेद पृष्ठभूमि पर उच्च-कंट्रास्ट स्टूडियो फ़ोटो का उपयोग करें, और वास्तविक ${match[3]} शिल्प कौशल की तलाश करने वाले सांस्कृतिक और पर्यावरण-अनुकूल खरीदारों को लक्षित करें।`;
      } else {
        localizedDirectAnswer = `अपने उत्पाद को सफलतापूर्वक बेचने के लिए इसकी प्रामाणिक शिल्प विरासत, स्टूडियो फ़ोटो और पर्यावरण-अनुकूल गुणवत्ता को प्रमुखता से दिखाएं।`;
      }
    } else if (directAnswer.startsWith('Top recommended online channels for your')) {
      const prodName = directAnswer.replace('Top recommended online channels for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए शीर्ष अनुशंसित ऑनलाइन बिक्री चैनल:`;
    } else if (directAnswer.startsWith('Pricing breakdown for your')) {
      const prodName = directAnswer.replace('Pricing breakdown for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए मूल्य और लाभ विवरण:`;
    } else if (directAnswer.startsWith('Photo guidelines for your')) {
      const prodName = directAnswer.replace('Photo guidelines for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए पेशेवर फ़ोटो दिशानिर्देश:`;
    } else if (directAnswer.startsWith('Festive & gifting strategy for your')) {
      const prodName = directAnswer.replace('Festive & gifting strategy for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए त्योहारी और उपहार रणनीति:`;
    } else if (directAnswer.startsWith('Social media action steps for your')) {
      const prodName = directAnswer.replace('Social media action steps for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए सोशल मीडिया कार्य योजना:`;
    } else if (directAnswer.startsWith('Actionable strategies to sell your')) {
      const prodName = directAnswer.replace('Actionable strategies to sell your', '').replace('faster:', '').trim();
      localizedDirectAnswer = `अपने ${prodName || 'उत्पाद'} की बिक्री तेजी से बढ़ाने के लिए शीर्ष रणनीतियाँ:`;
    } else if (directAnswer.startsWith('Primary target buyers for your')) {
      const prodName = directAnswer.replace('Primary target buyers for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए प्रमुख लक्षित खरीदार वर्ग:`;
    } else if (directAnswer.startsWith('High-intent search terms for your')) {
      const prodName = directAnswer.replace('High-intent search terms for your', '').replace(':', '').trim();
      localizedDirectAnswer = `आपके ${prodName || 'उत्पाद'} के लिए सबसे अधिक खोजे जाने वाले कीवर्ड्स:`;
    }
  }

  // Localize sellingTips
  const tips = (advice.advice?.sellingTips || []).map((tip) => {
    if (typeof tip !== 'string' || /[\u0900-\u097F]/.test(tip)) return tip;

    if (tip.includes('Record a 15-second process video')) {
      return 'इंस्टाग्राम रील्स और यूट्यूब शॉर्ट्स के लिए अपने हाथों से उत्पाद बनाने की 15-सेकंड की प्रोसेस रील वीडियो रिकॉर्ड करें।';
    }
    if (tip.includes('Bundle complementary items together')) {
      return 'औसत ऑर्डर मूल्य बढ़ाने और आकर्षक उपहार सेट पेश करने के लिए मिलते-जुलते पूरक उत्पादों का बंडल बनाएं।';
    }
    if (tip.includes('Participate in state craft exhibitions')) {
      return 'राज्य शिल्प प्रदर्शनियों (जैसे दस्तकार, हुनर हाट, सरस मेला) में भाग लें और आगंतुकों के साथ अपने ऑनलाइन कैटलॉग का QR कोड साझा करें।';
    }
    if (tip.startsWith('Cost Foundation:')) {
      return tip.replace('Cost Foundation:', 'लागत आधार:').replace('Base production cost is', 'आधारभूत उत्पादन लागत है');
    }
    if (tip.startsWith('Recommended Price:')) {
      return tip.replace('Recommended Price:', 'अनुशंसित मूल्य:').replace('delivers a fair', 'पर आपको उचित').replace('artisan margin', 'कारीगर मार्जिन मिलता है').replace('net profit', 'शुद्ध लाभ');
    }
    if (tip.startsWith('Market Benchmark:')) {
      return tip.replace('Market Benchmark: Aligns with', 'बाज़ार तुलना: इसके अनुरूप');
    }
    if (tip.startsWith('Craft Defense:')) {
      return 'शिल्प का महत्व: बिना किसी अनावश्यक छूट के उचित मूल्य पाने के लिए लिस्टिंग में हस्तनिर्मित घंटों का उल्लेख करें।';
    }
    if (tip.startsWith('Main Photo:')) {
      return 'मुख्य तस्वीर: शुद्ध सफेद (#FFFFFF) स्टूडियो बैकग्राउंड पर 1:1 वर्गाकार साफ़ तस्वीर लें।';
    }
    if (tip.startsWith('Detail Shot:')) {
      return 'क्लोज़-अप डिटेल: 2x मैक्रो क्लोज़-अप लें जिससे बारीक कारीगरी और सामग्री की प्राकृतिक बनावट दिखे।';
    }
    if (tip.startsWith('Lighting:')) {
      return 'प्राकृतिक रोशनी: खिड़की के पास सुबह की सौम्य धूप में तस्वीर लें; सीधे और कठोर फ़्लैश से बचें।';
    }
    if (tip.startsWith('Etsy India:')) {
      return 'Etsy India: अंतरराष्ट्रीय और प्रवासी भारतीय (NRI) खरीदारों के लिए सर्वोत्तम जो 2-3 गुना अधिक मूल्य दे सकते हैं।';
    }
    if (tip.startsWith('Amazon Karigar')) {
      return 'Amazon Karigar / Flipkart Samarth: कारीगरों के लिए रियायती विक्रेता शुल्क के साथ व्यापक राष्ट्रीय पहुंच।';
    }
    if (tip.startsWith('iTokri & Jaypore:')) {
      return 'iTokri और Jaypore: समर्पित पारंपरिक भारतीय शिल्प प्रेमियों और कला पारखी ग्राहकों के लिए आदर्श।';
    }
    if (tip.startsWith('WhatsApp Business & Instagram:')) {
      return 'WhatsApp Business और Instagram: शून्य प्रतिशत कमीशन और सीधे त्वरित UPI भुगतान के साथ व्यक्तिगत बिक्री।';
    }

    return tip;
  });

  // Localize betterTitle
  let betterTitle = advice.advice?.betterTitle;
  if (betterTitle && typeof betterTitle.suggestedTitle === 'string' && !/[\u0900-\u097F]/.test(betterTitle.suggestedTitle)) {
    const orig = betterTitle.suggestedTitle;
    let hiTitle = orig;
    if (orig.startsWith('Handcrafted ') && orig.includes(' - Authentic ') && orig.includes(' Heritage')) {
      hiTitle = orig
        .replace('Handcrafted ', 'हस्तनिर्मित ')
        .replace(' - Authentic ', ' — प्रामाणिक ')
        .replace(' Heritage', ' धरोहर');
    }
    betterTitle = {
      ...betterTitle,
      suggestedTitle: hiTitle,
      reason: isHindi ? 'सामग्री की प्रामाणिकता, शिल्प कौशल और खोज-अनुकूल स्पष्टता को एक साथ जोड़ता है।' : betterTitle.reason
    };
  }

  return {
    ...advice,
    directAnswer: localizedDirectAnswer,
    advice: {
      ...advice.advice,
      sellingTips: tips,
      betterTitle
    }
  };
}

export default function AiMarketStudio({ addToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const { t, language, translateCategory } = useLanguage();

  // Active Tab: 'smart-pricing' | 'selling-advisor'
  const initialTab = location.state?.tab === 'selling-advisor' ? 'selling-advisor' : 'smart-pricing';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Artisan products
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);

  // 1. DYNAMIC PRICING STATE
  const [materialCost, setMaterialCost] = useState('750');
  const [labourCost, setLabourCost] = useState('350');
  const [packagingCost, setPackagingCost] = useState('50');
  const [otherCost, setOtherCost] = useState('50');
  const [pricingData, setPricingData] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [pricingStep, setPricingStep] = useState(0); // Multi-step loading
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // 2. SELLING ADVISOR STATE
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [isSubmittingAdvisor, setIsSubmittingAdvisor] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Debounce ref for live pricing calculation
  const calcTimerRef = useRef(null);

  // Load products on mount
  useEffect(() => {
    async function loadData() {
      setLoadingProducts(true);
      const isDemoAccount = Boolean(user && (user.email === 'ramesh@karigar.in' || user.isDemo));
      const userKey = user?.email || user?.id || '';

      try {
        if (token) {
          const res = await getProducts(token);
          if (res.success && res.products && res.products.length > 0) {
            setProducts(res.products);
            const stateProdId = location.state?.productId;
            const target = res.products.find(p => (p._id || p.id) === stateProdId) || res.products[0];
            setSelectedProductId(target._id || target.id);
            populateProductContext(target);
            return;
          }
        }

        // Check local storage for cached products
        if (userKey) {
          const cached = localStorage.getItem(`karigar_products_${userKey}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProducts(parsed);
                const target = parsed[0];
                setSelectedProductId(target._id || target.id);
                populateProductContext(target);
                return;
              }
            } catch (e) {}
          }
        }

        if (isDemoAccount) {
          setProducts(mockProducts);
          const target = mockProducts[0];
          setSelectedProductId(target._id || target.id);
          populateProductContext(target);
        } else {
          setProducts([]);
          setSelectedProductId('');
          setCurrentProduct(null);
        }
      } catch (err) {
        console.warn('AI Market Studio load products fallback:', err);
        if (isDemoAccount) {
          setProducts(mockProducts);
          setSelectedProductId(mockProducts[0]._id || mockProducts[0].id);
          populateProductContext(mockProducts[0]);
        } else {
          setProducts([]);
          setSelectedProductId('');
          setCurrentProduct(null);
        }
      } finally {
        setLoadingProducts(false);
      }
    }
    loadData();
  }, [token, user?.email, user?.id, location.state]);

  const populateProductContext = (prod) => {
    if (!prod) return;
    setCurrentProduct(prod);

    // Populate costs directly from product model if available
    const m = prod.materialCost !== undefined && prod.materialCost > 0 ? String(prod.materialCost) : '750';
    const l = prod.labourCost !== undefined && prod.labourCost > 0 ? String(prod.labourCost) : '350';
    const pkg = prod.packagingCost !== undefined && prod.packagingCost > 0 ? String(prod.packagingCost) : '50';
    const oth = prod.otherCost !== undefined && prod.otherCost > 0 ? String(prod.otherCost) : '50';

    setMaterialCost(m);
    setLabourCost(l);
    setPackagingCost(pkg);
    setOtherCost(oth);

    // Trigger dynamic pricing analysis with full product attributes
    runDynamicPricing(prod, m, l, pkg, oth);
  };

  const handleProductChange = (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    const prod = products.find(p => (p._id || p.id) === pId);
    if (prod) {
      populateProductContext(prod);
    }
  };

  // --- DYNAMIC PRICING ENGINE RUNNER ---
  const runDynamicPricing = async (prod, m, l, pkg, oth) => {
    const targetProd = prod || currentProduct;
    setIsCalculatingPrice(true);
    setPricingStep(1);

    const timer1 = setTimeout(() => setPricingStep(2), 200);
    const timer2 = setTimeout(() => setPricingStep(3), 400);

    try {
      const payload = {
        productId: targetProd?._id || targetProd?.id,
        materialCost: parseFloat(m) || 0,
        labourCost: parseFloat(l) || 0,
        packagingCost: parseFloat(pkg) || 0,
        otherCost: parseFloat(oth) || 0,
        category: targetProd?.category || 'Traditional Textile',
        productType: targetProd?.name || targetProd?.title || 'Handmade Bandhani Dupatta',
        material: targetProd?.material || 'Cotton',
        craftType: targetProd?.craftType || 'Bandhani',
        description: targetProd?.description || '',
      };

      const res = await analyzeDynamicPricing(payload, token);
      if (res.success && res.pricing) {
        setPricingData(res);
      }
    } catch (err) {
      console.warn('Dynamic pricing calc error:', err.message);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setPricingStep(0);
      setIsCalculatingPrice(false);
    }
  };

  const handleCostInputChange = (field, val) => {
    let newM = materialCost;
    let newL = labourCost;
    let newPkg = packagingCost;
    let newOth = otherCost;

    if (field === 'material') { setMaterialCost(val); newM = val; }
    if (field === 'labour') { setLabourCost(val); newL = val; }
    if (field === 'packaging') { setPackagingCost(val); newPkg = val; }
    if (field === 'other') { setOtherCost(val); newOth = val; }

    // Debounce recalculation
    if (calcTimerRef.current) clearTimeout(calcTimerRef.current);
    calcTimerRef.current = setTimeout(() => {
      runDynamicPricing(currentProduct, newM, newL, newPkg, newOth);
    }, 350);
  };

  const handleResetCosts = () => {
    if (currentProduct) {
      populateProductContext(currentProduct);
      if (addToast) addToast('Reset to default product costs', 'info');
    }
  };

  // --- SAVE FINAL PRICE TO PRODUCT & DATABASE ---
  const handleApplyRecommendedPrice = async (recommendedPrice) => {
    if (!currentProduct) return;
    setIsSavingPrice(true);
    try {
      const pId = currentProduct._id || currentProduct.id;
      const isRealDbProduct = pId && !String(pId).startsWith('mock') && !String(pId).startsWith('fallback_');

      if (isRealDbProduct && token) {
        const res = await calculateProductPricingById(pId, {
          materialCost: parseFloat(materialCost) || 0,
          labourCost: parseFloat(labourCost) || 0,
          packagingCost: parseFloat(packagingCost) || 0,
          otherCost: parseFloat(otherCost) || 0,
          customPrice: recommendedPrice,
          applyToProduct: true,
        }, token);

        if (res.success && res.product) {
          setCurrentProduct(res.product);
          setProducts(prev => prev.map(p => (p._id || p.id) === pId ? res.product : p));
          if (addToast) addToast(`Selling price saved as ₹${recommendedPrice.toLocaleString('en-IN')} in database & catalogue!`, 'success');
          return;
        }
      }

      // Fallback state update
      setCurrentProduct(prev => ({ ...prev, price: recommendedPrice }));
      setProducts(prev => prev.map(p => (p._id || p.id) === pId ? { ...p, price: recommendedPrice } : p));
      if (addToast) addToast(`Selling price updated to ₹${recommendedPrice.toLocaleString('en-IN')}!`, 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update price', 'error');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // --- SELLING ADVISOR ---
  const handleAskAdvisor = async (qText) => {
    const query = (qText || advisorQuery).trim();
    if (!query) return;

    setIsSubmittingAdvisor(true);
    try {
      const contextPayload = {
        title: currentProduct?.name || 'Artisan Craft',
        category: currentProduct?.category || 'General Craft',
        price: currentProduct?.price || pricingData?.pricing?.recommendedPrice || 500,
        productionCost: pricingData?.pricing?.productionCost || 1200,
        recommendedPrice: pricingData?.pricing?.recommendedPrice || 1599,
        marketRange: pricingData?.marketData?.formattedRange || 'competitive marketplace range',
        material: currentProduct?.material || 'Handmade',
        craftType: currentProduct?.craftType || 'Craft',
        tags: currentProduct?.tags || []
      };

      const rawId = currentProduct?._id || currentProduct?.id;
      const isRealDbProduct = rawId && !String(rawId).startsWith('mock') && !String(rawId).startsWith('fallback_');

      const res = await getBusinessAdvice({
        question: query,
        productContext: contextPayload,
        productId: isRealDbProduct ? rawId : undefined,
        language: language || 'EN'
      }, token);

      if (res.success && res.advice) {
        setCurrentAdvice(res.advice);
        if (addToast) addToast(language === 'HI' ? 'सलाहकार समाधान तैयार है!' : 'Advice ready!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || (language === 'HI' ? 'सलाह प्राप्त करने में त्रुटि' : 'Failed to get advice'), 'error');
    } finally {
      setIsSubmittingAdvisor(false);
    }
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (addToast) addToast(language === 'HI' ? 'क्लिपबोर्ड पर कॉपी किया गया!' : 'Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Calculate live production cost summary for compact display
  const numMat = parseFloat(materialCost) || 0;
  const numLab = parseFloat(labourCost) || 0;
  const numPkg = parseFloat(packagingCost) || 0;
  const numOth = parseFloat(otherCost) || 0;
  const totalProductionCost = numMat + numLab + numPkg + numOth;

  // Percentage breakdown for distribution bar
  const matPct = totalProductionCost > 0 ? Math.round((numMat / totalProductionCost) * 100) : 25;
  const labPct = totalProductionCost > 0 ? Math.round((numLab / totalProductionCost) * 100) : 25;
  const pkgPct = totalProductionCost > 0 ? Math.round((numPkg / totalProductionCost) * 100) : 25;
  const othPct = totalProductionCost > 0 ? (100 - matPct - labPct - pkgPct) : 25;

  const advisorQuestions = language === 'HI' ? ADVISOR_QUESTIONS_HI : ADVISOR_QUESTIONS_EN;

  return (
    <div className="main-container" style={{ maxWidth: '920px' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.15rem' }}>
          <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(184,134,155,0.25) 0%, rgba(246,196,146,0.15) 100%)', color: 'var(--accent-primary)', border: '1px solid rgba(184,134,155,0.35)' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.3px', margin: 0 }}>
              {t('studio.pricingHeader', 'DYNAMIC PRICING & MARKET ADVISOR')}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0 0' }}>
              {t('studio.pricingSub', 'AI-powered pricing recommendations based on your product, costs and market signals.')}
            </p>
          </div>
        </div>
      </div>

      {!loadingProducts && products.length === 0 ? (
        <EmptyState
          title={language === 'HI' ? 'स्टूडियो में कोई उत्पाद नहीं है' : 'No Products in Studio'}
          description={language === 'HI' ? 'एआई मार्केट स्टूडियो और मूल्य निर्धारण शुरू करने के लिए अपना पहला उत्पाद जोड़ें।' : 'Add your first craft product to run AI dynamic pricing and market intelligence.'}
          actionLabel={language === 'HI' ? '+ नया शिल्प उत्पाद जोड़ें' : '+ Add New Craft Product'}
          onAction={() => navigate('/add-product')}
        />
      ) : (
        <>
          {/* Selected Product Banner Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.65rem 0.85rem',
            boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.25rem' }}>
                  {t('studio.selectProduct', 'Select Active Craft Product:')}
                </label>
                <select 
                  className="form-select"
                  value={selectedProductId}
                  onChange={handleProductChange}
                  style={{ fontWeight: 700, padding: '0.45rem 0.75rem', width: '100%', fontSize: '0.88rem' }}
                  disabled={loadingProducts}
                >
                  {products.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.isDemoFallback || String(p._id || p.id).startsWith('fallback_') ? '🎨 [Demo] ' : '📦 '}
                      {p.name || p.title} ({translateCategory(p.category || 'Craft')} — ₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Details Spotlight Bar */}
              {currentProduct && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(253,246,226,0.03)',
                  border: '1px solid var(--border-color)'
                }}>
                  {currentProduct.enhancedImage || currentProduct.originalImage || currentProduct.image ? (
                    <img 
                      src={currentProduct.enhancedImage || currentProduct.originalImage || currentProduct.image} 
                      alt={currentProduct.name} 
                      style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid rgba(253,246,226,0.15)', flexShrink: 0 }} 
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={20} color="var(--accent-primary)" />
                    </div>
                  )}
                  
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentProduct.name || currentProduct.title}
                      </h3>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(246,196,146,0.15)', color: 'var(--accent-gold)', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                        {language === 'HI' ? 'मूल्य:' : 'Price:'} ₹{currentProduct.price}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong style={{ color: 'var(--accent-gold)' }}>{translateCategory(currentProduct.category) || 'Traditional Craft'}</strong>
                      {currentProduct.craftType && ` • ${currentProduct.craftType}`}
                      {currentProduct.material && ` • ${currentProduct.material}`}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Main Studio Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            marginBottom: '0.65rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.35rem'
          }}>
            <button
              onClick={() => setActiveTab('smart-pricing')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'smart-pricing' ? 'linear-gradient(135deg, #b8869b 0%, #d498b0 100%)' : 'rgba(253,246,226,0.04)',
                color: activeTab === 'smart-pricing' ? '#1c1521' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'smart-pricing' ? '0 4px 15px rgba(184,134,155,0.35)' : 'none'
              }}
            >
              <DollarSign size={14} /> 1. {t('studio.tabPricing', 'Smart Cost-Plus Pricing')}
            </button>

            <button
              onClick={() => setActiveTab('selling-advisor')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'selling-advisor' ? 'linear-gradient(135deg, #b8869b 0%, #d498b0 100%)' : 'rgba(253,246,226,0.04)',
                color: activeTab === 'selling-advisor' ? '#1c1521' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'selling-advisor' ? '0 4px 15px rgba(184,134,155,0.35)' : 'none'
              }}
            >
              <Lightbulb size={14} /> 2. {t('studio.tabAdvisor', 'AI Business Advisor')}
            </button>
          </div>

          {/* TAB 1: DYNAMIC PRICING ASSISTANT (INPUT PANEL ON TOP, OUTPUT & TOGGLE BELOW) */}
          {activeTab === 'smart-pricing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* 1. PRODUCTION COST INPUTS PANEL */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.65rem 0.85rem',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {language === 'HI' ? 'उत्पादन लागत इनपुट' : 'Production Cost Inputs'}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      ({language === 'HI' ? 'लागत समायोजित करें' : 'Adjust raw costs'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCosts}
                    title="Reset to default costs"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}
                  >
                    <RotateCcw size={12} /> {language === 'HI' ? 'रीसेट' : 'Reset'}
                  </button>
                </div>

                {/* 4 Cost Input Fields in Compact 2x2 Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', marginBottom: '0.55rem' }}>
                  
                  {/* 1. Raw Materials */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Scissors size={12} color="var(--accent-gold)" /> {language === 'HI' ? 'कच्चा माल' : 'Raw Materials'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-input" 
                        value={materialCost} 
                        onChange={(e) => handleCostInputChange('material', e.target.value)} 
                        style={{ padding: '0.35rem 0.5rem 0.35rem 1.4rem', height: '34px', fontSize: '0.85rem', fontWeight: 700, width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* 2. Artisan Labour */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Hammer size={12} color="var(--accent-terracotta)" /> {language === 'HI' ? 'कारीगर श्रम' : 'Artisan Labour'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-input" 
                        value={labourCost} 
                        onChange={(e) => handleCostInputChange('labour', e.target.value)} 
                        style={{ padding: '0.35rem 0.5rem 0.35rem 1.4rem', height: '34px', fontSize: '0.85rem', fontWeight: 700, width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* 3. Packaging & Box */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Box size={12} color="var(--info)" /> {language === 'HI' ? 'पैकेजिंग और डिब्बा' : 'Packaging & Box'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-input" 
                        value={packagingCost} 
                        onChange={(e) => handleCostInputChange('packaging', e.target.value)} 
                        style={{ padding: '0.35rem 0.5rem 0.35rem 1.4rem', height: '34px', fontSize: '0.85rem', fontWeight: 700, width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* 4. Overhead & Logistics */}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Truck size={12} color="var(--success)" /> {language === 'HI' ? 'अन्य खर्च' : 'Other Overhead'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                      <input 
                        type="number" 
                        min="0" 
                        className="form-input" 
                        value={otherCost} 
                        onChange={(e) => handleCostInputChange('other', e.target.value)} 
                        style={{ padding: '0.35rem 0.5rem 0.35rem 1.4rem', height: '34px', fontSize: '0.85rem', fontWeight: 700, width: '100%' }}
                      />
                    </div>
                  </div>

                </div>

                {/* Total Production Cost Highlight Bar */}
                <div style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(184,134,155,0.2) 0%, rgba(246,196,146,0.12) 100%)',
                  border: '1px solid rgba(184,134,155,0.4)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff' }}>{language === 'HI' ? 'कुल उत्पादन लागत:' : 'Total Production Cost:'}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                      ₹{totalProductionCost.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Mini Distribution Bar */}
                  <div style={{ height: '4px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)', display: 'flex', overflow: 'hidden', marginBottom: '0.2rem' }}>
                    <div style={{ width: `${matPct}%`, background: 'var(--accent-gold)' }} title={`Material: ${matPct}%`} />
                    <div style={{ width: `${labPct}%`, background: 'var(--accent-primary)' }} title={`Labour: ${labPct}%`} />
                    <div style={{ width: `${pkgPct}%`, background: 'var(--info)' }} title={`Packaging: ${pkgPct}%`} />
                    <div style={{ width: `${othPct}%`, background: 'var(--success)' }} title={`Overhead: ${othPct}%`} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    <span>{language === 'HI' ? 'सामग्री' : 'Mat'}: {matPct}%</span>
                    <span>{language === 'HI' ? 'श्रम' : 'Lab'}: {labPct}%</span>
                    <span>{language === 'HI' ? 'पैकेजिंग' : 'Pkg'}: {pkgPct}%</span>
                    <span>{language === 'HI' ? 'अन्य' : 'Oth'}: {othPct}%</span>
                  </div>
                </div>
              </div>

          {/* 2. ESTIMATED PRICE RANGE & SUGGESTED PRICE DIRECTLY BELOW INPUT PANEL */}
          <div>
            {isCalculatingPrice ? (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <Loader text="" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', minWidth: '240px' }}>
                  <div style={{ fontSize: '0.85rem', color: pricingStep >= 1 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {pricingStep >= 1 ? '✓' : '⟳'} {language === 'HI' ? 'उत्पाद विशेषताओं और लागत का विश्लेषण...' : 'Analyzing product attributes & costs...'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: pricingStep >= 2 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {pricingStep >= 2 ? '✓' : '⟳'} {language === 'HI' ? 'सत्यापित बाज़ार संकेतों की जांच...' : 'Checking verified market signals...'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: pricingStep >= 3 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {pricingStep >= 3 ? '✓' : '⟳'} {language === 'HI' ? 'पारदर्शी सिफारिश तैयार की जा रही है...' : 'Generating explainable recommendation...'}
                  </div>
                </div>
              </div>
            ) : pricingData ? (
              <ExplainablePricingCard
                pricingData={pricingData}
                onApplyPrice={handleApplyRecommendedPrice}
                isApplying={isSavingPrice}
                addToast={addToast}
              />
            ) : (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center'
                }}
              >
                <p style={{ color: 'var(--text-muted)' }}>{language === 'HI' ? 'डायनामिक मूल्य उत्पन्न करने के लिए उत्पाद चुनें और लागत दर्ज करें।' : 'Select a product and enter costs to generate dynamic pricing.'}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SELLING ADVISOR AI (MINIMALIST & INTEGRATED WITH PRICING) */}
      {activeTab === 'selling-advisor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Query Box */}
          <Card>
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {advisorQuestions.map((q, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => { setAdvisorQuery(q); handleAskAdvisor(q); }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-secondary)', 
                      borderRadius: 'var(--radius-full)', 
                      padding: '0.3rem 0.75rem', 
                      fontSize: '0.78rem', 
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent-gold)'; e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t('studio.askAdvisorPlaceholder', 'Ask your question (e.g. Why should I sell this for the recommended price?)')} 
                value={advisorQuery} 
                onChange={(e) => setAdvisorQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisor()} 
              />
              <Button onClick={() => handleAskAdvisor()} loading={isSubmittingAdvisor} icon={<Send size={14} />}>
                {t('studio.sendQuestionBtn', 'Ask')}
              </Button>
            </div>
          </Card>

          {/* Minimalist, To-The-Point Solution Card */}
          {(() => {
            const displayAdvice = localizeAdvice(currentAdvice, language === 'HI');
            if (!displayAdvice) return null;

            return (
              <Card title={language === 'HI' ? 'सलाहकार समाधान' : 'Advisor Solution'} badge={<span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>{language === 'HI' ? 'प्रत्यक्ष कार्य योजना' : 'Direct Action Plan'}</span>}>
                
                {/* Main Headline Direct Answer */}
                <div style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,183,3,0.08)',
                  border: '1px solid rgba(255,183,3,0.25)',
                  marginBottom: '1rem'
                }}>
                  <p style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {displayAdvice.directAnswer}
                  </p>
                </div>

                {/* Actionable To-The-Point Points */}
                {displayAdvice.advice?.sellingTips && displayAdvice.advice.sellingTips.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {displayAdvice.advice.sellingTips.map((tip, i) => {
                      const parts = tip.split(':');
                      const hasPrefix = parts.length > 1;
                      return (
                        <div 
                          key={i} 
                          style={{ 
                            padding: '0.65rem 0.9rem', 
                            background: 'rgba(255,255,255,0.02)', 
                            borderRadius: 'var(--radius-sm)', 
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.6rem'
                          }}
                        >
                          <CheckCircle2 size={16} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                            {hasPrefix ? (
                              <>
                                <strong style={{ color: 'var(--accent-gold)' }}>{parts[0]}:</strong>
                                {parts.slice(1).join(':')}
                              </>
                            ) : tip}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Suggested Product Title If Present */}
                {displayAdvice.advice?.betterTitle?.suggestedTitle && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(230,81,0,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(230,81,0,0.25)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{language === 'HI' ? 'सुझाया गया उत्पाद शीर्षक:' : 'Suggested Product Title:'}</span>
                      <p style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: '#fff' }}>
                        {displayAdvice.advice.betterTitle.suggestedTitle}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyText(displayAdvice.advice.betterTitle.suggestedTitle, 'title')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      {copiedKey === 'title' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />} {language === 'HI' ? 'शीर्षक कॉपी करें' : 'Copy Title'}
                    </button>
                  </div>
                )}

                {/* Compact Keywords Pills with 1-Click Copy */}
                {displayAdvice.advice?.keywords && displayAdvice.advice.keywords.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <Tag size={13} color="var(--text-muted)" />
                      {displayAdvice.advice.keywords.slice(0, 5).map((kw, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                          #{kw}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleCopyText(displayAdvice.advice.keywords.join(', '), 'keywords')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {copiedKey === 'keywords' ? <Check size={13} color="var(--success)" /> : <Copy size={13} />} {language === 'HI' ? 'कीवर्ड्स कॉपी करें' : 'Copy Keywords'}
                    </button>
                  </div>
                )}

              </Card>
            );
          })()}

        </div>
      )}
      </>
      )}
    </div>
  );
}
