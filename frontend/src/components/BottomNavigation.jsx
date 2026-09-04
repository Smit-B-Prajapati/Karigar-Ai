import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Home, PlusCircle, Grid, Sparkles, User } from 'lucide-react';

export default function BottomNavigation() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (!isAuthenticated) return null;

  const tabs = [
    { label: t('nav.home', 'Home'), path: '/home', icon: <Home size={22} /> },
    { label: t('nav.addProduct', 'Add'), path: '/add-product', icon: <PlusCircle size={24} color="var(--accent-terracotta)" /> },
    { label: t('nav.aiMarketStudio', 'AI Studio'), path: '/ai-market-studio', icon: <Sparkles size={22} color="var(--accent-gold)" /> },
    { label: t('nav.myProducts', 'Catalogue'), path: '/catalogue', icon: <Grid size={22} /> },
    { label: t('nav.profile', 'Profile'), path: '/profile', icon: <User size={22} /> },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
