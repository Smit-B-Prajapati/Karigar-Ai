import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="main-content" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }} className="gradient-text">404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
      <Link 
        to="/" 
        style={{
          background: 'var(--accent-primary)',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-sm)',
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        Return to Home
      </Link>
    </div>
  );
}
