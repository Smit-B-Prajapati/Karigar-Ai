import React, { useState, useEffect } from 'react';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import ExplainablePricingCard from '../components/ExplainablePricingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getProducts, updateProduct } from '../services/productService.js';
import { calculateSmartPricing, calculateProductPricingById } from '../services/pricingService.js';
import { mockProducts, mockCategories } from '../services/dummyData.js';
import {
  DollarSign,
  TrendingUp,
  Calculator,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  HelpCircle,
  Percent,
  Coins
} from 'lucide-react';

export default function Pricing({ addToast }) {
  const { token, user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);

  // Pricing Form Inputs (Validated non-negative numbers)
  const [materialCost, setMaterialCost] = useState('450');
  const [labourCost, setLabourCost] = useState('300');
  const [packagingCost, setPackagingCost] = useState('80');
  const [otherCost, setOtherCost] = useState('120');

  // Craft Context
  const [category, setCategory] = useState('Pottery & Ceramics');
  const [craftType, setCraftType] = useState('Wheel Pottery');
  const [material, setMaterial] = useState('Terracotta Clay');

  // AI-assisted Pricing Recommendation State
  const [pricingData, setPricingData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [inputErrors, setInputErrors] = useState({});

  // Fetch products from MongoDB
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const userKey = user?.email || user?.id || '';

      try {
        if (token) {
          const res = await getProducts(token);
          if (res.success && Array.isArray(res.products)) {
            const clean = res.products.filter(p => !p.isDemoFallback && !String(p.id || p._id || '').startsWith('fallback_'));
            if (clean.length > 0) {
              setProducts(clean);
              const first = clean[0];
              setSelectedProductId(first._id || first.id);
              populateProductCosts(first);
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
                  setSelectedProductId(clean[0]._id || clean[0].id);
                  populateProductCosts(clean[0]);
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
        console.warn('Load products fallback:', err);
        setProducts([]);
        setSelectedProductId('');
        setCurrentProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [token, user?.email, user?.id]);

  const populateProductCosts = (prod) => {
    if (!prod) return;
    setCurrentProduct(prod);
    setCategory(prod.category || 'Pottery & Ceramics');
    setMaterial(prod.material || 'Natural Terracotta');
    setCraftType(prod.craftType || 'Pottery');

    const mCost = prod.materialCost !== undefined && prod.materialCost > 0 ? String(prod.materialCost) : '450';
    const lCost = prod.labourCost !== undefined && prod.labourCost > 0 ? String(prod.labourCost) : '300';
    setMaterialCost(mCost);
    setLabourCost(lCost);
    setPackagingCost('80');
    setOtherCost('120');

    // Run initial baseline calculation
    runPriceCalculation(mCost, lCost, '80', '120', prod.category || 'Pottery & Ceramics', prod.name || 'Craft');
  };

  const handleProductSelect = (prodId) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => (p._id || p.id) === prodId);
    if (prod) {
      populateProductCosts(prod);
    }
  };

  // Validate numeric fields
  const validateInputs = () => {
    const errors = {};
    const m = parseFloat(materialCost);
    const l = parseFloat(labourCost);
    const p = parseFloat(packagingCost);
    const o = parseFloat(otherCost);

    if (isNaN(m) || m < 0) errors.materialCost = 'Please enter a valid non-negative cost';
    if (isNaN(l) || l < 0) errors.labourCost = 'Please enter a valid non-negative cost';
    if (isNaN(p) || p < 0) errors.packagingCost = 'Please enter a valid non-negative cost';
    if (isNaN(o) || o < 0) errors.otherCost = 'Please enter a valid non-negative cost';

    const total = (isNaN(m) ? 0 : m) + (isNaN(l) ? 0 : l) + (isNaN(p) ? 0 : p) + (isNaN(o) ? 0 : o);
    if (total <= 0) {
      errors.general = 'Total production cost must be greater than ₹0';
    }

    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const runPriceCalculation = async (m, l, pkg, oth, cat, name) => {
    setIsCalculating(true);
    try {
      const payload = {
        materialCost: parseFloat(m) || 0,
        labourCost: parseFloat(l) || 0,
        packagingCost: parseFloat(pkg) || 0,
        otherCost: parseFloat(oth) || 0,
        category: cat || category,
        productType: name || currentProduct?.name || 'Craft Item',
        material: material,
        craftType: craftType,
      };

      const res = await calculateSmartPricing(payload, token);
      if (res.success && res.pricingRecommendation) {
        setPricingData(res);
      }
    } catch (err) {
      console.warn('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculate = (e) => {
    if (e) e.preventDefault();
    if (!validateInputs()) {
      if (addToast) addToast('Please correct the highlighted cost inputs', 'error');
      return;
    }

    runPriceCalculation(materialCost, labourCost, packagingCost, otherCost, category, currentProduct?.name);
    if (addToast) addToast('Explainable Price Recommendation updated!', 'success');
  };

  // Step 11: Apply Final Selling Price to MongoDB product document
  const handleApplyPriceToProduct = async (customFinalPrice) => {
    if (!pricingData) return;

    const priceToApply = customFinalPrice || pricingData.pricingRecommendation.recommendedPrice;

    if (!currentProduct || !currentProduct._id || currentProduct._id.startsWith('mock')) {
      if (addToast) addToast(`Final Selling Price ₹${priceToApply} saved to preview!`, 'success');
      return;
    }

    setIsApplying(true);
    try {
      const updatePayload = {
        price: priceToApply,
        materialCost: pricingData.costBreakdown.materialCost,
        labourCost: pricingData.costBreakdown.labourCost,
      };

      const res = await updateProduct(currentProduct._id, updatePayload, token);
      if (res.success && res.product) {
        setCurrentProduct(res.product);
        setProducts(prev => prev.map(p => p._id === res.product._id ? res.product : p));
        if (addToast) addToast(`Final Selling Price ₹${priceToApply} saved & synced to MongoDB!`, 'success');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Failed to update product price', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Base Calculation sum: Production Cost = Material + Labour + Packaging + Other
  const liveMaterial = parseFloat(materialCost) || 0;
  const liveLabour = parseFloat(labourCost) || 0;
  const livePackaging = parseFloat(packagingCost) || 0;
  const liveOther = parseFloat(otherCost) || 0;
  const liveProductionCost = Math.round((liveMaterial + liveLabour + livePackaging + liveOther) * 100) / 100;

  if (loading) {
    return <Loader fullPage text="Loading Explainable Smart Pricing Engine..." />;
  }

  return (
    <div className="main-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          Explainable <span className="gradient-text">Smart Pricing Guide</span>
        </h1>
        <p style={{ fontSize: '0.95rem' }}>
          Step 11: Transparently understand why a price is recommended, inspect craft value factors, and set your final selling price.
        </p>
      </div>

      {/* Product Selector Bar */}
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
          <Coins size={20} color="var(--accent-gold)" />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Active Craft Listing
            </span>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {currentProduct?.name || 'Artisan Handicraft'}
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
                {p.name || p.title} (₹{p.price || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Grid: Cost Input Form on Left, Explainable Pricing Card on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Pricing Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <Card title="Craft Production Costs Form">
            <form onSubmit={handleCalculate}>
              
              {/* 1. Material Cost */}
              <Input
                label="Material Cost (₹)"
                type="number"
                min="0"
                step="1"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="e.g. 450"
                helperText="Raw materials: clay, organic dyes, fabrics, metal wires, glaze"
                error={inputErrors.materialCost}
                required
              />

              {/* 2. Labour Cost */}
              <Input
                label="Labour Cost (₹)"
                type="number"
                min="0"
                step="1"
                value={labourCost}
                onChange={(e) => setLabourCost(e.target.value)}
                placeholder="e.g. 300"
                helperText="Artisan crafting time, carving, weaving, moulding wage"
                error={inputErrors.labourCost}
                required
              />

              {/* 3. Packaging Cost */}
              <Input
                label="Packaging Cost (₹)"
                type="number"
                min="0"
                step="1"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                placeholder="e.g. 80"
                helperText="Eco-friendly boxes, bubble wrap, labels, gift bags"
                error={inputErrors.packagingCost}
                required
              />

              {/* 4. Other Cost */}
              <Input
                label="Other Cost (₹)"
                type="number"
                min="0"
                step="1"
                value={otherCost}
                onChange={(e) => setOtherCost(e.target.value)}
                placeholder="e.g. 120"
                helperText="Kiln electricity/fuel, tools depreciation, workshop overhead"
                error={inputErrors.otherCost}
                required
              />

              {/* Craft Category & Technique Context */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <Input
                  label="Category"
                  type="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={mockCategories.filter(c => c !== 'All Crafts')}
                />
                <Input
                  label="Craft Technique"
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value)}
                  placeholder="e.g. Handloom"
                />
              </div>

              {/* Base Calculation Display */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Base Production Cost Formula:
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Material + Labour + Packaging + Other
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    ₹{liveMaterial} + ₹{liveLabour} + ₹{livePackaging} + ₹{liveOther}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-terracotta)' }}>
                    = ₹{liveProductionCost}
                  </span>
                </div>
              </div>

              {inputErrors.general && (
                <p style={{ color: 'var(--danger)', fontSize: '0.84rem', marginBottom: '1rem' }}>
                  {inputErrors.general}
                </p>
              )}

              <Button
                type="submit"
                isLoading={isCalculating}
                fullWidth={true}
                icon={<Calculator size={18} />}
              >
                Recalculate Price Breakdown
              </Button>
            </form>
          </Card>

        </div>

        {/* Right Column: Explainable Pricing Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {pricingData ? (
            <ExplainablePricingCard
              pricingData={pricingData}
              onApplyPrice={handleApplyPriceToProduct}
              isApplying={isApplying}
              addToast={addToast}
            />
          ) : (
            <Card title="Explainable Pricing Breakdown">
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Calculator size={42} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Enter Production Costs
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 1.25rem auto' }}>
                  Fill in material, labour, packaging, and other costs to see the transparent "WHY THIS PRICE?" breakdown.
                </p>
                <Button type="button" onClick={handleCalculate} icon={<Calculator size={16} />}>
                  Calculate Recommendation
                </Button>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
