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
    },
    {
      label: isHindi ? 'नया शिल्प' : 'Add Craft',
      path: '/add-product',
      icon: PlusCircle,
    },
    {
      label: isHindi ? 'एआई स्टूडियो' : 'AI Studio',
      path: '/ai-market-studio',
      icon: Sparkles,
      isSpecial: true,
    },
    {
      label: isHindi ? 'कैटलॉग' : 'Catalogue',
      path: '/catalogue',
      icon: Grid,
    },
    {
      label: isHindi ? 'प्रोफ़ाइल' : 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `bottom-tab ${tab.isSpecial ? 'bottom-tab-special' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-tab-icon-wrap">
              <IconComponent size={21} />
            </div>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
