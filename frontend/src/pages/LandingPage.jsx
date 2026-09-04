import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import HealthBadge from '../components/HealthBadge.jsx';
import { mockProducts } from '../services/dummyData.js';
import { Sparkles, ArrowRight, Mic, Camera, ShoppingBag, TrendingUp, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>AI Platform for Indian Artisans</span>
        </div>

        <h1 className="hero-title">
          Karigar<span className="gradient-text">AI</span>
        </h1>

        <p className="hero-subtitle">
          From Handmade to Market-Ready in Minutes
        </p>

        <p style={{ maxWidth: '600px', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
          Upload craft photos or describe in your native language (Hindi, Gujarati, English). Let AI generate marketplace listings, studio images, and optimal pricing.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          <Button 
            onClick={() => navigate('/add-product')} 
            icon={<Camera size={20} />} 
            size="lg"
          >
            Add First Product
          </Button>

          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="secondary" 
            icon={<ArrowRight size={20} />} 
            size="lg"
          >
            View Dashboard
          </Button>
        </div>

        {/* Backend API Health Status Indicator */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
          <HealthBadge />
        </div>
      </section>

      {/* Value Proposition Highlights */}
      <section style={{ marginTop: '3.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '2rem' }}>
          Empowering Local Craftspeople with Smart AI
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <Card title="Voice & Photo Input" subtitle="No complex typing needed">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(230,81,0,0.15)', color: 'var(--accent-terracotta)' }}>
                <Mic size={24} />
              </div>
              <p style={{ fontSize: '0.9rem' }}>Artisans can describe crafts in Hindi or Gujarati using voice notes.</p>
            </div>
          </Card>

          <Card title="Studio Quality Enhancer" subtitle="Marketplace standard visuals">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,183,3,0.15)', color: 'var(--accent-gold)' }}>
                <Camera size={24} />
              </div>
              <p style={{ fontSize: '0.9rem' }}>Transform raw phone photos into studio-grade marketplace imagery.</p>
            </div>
          </Card>

          <Card title="Fair Pricing Calculator" subtitle="Protect artisan profits">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <p style={{ fontSize: '0.9rem' }}>Calculate exact labor hours & material costs for fair pricing.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Featured Artisan Craft Showcase */}
      <section style={{ marginTop: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem' }}>Featured Craft Listings</h2>
            <p style={{ fontSize: '0.9rem' }}>Sample products created using KarigarAI studio tool</p>
          </div>
          <Button onClick={() => navigate('/catalogue')} variant="outline" size="sm">
            Explore All Catalogue
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.5rem' }}>
          {mockProducts.slice(0, 3).map((product) => (
            <Card
              key={product.id}
              image={product.image}
              title={product.title}
              subtitle={product.category}
              footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>
                    ₹ {product.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--success-glow)', color: 'var(--success)' }}>
                    {product.status}
                  </span>
                </div>
              }
            >
              <p style={{ fontSize: '0.88rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.story}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
