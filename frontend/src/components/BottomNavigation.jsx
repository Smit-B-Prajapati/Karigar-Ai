import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Home, PlusCircle, Grid, Sparkles, User } from 'lucide-react';

export default function BottomNavigation() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isHindi = language === 'HI';

  if (!isAuthenticated) return null;

  const tabs = [
    {
      label: isHindi ? 'होम' : 'Home',
      path: '/home',
      icon: Home,
      size: 20
    },
    {
      label: isHindi ? 'नया शिल्प' : 'Add Craft',
      path: '/add-product',
      icon: PlusCircle,
      size: 21,
      color: 'var(--accent-terracotta)'
    },
    {
      label: isHindi ? 'एआई स्टूडियो' : 'AI Studio',
      path: '/ai-market-studio',
      icon: Sparkles,
      size: 21,
      isHero: true
    },
    {
      label: isHindi ? 'कैटलॉग' : 'Catalogue',
      path: '/catalogue',
      icon: Grid,
      size: 20
    },
    {
      label: isHindi ? 'प्रोफ़ाइल' : 'Profile',
      path: '/profile',
      icon: User,
      size: 20
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        if (tab.isHero) {
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `bottom-tab bottom-tab-hero ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-tab-hero-bubble">
                <IconComponent size={tab.size} />
              </div>
              <span className="bottom-tab-hero-label">{tab.label}</span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-tab-icon-wrap">
              <IconComponent size={tab.size} color={tab.color} />
            </div>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
