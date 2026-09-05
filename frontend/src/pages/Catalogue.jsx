import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Modal from '../components/Modal.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import VoiceRecorderModal from '../components/VoiceRecorderModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getProducts, updateProduct, deleteProduct, uploadProductImage } from '../services/productService.js';
import { mockCategories, mockProducts } from '../services/dummyData.js';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit,
  Trash2,
  Save,
  Camera,
  Sparkles,
  Wand2,
  Mic,
  DollarSign,
  Filter,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Tag,
  Layers,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  X,
  ShoppingBag
} from 'lucide-react';

export default function Catalogue({ addToast }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t, language, translateCategory, translateStatus } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'grid' | 'list'
  const [viewMode, setViewMode] = useState('grid');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Crafts');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('All Prices');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');

  // Modals
  const [viewProductModal, setViewProductModal] = useState(null);
  const [editProductModal, setEditProductModal] = useState(null);
  const [uploadPhotoModal, setUploadPhotoModal] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    const userKey = user?.email || user?.id || '';

    try {
      if (token) {
        const res = await getProducts(token);
        if (res.success && Array.isArray(res.products)) {
          const clean = res.products.filter(p => !p.isDemoFallback && !String(p.id || p._id || '').startsWith('fallback_'));
          setProducts(clean);
          if (userKey) {
            localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(clean));
          }
          return;
        }
      }

      // Check local storage backup for this user
      if (userKey) {
        const cached = localStorage.getItem(`karigar_products_${userKey}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter(p => !p.isDemoFallback && !String(p.id || p._id || '').startsWith('fallback_'));
              localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(clean));
              setProducts(clean);
              return;
            }
          } catch (e) {}
        }
      }

      setProducts([]);
    } catch (err) {
      console.warn('Fetch products fallback:', err);
      if (userKey) {
        const cached = localStorage.getItem(`karigar_products_${userKey}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter(p => !p.isDemoFallback && !String(p.id || p._id || '').startsWith('fallback_'));
              localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(clean));
              setProducts(clean);
              return;
            }
          } catch (e) {}
        }
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, user?.email, user?.id]);

  // Quick Status Toggle: Draft <-> Published
  const handleToggleStatus = async (productToToggle, e) => {
    if (e) e.stopPropagation();
    const isCurrentlyPublished = productToToggle.status === 'Published' || productToToggle.status === 'Market-Ready';
    const nextStatus = isCurrentlyPublished ? 'Draft' : 'Published';

    try {
      if (productToToggle._id && !productToToggle._id.startsWith('mock') && token) {
        const res = await updateProduct(productToToggle._id, { status: nextStatus }, token);
        if (res.success && res.product) {
          setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
          if (addToast) addToast(`Status updated to ${nextStatus}!`, 'success');
        }
      } else {
        setProducts(prev => prev.map(p => (p._id || p.id) === (productToToggle._id || productToToggle.id) ? { ...p, status: nextStatus } : p));
        if (addToast) addToast(`Status updated to ${nextStatus}!`, 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Delete Product
  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}" from your catalogue?`)) return;

    try {
      const res = await deleteProduct(id, token);
      if (res.success) {
        if (addToast) addToast('Product deleted successfully', 'success');
        const userKey = user?.email || user?.id || '';
        setProducts(prev => {
          const next = prev.filter(p => (p._id || p.id) !== id && p._id !== id && p.id !== id);
          if (userKey) {
            try {
              localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(next));
            } catch (e) {}
          }
          return next;
        });
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Update Product from Edit Modal
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editProductModal.name.trim()) {
      if (addToast) addToast('Product name is required', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      if (editProductModal._id && !editProductModal._id.startsWith('mock') && token) {
        const res = await updateProduct(editProductModal._id, editProductModal, token);
        if (res.success && res.product) {
          if (addToast) addToast('Product updated in MongoDB!', 'success');
          setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
          setEditProductModal(null);
        }
      } else {
        setProducts(prev => prev.map(p => (p._id || p.id) === (editProductModal._id || editProductModal.id) ? editProductModal : p));
        setEditProductModal(null);
        if (addToast) addToast('Product updated!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update product', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Save Uploaded Photo
  const handleSaveUploadedPhoto = async (base64Data, rawFile) => {
    if (!uploadPhotoModal || !base64Data) return;

    setIsUploadingPhoto(true);
    setPhotoUploadProgress(25);

    try {
      setPhotoUploadProgress(65);
      if (uploadPhotoModal._id && !uploadPhotoModal._id.startsWith('mock') && token) {
        const res = await uploadProductImage(
          uploadPhotoModal._id,
          rawFile || base64Data,
          token
        );

        setPhotoUploadProgress(100);
        if (res.success && res.product) {
          if (addToast) addToast('New craft photo saved to MongoDB!', 'success');
          setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
          setUploadPhotoModal(null);
        }
      } else {
        setProducts(prev => prev.map(p => (p._id || p.id) === (uploadPhotoModal._id || uploadPhotoModal.id) ? { ...p, originalImage: base64Data } : p));
        setUploadPhotoModal(null);
        if (addToast) addToast('Photo updated!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Filter computation
  const filteredProducts = products.filter((p) => {
    const nameMatch = (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matMatch = (p.material || '').toLowerCase().includes(searchTerm.toLowerCase());
    const craftMatch = (p.craftType || '').toLowerCase().includes(searchTerm.toLowerCase());
    const textMatch = nameMatch || descMatch || matMatch || craftMatch;

    const categoryMatch = selectedCategory === 'All Crafts' || p.category === selectedCategory;

    let priceMatch = true;
    const pr = p.price || 0;
    if (selectedPriceFilter === 'Under ₹500') priceMatch = pr < 500;
    else if (selectedPriceFilter === '₹500 – ₹1,500') priceMatch = pr >= 500 && pr <= 1500;
    else if (selectedPriceFilter === '₹1,500 – ₹3,000') priceMatch = pr > 1500 && pr <= 3000;
    else if (selectedPriceFilter === 'Above ₹3,000') priceMatch = pr > 3000;

    let statusMatch = true;
    if (selectedStatusFilter === 'Published') statusMatch = p.status === 'Published' || p.status === 'Market-Ready';
    else if (selectedStatusFilter === 'Draft') statusMatch = p.status === 'Draft';

    return textMatch && categoryMatch && priceMatch && statusMatch;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Crafts');
    setSelectedPriceFilter('All Prices');
    setSelectedStatusFilter('All Status');
  };

  return (
    <div className="main-container">
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {t('catalogue.pageTitle', 'My Artisan Catalogue')}
          </h1>
          <p style={{ fontSize: '0.95rem' }}>
            {t('catalogue.pageSubtitle', 'Manage, filter, publish, and inspect all craft documents in your artisan catalogue.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/add-product')} icon={<PlusCircle size={16} />}>
            {t('catalogue.addProductBtn', '+ Add Craft')}
          </Button>
          <Button onClick={() => navigate('/studio')} variant="secondary" icon={<Wand2 size={16} />}>
            {t('nav.studio', 'Photo Studio')}
          </Button>
          <Button onClick={() => navigate('/ai-market-studio')} variant="outline" icon={<Sparkles size={16} color="var(--accent-gold)" />}>
            {t('nav.aiMarketStudio', 'AI Studio')}
          </Button>
        </div>
      </div>

      {/* Search & Comprehensive Filters Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Row 1: Search Bar & View Mode Toggle */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input 
              placeholder={t('catalogue.searchPlaceholder', 'Search by title, description, material, or tags...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          {/* Grid / List View Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                borderRadius: '4px',
                background: viewMode === 'grid' ? 'var(--accent-terracotta)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={15} /> {t('catalogue.gridView', 'Grid')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.45rem 0.75rem',
                border: 'none',
                borderRadius: '4px',
                background: viewMode === 'list' ? 'var(--accent-terracotta)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <ListIcon size={15} /> {t('catalogue.listView', 'List')}
            </button>
          </div>
        </div>

        {/* Row 2: Category Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
          {mockCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: selectedCategory === cat ? 'var(--accent-terracotta)' : 'var(--bg-input)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-smooth)'
              }}
            >
              {translateCategory(cat)}
            </button>
          ))}
        </div>

        {/* Row 3: Price & Status Filters + Match Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Price Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('catalogue.price', 'Price')}:</span>
              <select
                value={selectedPriceFilter}
                onChange={(e) => setSelectedPriceFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="All Prices">{t('catalogue.allPrices', 'All Prices')}</option>
                <option value="Under ₹500">{language === 'HI' ? '₹500 से कम' : 'Under ₹500'}</option>
                <option value="₹500 – ₹1,500">₹500 – ₹1,500</option>
                <option value="₹1,500 – ₹3,000">₹1,500 – ₹3,000</option>
                <option value="Above ₹3,000">{language === 'HI' ? '₹3,000 से अधिक' : 'Above ₹3,000'}</option>
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('catalogue.status', 'Status')}:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="All Status">{t('catalogue.allStatus', 'All Status')}</option>
                <option value="Published">{language === 'HI' ? 'प्रकाशित (Published)' : 'Published Live'}</option>
                <option value="Draft">{language === 'HI' ? 'ड्राफ्ट (Draft)' : 'Draft'}</option>
              </select>
            </div>

            {(searchTerm || selectedCategory !== 'All Crafts' || selectedPriceFilter !== 'All Prices' || selectedStatusFilter !== 'All Status') && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <X size={13} /> {t('catalogue.resetFilters', 'Reset Filters')}
              </button>
            )}
          </div>

          {/* Search/Filter Count State */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {language === 'HI' ? `${products.length} में से ${filteredProducts.length} शिल्प प्रदर्शित` : `Showing ${filteredProducts.length} of ${products.length} craft products`}
          </div>
        </div>

      </div>

      {/* Main Product Showcase (Loading, Error, Empty, or Products) */}
      {loading ? (
        <Loader fullPage text={t('common.loading', 'Loading Artisan Product Catalogue...')} />
      ) : error ? (
        <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '3rem 1rem' }}>
          <AlertCircle size={42} style={{ margin: '0 auto 1rem auto' }} />
          <h3>{language === 'HI' ? 'कैटलॉग लोड करने में विफल' : 'Failed to Load Catalogue'}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{error}</p>
          <Button onClick={fetchProducts} icon={<Sparkles size={16} />}>
            {language === 'HI' ? 'पुनः प्रयास करें' : 'Retry Loading'}
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={t('catalogue.emptyTitle', 'No Products Found')}
          description={
            searchTerm || selectedCategory !== 'All Crafts' || selectedPriceFilter !== 'All Prices' || selectedStatusFilter !== 'All Status'
              ? (language === 'HI' ? 'आपकी खोज या फ़िल्टर से कोई शिल्प मेल नहीं खाता।' : 'No craft items matched your active search or filter criteria.')
              : t('catalogue.emptySubtitle', 'Your catalogue is empty. Add your first handcrafted product to start selling.')
          }
          actionLabel={
            searchTerm || selectedCategory !== 'All Crafts' || selectedPriceFilter !== 'All Prices' || selectedStatusFilter !== 'All Status'
              ? t('catalogue.resetFilters', 'Clear All Filters')
              : t('catalogue.addProductBtn', 'Add New Craft')
          }
          onAction={
            searchTerm || selectedCategory !== 'All Crafts' || selectedPriceFilter !== 'All Prices' || selectedStatusFilter !== 'All Status'
              ? clearAllFilters
              : () => navigate('/add-product')
          }
        />
      ) : viewMode === 'grid' ? (
        
        /* 1. PRODUCT GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map((product) => {
            const isPub = product.status === 'Published' || product.status === 'Market-Ready';
            const img = product.enhancedImage || product.originalImage || product.image;

            return (
              <div
                key={product._id || product.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition-smooth)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                {/* Product Image & Badges */}
                <div
                  style={{
                    position: 'relative',
                    height: '210px',
                    background: '#070a12',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => setViewProductModal(product)}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <Camera size={36} />
                      <span style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>No Photo</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(product, e)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: isPub ? 'rgba(16, 185, 129, 0.95)' : 'rgba(230, 81, 0, 0.95)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                    title="Click to toggle Draft / Published"
                  >
                    {isPub ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    <span>{isPub ? translateStatus('Published') : translateStatus('Draft')}</span>
                  </button>

                  {/* Category Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}
                  >
                    {translateCategory(product.category) || 'Craft'}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  
                  {/* Title & Craft Type */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-terracotta)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {product.craftType || 'Handmade Craft'}
                      </span>
                    </div>

                    <h3
                      onClick={() => setViewProductModal(product)}
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        lineClamp: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {product.name}
                    </h3>
                  </div>

                  {/* Description snippet */}
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineClamp: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '1rem',
                      flex: 1
                    }}
                  >
                    {product.description || (language === 'HI' ? 'कोई विवरण नहीं दिया गया।' : 'No description provided.')}
                  </p>

                  {/* Price & Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{t('catalogue.price', 'Price')}</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                        ₹ {product.price?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/marketplace-preview/${product._id || product.id}`)}
                        icon={<ShoppingBag size={13} />}
                        title={language === 'HI' ? 'मार्केटप्लेस पूर्वावलोकन खोलें' : 'Open Marketplace Preview'}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewProductModal(product)}
                        icon={<Eye size={13} />}
                        title={language === 'HI' ? 'उत्पाद विवरण देखें' : 'View Full Product Details'}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditProductModal(product)}
                        icon={<Edit size={13} />}
                        title={language === 'HI' ? 'उत्पाद संपादित करें' : 'Edit Product'}
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => handleDelete(product._id || product.id, product.name, e)}
                        icon={<Trash2 size={13} />}
                        title={language === 'HI' ? 'उत्पाद हटाएं' : 'Delete Product'}
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* 2. PRODUCT LIST VIEW (Table / Compact Row View) */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>{t('home.thProduct', 'Craft Item')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t('home.thCategory', 'Category')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{language === 'HI' ? 'शिल्प तकनीक' : 'Craft Technique'}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t('home.thPrice', 'Price (₹)')}</th>
                <th style={{ padding: '0.85rem 1rem' }}>{t('home.thStatus', 'Status')}</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>{t('home.thActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isPub = product.status === 'Published' || product.status === 'Market-Ready';
                const img = product.enhancedImage || product.originalImage || product.image;

                return (
                  <tr
                    key={product._id || product.id}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                  >
                    {/* Item Thumbnail & Name */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: 'var(--radius-sm)',
                            background: '#070a12',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => setViewProductModal(product)}
                        >
                          {img ? (
                            <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Camera size={20} color="var(--text-muted)" />
                          )}
                        </div>
                        <div>
                          <span
                            onClick={() => setViewProductModal(product)}
                            style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', display: 'block' }}
                          >
                            {product.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {product.material || 'Handmade'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {translateCategory(product.category) || 'Craft'}
                    </td>

                    {/* Craft Technique */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {product.craftType || 'Handicraft'}
                    </td>

                    {/* Price */}
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                      ₹ {product.price?.toLocaleString('en-IN')}
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(product, e)}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: isPub ? 'rgba(16, 185, 129, 0.15)' : 'rgba(230, 81, 0, 0.15)',
                          color: isPub ? 'var(--success)' : 'var(--accent-terracotta)',
                          border: isPub ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(230, 81, 0, 0.4)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {isPub ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        <span>{isPub ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setViewProductModal(product)}
                          icon={<Eye size={13} />}
                          title="View Details"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditProductModal(product)}
                          icon={<Edit size={13} />}
                          title="Edit"
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => handleDelete(product._id || product.id, product.name, e)}
                          icon={<Trash2 size={13} />}
                          title="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. POLISHED PRODUCT DETAILS MODAL */}
      {viewProductModal && (
        <Modal
          isOpen={Boolean(viewProductModal)}
          onClose={() => setViewProductModal(null)}
          title="Craft Product Details"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
              <Button
                onClick={() => {
                  const prod = viewProductModal;
                  setViewProductModal(null);
                  setEditProductModal(prod);
                }}
                variant="secondary"
                icon={<Edit size={15} />}
                fullWidth={true}
              >
                Edit Product
              </Button>
              <Button
                onClick={() => navigate(`/marketplace-preview/${viewProductModal._id || viewProductModal.id}`)}
                variant="primary"
                icon={<ShoppingBag size={15} />}
                fullWidth={true}
              >
                Marketplace Preview & Export
              </Button>
              <Button
                onClick={() => navigate(`/catalogue/${viewProductModal._id || viewProductModal.id}`)}
                variant="outline"
                icon={<ExternalLink size={15} />}
                fullWidth={true}
              >
                Full Product Page
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Image Preview with Badges */}
            <div
              style={{
                position: 'relative',
                height: '240px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#070a12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {viewProductModal.enhancedImage || viewProductModal.originalImage || viewProductModal.image ? (
                <img
                  src={viewProductModal.enhancedImage || viewProductModal.originalImage || viewProductModal.image}
                  alt={viewProductModal.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Camera size={42} color="var(--text-muted)" />
              )}

              {/* Status Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: (viewProductModal.status === 'Published' || viewProductModal.status === 'Market-Ready') ? 'var(--success)' : 'var(--accent-terracotta)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {viewProductModal.status || 'Draft'}
              </div>
            </div>

            {/* Title & Price Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {viewProductModal.category} • {viewProductModal.craftType}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                  ₹ {viewProductModal.price?.toLocaleString('en-IN')}
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {viewProductModal.name}
              </h2>
            </div>

            {/* Description */}
            <div style={{ background: 'var(--bg-input)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {viewProductModal.description || 'No detailed description.'}
            </div>

            {/* Specifications Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.84rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Material:</span>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{viewProductModal.material || 'Organic / Natural'}</p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Craft Technique:</span>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{viewProductModal.craftType || 'Handicraft'}</p>
              </div>
            </div>

            {/* Tags */}
            {viewProductModal.tags && viewProductModal.tags.length > 0 && (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Tags:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {viewProductModal.tags.map((t, idx) => (
                    <span key={idx} style={{ padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', background: 'rgba(255,183,3,0.1)', color: 'var(--accent-gold)', fontSize: '0.75rem' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Information */}
            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-terracotta)', fontWeight: 700, marginBottom: '0.35rem' }}>
                <ShieldCheck size={15} />
                <span>Artisan / Seller Information</span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                <strong>Artisan:</strong> {viewProductModal.artisan?.name || user?.name || 'Master Artisan'} ({viewProductModal.artisan?.email || user?.email || 'artisan@karigar.ai'})
              </p>
            </div>

          </div>
        </Modal>
      )}

      {/* 4. EDIT PRODUCT MODAL */}
      {editProductModal && (
        <Modal
          isOpen={Boolean(editProductModal)}
          onClose={() => setEditProductModal(null)}
          title={`Edit Product: ${editProductModal.name}`}
        >
          <form onSubmit={handleUpdate}>
            <Input
              label="Product Title"
              value={editProductModal.name || ''}
              onChange={(e) => setEditProductModal({ ...editProductModal, name: e.target.value })}
              required
            />

            <Input
              label="Category"
              type="select"
              value={editProductModal.category || 'General Craft'}
              onChange={(e) => setEditProductModal({ ...editProductModal, category: e.target.value })}
              options={mockCategories.filter(c => c !== 'All Crafts')}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Material"
                value={editProductModal.material || ''}
                onChange={(e) => setEditProductModal({ ...editProductModal, material: e.target.value })}
              />
              <Input
                label="Craft Technique"
                value={editProductModal.craftType || ''}
                onChange={(e) => setEditProductModal({ ...editProductModal, craftType: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Selling Price (₹)"
                type="number"
                value={editProductModal.price || ''}
                onChange={(e) => setEditProductModal({ ...editProductModal, price: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Status"
                type="select"
                value={editProductModal.status || 'Draft'}
                onChange={(e) => setEditProductModal({ ...editProductModal, status: e.target.value })}
                options={['Draft', 'Published', 'Market-Ready', 'Archived']}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Input
                label="Description"
                type="textarea"
                value={editProductModal.description || ''}
                onChange={(e) => setEditProductModal({ ...editProductModal, description: e.target.value })}
                rows={4}
              />
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: 0,
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Mic size={13} /> Speak Description
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button type="submit" isLoading={isUpdating} fullWidth={true} icon={<Save size={16} />}>
                Save Changes
              </Button>
              <Button type="button" onClick={() => setEditProductModal(null)} variant="secondary" fullWidth={true}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. QUICK UPLOAD / CHANGE PHOTO MODAL */}
      {uploadPhotoModal && (
        <Modal
          isOpen={Boolean(uploadPhotoModal)}
          onClose={() => setUploadPhotoModal(null)}
          title={`Update Photo: ${uploadPhotoModal.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Capture a new phone camera photo or upload an image file (JPEG, PNG, WEBP &lt; 5MB).
            </p>
            <ImageUploader
              value={uploadPhotoModal.originalImage || uploadPhotoModal.image || ''}
              onChange={handleSaveUploadedPhoto}
              uploadProgress={photoUploadProgress}
              isUploading={isUploadingPhoto}
              showPipeline={true}
              addToast={addToast}
            />
          </div>
        </Modal>
      )}

      {/* 6. VOICE RECORDER MODAL FOR EDITING */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialText={editProductModal?.description || ''}
        onApplyTranscript={(spokenText) => {
          if (editProductModal) {
            setEditProductModal(prev => ({
              ...prev,
              description: prev.description ? `${prev.description}\n\n${spokenText}` : spokenText,
            }));
          }
        }}
        addToast={addToast}
      />

    </div>
  );
}
