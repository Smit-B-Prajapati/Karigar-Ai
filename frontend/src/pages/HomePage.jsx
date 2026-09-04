import React from 'react';
import HealthBadge from '../components/HealthBadge.jsx';
import { Sparkles, Image, Tag, ShoppingBag, Bot, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const upcomingModules = [
    { icon: <Image size={24} />, title: "Image Processing", desc: "Background removal & studio quality enhancement for craft photos." },
    { icon: <Tag size={24} />, title: "AI Pricing Engine", desc: "Smart market pricing recommendations based on materials & effort." },
    { icon: <ShoppingBag size={24} />, title: "Catalogue Builder", desc: "Auto-generate export & marketplace ready product listings." },
    { icon: <Bot size={24} />, title: "Artisan Business Advisor", desc: "Voice/Text AI guide to help scale local businesses globally." },
  ];

  return (
    <div className="main-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>Step 1 — Foundation Architecture</span>
        </div>
        
        <h1 className="hero-title">
          Karigar<span className="gradient-text">AI</span>
        </h1>

        <p className="hero-subtitle">
          From Handmade to Market-Ready in Minutes
        </p>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <HealthBadge />
        </div>
      </section>

      {/* Scalable Architecture Preview Grid */}
      <section style={{ marginTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Built for High-Scalability
          </h2>
          <p>Foundation ready for multi-module expansion in upcoming steps.</p>
        </div>

        <div className="features-grid">
          {upcomingModules.map((mod, index) => (
            <div key={index} className="glass-card feature-card">
              <div className="feature-icon">
                {mod.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>{mod.title}</h3>
              <p style={{ fontSize: '0.9rem' }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
