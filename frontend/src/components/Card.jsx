import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  footer,
  image,
  className = '',
  onClick,
  style = {}
}) {
  return (
    <div 
      className={`glass-card ${className}`} 
      onClick={onClick}
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {image && (
        <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#10172a' }}>
          <img 
            src={image} 
            alt={title || 'Card thumbnail'} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
      )}

      {(title || action) && (
        <div style={{ padding: '1.25rem 1.5rem 0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {title && <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
        {children}
      </div>

      {footer && (
        <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
