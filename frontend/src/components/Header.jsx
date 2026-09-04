import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="brand-logo">
          <img src={logo} alt="KarigarAI Logo" className="logo-img" />
          <span className="brand-title">
            Karigar<span className="gradient-text">AI</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Step 1: Project Foundation</span>
        </div>
      </div>
    </header>
  );
}
