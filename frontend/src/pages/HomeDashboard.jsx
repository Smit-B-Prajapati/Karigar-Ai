import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getProducts, deleteProduct } from '../services/productService.js';
import {
  Plus,
  Sparkles,
  Package,
  CheckCircle2,
  FileText,
  DollarSign,
  Eye,
  Trash2,
  ArrowRight,
  Filter,
  Wand2
} from 'lucide-react';

export default function HomeDashboard({ addToast }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t, language, translateCategory, translateStatus } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active filter state: 'all' | 'published' | 'drafts' | 'value'
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchArtisanProducts = async () => {
    setLoading(true);
    setError(null);
    const userKey = user?.email || user?.id || '';

    try {
      if (token) {
        const res = await getProducts(token);
        if (res.success && res.products && res.products.length > 0) {
          setProducts(res.products);
          if (userKey) {
            localStorage.setItem(`karigar_products_${userKey}`, JSON.stringify(res.products));
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
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProducts(parsed);
              return;
            }
          } catch (e) {}
        }
      }

      setProducts([]);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
      if (userKey) {
        const cached = localStorage.getItem(`karigar_products_${userKey}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProducts(parsed);
              return;
            }
          } catch (e) {}
        }
      }
      setError('Could not connect to database. Displaying offline mode.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtisanProducts();
  }, [token, user?.email, user?.id]);

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`${t('catalogue.confirmDelete', 'Are you sure you want to delete this product?')} "${name}"`)) return;

    try {
      const res = await deleteProduct(id, token);
      if (res.success) {
        if (addToast) addToast('Product deleted from database', 'success');
        setProducts(prev => prev.filter(p => p._id !== id));
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Compute live statistics from MongoDB
  const totalProducts = products.length;
  const publishedProducts = products.filter(p => p.status === 'Published' || p.status === 'Market-Ready');
  const draftProducts = products.filter(p => p.status === 'Draft');
  const totalCatalogueValue = products.reduce((acc, p) => acc + (p.price || 0), 0);

  // Filter products based on clicked stat card
  const filteredProducts = activeFilter === 'published'
    ? publishedProducts
    : activeFilter === 'drafts'
    ? draftProducts
    : products;

  // Filter Display metadata
  const getFilterMetadata = () => {
    switch (activeFilter) {
      case 'published':
        return {
          title: `${t('home.publishedProducts', 'Published Products')} (${publishedProducts.length})`,
          subtitle: t('home.publishedSubtitle', 'Live, market-ready handcrafted listings ready for buyers and marketplaces'),
          badgeColor: 'var(--success)',
          emptyMsg: t('home.emptyPublished', 'No published products yet. Complete and publish your draft products!')
        };
      case 'drafts':
        return {
          title: `${t('home.draftProducts', 'Draft Products')} (${draftProducts.length})`,
          subtitle: t('home.draftSubtitle', 'In-progress listings requiring pricing, description, or photo finalization'),
          badgeColor: 'var(--warning)',
          emptyMsg: t('home.emptyDrafts', 'No draft products currently found.')
        };
      case 'value':
        return {
          title: `${t('home.totalValue', 'Catalogue Value')} (₹ ${totalCatalogueValue.toLocaleString('en-IN')})`,
          subtitle: t('home.valueSubtitle', 'Total retail inventory value across all active artisanal craft documents'),
          badgeColor: 'var(--accent-gold)',
          emptyMsg: t('home.noProducts', 'No products added yet.')
        };
      case 'all':
      default:
        return {
          title: `${t('home.allProducts', 'All Products')} (${totalProducts})`,
          subtitle: t('home.allSubtitle', 'Complete inventory of handcrafted artisan documents stored in database'),
          badgeColor: 'var(--accent-primary)',
          emptyMsg: t('home.noProducts', 'No products added yet. Click "Add Product" to get started!')
        };
    }
  };

  const filterMeta = getFilterMetadata();

  return (
    <div className="main-container" style={{ maxWidth: '1120px' }}>
      
      {/* Hero Welcome Banner - Compact, Sleek & Mobile Friendly */}
      <div className="home-hero-banner">
        <div className="home-hero-badge">
          <Sparkles size={13} color="var(--accent-gold)" />
          <span>{t('home.platformBadge', 'AI PLATFORM FOR ARTISANS')}</span>
        </div>

        <h1 className="home-hero-title">
          {t('home.welcome', 'Welcome back')}, <span className="gradient-text">{user?.name || 'Karigar'}</span>! 🙏
        </h1>
        <p className="home-hero-subtitle">
          {t('home.welcomeSubtitle', 'Turn your handmade products into market-ready listings with AI.')}
        </p>

        <div className="home-hero-actions">
          <Button 
            onClick={() => navigate('/add-product')}
            icon={<Plus size={16} />}
            variant="primary"
          >
            {t('home.addNewCraft', 'Add New Product')}
          </Button>
          <Button 
            onClick={() => navigate('/ai-market-studio')}
            icon={<Sparkles size={16} color="var(--accent-gold)" />}
            variant="secondary"
          >
            {t('home.openAiStudio', 'Open AI Market Studio')}
          </Button>
        </div>
      </div>

      {/* Interactive & Clickable Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        
        {/* Stat Card 1: TOTAL PRODUCTS */}
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          style={{
            background: activeFilter === 'all' ? 'rgba(184, 134, 155, 0.16)' : 'var(--bg-card)',
            border: activeFilter === 'all' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
            boxShadow: activeFilter === 'all' ? '0 8px 24px rgba(184, 134, 155, 0.2)' : '0 2px 10px rgba(70, 45, 80, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: activeFilter === 'all' ? 'translateY(-2px)' : 'none',
            display: 'block',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(184, 134, 155, 0.15)', color: 'var(--accent-primary)' }}>
              <Package size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', color: activeFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {t('home.totalProducts', 'TOTAL PRODUCTS')}
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {totalProducts}
              </h3>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            {t('home.allProducts', 'All Products')} ➔
          </p>
        </button>

        {/* Stat Card 2: PUBLISHED */}
        <button
          type="button"
          onClick={() => setActiveFilter('published')}
          style={{
            background: activeFilter === 'published' ? 'rgba(13, 148, 136, 0.14)' : 'var(--bg-card)',
            border: activeFilter === 'published' ? '2px solid var(--success)' : '1px solid var(--border-color)',
            boxShadow: activeFilter === 'published' ? '0 8px 24px rgba(13, 148, 136, 0.2)' : '0 2px 10px rgba(70, 45, 80, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: activeFilter === 'published' ? 'translateY(-2px)' : 'none',
            display: 'block',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(13, 148, 136, 0.12)', color: 'var(--success)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', color: activeFilter === 'published' ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {t('home.publishedCount', 'PUBLISHED')}
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {publishedProducts.length}
              </h3>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            {t('home.publishedProducts', 'Published Products')} ➔
          </p>
        </button>

        {/* Stat Card 3: DRAFTS */}
        <button
          type="button"
          onClick={() => setActiveFilter('drafts')}
          style={{
            background: activeFilter === 'drafts' ? 'rgba(217, 119, 6, 0.14)' : 'var(--bg-card)',
            border: activeFilter === 'drafts' ? '2px solid var(--warning)' : '1px solid var(--border-color)',
            boxShadow: activeFilter === 'drafts' ? '0 8px 24px rgba(217, 119, 6, 0.2)' : '0 2px 10px rgba(70, 45, 80, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: activeFilter === 'drafts' ? 'translateY(-2px)' : 'none',
            display: 'block',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(217, 119, 6, 0.12)', color: 'var(--warning)' }}>
              <FileText size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', color: activeFilter === 'drafts' ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {t('home.draftCount', 'DRAFTS')}
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {draftProducts.length}
              </h3>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            {t('home.draftProducts', 'Draft Products')} ➔
          </p>
        </button>

        {/* Stat Card 4: CATALOGUE VALUE */}
        <button
          type="button"
          onClick={() => setActiveFilter('value')}
          style={{
            background: activeFilter === 'value' ? 'rgba(232, 151, 88, 0.16)' : 'var(--bg-card)',
            border: activeFilter === 'value' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
            boxShadow: activeFilter === 'value' ? '0 8px 24px rgba(232, 151, 88, 0.2)' : '0 2px 10px rgba(70, 45, 80, 0.04)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: activeFilter === 'value' ? 'translateY(-2px)' : 'none',
            display: 'block',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(232, 151, 88, 0.15)', color: 'var(--accent-gold)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', color: activeFilter === 'value' ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {t('home.totalValue', 'CATALOGUE VALUE')}
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                ₹ {totalCatalogueValue.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            {t('home.totalValue', 'Catalogue Value')} ➔
          </p>
        </button>
      </div>

      {/* Dynamic Filtered Products Display Section */}

      <div>
        <Card 
          title={filterMeta.title}
          subtitle={filterMeta.subtitle}
          action={
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {activeFilter !== 'all' && (
                <Button onClick={() => setActiveFilter('all')} variant="secondary" size="sm">
                  {t('home.allProducts', 'Show All')} ({totalProducts})
                </Button>
              )}
              <Button onClick={() => navigate('/catalogue')} variant="outline" size="sm">
                {t('home.viewAll', 'Open Full Catalogue ➔')}
              </Button>
            </div>
          }
        >
          {loading ? (
            <Loader text={t('common.loading', 'Loading your artisan products...')} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState 
              title={filterMeta.title}
              description={filterMeta.emptyMsg}
              actionLabel={t('home.addNewCraft', '+ Add New Product')}
              onAction={() => navigate('/add-product')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredProducts.map(p => (
                <div 
                  key={p._id || p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', minWidth: '240px' }}>
                    {p.enhancedImage || p.originalImage || p.image ? (
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        background: '#fff',
                        border: '1px solid var(--border-color)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img 
                          src={p.enhancedImage || p.originalImage || p.image} 
                          alt={p.name || p.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', background: 'rgba(230,81,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-terracotta)', flexShrink: 0 }}>
                        <Package size={28} />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                        {p.name || p.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {translateCategory(p.category)} • {p.craftType || p.material || 'Artisan Craft'}
                      </p>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.25rem' }}>
                        ₹ {p.price ? Number(p.price).toLocaleString('en-IN') : '0'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      background: p.status === 'Published' || p.status === 'Market-Ready' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: p.status === 'Published' || p.status === 'Market-Ready' ? 'var(--success)' : 'var(--warning)',
                      border: `1px solid ${p.status === 'Published' || p.status === 'Market-Ready' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      fontWeight: 700
                    }}>
                      {p.status === 'Published' || p.status === 'Market-Ready' ? `✓ ${translateStatus('Published')}` : `✎ ${translateStatus('Draft')}`}
                    </span>

                    <Button 
                      onClick={() => navigate('/ai-market-studio', { state: { productId: p._id || p.id } })}
                      variant="secondary"
                      size="sm"
                      icon={<Wand2 size={14} color="var(--accent-gold)" />}
                    >
                      {t('home.actionEnhance', 'AI Studio')}
                    </Button>

                    <Button 
                      onClick={() => navigate(`/catalogue/${p._id || p.id}`)} 
                      variant="outline" 
                      size="sm"
                      icon={<Eye size={14} />}
                    >
                      {t('home.actionView', 'View / Edit')}
                    </Button>

                    <Button 
                      onClick={() => handleDeleteProduct(p._id || p.id, p.name || p.title)} 
                      variant="danger" 
                      size="sm"
                      icon={<Trash2 size={14} />}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
