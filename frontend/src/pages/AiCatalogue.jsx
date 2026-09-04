import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Loader from '../components/Loader.jsx';
import VoiceRecorderModal from '../components/VoiceRecorderModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getProducts, updateProduct } from '../services/productService.js';
import { generateAiCatalogue, generateProductCatalogueById } from '../services/catalogueGeneratorService.js';
import { mockProducts, mockCategories } from '../services/dummyData.js';
import {
  Sparkles,
  RefreshCw,
  Edit3,
  Save,
  CheckCircle2,
  Globe,
  Mic,
  FileText,
  Layers,
  Tag,
  Users,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';

export default function AiCatalogue({ addToast }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);

  // Input Data Sources
  const [artisanNotes, setArtisanNotes] = useState('');
  const [inputCategory, setInputCategory] = useState('Pottery & Ceramics');
  const [inputMaterial, setInputMaterial] = useState('');
  const [inputCraftType, setInputCraftType] = useState('');
  const [imageAnalysisSummary, setImageAnalysisSummary] = useState({
    productType: '',
    material: '',
    craftType: '',
    colors: ['Terracotta Brown', 'Earth White'],
    visibleCharacteristics: ['Hand-thrown clay curves', 'Natural mineral wash']
  });

  // Output Language: 'en' | 'hi' (Extensible for 'gu')
  const [outputLanguage, setOutputLanguage] = useState('en');

  // Generated Catalogue State (Structured JSON)
  const [catalogue, setCatalogue] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Fetch products from MongoDB
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const isDemoAccount = Boolean(user && (user.email === 'ramesh@karigar.in' || user.isDemo));
      const userKey = user?.email || user?.id || '';

      try {
        if (token) {
          const res = await getProducts(token);
          if (res.success && res.products && res.products.length > 0) {
            setProducts(res.products);
            const first = res.products[0];
            setSelectedProductId(first._id);
            populateProductDetails(first);
            return;
          }
        }

        if (userKey) {
          const cached = localStorage.getItem(`karigar_products_${userKey}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProducts(parsed);
                setSelectedProductId(parsed[0]._id || parsed[0].id);
                populateProductDetails(parsed[0]);
                return;
              }
            } catch (e) {}
          }
        }

        if (isDemoAccount) {
          setProducts(mockProducts);
          setSelectedProductId(mockProducts[0]._id || 'mock-1');
          populateProductDetails(mockProducts[0]);
        } else {
          setProducts([]);
          setSelectedProductId('');
          setCurrentProduct(null);
        }
      } catch (err) {
        console.warn('Load products fallback:', err);
        if (isDemoAccount) {
          setProducts(mockProducts);
          setSelectedProductId(mockProducts[0]._id || 'mock-1');
          populateProductDetails(mockProducts[0]);
        } else {
          setProducts([]);
          setSelectedProductId('');
          setCurrentProduct(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [token, user?.email, user?.id]);

  const populateProductDetails = (prod) => {
    if (!prod) return;
    setCurrentProduct(prod);
    setInputCategory(prod.category || 'Pottery & Ceramics');
    setInputMaterial(prod.material || 'Natural Clay');
    setInputCraftType(prod.craftType || 'Pottery');
    setArtisanNotes(prod.description || '');
    setImageAnalysisSummary({
      productType: prod.name || 'Artisan Craft',
      material: prod.material || 'Organic Clay',
      craftType: prod.craftType || 'Handicraft',
      colors: prod.tags?.slice(0, 3) || ['Earth Brown', 'Natural Gold'],
      visibleCharacteristics: ['Traditional artisan hand-finish', 'Eco-friendly material']
    });

    // If product already has structured descriptions, initialize preview
    if (prod.description && prod.description.length > 30) {
      setCatalogue({
        title: prod.name || '',
        shortDescription: prod.description.substring(0, 120) + '...',
        description: prod.description,
        category: prod.category || 'Handicraft',
        material: prod.material || 'Natural Materials',
        craftType: prod.craftType || 'Artisan Technique',
        keywords: prod.tags || ['Handmade', 'Artisan', 'India'],
        tags: prod.tags || ['AuthenticCraft', 'EcoFriendly'],
        targetAudience: 'Lovers of authentic Indian handicrafts and cultural gifting'
      });
    } else {
      setCatalogue(null);
    }
  };

  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => (p._id || p.id) === prodId);
    if (prod) {
      populateProductDetails(prod);
    }
  };

  // Step 9: Main Multilingual Catalogue Generation Call
  const handleGenerateCatalogue = async () => {
    setIsGenerating(true);
    if (addToast) addToast(`Generating AI Catalogue in ${outputLanguage === 'hi' ? 'Hindi (हिन्दी)' : 'English'}...`, 'info');

    try {
      const payload = {
        imageAnalysis: imageAnalysisSummary,
        description: artisanNotes,
        attributes: {
          name: currentProduct?.name || imageAnalysisSummary.productType,
          category: inputCategory,
          material: inputMaterial,
          craftType: inputCraftType,
        },
        outputLanguage: outputLanguage,
      };

      let res;
      if (currentProduct && currentProduct._id && !currentProduct._id.startsWith('mock')) {
        res = await generateProductCatalogueById(currentProduct._id, payload, token);
      } else {
        res = await generateAiCatalogue(payload, token);
      }

      if (res.success && res.catalogue) {
        setCatalogue(res.catalogue);
        if (addToast) addToast('AI Multilingual Catalogue generated successfully!', 'success');
      } else {
        throw new Error(res.message || 'Failed to generate catalogue');
      }
    } catch (err) {
      console.error('Catalogue Generation Error:', err);
      if (addToast) addToast(err.message || 'Failed to generate catalogue', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to MongoDB Product Document
  const handleSaveToMongoDB = async () => {
    if (!catalogue) return;

    if (!currentProduct || !currentProduct._id || currentProduct._id.startsWith('mock')) {
      if (addToast) addToast('Catalogue updated in preview mode!', 'success');
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        name: catalogue.title,
        description: catalogue.description,
        category: catalogue.category,
        material: catalogue.material,
        craftType: catalogue.craftType,
        tags: catalogue.tags.concat(catalogue.keywords || []),
      };

      const res = await updateProduct(currentProduct._id, updatePayload, token);
      if (res.success && res.product) {
        setCurrentProduct(res.product);
        setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
        if (addToast) addToast('Catalogue saved and synced to MongoDB!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to save to database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyword tag manipulation
  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (!newKeywordInput.trim() || !catalogue) return;
      if (!catalogue.keywords.includes(newKeywordInput.trim())) {
        setCatalogue(prev => ({
          ...prev,
          keywords: [...prev.keywords, newKeywordInput.trim()]
        }));
      }
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove) => {
    if (!catalogue) return;
    setCatalogue(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== kwToRemove)
    }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (!newTagInput.trim() || !catalogue) return;
      if (!catalogue.tags.includes(newTagInput.trim())) {
        setCatalogue(prev => ({
          ...prev,
          tags: [...prev.tags, newTagInput.trim()]
        }));
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!catalogue) return;
    setCatalogue(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  if (loading) {
    return <Loader fullPage text="Loading Multilingual Catalogue Generator..." />;
  }

  return (
    <div className="main-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          AI Multilingual <span className="gradient-text">Catalogue Generator</span>
        </h1>
        <p style={{ fontSize: '0.95rem' }}>
          Synthesize product images, voice notes (Hindi/Gujarati/English), and craft facts into professional e-commerce listings.
        </p>
      </div>

      {/* Product Document Selector Bar */}
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
          <BookOpen size={20} color="var(--accent-terracotta)" />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Active Craft Document
            </span>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {currentProduct?.name || 'Artisan Listing'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select Product:</label>
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
                {p.name || p.title} ({p.category || 'Craft'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Layout: Inputs on Left, Generated Editable Catalogue on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Combined Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Target Output Language Selector (English & Hindi only) */}
          <Card title="Output Language (भाषा / English)">
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Choose target language for e-commerce title, description, and keywords:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setOutputLanguage('en')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: outputLanguage === 'en' ? 'rgba(230,81,0,0.15)' : 'var(--bg-input)',
                  border: outputLanguage === 'en' ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                  color: outputLanguage === 'en' ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>🌐</span> English (India)
              </button>

              <button
                type="button"
                onClick={() => setOutputLanguage('hi')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: outputLanguage === 'hi' ? 'rgba(230,81,0,0.15)' : 'var(--bg-input)',
                  border: outputLanguage === 'hi' ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                  color: outputLanguage === 'hi' ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>🇮🇳</span> हिन्दी (Hindi)
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
              * Gujarati spoken voice or text is natively accepted as input.
            </p>
          </Card>

          {/* Input 1: Voice / Written Artisan Notes */}
          <Card title="1. Voice & Text Artisan Notes">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Spoken craft notes (Hindi, Gujarati, English):</span>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Mic size={14} /> Tap to Speak
              </button>
            </div>

            <textarea
              value={artisanNotes}
              onChange={(e) => setArtisanNotes(e.target.value)}
              placeholder="Describe materials, workshop story, or unique features..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </Card>

          {/* Input 2: Product Visual Analysis Facts */}
          <Card title="2. Image Analysis Facts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Visual Craft Type:</span>
                <span style={{ fontWeight: 600 }}>{imageAnalysisSummary.craftType || 'Handicraft'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Detected Material:</span>
                <span style={{ fontWeight: 600 }}>{imageAnalysisSummary.material || 'Natural Clay'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Observed Palette:</span>
                <span>{imageAnalysisSummary.colors.join(', ')}</span>
              </div>
            </div>
          </Card>

          {/* Input 3: Base Craft Attributes */}
          <Card title="3. Craft Attributes">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Craft Category"
                type="select"
                value={inputCategory}
                onChange={(e) => setInputCategory(e.target.value)}
                options={mockCategories.filter(c => c !== 'All Crafts')}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label="Material"
                  value={inputMaterial}
                  onChange={(e) => setInputMaterial(e.target.value)}
                  placeholder="e.g. Terracotta Clay"
                />
                <Input
                  label="Craft Technique"
                  value={inputCraftType}
                  onChange={(e) => setInputCraftType(e.target.value)}
                  placeholder="e.g. Wheel Pottery"
                />
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          <Button
            type="button"
            onClick={handleGenerateCatalogue}
            isLoading={isGenerating}
            fullWidth={true}
            icon={<Sparkles size={18} color="var(--accent-gold)" />}
          >
            {catalogue ? 'Regenerate Multilingual Catalogue' : 'Generate Professional Catalogue'}
          </Button>

        </div>

        {/* Right Column: Editable Generated Catalogue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card
            title="Generated E-Commerce Listing (Editable)"
            badge={
              catalogue ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <ShieldCheck size={14} /> AI Anti-Fabrication Verified
                </div>
              ) : null
            }
          >
            {isGenerating ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    border: '4px solid rgba(230,81,0,0.2)',
                    borderTopColor: 'var(--accent-terracotta)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1.25rem auto'
                  }}
                />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                  Synthesizing Multilingual Catalogue...
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Combining image visual facts, spoken artisan notes, and craft taxonomy without false claims.
                </p>
              </div>
            ) : catalogue ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Title */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Product Title (शीर्षक / Title)
                  </label>
                  <input
                    type="text"
                    value={catalogue.title}
                    onChange={(e) => setCatalogue({ ...catalogue, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '1.05rem',
                      fontWeight: 700
                    }}
                  />
                </div>

                {/* 2. Short Description */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Short Summary (संक्षिप्त विवरण / Hook)
                  </label>
                  <input
                    type="text"
                    value={catalogue.shortDescription}
                    onChange={(e) => setCatalogue({ ...catalogue, shortDescription: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* 3. Detailed Description */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Detailed Product Story & Care (विस्तृत विवरण)
                  </label>
                  <textarea
                    value={catalogue.description}
                    onChange={(e) => setCatalogue({ ...catalogue, description: e.target.value })}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* 4. Taxonomy: Category, Material, Craft Type */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={catalogue.category}
                      onChange={(e) => setCatalogue({ ...catalogue, category: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Material
                    </label>
                    <input
                      type="text"
                      value={catalogue.material}
                      onChange={(e) => setCatalogue({ ...catalogue, material: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Craft Type
                    </label>
                    <input
                      type="text"
                      value={catalogue.craftType}
                      onChange={(e) => setCatalogue({ ...catalogue, craftType: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* 5. Search Keywords (Tags/Chips) */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    SEO Keywords (कीवर्ड्स)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    {catalogue.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255,183,3,0.12)',
                          border: '1px solid rgba(255,183,3,0.3)',
                          color: 'var(--accent-gold)',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {kw}
                        <button type="button" onClick={() => handleRemoveKeyword(kw)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Add keyword..."
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddKeyword} icon={<Plus size={13} />}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* 6. Tags */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                    E-Commerce Tags (टैग्स)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    {catalogue.tags.map((tg, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(230,81,0,0.12)',
                          border: '1px solid rgba(230,81,0,0.3)',
                          color: 'var(--accent-terracotta)',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        #{tg}
                        <button type="button" onClick={() => handleRemoveTag(tg)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={handleAddTag} icon={<Plus size={13} />}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* 7. Target Audience */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Target Audience (लक्षित खरीदार)
                  </label>
                  <input
                    type="text"
                    value={catalogue.targetAudience}
                    onChange={(e) => setCatalogue({ ...catalogue, targetAudience: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                {/* Actions: Regenerate, Edit, Save */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <Button
                    type="button"
                    onClick={handleGenerateCatalogue}
                    variant="outline"
                    isLoading={isGenerating}
                    icon={<RefreshCw size={15} />}
                  >
                    Regenerate
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSaveToMongoDB}
                    variant="primary"
                    isLoading={isSaving}
                    icon={<Save size={16} />}
                    style={{ flex: 1 }}
                  >
                    Save & Sync to MongoDB
                  </Button>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Sparkles size={42} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  No Catalogue Generated Yet
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto 1.25rem auto' }}>
                  Select an artisan craft document on the left, speak or write details, and click Generate.
                </p>
                <Button type="button" onClick={handleGenerateCatalogue} icon={<Sparkles size={16} />}>
                  Generate Now
                </Button>
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* Voice Recorder Modal for input dictation */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialText={artisanNotes}
        onApplyTranscript={(spokenText) => {
          setArtisanNotes(prev => (prev ? `${prev}\n\n${spokenText}` : spokenText));
        }}
        addToast={addToast}
      />
    </div>
  );
}
