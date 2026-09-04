import React, { useState, useEffect } from 'react';
import { getHealthStatus } from '../services/healthService.js';
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function HealthBadge() {
  const [status, setStatus] = useState({ loading: true, online: false, data: null, error: null });

  const checkHealth = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const data = await getHealthStatus();
      setStatus({ loading: false, online: true, data, error: null });
    } catch (err) {
      setStatus({ loading: false, online: false, data: null, error: err.message });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="glass-card" style={{ padding: '1.5rem', width: '100%', maxWidth: '540px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Backend Service API Status</h3>
        </div>
        <button 
          onClick={checkHealth} 
          disabled={status.loading}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Refresh Status"
        >
          <RefreshCw size={16} className={status.loading ? 'spin' : ''} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        {status.online ? (
          <div className="status-badge online">
            <span className="pulse-dot"></span>
            <CheckCircle2 size={16} />
            <span>API Online — GET /api/health</span>
          </div>
        ) : (
          <div className="status-badge offline">
            <span className="pulse-dot"></span>
            <AlertCircle size={16} />
            <span>API Offline — Connection Refused</span>
          </div>
        )}
      </div>

      <div className="response-box">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          RESPONSE PAYLOAD (GET /api/health):
        </div>
        <pre>
          {status.loading 
            ? '// Connecting to http://localhost:5000/api/health...' 
            : JSON.stringify(status.data || { success: false, error: status.error }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
