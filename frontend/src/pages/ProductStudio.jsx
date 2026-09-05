import React, { useState, useEffect } from 'react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import DetectedAttributes from '../components/DetectedAttributes.jsx';
import BeforeAfterComparison from '../components/BeforeAfterComparison.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getProducts, uploadProductImage, updateProduct } from '../services/productService.js';
import { analyzeImage, analyzeProductById } from '../services/aiService.js';
import { enhanceProductById, enhanceRawImage } from '../services/imageEnhanceService.js';
import { mockProducts } from '../services/dummyData.js';
import {
  Sparkles,
  Wand2,
  Sliders,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Camera,
  Layers,
  ArrowRight,
  Info,
  ShieldCheck,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export default function ProductStudio({ addToast }) {
  const { token, user } = useAuth();
  const { t, language, translateCategory, translateStatus } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);

  const [currentImage, setCurrentImage] = useState('');
  const [enhancedImage, setEnhancedImage] = useState('');
  const [enhancementDetails, setEnhancementDetails] = useState(null);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancingStage, setEnhancingStage] = useState(1);
  const [enhanceError, setEnhanceError] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('Studio Clean White');

  // AI Image Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  // Enhancement Presets
  const presets = language === 'HI' ? [
    { id: 'Studio Clean White', label: 'स्टूडियो क्लीन व्हाइट', desc: 'सॉफ्ट ग्राउंडिंग छाया के साथ सीमलेस शुद्ध स्टूडियो बैकड्रॉप' },
    { id: 'Warm Heritage Glow', label: 'वार्म हेरिटेज ग्लो', desc: 'पारंपरिक हस्तशिल्प के लिए तैयार किए गए प्राकृतिक मिट्टी के रंग' },
    { id: 'Festive Radiant Ambience', label: 'उत्सव दीप्ति माहौल', desc: 'कपड़ों और पीतल के शिल्प के लिए जीवंत चमक' },
    { id: 'Natural Sunlight', label: 'प्राकृतिक सूर्य का प्रकाश', desc: 'प्रामाणिक शिल्प बनावट को उजागर करने वाला संतुलित डेलाइट' },
  ] : [
    { id: 'Studio Clean White', label: 'Studio Clean White', desc: 'Seamless pure studio backdrop with soft grounding shadow' },
    { id: 'Warm Heritage Glow', label: 'Warm Heritage Glow', desc: 'Warm earthy undertones tailored for traditional handicrafts' },
    { id: 'Festive Radiant Ambience', label: 'Festive Radiant Ambience', desc: 'Enhanced vibrant saturation for textiles and brass' },
    { id: 'Natural Sunlight', label: 'Natural Sunlight', desc: 'Balanced daylight exposure highlighting authentic material textures' },
  ];

  // Fetch real artisan products from MongoDB backend
  useEffect(() => {
    async function loadArtisanProducts() {
      setLoading(true);
      const userKey = user?.email || user?.id || '';

      try {
        if (token) {
          const res = await getProducts(token);
          if (res.success && Array.isArray(res.products)) {
            const clean = res.products.filter(p => !p.isDemoFallback && !String(p.id || p._id || '').startsWith('fallback_'));
            if (clean.length > 0) {
              setProducts(clean);
              const firstId = clean[0]._id || clean[0].id;
              setSelectedProductId(firstId);
              setCurrentProduct(clean[0]);
              setCurrentImage(clean[0].originalImage || clean[0].enhancedImage || clean[0].image || '');
              setEnhancedImage(clean[0].enhancedImage || '');
              if (userKey) {
                localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(clean));
              }
              return;
            }
          }
        }

        if (userKey) {
          const cached = localStorage.getItem(`karigar_products_${userKey}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) {
                const clean = parsed.filter(p => !p.isDemoFallback && !String(p.id || p._id || '').startsWith('fallback_'));
                localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(clean));
                if (clean.length > 0) {
                  setProducts(clean);
                  const firstId = clean[0]._id || clean[0].id;
                  setSelectedProductId(firstId);
                  setCurrentProduct(clean[0]);
                  setCurrentImage(clean[0].originalImage || clean[0].enhancedImage || clean[0].image || '');
                  setEnhancedImage(clean[0].enhancedImage || '');
                  return;
                }
              }
            } catch (e) {}
          }
        }

        setProducts([]);
        setSelectedProductId('');
        setCurrentProduct(null);
      } catch (err) {
        console.warn('Could not load products, using fallback:', err);
        setProducts([]);
        setSelectedProductId('');
        setCurrentProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadArtisanProducts();
  }, [token, user?.email, user?.id]);

  // When selected product changes
  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => (p._id || p.id) === prodId);
    if (prod) {
      setCurrentProduct(prod);
      setCurrentImage(prod.originalImage || prod.image || '');
      setEnhancedImage(prod.enhancedImage || '');
      setAiAnalysis(null);
      setEnhanceError(null);
    }
  };

  // Image Upload handler directly linked to POST /api/products/:id/image
  const handleImageUploaded = async (base64Data, rawFile) => {
    if (!base64Data) {
      setCurrentImage('');
      setEnhancedImage('');
      setAiAnalysis(null);
      return;
    }

    setCurrentImage(base64Data);
    setEnhancedImage('');
    setAiAnalysis(null);
    setEnhanceError(null);

    // If product is a real MongoDB product, persist via API
    if (currentProduct && currentProduct._id && !currentProduct._id.startsWith('mock')) {
      setIsUploading(true);
      setUploadProgress(20);

      try {
        setUploadProgress(60);
        const res = await uploadProductImage(
          currentProduct._id,
          rawFile || base64Data,
          token
        );

        setUploadProgress(100);
        if (res.success && res.product) {
          setCurrentProduct(res.product);
          setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
          if (addToast) addToast('Product image uploaded & validated to MongoDB server!', 'success');
        }
      } catch (err) {
        if (addToast) addToast(err.message || 'Failed to upload image to server', 'error');
      } finally {
        setIsUploading(false);
      }
    } else {
      if (addToast) addToast('Photo loaded into Studio preview!', 'success');
    }
  };

  // Step 7: Trigger AI Image Enhancement Pipeline
  const handleEnhanceProductPhoto = async () => {
    if (!currentImage) {
      if (addToast) addToast('Please select or upload a product photo first', 'error');
      return;
    }

    setIsEnhancing(true);
    setEnhanceError(null);
    setEnhancingStage(1);
    if (addToast) addToast('Initiating AI Image Enhancement...', 'info');

    // Simulate multi-stage processing animation
    const stageInterval = setInterval(() => {
      setEnhancingStage(prev => (prev < 4 ? prev + 1 : prev));
    }, 600);

    try {
      let res;
      if (currentProduct && currentProduct._id && !currentProduct._id.startsWith('mock')) {
        res = await enhanceProductById(currentProduct._id, token, {
          preset: selectedPreset,
          cropSquare: true,
          saveToProduct: false, // User decides whether to commit
        });
      } else {
        res = await enhanceRawImage(currentImage, token, {
          preset: selectedPreset,
          cropSquare: true,
        });
      }

      clearInterval(stageInterval);

      if (res.success && (res.enhancedImage || res.enhancedBase64)) {
        setEnhancedImage(res.enhancedBase64 || res.enhancedImage);
        setEnhancementDetails(res.enhancementDetails || {
          background: `Studio Backdrop (${selectedPreset})`,
          aspectRatio: '1:1 Square (E-Commerce Optimized)',
        });
        if (addToast) addToast('Photo enhancement complete! Compare before and after.', 'success');
      } else {
        throw new Error(res.message || 'Enhancement failed to generate an enhanced photo');
      }
    } catch (err) {
      clearInterval(stageInterval);
      console.error('Enhancement error:', err);
      setEnhanceError(err.message || 'AI Enhancement service was unavailable. Original photo retained.');
      if (addToast) addToast('Enhancement could not be completed. Original photo preserved.', 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  // User Action: Commit Enhanced Image to MongoDB
  const handleUseEnhancedImage = async () => {
    if (!enhancedImage) return;

    if (!currentProduct || !currentProduct._id || currentProduct._id.startsWith('mock')) {
      if (addToast) addToast('Enhanced photo selected for preview!', 'success');
      return;
    }

    try {
      const updatePayload = {
        enhancedImage: enhancedImage,
        status: 'Market-Ready',
      };

      const res = await updateProduct(currentProduct._id, updatePayload, token);
      if (res.success && res.product) {
        setCurrentProduct(res.product);
        setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
        if (addToast) addToast('Enhanced photo saved as Market-Ready in MongoDB!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to save enhanced image to product', 'error');
    }
  };

  // User Action: Keep Original Photo
  const handleKeepOriginalPhoto = async () => {
    setEnhancedImage('');
    setEnhancementDetails(null);
    setEnhanceError(null);

    if (currentProduct && currentProduct._id && !currentProduct._id.startsWith('mock')) {
      try {
        const res = await updateProduct(currentProduct._id, { enhancedImage: '' }, token);
        if (res.success && res.product) {
          setCurrentProduct(res.product);
          setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
        }
      } catch (err) {
        console.warn('Reset error:', err);
      }
    }
    if (addToast) addToast('Original craft photo retained as primary', 'info');
  };

  // Step 6: Trigger Multimodal AI Image Analysis
  const handleRunAiAnalysis = async () => {
    if (!currentImage) {
      if (addToast) addToast('Please select or upload a product photo first', 'error');
      return;
    }

    setIsAnalyzingAi(true);
    if (addToast) addToast('Multimodal AI analyzing visual craft attributes...', 'info');

    try {
      let res;
      if (currentProduct && currentProduct._id && !currentProduct._id.startsWith('mock')) {
        res = await analyzeProductById(currentProduct._id, token);
      } else {
        res = await analyzeImage(currentImage, token, {
          name: currentProduct?.name || '',
          category: currentProduct?.category || '',
        });
      }

      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
        if (addToast) addToast('AI visual analysis complete! Attributes detected.', 'success');
      }
    } catch (err) {
      console.error('AI Analysis Studio Error:', err);
      if (addToast) addToast(err.message || 'AI visual analysis failed', 'error');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Save edited attributes back to MongoDB product
  const handleApplyAttributesToProduct = async (attributes) => {
    if (!currentProduct || !currentProduct._id || currentProduct._id.startsWith('mock')) {
      if (addToast) addToast('Attributes updated in preview!', 'success');
      return;
    }

    try {
      const updatePayload = {
        name: currentProduct.name || attributes.productType,
        category: attributes.category !== 'Unknown' ? attributes.category : currentProduct.category,
        material: attributes.material !== 'Unknown' ? attributes.material : currentProduct.material,
        craftType: attributes.craftType !== 'Unknown' ? attributes.craftType : currentProduct.craftType,
        tags: attributes.colors.concat(attributes.visibleCharacteristics || []),
      };

      const res = await updateProduct(currentProduct._id, updatePayload, token);
      if (res.success && res.product) {
        setCurrentProduct(res.product);
        setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
        if (addToast) addToast('Artisan craft document updated in MongoDB!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update craft document', 'error');
    }
  };

  if (loading) {
    return <Loader fullPage text={t('common.loading', 'Loading Artisan Photo Studio...')} />;
  }

  return (
    <div className="main-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          {language === 'HI' ? 'उत्पाद फ़ोटो स्टूडियो और एआई संवर्धन' : 'Product Photo Studio & AI Enhancement'}
        </h1>
        <p style={{ fontSize: '0.95rem' }}>
          {language === 'HI' ? 'बैकग्राउंड रिमूवल, स्टूडियो लाइटिंग, 1:1 ई-कॉमर्स अनुपात और दृश्य तुलना।' : 'Background cleanup, studio lighting, 1:1 e-commerce ratio, and visual comparison.'}
        </p>
      </div>

      {/* Product Selector Dropdown Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers size={20} color="var(--accent-terracotta)" />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              {language === 'HI' ? 'सक्रिय उत्पाद' : 'Active Product Document'}
            </span>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {currentProduct?.name || currentProduct?.title || 'Artisan Handicraft'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('studio.selectProduct', 'Select Product:')}</label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductSelect(e.target.value)}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {products.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name || p.title} ({translateCategory(p.category || 'Craft')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Studio 2-Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Image Canvas / Before-After Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card title={language === 'HI' ? 'फ़ोटो स्टूडियो कैनवास' : 'Photo Studio Canvas'}>
            {/* If enhancing, or enhanced, show BeforeAfterComparison */}
            {isEnhancing || enhancedImage || enhanceError ? (
              <BeforeAfterComparison
                originalImage={currentImage}
                enhancedImage={enhancedImage}
                isEnhancing={isEnhancing}
                enhancingStage={enhancingStage}
                error={enhanceError}
                enhancementDetails={enhancementDetails}
                onUseEnhanced={handleUseEnhancedImage}
                onKeepOriginal={handleKeepOriginalPhoto}
                onRetry={handleEnhanceProductPhoto}
                addToast={addToast}
              />
            ) : (
              /* Original Photo Display */
              <div
                style={{
                  position: 'relative',
                  height: '360px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#070a12',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="Craft original"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', gap: '0.75rem' }}>
                    <ImageIcon size={42} />
                    <span>{language === 'HI' ? 'अभी कोई फ़ोटो अपलोड नहीं की गई है' : 'No craft photo uploaded yet'}</span>
                  </div>
                )}

                {currentImage && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {language === 'HI' ? 'मूल फ़ोटो (Original)' : 'Original Raw Photo'}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* AI Visual Attribute Inspection Panel */}
          {(isAnalyzingAi || aiAnalysis) && (
            <Card title={language === 'HI' ? 'एआई दृश्य विशेषता निरीक्षण' : 'AI Visual Attribute Inspection'}>
              <DetectedAttributes
                analysis={aiAnalysis}
                isAnalyzing={isAnalyzingAi}
                onApply={handleApplyAttributesToProduct}
                onAnalysisChange={setAiAnalysis}
                addToast={addToast}
              />
            </Card>
          )}

        </div>

        {/* Right Column: AI Enhancement Controls, Presets & Analysis Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Step 7 AI Photo Enhancement Card */}
          <Card title={language === 'HI' ? 'एआई ई-कॉमर्स फ़ोटो संवर्धन' : 'AI E-Commerce Photo Enhancement'}>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {language === 'HI' ? 'बैकग्राउंड साफ़ करें, स्टूडियो लाइटिंग बढ़ाएं और 1:1 ई-कॉमर्स अनुपात में बदलें।' : 'Clean backgrounds, enhance studio lighting, center the product, and format into a 1:1 e-commerce ratio.'}
            </p>

            {/* Presets Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedPreset === preset.id ? 'rgba(230,81,0,0.14)' : 'var(--bg-input)',
                    border: selectedPreset === preset.id ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                    color: selectedPreset === preset.id ? 'var(--accent-terracotta)' : 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{preset.label}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{preset.desc}</p>
                  </div>
                  {selectedPreset === preset.id && <Check size={16} />}
                </button>
              ))}
            </div>

            <Button
              type="button"
              onClick={handleEnhanceProductPhoto}
              isLoading={isEnhancing}
              fullWidth={true}
              icon={<Wand2 size={18} />}
            >
              {isEnhancing ? (language === 'HI' ? 'फ़ोटो संवर्धित की जा रही है...' : 'Enhancing Photo...') : (language === 'HI' ? 'एआई स्टूडियो से संवर्धित करें' : 'Enhance with AI Studio')}
            </Button>
          </Card>

          {/* Multimodal AI Visual Analysis Trigger Card */}
          <Card title={language === 'HI' ? 'मल्टीमॉडल एआई दृश्य विश्लेषण' : 'Multimodal AI Visual Analysis'}>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {language === 'HI' ? 'सामग्री, शिल्प तकनीक, रंग और डिज़ाइन विशेषताओं का सटीक पता लगाएं।' : 'Detect material, craft technique, colors, and design characteristics with zero hallucination.'}
            </p>

            <Button
              type="button"
              onClick={handleRunAiAnalysis}
              isLoading={isAnalyzingAi}
              variant="outline"
              fullWidth={true}
              icon={<Sparkles size={18} color="var(--accent-gold)" />}
            >
              {isAnalyzingAi ? (language === 'HI' ? 'शिल्प छवि का विश्लेषण हो रहा है...' : 'Analyzing Craft Image...') : (language === 'HI' ? 'दृश्य विशेषताओं का विश्लेषण करें' : 'Analyze Visual Attributes')}
            </Button>
          </Card>

          {/* Upload / Replace Photo Section */}
          <Card title={language === 'HI' ? 'फ़ोटो अपलोड या बदलें' : 'Upload or Replace Photo'}>
            <ImageUploader
              value={currentImage}
              onChange={handleImageUploaded}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              showPipeline={false}
              addToast={addToast}
            />
          </Card>

          {/* Craft Summary Card */}
          <Card title={language === 'HI' ? 'शिल्प दस्तावेज़ विवरण' : 'Craft Document Specs'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('catalogue.price', 'Price')}:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>₹ {currentProduct?.price || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('addProduct.categoryLabel', 'Category')}:</span>
                <span>{translateCategory(currentProduct?.category) || 'General Craft'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('addProduct.materialLabel', 'Material')}:</span>
                <span>{currentProduct?.material || (language === 'HI' ? 'अज्ञात' : 'Unknown')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('addProduct.craftTypeLabel', 'Craft Type')}:</span>
                <span>{currentProduct?.craftType || (language === 'HI' ? 'अज्ञात' : 'Unknown')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('catalogue.status', 'Status')}:</span>
                <span style={{ color: currentProduct?.enhancedImage ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                  {currentProduct?.enhancedImage ? (language === 'HI' ? 'संवर्धित (बाज़ार हेतु तैयार)' : 'Enhanced (Market-Ready)') : translateStatus(currentProduct?.status || 'Draft')}
                </span>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

