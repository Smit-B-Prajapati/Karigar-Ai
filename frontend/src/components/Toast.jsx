import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], removeToast }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 size={20} color="var(--success)" />,
          error: <XCircle size={20} color="var(--danger)" />,
          warning: <AlertTriangle size={20} color="var(--warning)" />,
          info: <Info size={20} color="var(--info)" />
        };

        return (
          <div key={toast.id} className={`toast-item ${toast.type || 'info'}`}>
            {iconMap[toast.type] || iconMap.info}
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
