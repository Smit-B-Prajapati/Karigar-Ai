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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (user.email === 'ramesh@karigar.in' || user.isDemo) && (
            <span 
              className="lang-badge" 
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600 }}
              title="Demo Mode Active"
            >
              {t('nav.demoMode', '● Demo Mode Ready')}
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
              gap: '0.4rem',
              fontWeight: 700,
              background: activeLang === 'HI' ? 'rgba(230, 81, 0, 0.18)' : 'var(--bg-secondary)',
              border: activeLang === 'HI' ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
              color: activeLang === 'HI' ? 'var(--accent-terracotta)' : 'var(--text-primary)',
              transition: 'all 0.2s ease',
              padding: '0.4rem 0.75rem'
            }}
          >
            <Globe size={15} color={activeLang === 'HI' ? 'var(--accent-terracotta)' : 'var(--accent-gold)'} />
            <span>{activeLang === 'HI' ? '🇮🇳 हिन्दी (HI)' : '🌐 English (EN)'}</span>
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
                title="Log Out"
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

