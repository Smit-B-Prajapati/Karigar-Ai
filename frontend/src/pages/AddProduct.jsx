import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import DetectedAttributes from '../components/DetectedAttributes.jsx';
import VoiceRecorderModal from '../components/VoiceRecorderModal.jsx';
import BeforeAfterComparison from '../components/BeforeAfterComparison.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createProduct, uploadProductImage } from '../services/productService.js';
import { analyzeImage } from '../services/aiService.js';
import { enhancePhoto } from '../services/imageEnhanceService.js';
import { parseVoiceTranscript, sanitizeShortEnglishTitle } from '../services/voiceService.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { mockCategories } from '../services/dummyData.js';
import { Mic, Sparkles, CheckCircle2, ArrowRight, Wand2, RefreshCw, AlertTriangle, Layers, Camera, Check, Upload, Scissors, Image as ImageIcon } from 'lucide-react';

export default function AddProduct({ addToast }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t, language, translateCategory } = useLanguage();

  // Workflow Current Step: 1 = Basics | 2 = Photo | 3 = Studio & AI
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pottery & Ceramics',
    material: '',
    craftType: '',
    price: '750',
    materialCost: '450',
    labourCost: '300',
    description: '',
    photoData: '',
    photoFile: null
  });

  // Automated Enhancement & Analysis Pipeline States
  const [pipelineStatus, setPipelineStatus] = useState(''); // 'Uploading...' | 'Processing image...' | 'Enhancing photo...' | 'Analyzing product...' | 'Ready' | 'Error'
  const [pipelineStep, setPipelineStep] = useState(1); // 1: Uploading, 2: Removing Background, 3: Enhancing Image, 4: Completed
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState('');
  const [enhancementError, setEnhancementError] = useState('');
  const [selectedImageChoice, setSelectedImageChoice] = useState('enhanced'); // 'enhanced' | 'original'

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceFilled, setVoiceFilled] = useState(false);
  const [isParsingDemo, setIsParsingDemo] = useState(false);

  // Voice details extractor handler
  const handleApplyVoiceData = (extracted) => {
    if (!extracted) return;
    const cleanName = extracted.name
      ? sanitizeShortEnglishTitle(extracted.name, extracted.category || formData.category, extracted.material || formData.material)
      : formData.name;

    setFormData(prev => ({
      ...prev,
      name: cleanName || prev.name,
      category: extracted.category || prev.category,
      material: extracted.material || prev.material,
      craftType: extracted.craftType || prev.craftType,
      price: extracted.price ? String(extracted.price) : prev.price,
      materialCost: extracted.materialCost ? String(extracted.materialCost) : prev.materialCost,
      description: extracted.description || prev.description
    }));
    setVoiceFilled(true);
  };

  // Quick Demo Voice triggers (English and Hindi only)
  const handleTriggerVoiceDemo = async (sampleText, lang = 'hi-IN') => {
    setIsParsingDemo(true);
    if (addToast) addToast(lang === 'hi-IN' ? 'वॉइस विश्लेषण और शिल्प विवरण निकाला जा रहा है...' : 'Parsing voice transcript & extracting craft details...', 'info');
    try {
      const res = await parseVoiceTranscript(sampleText, lang, token);
      if (res && res.extracted) {
        handleApplyVoiceData({
          ...res.extracted,
          description: sampleText
        });
        if (addToast) addToast(lang === 'hi-IN' ? 'शिल्प विवरण फॉर्म में भर दिए गए हैं!' : 'Voice details extracted and populated into form!', 'success');
      }
    } catch (err) {
      console.warn('Demo voice parse error:', err);
    } finally {
      setIsParsingDemo(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 Image Handler - AUTOMATICALLY triggers Studio Enhancement & AI Analysis
  const handleImageSelect = async (base64Data, rawFile) => {
    setFormData(prev => ({
      ...prev,
      photoData: base64Data,
      photoFile: rawFile
    }));
    setEnhancementError('');
    setEnhancedImage('');
    setSelectedImageChoice('enhanced');

    // Advance to Step 3 Studio & Run Pipeline Automatically
    setCurrentStep(3);
    runAutomaticStudioPipeline(base64Data || rawFile);
  };

  // Automatic Enhancement & Analysis Pipeline
  const runAutomaticStudioPipeline = async (imageInput) => {
    setIsEnhancing(true);
    setIsAnalyzing(true);
    setEnhancementError('');
    setPipelineStep(1); // 1: Uploading
    setPipelineStatus('Uploading product image...');

    let enhancedResultUrl = '';

    // Simulate smooth progress step transition
    const stepTimer = setTimeout(() => {
      setPipelineStep(2); // 2: Removing Background
      setPipelineStatus('Removing background with AI...');
    }, 600);

    // 1. Run Photo Enhancement
    try {
      const enhanceRes = await enhancePhoto(imageInput, 'temp-prod', { preset: 'Studio Clean White' }, token);
      clearTimeout(stepTimer);
      
      setPipelineStep(3); // 3: Enhancing Image
      setPipelineStatus('Enhancing lighting, contrast & studio backdrop...');

      if (enhanceRes.success && (enhanceRes.enhancedImageUrl || enhanceRes.enhancedBase64)) {
        enhancedResultUrl = enhanceRes.enhancedBase64 || enhanceRes.enhancedImageUrl;
        setEnhancedImage(enhancedResultUrl);
        setSelectedImageChoice('enhanced');
        setPipelineStep(4); // 4: Completed
      } else {
        setEnhancementError(enhanceRes.message || 'Photo enhancement is temporarily unavailable.');
        setSelectedImageChoice('original');
      }
    } catch (enhErr) {
      console.warn('Studio photo enhancement failed/unavailable:', enhErr.message);
      setEnhancementError('Photo enhancement is temporarily unavailable. Check REMOVE_BG_API_KEY in backend/.env.');
      setSelectedImageChoice('original');
    } finally {
      setIsEnhancing(false);
    }

    // 2. Run Multimodal AI Image Analysis
    try {
      setPipelineStatus(enhancedResultUrl ? 'Analyzing craft attributes & material features...' : 'Completing analysis...');
      const analysisRes = await analyzeImage(
        imageInput,
        token,
        { name: formData.name, category: formData.category }
      );

      if (analysisRes.success && analysisRes.analysis) {
        setAiAnalysis(analysisRes.analysis);
        
        // Auto-fill blanks if available
        const suggestedTitle = (analysisRes.analysis.productType && analysisRes.analysis.productType !== 'Unknown')
          ? sanitizeShortEnglishTitle(analysisRes.analysis.productType, analysisRes.analysis.category, analysisRes.analysis.material)
          : '';

        setFormData(prev => ({
          ...prev,
          name: prev.name || suggestedTitle,
          category: analysisRes.analysis.category !== 'Unknown' ? analysisRes.analysis.category : prev.category,
          material: analysisRes.analysis.material !== 'Unknown' ? analysisRes.analysis.material : prev.material,
          craftType: analysisRes.analysis.craftType !== 'Unknown' ? analysisRes.analysis.craftType : prev.craftType,
        }));
      }
    } catch (analysisErr) {
      console.warn('AI analysis warning:', analysisErr.message);
    } finally {
      setIsAnalyzing(false);
      setPipelineStep(4);
      setPipelineStatus('Ready');
    }
  };

  // Submit product creation to MongoDB
  const handleSubmitProduct = async (shouldNavigateToAiStudio = false) => {
    if (!formData.name.trim()) {
      if (addToast) addToast(t('addProduct.titleLabel', 'Please enter a product name'), 'error');
      setCurrentStep(1);
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      if (addToast) addToast(t('addProduct.sellingPriceLabel', 'Please enter a valid selling price'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create product in database
      const payload = {
        name: formData.name,
        category: formData.category,
        material: formData.material,
        craftType: formData.craftType,
        description: formData.description,
        price: parseFloat(formData.price),
        materialCost: formData.materialCost ? parseFloat(formData.materialCost) : 0,
        labourCost: formData.labourCost ? parseFloat(formData.labourCost) : 0,
        originalImage: formData.photoData || '',
        enhancedImage: enhancedImage || '',
        status: 'Market-Ready'
      };

      const res = await createProduct(payload, token);
      if (!res.success || !res.product) {
        throw new Error(res.message || 'Failed to create product in database');
      }

      let created = res.product;

      // Upload image payload to product endpoint if available
      if (formData.photoData && created._id) {
        try {
          const imgRes = await uploadProductImage(
            created._id,
            formData.photoFile || formData.photoData,
            token
          );
          if (imgRes.success && imgRes.product) {
            created = imgRes.product;
          }
        } catch (imgErr) {
          console.warn('Image upload endpoint warning:', imgErr.message);
        }
      }

      // Cache product in localStorage for this user
      const userKey = user?.email || user?.id;
      if (userKey) {
        try {
          const storageKey = `karigar_products_${userKey}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const updated = [created, ...existing.filter(p => (p._id || p.id) !== (created._id || created.id))];
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (storageErr) {
          console.warn('Storage cache error:', storageErr.message);
        }
      }

      if (addToast) addToast('Product created and saved successfully!', 'success');

      if (shouldNavigateToAiStudio) {
        navigate('/ai-market-studio', { state: { productId: created._id || created.id } });
      } else {
        navigate('/catalogue');
      }
    } catch (err) {
      console.error('Create product error:', err);
      const userKey = user?.email || user?.id;
      if (userKey) {
        const localProd = {
          _id: 'local_' + Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
          artisan: userKey
        };
        try {
          const storageKey = `karigar_products_${userKey}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          localStorage.setItem(storageKey, JSON.stringify([localProd, ...existing]));
          if (addToast) addToast(language === 'HI' ? 'उत्पाद स्थानीय रूप से सुरक्षित सहेज लिया गया है!' : 'Product saved locally!', 'success');
          if (shouldNavigateToAiStudio) {
            navigate('/ai-market-studio', { state: { productId: localProd._id } });
          } else {
            navigate('/catalogue');
          }
          return;
        } catch (cacheErr) {
          console.warn('Cache fallback err:', cacheErr.message);
        }
      }
      if (addToast) addToast(err.message || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-container" style={{ maxWidth: '960px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{t('addProduct.pageTitle', 'Add New Artisan Product')}</h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          {t('addProduct.pageSubtitle', 'Create a market-ready listing with step-by-step AI studio automation.')}
        </p>
      </div>

      {/* Workflow Step Progress Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: currentStep >= 1 ? 1 : 0.45 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStep >= 1 ? 'var(--accent-terracotta)' : 'var(--bg-input)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>1</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('addProduct.step1', 'Product Basics')}</span>
        </div>
        <ArrowRight size={16} color="var(--text-muted)" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: currentStep >= 2 ? 1 : 0.45 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStep >= 2 ? 'var(--accent-terracotta)' : 'var(--bg-input)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>2</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('addProduct.step2', 'Product Photo')}</span>
        </div>
        <ArrowRight size={16} color="var(--text-muted)" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: currentStep >= 3 ? 1 : 0.45 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStep >= 3 ? 'var(--accent-gold)' : 'var(--bg-input)', color: currentStep >= 3 ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>3</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('addProduct.step3', 'Studio & AI Analysis')}</span>
        </div>
      </div>

      {/* STEP 1: Product Basics */}
      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* HERO VOICE ASSISTANT BANNER - MAIN FOCUS */}
          <div
            style={{
              padding: '1.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(230, 81, 0, 0.22) 0%, rgba(255, 183, 3, 0.12) 100%)',
              border: '2px solid rgba(230, 81, 0, 0.45)',
              boxShadow: '0 12px 30px rgba(230, 81, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              
              {/* Pulsing Mic Hero Icon */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    background: 'rgba(230, 81, 0, 0.25)',
                    animation: 'pulse 1.8s infinite'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-terracotta), #ff7043)',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(230, 81, 0, 0.5)',
                    transition: 'transform 0.2s ease'
                  }}
                  title="Click to start Voice Assistant"
                >
                  <Mic size={38} />
                </button>
              </div>

              {/* Title & Description */}
              <div style={{ flex: '1', minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ background: 'var(--accent-gold)', color: '#000', fontSize: '0.72rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('addProduct.voiceHeroBadge', 'Voice-First AI Listing')}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {t('addProduct.voiceHeroTitle', '🎙️ Voice Craft Assistant')}
                  </h2>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {t('addProduct.voiceHeroDesc', 'Speak your craft details naturally in Hindi or English. AI automatically fills Title, Category, Material, Technique, Price, Cost, and Story into your form fields!')}
                </p>
              </div>

              {/* Primary Voice Action Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                <Button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  variant="primary"
                  icon={<Mic size={18} />}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem 1.25rem', fontWeight: 800, fontSize: '0.95rem' }}
                >
                  {t('addProduct.startVoiceBtn', 'Start Voice Assistant 🎙️')}
                </Button>
              </div>

            </div>

            {/* Quick Demo Sample Prompts Bar (English & Hindi only) */}
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} /> {t('addProduct.quickDemoSamples', 'Quick Demo Samples (Click to Test):')}
              </span>

              <button
                type="button"
                disabled={isParsingDemo}
                onClick={() => handleTriggerVoiceDemo(
                  'यह हस्तनिर्मित जयपुर टेराकोटा गुलदस्ता है। प्राकृतिक मिट्टी से चाक पर बनाया गया है। कीमत 750 रुपये और सामग्री लागत 450 रुपये है।',
                  'hi-IN'
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                {t('addProduct.demoHindi', '🇮🇳 Demo (Hindi Pottery)')}
              </button>

              <button
                type="button"
                disabled={isParsingDemo}
                onClick={() => handleTriggerVoiceDemo(
                  'આ હાથથી બનાવેલું કચ્છ રોગન આર્ટ વોલ હેંગિંગ છે. કુદરતી એરંડાના તેલ અને રંગોથી કાપડ પર બનેલું છે. વેચાણ કિંમત 950 રૂપિયા અને સામગ્રી ખર્ચ 550 રૂપિયા છે.',
                  'gu-IN'
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                {t('addProduct.demoGujarati', '🇮🇳 Demo (Gujarati Rogan Art)')}
              </button>

              <button
                type="button"
                disabled={isParsingDemo}
                onClick={() => handleTriggerVoiceDemo(
                  'Hand-painted Jaipur Terracotta Vase made with organic clay on wheel pottery. Target price 750 rupees with material cost 450 rupees.',
                  'en-IN'
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                {t('addProduct.demoEnglish', '🌐 Demo (English Craft)')}
              </button>
            </div>

          </div>

          {/* Product Basics Form Card */}
          <Card title="Step 1: Product Basics Form" subtitle="All fields below are populated by Voice AI and can be freely modified anytime.">
            {voiceFilled && (
              <div style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--success)',
                fontSize: '0.88rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={18} />
                  <span><strong>✨ Voice Details Extracted!</strong> Fields populated from spoken audio. You can edit any field anytime.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-terracotta)', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Speak Again 🎙️
                </button>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }}>
              <Input 
                label={t('addProduct.titleLabel', 'Product Name / Title (Short & English only)')}
                placeholder={t('addProduct.titlePlaceholder', 'e.g. Handmade Festive Rakhi (2-4 words in English)')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                badgeText={voiceFilled && formData.name ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                helpText={t('addProduct.titleHelp', 'Keep title short (2 to 4 words) in English only for optimal marketplace search.')}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <Input 
                  label={t('addProduct.categoryLabel', 'Craft Category')}
                  type="select"
                  options={mockCategories.filter(c => c !== 'All Crafts').map(c => ({
                    value: c,
                    label: translateCategory(c)
                  }))}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  badgeText={voiceFilled && formData.category ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                  required
                />

                <Input 
                  label={t('addProduct.materialLabel', 'Material')}
                  placeholder={t('addProduct.materialPlaceholder', 'e.g. Terracotta Clay / Pure Silk')}
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  badgeText={voiceFilled && formData.material ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                />

                <Input 
                  label={t('addProduct.techniqueLabel', 'Craft Technique')}
                  placeholder={t('addProduct.techniquePlaceholder', 'e.g. Wheel Pottery / Tie-Dye')}
                  value={formData.craftType}
                  onChange={(e) => setFormData({ ...formData, craftType: e.target.value })}
                  badgeText={voiceFilled && formData.craftType ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input 
                  label={t('addProduct.sellingPriceLabel', 'Target Selling Price (₹)')}
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  badgeText={voiceFilled && formData.price ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                  required
                />

                <Input 
                  label={t('addProduct.materialCostLabel', 'Material Cost (₹)')}
                  type="number"
                  value={formData.materialCost}
                  onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                  badgeText={voiceFilled && formData.materialCost ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                />
              </div>

              <Input 
                label={t('addProduct.storyLabel', 'Craft Story & Description')}
                type="textarea"
                rows={3}
                placeholder={t('addProduct.storyPlaceholder', 'Describe your craft creation process...')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                badgeText={voiceFilled && formData.description ? (language === 'HI' ? '✨ वॉइस द्वारा भरा गया' : '✨ Voice Filled') : null}
                voicePrompt={true}
                onVoiceClick={() => setIsVoiceModalOpen(true)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Button 
                  type="button" 
                  variant="secondary" 
                  loading={isSubmitting}
                  onClick={() => handleSubmitProduct(false)}
                >
                  {language === 'HI' ? '💾 उत्पाद अभी सहेजें' : '💾 Save Product Now'}
                </Button>
                <Button type="submit" icon={<ArrowRight size={18} />}>
                  {t('addProduct.nextPhotoBtn', 'Continue to Product Photo ➔')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* STEP 2: Product Photo Upload */}
      {currentStep === 2 && (
        <Card title={t('addProduct.step2Title', 'Step 2: Upload Craft Photo')} subtitle={t('addProduct.step2Subtitle', 'Upload or capture a photo. Studio enhancement & AI analysis will run automatically!')}>
          <ImageUploader 
            value={formData.photoData}
            onChange={handleImageSelect}
            addToast={addToast}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Button onClick={() => setCurrentStep(1)} variant="secondary">
              {t('addProduct.backToBasicsBtn', '← Back to Basics')}
            </Button>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button 
                type="button" 
                variant="secondary" 
                loading={isSubmitting}
                onClick={() => handleSubmitProduct(false)}
              >
                {language === 'HI' ? '💾 उत्पाद सहेजें' : '💾 Save Product'}
              </Button>
              {formData.photoData && (
                <Button onClick={() => handleImageSelect(formData.photoData, formData.photoFile)} icon={<Sparkles size={18} color="var(--accent-gold)" />}>
                  {t('addProduct.runStudioBtn', 'Run Studio Enhancement ➔')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: Product Studio Automatic Photo Enhancement & AI Image Analysis */}
      {currentStep === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Automated 4-Step Pipeline Progress Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Wand2 size={22} color="var(--accent-gold)" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{t('addProduct.pipelineHeader', 'AI Photo Studio & Vision Pipeline')}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{t('addProduct.pipelineSub', 'Automatic background removal, pure white studio compositing & multimodal analysis')}</p>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: pipelineStep === 4 ? 'var(--success)' : 'var(--accent-gold)' }}>
                {pipelineStatus}
              </span>
            </div>

            {/* 4-Step Progress Flow with Icons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginTop: '0.75rem'
            }}>
              {[
                { step: 1, label: t('addProduct.stageUploading', 'Uploading'), icon: <Upload size={16} /> },
                { step: 2, label: t('addProduct.stageRemovingBg', 'Removing Background'), icon: <Scissors size={16} /> },
                { step: 3, label: t('addProduct.stageEnhancing', 'Enhancing Image'), icon: <Sparkles size={16} /> },
                { step: 4, label: t('addProduct.stageCompleted', 'Completed'), icon: <CheckCircle2 size={16} /> },
              ].map((item) => {
                const isDone = pipelineStep > item.step || (pipelineStep === 4 && item.step === 4 && !isEnhancing);
                const isActive = pipelineStep === item.step && isEnhancing;
                return (
                  <div
                    key={item.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isDone
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isActive
                        ? 'rgba(230, 81, 0, 0.18)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${
                        isDone
                          ? 'rgba(16, 185, 129, 0.4)'
                          : isActive
                          ? 'var(--accent-terracotta)'
                          : 'var(--border-color)'
                      }`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isDone ? 'var(--success)' : isActive ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {isDone ? <Check size={14} /> : item.icon}
                    </div>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isActive || isDone ? 700 : 500,
                      color: isDone ? 'var(--success)' : isActive ? 'var(--accent-gold)' : 'var(--text-muted)'
                    }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Photo Studio Side-by-Side Comparison */}
          <Card
            title={t('addProduct.studioPresentationTitle', 'Product Studio Presentation')}
            subtitle={t('addProduct.studioPresentationSub', 'Compare original photo with AI Studio background removal & lighting')}
          >
            {enhancementError && (
              <div style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: 'var(--warning)',
                fontSize: '0.88rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <AlertTriangle size={20} />
                  <div>
                    <strong>{language === 'HI' ? 'फ़ोटो संवर्धन अस्थायी रूप से अनुपलब्ध है।' : 'Photo enhancement is temporarily unavailable.'}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {language === 'HI' ? 'सटीक बैकग्राउंड हटाने के लिए backend/.env में REMOVE_BG_API_KEY जोड़ें। आप सुरक्षित रूप से मूल फ़ोटो के साथ आगे बढ़ सकते हैं।' : 'To enable high-accuracy background removal, add REMOVE_BG_API_KEY to backend/.env. You can safely continue with your original photo.'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => runAutomaticStudioPipeline(formData.photoData || formData.photoFile)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <RefreshCw size={14} /> {t('addProduct.retryEnhancementBtn', 'Retry Enhancement')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageChoice('original')}
                    style={{
                      background: 'var(--accent-terracotta)',
                      border: 'none',
                      color: '#fff',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t('addProduct.useOriginalBtn', 'Continue with Original Photo')}
                  </button>
                </div>
              </div>
            )}

            {/* Two image boxes (Original | Enhanced) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              
              {/* Box 1: ORIGINAL PHOTO */}
              <div style={{
                border: selectedImageChoice === 'original' ? '2px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                    {t('addProduct.originalBoxTitle', 'ORIGINAL PHOTO')}
                  </span>
                  {selectedImageChoice === 'original' && (
                    <span style={{ fontSize: '0.72rem', background: 'var(--accent-terracotta)', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                      ✓ {language === 'HI' ? 'चयनित' : 'SELECTED'}
                    </span>
                  )}
                </div>

                <div style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  height: '280px',
                  background: '#0a0d14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={formData.photoData}
                    alt="Original Craft Photo"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedImageChoice('original')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: selectedImageChoice === 'original' ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                      background: selectedImageChoice === 'original' ? 'rgba(230,81,0,0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedImageChoice === 'original' ? 'var(--accent-terracotta)' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedImageChoice === 'original' ? (language === 'HI' ? '✓ मूल फ़ोटो चयनित' : '✓ Using Original') : t('addProduct.useOriginalBtn', 'Use Original')}
                  </button>
                </div>
              </div>

              {/* Box 2: STUDIO ENHANCED (PURE WHITE BACKDROP) */}
              <div style={{
                border: selectedImageChoice === 'enhanced' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} /> {t('addProduct.enhancedBoxTitle', 'AFTER (ENHANCED - WHITE BACKDROP)')}
                  </span>
                  {selectedImageChoice === 'enhanced' && enhancedImage && (
                    <span style={{ fontSize: '0.72rem', background: 'var(--accent-gold)', color: '#000', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 900 }}>
                      ✓ {language === 'HI' ? 'सक्रिय पसंद' : 'ACTIVE CHOICE'}
                    </span>
                  )}
                </div>

                <div style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  height: '280px',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {isEnhancing ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444', padding: '1.5rem', textAlign: 'center' }}>
                      <div className="spinner" style={{ width: '40px', height: '40px', color: 'var(--accent-terracotta)', marginBottom: '1rem' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{pipelineStatus}</span>
                      <span style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.3rem' }}>{language === 'HI' ? 'सफेद बैकग्राउंड और स्टूडियो लाइटिंग लागू की जा रही है...' : 'Applying clean white background & lighting...'}</span>
                    </div>
                  ) : enhancedImage ? (
                    <img
                      src={enhancedImage}
                      alt="Studio White Product Preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', padding: '1rem', textAlign: 'center' }}>
                      <ImageIcon size={36} color="#bbb" style={{ marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>{language === 'HI' ? 'संवर्धित स्टूडियो फ़ोटो यहाँ दिखाई देगी' : 'Enhanced studio image will appear here'}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    disabled={!enhancedImage || isEnhancing}
                    onClick={() => setSelectedImageChoice('enhanced')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--accent-gold)',
                      background: selectedImageChoice === 'enhanced' && enhancedImage ? 'var(--accent-gold)' : 'rgba(255,183,3,0.12)',
                      color: selectedImageChoice === 'enhanced' && enhancedImage ? '#000' : 'var(--accent-gold)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: !enhancedImage || isEnhancing ? 'not-allowed' : 'pointer',
                      opacity: !enhancedImage ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedImageChoice === 'enhanced' && enhancedImage ? (language === 'HI' ? '✓ संवर्धित फ़ोटो चयनित' : '✓ Using Enhanced') : t('addProduct.useEnhancedBtn', 'Use Enhanced')}
                  </button>

                  <button
                    type="button"
                    onClick={() => runAutomaticStudioPipeline(formData.photoData || formData.photoFile)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title="Retry photo enhancement"
                  >
                    <RefreshCw size={14} /> {t('addProduct.retryEnhancementBtn', 'Retry')}
                  </button>
                </div>
              </div>

            </div>
          </Card>

          {/* AI Image Analysis Detected Attributes */}
          <Card title={t('addProduct.detectedAttributesTitle', 'Detected AI Craft Attributes')} subtitle={t('addProduct.detectedAttributesSub', 'Automatic visual observations. All detected attributes are fully editable.')}>
            {isAnalyzing ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', color: 'var(--accent-terracotta)', marginBottom: '0.75rem' }} />
                <p>{language === 'HI' ? 'दृश्य बनावट, रंग और शिल्प शैली का विश्लेषण जारी है...' : 'Analyzing visual textures, colors & craft style...'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <Input label={t('addProduct.detectedTypeLabel', 'Detected Product Type')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <Input label={t('addProduct.detectedCategoryLabel', 'Detected Category')} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                <Input label={t('addProduct.detectedMaterialLabel', 'Detected Material')} value={formData.material || (language === 'HI' ? 'पहचाना नहीं गया' : 'Not detected')} onChange={(e) => setFormData({ ...formData, material: e.target.value })} />
                <Input label={t('addProduct.detectedTechniqueLabel', 'Detected Craft Technique')} value={formData.craftType || (language === 'HI' ? 'पहचाना नहीं गया' : 'Not detected')} onChange={(e) => setFormData({ ...formData, craftType: e.target.value })} />
              </div>
            )}
          </Card>

          {/* Bottom Action CTAs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <Button onClick={() => setCurrentStep(2)} variant="secondary">
              {t('addProduct.changePhotoBtn', '← Change Photo')}
            </Button>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button onClick={() => handleSubmitProduct(false)} loading={isSubmitting} variant="secondary">
                {t('addProduct.saveAndCatalogueBtn', 'Save & View in Catalogue')}
              </Button>
              <Button onClick={() => handleSubmitProduct(true)} loading={isSubmitting} variant="primary" icon={<Sparkles size={18} color="#fff" />}>
                {t('addProduct.proceedToAiStudioBtn', 'Save & Open AI Market Studio ➔')}
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* Voice Recorder Modal */}
      {isVoiceModalOpen && (
        <VoiceRecorderModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onApplyVoiceData={handleApplyVoiceData}
          onApplyTranscript={(text) => setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description}\n\n${text}` : text }))}
          addToast={addToast}
        />
      )}

    </div>
  );
}
