import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import VoiceRecorderModal from '../components/VoiceRecorderModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getProducts } from '../services/productService.js';
import { getBusinessAdvice, getProductBusinessAdvice } from '../services/advisorService.js';
import { mockProducts, demoFallbackProducts } from '../services/dummyData.js';
import {
  Sparkles,
  Send,
  Mic,
  Package,
  Tag,
  Search,
  DollarSign,
  Users,
  Calendar,
  Gift,
  Camera,
  FileText,
  Lightbulb,
  AlertTriangle,
  History,
  Check,
  Copy,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "How can I sell this product better?",
  "How to position this craft for upcoming festivals?",
  "What search keywords will bring online buyers?",
  "How to market this item as a corporate gift?",
  "How can I improve my product photography?",
  "How should I structure my product description and story?",
  "What target audience will appreciate this craft?"
];

export default function BusinessAdvisor({ addToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  // Artisan products from MongoDB
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);

  // Manual/custom product context fallback
  const [customContext, setCustomContext] = useState({
    title: 'Terracotta Painted Decorative Pot',
    category: 'Pottery & Ceramics',
    price: 750,
    material: 'Terracotta Clay',
    craftType: 'Traditional Clay Painting',
    description: 'Handcrafted terracotta clay pot with traditional floral motifs and natural earthen glaze.',
    tags: ['Pottery', 'Decor', 'Traditional', 'Handmade']
  });
  const [useCustomProduct, setUseCustomProduct] = useState(false);

  // Question & Interaction state
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState(null);
  const [advisorEngine, setAdvisorEngine] = useState('');

  // Conversation history for current active session
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(null);

  // Voice recording modal state
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Copied keywords state
  const [copiedKeywords, setCopiedKeywords] = useState(false);

  // Load products on mount
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      const isDemoAccount = Boolean(user && (user.email === 'ramesh@karigar.in' || user.isDemo));
      const userKey = user?.email || user?.id || '';

      try {
        if (token) {
          const res = await getProducts(token);
          if (res.success && res.products && res.products.length > 0) {
            setProducts(res.products);
            const stateProductId = location.state?.productId;
            if (stateProductId && res.products.some(p => (p._id || p.id) === stateProductId)) {
              setSelectedProductId(stateProductId);
              setActiveProduct(res.products.find(p => (p._id || p.id) === stateProductId));
            } else {
              setSelectedProductId(res.products[0]._id || res.products[0].id);
              setActiveProduct(res.products[0]);
            }
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
                setActiveProduct(parsed[0]);
                return;
              }
            } catch (e) {}
          }
        }

        // Only fallback to demo items for demo account
        if (isDemoAccount) {
          setProducts(mockProducts);
          const stateProductId = location.state?.productId;
          const target = mockProducts.find(p => (p._id || p.id) === stateProductId) || mockProducts[0];
          setSelectedProductId(target._id || target.id);
          setActiveProduct(target);
        } else {
          setProducts([]);
          setSelectedProductId('');
          setActiveProduct(null);
        }
      } catch (err) {
        console.warn('Could not load user products for advisor, using demo fallback:', err.message);
        if (isDemoAccount) {
          setProducts(mockProducts);
          setSelectedProductId(mockProducts[0]._id || mockProducts[0].id);
          setActiveProduct(mockProducts[0]);
        } else {
          setProducts([]);
          setSelectedProductId('');
          setActiveProduct(null);
        }
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, [token, user?.email, user?.id, location.state]);

  // Handle product selection change
  const handleProductSelect = (e) => {
    const pId = e.target.value;
    if (pId === 'custom') {
      setUseCustomProduct(true);
      setSelectedProductId('custom');
      setActiveProduct(null);
    } else {
      setUseCustomProduct(false);
      setSelectedProductId(pId);
      const found = products.find(p => p._id === pId);
      setActiveProduct(found || null);
    }
  };

  // Submit advice query
  const handleAskQuestion = async (questionToAsk) => {
    const queryText = (questionToAsk || question).trim();
    if (!queryText) {
      if (addToast) addToast('Please enter or select a question to ask the Business Advisor', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      const historyPayload = sessionHistory.map(item => ({
        question: item.question,
        answer: item.adviceData?.directAnswer || ''
      }));

      if (!useCustomProduct && selectedProductId && selectedProductId !== 'custom') {
        res = await getProductBusinessAdvice(selectedProductId, {
          question: queryText,
          conversationHistory: historyPayload
        }, token);
      } else {
        const contextPayload = {
          title: customContext.title,
          name: customContext.title,
          category: customContext.category,
          price: Number(customContext.price) || 0,
          material: customContext.material,
          craftType: customContext.craftType,
          description: customContext.description,
          tags: customContext.tags
        };
        res = await getBusinessAdvice({
          question: queryText,
          productContext: contextPayload,
          conversationHistory: historyPayload
        }, token);
      }

      if (res.success && res.advice) {
        const newAdviceEntry = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          question: queryText,
          productTitle: useCustomProduct ? customContext.title : (activeProduct?.name || 'Custom Craft'),
          adviceData: res.advice,
          engine: res.engine || 'karigar-ai-engine'
        };

        setCurrentAdvice(res.advice);
        setAdvisorEngine(res.engine || 'karigar-ai-engine');
        
        // Append to current session conversation history
        setSessionHistory(prev => [newAdviceEntry, ...prev]);
        setActiveHistoryIndex(0);

        if (addToast) addToast('Business advice generated successfully!', 'success');
      } else {
        throw new Error(res.message || 'Failed to generate business advice');
      }
    } catch (err) {
      console.error('Advisor Submit Error:', err);
      if (addToast) addToast(err.message || 'Failed to get business advice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select historical turn from session
  const handleSelectHistoryTurn = (index) => {
    setActiveHistoryIndex(index);
    const selected = sessionHistory[index];
    if (selected) {
      setCurrentAdvice(selected.adviceData);
      setAdvisorEngine(selected.engine);
    }
  };

  // Copy keywords
  const handleCopyKeywords = (keywordsArray) => {
    if (!keywordsArray || keywordsArray.length === 0) return;
    const textToCopy = keywordsArray.join(', ');
    navigator.clipboard.writeText(textToCopy);
    setCopiedKeywords(true);
    if (addToast) addToast('Keywords copied to clipboard!', 'success');
    setTimeout(() => setCopiedKeywords(false), 2500);
  };

  // Voice recording complete handler
  const handleVoiceRecordingComplete = (transcript) => {
    if (transcript && transcript.trim()) {
      setQuestion(transcript.trim());
      if (addToast) addToast('Voice transcribed! Press Ask Advisor to submit.', 'info');
    }
  };

  return (
    <div className="main-container">
      {/* Header Title */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, rgba(230,81,0,0.2) 0%, rgba(255,183,3,0.2) 100%)', color: 'var(--accent-gold)' }}>
            <Sparkles size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>AI Business Advisor</h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Practical, realistic e-commerce guidance tailored to your artisan handicraft
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.75rem' }}>

        {/* SECTION 1: Product Context Selection */}
        <Card title="Step 1: Select Craft Product Context" subtitle="The AI Advisor uses your product details to generate tailored strategies">
          {loadingProducts ? (
            <Loader text="Loading your artisan catalogue..." />
          ) : (
            <div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Choose Active Product:</label>
                <select 
                  className="form-select" 
                  value={useCustomProduct ? 'custom' : selectedProductId}
                  onChange={handleProductSelect}
                  style={{ fontWeight: 600 }}
                >
                  {products.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.isDemoFallback || String(p._id || p.id).startsWith('fallback_') ? '🎨 [Demo Fallback] ' : '📦 '}
                      {p.name || p.title} ({p.category} - ₹{p.price})
                    </option>
                  ))}
                  <option value="custom">✏️ Enter Custom Craft Context</option>
                </select>
              </div>

              {/* Product Preview Context Card */}
              {!useCustomProduct && activeProduct && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap'
                }}>
                  {activeProduct.enhancedImage || activeProduct.originalImage ? (
                    <img 
                      src={activeProduct.enhancedImage || activeProduct.originalImage} 
                      alt={activeProduct.name}
                      style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', background: 'rgba(230,81,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-terracotta)' }}>
                      <Package size={36} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeProduct.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {activeProduct.category} • {activeProduct.material || 'Artisan Material'} • {activeProduct.craftType || 'Traditional Craft'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>
                        Price: ₹{activeProduct.price}
                      </span>
                      {activeProduct.tags && activeProduct.tags.length > 0 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', background: 'rgba(255,183,3,0.1)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                          🏷️ {activeProduct.tags.slice(0, 3).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Product Fields (shown if custom selected) */}
              {useCustomProduct && (
                <div style={{
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Craft Name / Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={customContext.title} 
                      onChange={(e) => setCustomContext({ ...customContext, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={customContext.category} 
                      onChange={(e) => setCustomContext({ ...customContext, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Selling Price (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={customContext.price} 
                      onChange={(e) => setCustomContext({ ...customContext, price: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Material</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={customContext.material} 
                      onChange={(e) => setCustomContext({ ...customContext, material: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label className="form-label">Craft Technique / Description</label>
                    <textarea 
                      className="form-textarea" 
                      rows={2}
                      value={customContext.description} 
                      onChange={(e) => setCustomContext({ ...customContext, description: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* SECTION 2: Suggested Questions & Query Input */}
        <Card title="Step 2: Ask Your E-Commerce Question" subtitle="Choose a recommended prompt or type your custom question">
          
          {/* Suggested Question Chips */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Suggested Artisan Questions:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SUGGESTED_QUESTIONS.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(sq);
                    handleAskQuestion(sq);
                  }}
                  disabled={isSubmitting}
                  style={{
                    background: question === sq ? 'rgba(230,81,0,0.25)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${question === sq ? 'var(--accent-terracotta)' : 'var(--border-color)'}`,
                    color: question === sq ? 'var(--accent-gold)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Sparkles size={13} color="var(--accent-gold)" />
                  <span>{sq}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Text Input Bar */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Your Question:</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. How can I sell this product better?" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) handleAskQuestion();
                }}
              />
              <button 
                type="button" 
                className="voice-btn-trigger" 
                onClick={() => setShowVoiceModal(true)}
                title="Speak question in English, Hindi, or Gujarati"
              >
                <Mic size={15} />
                <span>Voice</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => handleAskQuestion()} 
              loading={isSubmitting}
              icon={<Send size={18} />}
            >
              Ask AI Advisor
            </Button>
          </div>
        </Card>

        {/* SECTION 3: Advisor Loading State */}
        {isSubmitting && (
          <Card>
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div className="spinner" style={{ width: '42px', height: '42px', color: 'var(--accent-terracotta)', marginBottom: '1.2rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Analyzing Craft Context & Preparing E-Commerce Advice...
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Evaluating target audience, festival positioning, keywords, and practical photo & description improvements.
              </p>
            </div>
          </Card>
        )}

        {/* SECTION 4: Advice Response Display Area */}
        {!isSubmitting && currentAdvice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Direct Advisor Summary Header */}
            <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-terracotta)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Lightbulb size={24} color="var(--accent-gold)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Advisor Recommendation Summary</h2>
                </div>
                {advisorEngine && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
                    Powered by {advisorEngine}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '1.02rem', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 500 }}>
                {currentAdvice.directAnswer}
              </p>
            </div>

            {/* Categorized Advice Types Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

              {/* 1. Better Product Title */}
              {currentAdvice.advice?.betterTitle && (
                <Card 
                  title="🏷️ Better Product Title" 
                  subtitle="Optimized to improve search visibility & click rates"
                >
                  <div style={{ background: 'rgba(230,81,0,0.1)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(230,81,0,0.3)', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '0.25rem' }}>RECOMMENDED TITLE:</p>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                      {currentAdvice.advice.betterTitle.suggestedTitle}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <strong>Why it works:</strong> {currentAdvice.advice.betterTitle.reason}
                  </p>
                </Card>
              )}

              {/* 2. High-Intent Keywords & Search Terms */}
              {currentAdvice.advice?.keywords && (
                <Card 
                  title="🔍 Search Keywords & Tags" 
                  subtitle="Use these in product tags & search metadata"
                  action={
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyKeywords(currentAdvice.advice.keywords)}
                      icon={copiedKeywords ? <Check size={14} /> : <Copy size={14} />}
                    >
                      {copiedKeywords ? 'Copied' : 'Copy All'}
                    </Button>
                  }
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {currentAdvice.advice.keywords.map((kw, i) => (
                      <span key={i} style={{
                        fontSize: '0.82rem',
                        background: 'rgba(255,183,3,0.12)',
                        color: 'var(--accent-gold)',
                        border: '1px solid rgba(255,183,3,0.25)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600
                      }}>
                        #{kw}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* 3. Pricing Suggestions & Value Framing */}
              {currentAdvice.advice?.pricingSuggestions && (
                <Card 
                  title="💰 Pricing & Value Framing" 
                  subtitle="Position craft value without unrealistic earning promises"
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRICING STRATEGY:</p>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {currentAdvice.advice.pricingSuggestions.strategy}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>VALUE FRAMING TACTIC:</p>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {currentAdvice.advice.pricingSuggestions.framing}
                    </p>
                  </div>
                </Card>
              )}

              {/* 4. Target Audience */}
              {currentAdvice.advice?.targetAudience && (
                <Card 
                  title="🎯 Target Audience" 
                  subtitle="Key buyer profiles for this authentic handicraft"
                >
                  <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentAdvice.advice.targetAudience.map((ta, i) => (
                      <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ta}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* 5. Festival Positioning */}
              {currentAdvice.advice?.festivalPositioning && (
                <Card 
                  title="🪔 Festival Positioning" 
                  subtitle="Leverage Indian festive shopping seasons"
                >
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {currentAdvice.advice.festivalPositioning.festivals?.map((f, i) => (
                      <span key={i} style={{ fontSize: '0.78rem', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                        ✨ {f}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {currentAdvice.advice.festivalPositioning.pitch}
                  </p>
                </Card>
              )}

              {/* 6. Gifting Positioning */}
              {currentAdvice.advice?.giftingPositioning && (
                <Card 
                  title="🎁 Gifting Positioning" 
                  subtitle="Occasion marketing & packaging presentation"
                >
                  <div style={{ marginBottom: '0.6rem' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>GIFTING OCCASIONS:</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {currentAdvice.advice.giftingPositioning.giftingOccasions?.join(', ')}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>PACKAGING & STORY TIP:</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {currentAdvice.advice.giftingPositioning.packagingTip}
                    </p>
                  </div>
                </Card>
              )}

              {/* 7. Photography Improvements */}
              {currentAdvice.advice?.photographyTips && (
                <Card 
                  title="📸 Photography Improvements" 
                  subtitle="Visual presentation tips for higher conversions"
                >
                  <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentAdvice.advice.photographyTips.map((tip, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* 8. Description Improvements */}
              {currentAdvice.advice?.descriptionTips && (
                <Card 
                  title="📝 Description Improvements" 
                  subtitle="Enhance story authenticity & buyer confidence"
                >
                  <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentAdvice.advice.descriptionTips.map((dt, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {dt}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* 9. Practical Selling Tips */}
              {currentAdvice.advice?.sellingTips && (
                <Card 
                  title="🚀 Practical Selling Tips" 
                  subtitle="Actionable tactics for online & offline sales"
                >
                  <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentAdvice.advice.sellingTips.map((st, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {st}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

            </div>

            {/* MANDATORY ETHICAL & ACCURACY DISCLAIMER */}
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '0.25rem' }}>
                  Ethical AI Advisory Disclaimer
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {currentAdvice.disclaimer || 'AI Business Advisor recommendations are strategic guidelines. Actual sales depend on market demand, product quality, and promotion. KarigarAI does not guarantee specific earnings.'}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 5: Conversation History for Current Session */}
        {sessionHistory.length > 0 && (
          <Card 
            title="Session Conversation History" 
            subtitle={`Saved Q&A turns for the current active session (${sessionHistory.length})`}
            action={
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSessionHistory([]);
                  setCurrentAdvice(null);
                  setActiveHistoryIndex(null);
                }}
                icon={<RefreshCw size={14} />}
              >
                Clear History
              </Button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessionHistory.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={() => handleSelectHistoryTurn(idx)}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: activeHistoryIndex === idx ? 'rgba(230,81,0,0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${activeHistoryIndex === idx ? 'var(--accent-terracotta)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <History size={18} color={activeHistoryIndex === idx ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        "{item.question}"
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.productTitle} • {item.timestamp}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>

      {/* Voice Recorder Modal */}
      {showVoiceModal && (
        <VoiceRecorderModal
          onClose={() => setShowVoiceModal(false)}
          onTranscriptionComplete={handleVoiceRecordingComplete}
          addToast={addToast}
        />
      )}
    </div>
  );
}
