import React from 'react';
import { Mic } from 'lucide-react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon = null,
  voicePrompt = false,
  onVoiceClick,
  badgeText = null,
  options = [], // for select type
  rows = 3,    // for textarea type
  required = false,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {label} {required && <span style={{ color: 'var(--accent-terracotta)' }}>*</span>}
            {badgeText && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(230, 81, 0, 0.15)',
                color: 'var(--accent-terracotta)',
                border: '1px solid rgba(230, 81, 0, 0.3)',
                animation: 'pulse 2s ease infinite'
              }}>
                {badgeText}
              </span>
            )}
          </span>
          {voicePrompt && (
            <button 
              type="button" 
              onClick={onVoiceClick} 
              className="voice-btn-trigger"
              title="Speak to record (Voice input for artisans)"
            >
              <Mic size={14} />
              <span>Voice</span>
            </button>
          )}
        </label>
      )}

      <div className="input-wrapper">
        {icon && <div className="input-icon-left">{icon}</div>}

        {type === 'textarea' ? (
          <textarea
            id={inputId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`form-textarea ${icon ? 'has-icon' : ''}`}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            id={inputId}
            value={value}
            onChange={onChange}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`form-select ${icon ? 'has-icon' : ''}`}
            {...props}
          >
            {options.map((opt, i) => (
              <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                {typeof opt === 'object' ? opt.label : opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`form-input ${icon ? 'has-icon' : ''}`}
            {...props}
          />
        )}
      </div>

      {error && <span id={`${inputId}-error`} className="input-error-text" role="alert">{error}</span>}
      {helperText && !error && <span id={`${inputId}-helper`} className="input-helper-text">{helperText}</span>}
    </div>
  );
}
