import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Globe, PlusCircle, LayoutDashboard, Grid, User, Sparkles, LogOut, LogIn } from 'lucide-react';

export default function Navbar({ currentLang, onToggleLang }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const activeLang = currentLang || language || 'EN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = isAuthenticated ? [
    { label: t('nav.home', 'Home'), path: '/home', icon: <LayoutDashboard size={18} /> },
    { label: t('nav.myProducts', 'My Products'), path: '/catalogue', icon: <Grid size={18} /> },
    { label: t('nav.addProduct', 'Add Product'), path: '/add-product', icon: <PlusCircle size={18} /> },
    { label: t('nav.aiMarketStudio', 'AI Market Studio'), path: '/ai-market-studio', icon: <Sparkles size={18} color="var(--accent-gold)" /> },
    { label: t('nav.profile', 'Profile'), path: '/profile', icon: <User size={18} /> },
  ] : [];

  const handleLanguageClick = () => {
    if (onToggleLang) {
      onToggleLang();
    } else {
      toggleLanguage();
    }
  };

  return (
    <header className="app-header">
      <div className="nav-container">
        <Link to="/" className="brand-link" aria-label="KarigarAI Home">
          <img src={logo} alt="KarigarAI Logo" className="brand-logo-img" />
          <span className="brand-name">
            Karigar<span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav className="nav-desktop-menu" aria-label="Desktop Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {user && (user.email === 'ramesh@karigar.in' || user.isDemo) && (
            <span 
              className="lang-badge" 
              style={{ 
                background: 'rgba(16,185,129,0.12)', 
                border: '1px solid rgba(16,185,129,0.3)', 
                color: 'var(--success)', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                padding: '0.3rem 0.55rem',
                flexShrink: 0
              }}
              title="Demo Mode Active"
            >
              <span className="desktop-only">{t('nav.demoMode', '● Demo Mode Ready')}</span>
              <span className="mobile-only">● Demo</span>
            </span>
          )}

          {/* Whole Project English <-> Hindi Toggle Button */}
          <button 
            onClick={handleLanguageClick} 
            className="lang-badge" 
            title={activeLang === 'EN' ? 'Switch to Hindi (हिन्दी)' : 'Switch to English'}
            aria-label="Switch Language (English / हिंदी)"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontWeight: 700,
              background: activeLang === 'HI' ? 'rgba(230, 81, 0, 0.18)' : 'var(--bg-secondary)',
              border: activeLang === 'HI' ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
              color: activeLang === 'HI' ? 'var(--accent-terracotta)' : 'var(--text-primary)',
              transition: 'all 0.2s ease',
              padding: '0.3rem 0.6rem',
              fontSize: '0.78rem',
              flexShrink: 0
            }}
          >
            <Globe size={14} color={activeLang === 'HI' ? 'var(--accent-terracotta)' : 'var(--accent-gold)'} />
            <span className="desktop-only">{activeLang === 'HI' ? '🇮🇳 हिन्दी (HI)' : '🌐 English (EN)'}</span>
            <span className="mobile-only">{activeLang === 'HI' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <span className="desktop-only" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={t('nav.logout', 'Log Out')}
                aria-label="Log Out"
              >
                <LogOut size={14} />
                <span>{t('nav.logout', 'Logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                background: 'var(--accent-terracotta)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              <LogIn size={15} />
              <span>{t('nav.login', 'Login')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

