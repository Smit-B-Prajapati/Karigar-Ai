import React from 'react';

export default function Loader({
  size = 'md',
  fullPage = false,
  text = 'Loading...'
}) {
  const spinnerSize = size === 'sm' ? 18 : size === 'lg' ? 40 : 28;

  if (fullPage) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'var(--text-secondary)'
      }}>
        <div 
          className="spinner" 
          style={{ width: spinnerSize, height: spinnerSize, color: 'var(--accent-terracotta)' }} 
        />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{text}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
      <div 
        className="spinner" 
        style={{ width: spinnerSize, height: spinnerSize, color: 'var(--accent-terracotta)' }} 
      />
      {text && <span style={{ fontSize: '0.9rem' }}>{text}</span>}
    </div>
  );
}
