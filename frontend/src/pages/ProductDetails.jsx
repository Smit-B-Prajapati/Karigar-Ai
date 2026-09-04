import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getProductById, updateProduct, deleteProduct, uploadProductImage } from '../services/productService.js';
import { mockProducts, mockCategories } from '../services/dummyData.js';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Sparkles,
  Wand2,
  ShieldCheck,
  Tag,
  Layers,
  Camera,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Share2,
  ExternalLink,
  ShoppingBag,
  Lightbulb
} from 'lucide-react';

export default function ProductDetails({ addToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { t, language, translateCategory, translateStatus } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit & Upload photo modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    async function fetchProductDetails() {
      setLoading(true);
      setError(null);
      try {
        if (token && id && !id.startsWith('mock')) {
          const res = await getProductById(id, token);
          if (res.success && res.product) {
            setProduct(res.product);
            setEditFormData(res.product);
            return;
          }
        }
        const isDemoAccount = Boolean(user && (user.email === 'ramesh@karigar.in' || user.isDemo));
        if (isDemoAccount) {
          const found = mockProducts.find(p => (p._id || p.id) === id) || mockProducts[0];
          setProduct(found);
          setEditFormData(found);
        } else {
          setError(language === 'HI' ? 'उत्पाद नहीं मिला।' : 'Product not found.');
        }
      } catch (err) {
        console.warn('Fetch product details error:', err);
        const isDemoAccount = Boolean(user && (user.email === 'ramesh@karigar.in' || user.isDemo));
        if (isDemoAccount) {
          const found = mockProducts.find(p => (p._id || p.id) === id) || mockProducts[0];
          setProduct(found);
          setEditFormData(found);
        } else {
          setError(language === 'HI' ? 'उत्पाद नहीं मिला।' : 'Product not found.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetails();
  }, [id, token, user?.email, user?.isDemo]);

  // Toggle Status: Draft <-> Published
  const handleToggleStatus = async () => {
    if (!product) return;
    const nextStatus = product.status === 'Draft' ? 'Published' : 'Draft';

    if (product._id && !product._id.startsWith('mock') && token) {
      try {
        const res = await updateProduct(product._id, { status: nextStatus }, token);
        if (res.success && res.product) {
          setProduct(res.product);
          if (addToast) addToast(`Product status changed to ${nextStatus}!`, 'success');
        }
      } catch (err) {
        if (addToast) addToast(err.message || 'Failed to update status', 'error');
      }
    } else {
      setProduct(prev => ({ ...prev, status: nextStatus }));
      if (addToast) addToast(`Product status changed to ${nextStatus}!`, 'success');
    }
  };

  // Update Product Details
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      if (addToast) addToast('Product name is required', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      if (product._id && !product._id.startsWith('mock') && token) {
        const res = await updateProduct(product._id, editFormData, token);
        if (res.success && res.product) {
          setProduct(res.product);
          setIsEditModalOpen(false);
          if (addToast) addToast('Product updated in MongoDB database!', 'success');
        }
      } else {
        setProduct(editFormData);
        setIsEditModalOpen(false);
        if (addToast) addToast('Product updated locally!', 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update product', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!window.confirm(`${t('catalogue.confirmDelete', 'Are you sure you want to delete this product?')} "${product.name}"`)) return;

    try {
      if (product._id && !product._id.startsWith('mock') && token) {
        await deleteProduct(product._id, token);
      }
      if (addToast) addToast('Product deleted', 'success');
      navigate('/catalogue');
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to delete product', 'error');
    }
  };

  if (loading) {
    return <Loader fullPage text={t('common.loading', 'Loading Product Details...')} />;
  }

  if (error || !product) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
        <h2>{language === 'HI' ? 'उत्पाद नहीं मिला' : 'Product Not Found'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {language === 'HI' ? 'यह उत्पाद मौजूद नहीं है या हटा दिया गया है।' : 'The requested craft document could not be found or has been deleted.'}
        </p>
        <Button onClick={() => navigate('/catalogue')} icon={<ArrowLeft size={16} />}>
          {language === 'HI' ? 'कैटलॉग पर वापस जाएं' : 'Back to Catalogue'}
        </Button>
      </div>
    );
  }

  const isPublished = product.status === 'Published' || product.status === 'Market-Ready';
  const displayImage = product.enhancedImage || product.originalImage || product.image;
  const seller = product.seller || user || { name: 'Master Artisan', email: 'artisan@karigar.ai' };

  return (
    <div className="main-container">
      
      {/* Top Breadcrumb & Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> {language === 'HI' ? 'कैटलॉग पर वापस' : 'Back to Catalogue'}
        </button>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/marketplace-preview/${product._id || product.id}`)}
            icon={<ShoppingBag size={15} />}
          >
            {t('nav.marketplace', 'Marketplace Preview')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            icon={<ShieldCheck size={15} />}
          >
            {isPublished ? (language === 'HI' ? 'स्थिति: प्रकाशित' : 'Status: Published') : (language === 'HI' ? 'स्थिति: ड्राफ्ट' : 'Status: Draft')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            icon={<Edit size={15} />}
          >
            {language === 'HI' ? 'संपादित करें' : 'Edit Product'}
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDeleteProduct}
            icon={<Trash2 size={15} />}
          >
            {language === 'HI' ? 'हटाएं' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* 2-Column Product Showcase Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
        
        {/* Left Column: Image Canvas & Studio Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: '#070a12',
              border: '1px solid var(--border-color)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
              minHeight: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.name}
                style={{ width: '100%', height: '100%', maxHeight: '480px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                <Camera size={48} style={{ margin: '0 auto 0.5rem auto' }} />
                <span>{language === 'HI' ? 'कोई फ़ोटो अपलोड नहीं की गई' : 'No craft photo uploaded'}</span>
              </div>
            )}

            {/* Status Floating Pill */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: isPublished ? 'rgba(16, 185, 129, 0.95)' : 'rgba(230, 81, 0, 0.95)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.78rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {isPublished ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{isPublished ? translateStatus('Published') : translateStatus('Draft')}</span>
            </div>

            {product.enhancedImage && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 183, 3, 0.92)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Sparkles size={14} /> {language === 'HI' ? 'स्टूडियो संवर्धित' : 'Studio Enhanced'}
              </div>
            )}
          </div>

          {/* Quick AI Workflow Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Button
              onClick={() => navigate('/studio')}
              variant="outline"
              icon={<Wand2 size={16} />}
              fullWidth={true}
            >
              {t('nav.studio', 'Photo Studio')}
            </Button>
            <Button
              onClick={() => navigate('/ai-market-studio', { state: { productId: product._id || product.id, tab: 'smart-pricing' } })}
              variant="outline"
              icon={<DollarSign size={16} color="var(--accent-gold)" />}
              fullWidth={true}
            >
              {t('studio.tabPricing', 'Smart Pricing AI')}
            </Button>
          </div>

          <Button
            onClick={() => navigate('/ai-market-studio', { state: { productId: product._id || product.id, tab: 'selling-advisor' } })}
            variant="primary"
            icon={<Lightbulb size={16} />}
            fullWidth={true}
          >
            {t('studio.tabAdvisor', 'AI Selling Advisor')}
          </Button>
        </div>

        {/* Right Column: Complete Specs & Seller Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Product Info Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-terracotta)', fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>{translateCategory(product.category) || 'General Craft'}</span>
              <span>•</span>
              <span>{product.craftType || 'Handicraft'}</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Price Tag */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                ₹ {product.price?.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {language === 'HI' ? '(सभी कर शामिल)' : '(Inclusive of all taxes)'}
              </span>
            </div>
          </div>

          {/* Detailed Description */}
          <Card title={language === 'HI' ? 'उत्पाद कहानी और विवरण' : 'Product Story & Description'}>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
              {product.description || (language === 'HI' ? 'कोई विवरण नहीं दिया गया।' : 'No detailed product description entered yet.')}
            </p>
          </Card>

          {/* Craft Specifications Grid */}
          <Card title={language === 'HI' ? 'शिल्प विनिर्देश (Specifications)' : 'Craft Specifications'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>{t('addProduct.categoryLabel', 'Category')}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{translateCategory(product.category) || 'Craft'}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>{t('addProduct.materialLabel', 'Material')}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{product.material || (language === 'HI' ? 'प्राकृतिक / हस्तनिर्मित' : 'Organic / Handmade')}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>{t('addProduct.craftTypeLabel', 'Craft Technique')}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{product.craftType || (language === 'HI' ? 'पारंपरिक कारीगरी' : 'Traditional Artisan Craft')}</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>{t('catalogue.status', 'Listing Status')}</span>
                <span style={{ fontWeight: 700, color: isPublished ? 'var(--success)' : 'var(--warning)' }}>
                  {isPublished ? translateStatus('Published') : translateStatus('Draft')}
                </span>
              </div>
            </div>

            {/* Tags / Keywords Chips */}
            {product.tags && product.tags.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  {language === 'HI' ? 'उत्पाद टैग और कीवर्ड्स:' : 'Product Tags & Keywords:'}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255,183,3,0.1)',
                        border: '1px solid rgba(255,183,3,0.25)',
                        color: 'var(--accent-gold)',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Seller / Artisan Information Card */}
          <Card
            title={language === 'HI' ? 'कारीगर और विक्रेता जानकारी' : 'Artisan & Seller Information'}
            badge={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontSize: '0.76rem', fontWeight: 700 }}>
                <ShieldCheck size={14} /> {language === 'HI' ? 'सत्यापित कारीगर' : 'Verified Artisan'}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={16} color="var(--accent-terracotta)" />
                <span><strong>{language === 'HI' ? 'कारीगर:' : 'Artisan:'}</strong> {seller.name || 'Master Artisan'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={16} color="var(--accent-terracotta)" />
                <span><strong>{language === 'HI' ? 'संपर्क:' : 'Contact:'}</strong> {seller.email || 'artisan@karigar.ai'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={16} color="var(--accent-terracotta)" />
                <span><strong>{language === 'HI' ? 'शिल्प केंद्र:' : 'Craft Hub:'}</strong> {seller.location || 'India (Artisan Cluster)'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calendar size={16} color="var(--accent-terracotta)" />
                <span><strong>{language === 'HI' ? 'सूचीकरण तिथि:' : 'Listing Created:'}</strong> {new Date(product.createdAt || Date.now()).toLocaleDateString(language === 'HI' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Product Document"
        >
          <form onSubmit={handleUpdateProduct}>
            <Input
              label="Product Title"
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
            <Input
              label="Category"
              type="select"
              value={editFormData.category || 'General Craft'}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              options={mockCategories.filter(c => c !== 'All Crafts')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Material"
                value={editFormData.material || ''}
                onChange={(e) => setEditFormData({ ...editFormData, material: e.target.value })}
              />
              <Input
                label="Craft Technique"
                value={editFormData.craftType || ''}
                onChange={(e) => setEditFormData({ ...editFormData, craftType: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Selling Price (₹)"
                type="number"
                value={editFormData.price || ''}
                onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Status"
                type="select"
                value={editFormData.status || 'Draft'}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                options={['Draft', 'Published', 'Market-Ready', 'Archived']}
              />
            </div>
            <Input
              label="Description"
              type="textarea"
              value={editFormData.description || ''}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              rows={4}
            />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button type="submit" isLoading={isUpdating} fullWidth={true}>
                Save Changes to MongoDB
              </Button>
              <Button type="button" onClick={() => setIsEditModalOpen(false)} variant="secondary" fullWidth={true}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
