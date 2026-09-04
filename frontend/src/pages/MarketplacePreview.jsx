import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getProducts, getProductById } from '../services/productService.js';
import { getMarketplacePreview, exportCatalogueJson, downloadFile } from '../services/marketplaceService.js';
import { mockProducts } from '../services/dummyData.js';
import {
  ShoppingBag,
  Download,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Star,
  Truck,
  RotateCcw,
  MapPin,
  User,
  Heart,
  Share2,
  ChevronRight,
  Info,
  Layers,
  FileCode,
  FileSpreadsheet,
  ArrowLeft,
  ExternalLink,
  Eye
} from 'lucide-react';

export default function MarketplacePreview({ addToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t, language, translateCategory } = useLanguage();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(id || '');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState('enhanced');

  // Load all products and current selected product
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const isDemoAccount = Boolean(user && (user.email === 'ramesh@karigar.in' || user.isDemo));
      const userKey = user?.email || user?.id || '';

      try {
        let prodsList = [];
        if (token) {
          const res = await getProducts(token);
          if (res.success && res.products && res.products.length > 0) {
            prodsList = res.products;
          }
        }

        if (prodsList.length === 0 && userKey) {
          const cached = localStorage.getItem(`karigar_products_${userKey}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                prodsList = parsed;
              }
            } catch (e) {}
          }
        }

        if (prodsList.length === 0 && isDemoAccount) {
          prodsList = mockProducts;
        }

        setProducts(prodsList);

        const targetId = id || selectedProductId || (prodsList[0] ? (prodsList[0]._id || prodsList[0].id) : '');
        setSelectedProductId(targetId);

        const active = prodsList.find(p => (p._id || p.id) === targetId) || prodsList[0] || null;
        setCurrentProduct(active);
      } catch (err) {
        console.warn('Marketplace preview load error:', err);
        if (isDemoAccount) {
          setProducts(mockProducts);
          setCurrentProduct(mockProducts[0]);
          setSelectedProductId(mockProducts[0]._id || 'mock-1');
        } else {
          setProducts([]);
          setCurrentProduct(null);
          setSelectedProductId('');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, token, user?.email, user?.id]);

  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => (p._id || p.id) === prodId);
    if (prod) {
      setCurrentProduct(prod);
    }
  };

  // Export Catalogue as Clean Structured JSON
  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      if (token) {
        const res = await exportCatalogueJson(token);
        if (res.success) {
          downloadFile(res, `karigar-artisan-catalogue-${Date.now()}.json`, 'application/json');
          if (addToast) addToast('Complete catalogue exported as JSON!', 'success');
          return;
        }
      }

      // Local fallback export
      const fallbackExport = {
        catalogueMeta: {
          artisanName: user?.name || 'Master Artisan',
          totalItems: products.length,
          exportedAt: new Date().toISOString(),
          specification: 'KarigarAI Open Standard Catalogue Format v1.0',
        },
        products: products.map(p => ({
          title: p.name,
          category: p.category,
          material: p.material,
          craftType: p.craftType,
          price: p.price,
          description: p.description,
          tags: p.tags || [],
          status: p.status || 'Published',
        }))
      };

      downloadFile(fallbackExport, `karigar-artisan-catalogue-${Date.now()}.json`, 'application/json');
      if (addToast) addToast('Catalogue exported as structured JSON!', 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to export catalogue', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Catalogue as CSV
  const handleExportCsv = () => {
    const headers = ['Title', 'Category', 'Craft Technique', 'Material', 'Price (INR)', 'Status', 'Description'];
    const rows = products.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.craftType || '').replace(/"/g, '""')}"`,
      `"${(p.material || '').replace(/"/g, '""')}"`,
      `"${p.price || 0}"`,
      `"${p.status || 'Published'}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `karigar-catalogue-${Date.now()}.csv`, 'text/csv');
    if (addToast) addToast('Catalogue exported as CSV spreadsheet!', 'success');
  };

  // Copy JSON Data
  const handleCopyJson = () => {
    const singleExport = {
      title: currentProduct?.name,
      category: currentProduct?.category,
      material: currentProduct?.material,
      craftType: currentProduct?.craftType,
      price: currentProduct?.price,
      description: currentProduct?.description,
      tags: currentProduct?.tags || [],
      location: currentProduct?.location || user?.location || 'India (Artisan Craft Cluster)',
      seller: {
        artisanName: user?.name || currentProduct?.artisan?.name || 'Master Artisan',
        email: user?.email || '',
        verified: true
      }
    };

    navigator.clipboard.writeText(JSON.stringify(singleExport, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (addToast) addToast('Product JSON copied to clipboard!', 'info');
  };

  if (loading) {
    return <Loader fullPage text="Loading Marketplace Product Preview..." />;
  }

  if (!currentProduct) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>No Product Selected</h2>
        <Button onClick={() => navigate('/catalogue')} style={{ marginTop: '1rem' }}>
          Go to Catalogue
        </Button>
      </div>
    );
  }

  const primaryImage = currentProduct.enhancedImage || currentProduct.originalImage || currentProduct.image;
  const seller = currentProduct.artisan || user || { name: 'Master Artisan', email: 'artisan@karigar.ai', location: 'Kutch Craft Hub, Gujarat' };
  const calculatedMrp = Math.round((currentProduct.price || 1200) * 1.35);

  return (
    <div className="main-container">
      
      {/* Top Header & Export Controls Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-terracotta)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShoppingBag size={16} />
            <span>{language === 'HI' ? 'मार्केटप्लेस पूर्वावलोकन और निर्यात' : 'Marketplace-Ready Preview & Export Architecture'}</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {language === 'HI' ? 'मार्केटप्लेस लिस्टिंग प्रदर्शन' : 'Marketplace Listing Showcase'}
          </h1>
        </div>

        {/* Product Switcher & Export Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductSelect(e.target.value)}
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {products.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name || p.title} (₹{p.price || 0})
              </option>
            ))}
          </select>

          <Button
            type="button"
            onClick={handleExportJson}
            isLoading={isExporting}
            variant="primary"
            size="sm"
            icon={<Download size={15} />}
          >
            {language === 'HI' ? 'कैटलॉग निर्यात (JSON)' : 'Export Catalogue (JSON)'}
          </Button>

          <Button
            type="button"
            onClick={handleExportCsv}
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet size={15} />}
          >
            {language === 'HI' ? 'निर्यात CSV' : 'Export CSV'}
          </Button>

          <Button
            type="button"
            onClick={handleCopyJson}
            variant="secondary"
            size="sm"
            icon={isCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          >
            {isCopied ? (language === 'HI' ? 'कॉपी किया गया' : 'Copied') : (language === 'HI' ? 'JSON कॉपी करें' : 'Copy JSON')}
          </Button>
        </div>
      </div>

      {/* Advisory Architecture Notice */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 183, 3, 0.06)',
          border: '1px solid rgba(255, 183, 3, 0.25)',
          marginBottom: '2rem',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <Info size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <div>
          <strong>{language === 'HI' ? 'मार्केटप्लेस निर्यात सूचना:' : 'Marketplace Export Architecture:'}</strong> {language === 'HI' ? 'यह पूर्वावलोकन दिखाता है कि ई-कॉमर्स प्लेटफ़ॉर्म पर आपका उत्पाद खरीदारों को कैसा दिखेगा।' : 'This preview showcases how your product will look when distributed to national/global e-commerce channels.'}
        </div>
      </div>

      {/* REALISTIC E-COMMERCE PRODUCT LISTING SHOWCASE */}
      <div
        style={{
          background: '#0a0e1a',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          padding: '2rem'
        }}
      >
        {/* Marketplace Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('nav.home', 'Home')}</Link>
          <ChevronRight size={13} />
          <Link to="/catalogue" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('nav.catalogue', 'Catalogue')}</Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--accent-terracotta)', fontWeight: 600 }}>{translateCategory(currentProduct?.category) || 'Pottery'}</span>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentProduct?.name}</span>
        </div>

        {/* 2-Column Marketplace Product View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem' }}>
          
          {/* Left Column: Product Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#05070d',
                border: '1px solid var(--border-color)',
                height: '440px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={currentProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <ShoppingBag size={54} color="var(--text-muted)" />
              )}

              {/* Verified Artisan Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(16, 185, 129, 0.95)',
                  color: '#fff',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <ShieldCheck size={14} /> {language === 'HI' ? '100% प्रामाणिक हस्तनिर्मित' : '100% Authentic Handcrafted'}
              </div>

              {currentProduct.enhancedImage && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    background: 'rgba(255, 183, 3, 0.95)',
                    color: '#000',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Sparkles size={13} /> {language === 'HI' ? 'स्टूडियो सत्यापित फ़ोटो' : 'Studio Verified Photo'}
                </div>
              )}
            </div>

            {/* Trust & Guarantee Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <Truck size={18} color="var(--accent-gold)" style={{ margin: '0 auto 0.3rem auto' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{language === 'HI' ? 'सीधे कारीगर से' : 'Direct from Artisan'}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{language === 'HI' ? '2-3 दिनों में डिस्पैच' : 'Dispatches in 2-3 Days'}</p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <ShieldCheck size={18} color="var(--success)" style={{ margin: '0 auto 0.3rem auto' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{language === 'HI' ? 'उचित मूल्य गारंटी' : 'Fair Price Guarantee'}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{language === 'HI' ? '100% कारीगर को' : '100% to Maker'}</p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <RotateCcw size={18} color="var(--accent-terracotta)" style={{ margin: '0 auto 0.3rem auto' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>{language === 'HI' ? 'सुरक्षित पारगमन' : 'Safe Transit'}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{language === 'HI' ? 'सुरक्षित पैकेजिंग' : 'Secure Packaging'}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Marketplace Buy Box & Specifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Title & Review Rating Bar */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {translateCategory(currentProduct?.category)}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {currentProduct.craftType || (language === 'HI' ? 'पारंपरिक शिल्प' : 'Traditional Craft')}
                </span>
              </div>

              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                {currentProduct.name}
              </h1>

              {/* Star Rating Simulation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>5.0</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{language === 'HI' ? '(कारीगर प्रत्यक्ष सूची)' : '(Artisan Direct Listing)'}</span>
              </div>
            </div>

            {/* Price Box */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                  ₹ {currentProduct.price?.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹ {calculatedMrp.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 800 }}>
                  {language === 'HI' ? 'बचत 26%' : 'Save 26%'}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {language === 'HI' ? 'सभी कर शामिल। प्रत्यक्ष मूल्य निर्धारण यह सुनिश्चित करता है कि शिल्प का 100% राजस्व कारीगर को मिले।' : 'Inclusive of all taxes. Direct producer pricing ensures 100% of craft revenue goes to the artisan.'}
              </p>
            </div>

            {/* Artisan Description */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {language === 'HI' ? 'कारीगर की कहानी और शिल्प विवरण' : 'Artisan Story & Craft Narrative'}
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                {currentProduct.description || (language === 'HI' ? 'पारंपरिक औजारों और प्राकृतिक सामग्रियों का उपयोग करके कुशल कारीगरों द्वारा बनाया गया प्रामाणिक भारतीय हस्तशिल्प।' : 'Authentic Indian handicraft made by master artisans using traditional tools and natural materials.')}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                fontSize: '0.86rem'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', padding: '0.65rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('addProduct.craftTypeLabel', 'Craft Technique')}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currentProduct.craftType || (language === 'HI' ? 'पारंपरिक शिल्प' : 'Traditional Crafting')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('addProduct.materialLabel', 'Material')}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currentProduct.material || (language === 'HI' ? 'प्राकृतिक सामग्री' : 'Organic / Natural Materials')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', padding: '0.65rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{language === 'HI' ? 'शिल्प केंद्र स्थान' : 'Craft Cluster Location'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currentProduct.location || seller.location || 'India'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', padding: '0.65rem 1rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{language === 'HI' ? 'निर्माता' : 'Producer'}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seller.name || 'Master Artisan'} ({language === 'HI' ? 'सत्यापित' : 'Verified'})</span>
              </div>
            </div>

            {/* Search Tags */}
            {currentProduct.tags && currentProduct.tags.length > 0 && (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {language === 'HI' ? 'सर्च और वर्गीकरण टैग्स:' : 'Search & Taxonomy Tags:'}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {currentProduct.tags.map((tItem, idx) => (
                    <span key={idx} style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.25)', color: 'var(--accent-gold)', fontSize: '0.76rem' }}>
                      #{tItem}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Buy Box Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="primary"
                fullWidth={true}
                icon={<ShoppingBag size={18} />}
                onClick={() => {
                  if (addToast) addToast(language === 'HI' ? 'मार्केटप्लेस पूर्वावलोकन: सिम्युलेटेड ग्राहक चेकआउट' : 'Marketplace Preview: Simulated customer checkout flow', 'info');
                }}
              >
                {language === 'HI' ? 'झोले में जोड़ें (ग्राहक पूर्वावलोकन)' : 'Add to Bag (Customer Preview)'}
              </Button>

              <Button
                type="button"
                variant="outline"
                fullWidth={true}
                icon={<Download size={18} />}
                onClick={handleExportJson}
              >
                {language === 'HI' ? 'उत्पाद JSON डाउनलोड करें' : 'Download Product JSON'}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


