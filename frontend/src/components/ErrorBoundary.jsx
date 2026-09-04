import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            background: 'rgba(23, 32, 54, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.75rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #e65100 0%, #ff6b35 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Reset Session & Go to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
