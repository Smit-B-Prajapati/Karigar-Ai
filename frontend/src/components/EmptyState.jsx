import React from 'react';
import Button from './Button.jsx';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon = <PackageOpen size={48} color="var(--text-muted)" />,
  title = "No Items Found",
  description = "You haven't created any items here yet.",
  actionLabel,
  onAction
}) {
  return (
    <div className="glass-card" style={{
      padding: '3rem 1.5rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      maxWidth: '480px',
      margin: '2rem auto'
    }}>
      <div style={{
        padding: '1.25rem',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)'
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{title}</h3>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} style={{ marginTop: '0.5rem' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
