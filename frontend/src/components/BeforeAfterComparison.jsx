import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  X,
  Maximize2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Undo2
} from 'lucide-react';
import Button from './Button.jsx';

export default function BeforeAfterComparison({
  originalImage,
  enhancedImage,
  isEnhancing = false,
  enhancingStage = 1,
  error = null,
  enhancementDetails = null,
  onUseEnhanced,
  onKeepOriginal,
  onRetry,
  addToast,
}) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100 percentage
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side' | 'tabbed'
  const [activeTab, setActiveTab] = useState('enhanced'); // 'original' | 'enhanced'
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);

  const handleSliderMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Processing Animation View
  if (isEnhancing) {
    const stages = [
      { num: 1, title: 'Analyzing product boundaries & craft edges', desc: 'Isolating focal handicraft object...' },
      { num: 2, title: 'Studio background cleanup & noise reduction', desc: 'Applying clean studio backdrop...' },
      { num: 3, title: 'Studio lighting & exposure enhancement', desc: 'Balancing contrast, warmth & shadows...' },
      { num: 4, title: 'Framing 1:1 e-commerce aspect ratio', desc: 'Centering craft for marketplace readiness...' }
    ];

    return (
      <div
        style={{
          padding: '2.5rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(230, 81, 0, 0.04)',
          border: '1px solid rgba(230, 81, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid rgba(230, 81, 0, 0.2)',
              borderTopColor: 'var(--accent-terracotta)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wand2 size={24} color="var(--accent-terracotta)" />
          </div>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Enhancing Product Photo...
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          AI Studio is transforming your raw mobile craft photo into an e-commerce ready listing.
        </p>

        {/* Multi-step progress list */}
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
          {stages.map((stg) => {
            const isCompleted = enhancingStage > stg.num;
            const isCurrent = enhancingStage === stg.num;
            return (
              <div
                key={stg.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent ? 'rgba(230, 81, 0, 0.12)' : isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isCurrent ? 'var(--accent-terracotta)' : isCompleted ? 'var(--success)' : 'var(--border-color)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? <Check size={14} /> : stg.num}
                </div>
                <div>
                  <p style={{ fontSize: '0.84rem', fontWeight: 600, color: isCurrent ? 'var(--text-primary)' : isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>
                    {stg.title}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{stg.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Error State View (Never pretend enhancement succeeded)
  if (error) {
    return (
      <div
        style={{
          padding: '2rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div style={{ padding: '0.8rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
          <AlertCircle size={32} />
        </div>

        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171', marginBottom: '0.3rem' }}>
            Enhancement Service Notice
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
            {error || 'Unable to complete AI image enhancement at this moment. Your original photo is safely retained.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button type="button" onClick={onRetry} icon={<RefreshCw size={15} />}>
            Retry Enhancement
          </Button>
          <Button type="button" onClick={onKeepOriginal} variant="secondary" icon={<Undo2 size={15} />}>
            Keep Original Photo
          </Button>
        </div>
      </div>
    );
  }

  if (!enhancedImage) return null;

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        animation: 'fadeIn 0.4s ease'
      }}
    >
      {/* Header View Switcher */}
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-terracotta)" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Original vs. Enhanced Comparison
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            style={{
              padding: '0.35rem 0.7rem',
              border: 'none',
              borderRadius: '4px',
              background: viewMode === 'slider' ? 'var(--accent-terracotta)' : 'transparent',
              color: viewMode === 'slider' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Split Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            style={{
              padding: '0.35rem 0.7rem',
              border: 'none',
              borderRadius: '4px',
              background: viewMode === 'side-by-side' ? 'var(--accent-terracotta)' : 'transparent',
              color: viewMode === 'side-by-side' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Side by Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tabbed')}
            style={{
              padding: '0.35rem 0.7rem',
              border: 'none',
              borderRadius: '4px',
              background: viewMode === 'tabbed' ? 'var(--accent-terracotta)' : 'transparent',
              color: viewMode === 'tabbed' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Toggle Tabs
          </button>
        </div>
      </div>

      {/* Main Comparison Viewports */}
      {viewMode === 'slider' ? (
        /* Interactive Split-Slider View */
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            overflow: 'hidden',
            background: '#070a12',
            cursor: 'ew-resize',
            userSelect: 'none'
          }}
        >
          {/* Enhanced Image (Background layer) */}
          <img
            src={enhancedImage}
            alt="Enhanced craft photo"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(16, 185, 129, 0.9)',
              color: '#fff',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              fontWeight: 700
            }}
          >
            Enhanced Studio
          </div>

          {/* Original Image (Clipped overlay layer) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${sliderPosition}%`,
              overflow: 'hidden',
              borderRight: '2px solid #fff',
              boxShadow: '0 0 12px rgba(0,0,0,0.5)',
              background: '#070a12'
            }}
          >
            <img
              src={originalImage}
              alt="Original raw photo"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: '100%',
                maxWidth: 'none',
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#fff',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              Original Raw
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              top: '50%',
              left: `${sliderPosition}%`,
              transform: 'translate(-50%, -50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'ew-resize',
              zIndex: 10
            }}
          >
            <Sliders size={18} color="#000" />
          </div>
        </div>
      ) : viewMode === 'side-by-side' ? (
        /* Side by Side View */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'var(--border-color)' }}>
          <div style={{ position: 'relative', height: '340px', background: '#070a12' }}>
            <img src={originalImage} alt="Original photo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Original Raw Photo
            </div>
          </div>
          <div style={{ position: 'relative', height: '340px', background: '#070a12' }}>
            <img src={enhancedImage} alt="Enhanced photo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(16,185,129,0.9)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
              Enhanced E-Commerce Studio
            </div>
          </div>
        </div>
      ) : (
        /* Tabbed View */
        <div style={{ position: 'relative', height: '340px', background: '#070a12' }}>
          <img
            src={activeTab === 'enhanced' ? enhancedImage : originalImage}
            alt="Craft preview"
            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'all 0.3s ease' }}
          />
          <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.7)', padding: '0.3rem', borderRadius: 'var(--radius-full)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('original')}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === 'original' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'original' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Original Photo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('enhanced')}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === 'enhanced' ? 'var(--accent-terracotta)' : 'transparent',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Enhanced Studio
            </button>
          </div>
        </div>
      )}

      {/* Applied Enhancements Summary */}
      {enhancementDetails && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.82rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span><strong>Applied:</strong> {enhancementDetails.background} • {enhancementDetails.aspectRatio}</span>
          </div>

          <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            Market-Ready 1:1 Aspect
          </div>
        </div>
      )}

      {/* Action Decision Footer */}
      <div
        style={{
          padding: '1.25rem',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <Button
          type="button"
          onClick={onKeepOriginal}
          variant="secondary"
          icon={<Undo2 size={16} />}
        >
          Keep Original Photo
        </Button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              variant="outline"
              icon={<RefreshCw size={15} />}
            >
              Retry
            </Button>
          )}

          <Button
            type="button"
            onClick={onUseEnhanced}
            variant="primary"
            icon={<CheckCircle2 size={16} />}
          >
            Use Enhanced Image
          </Button>
        </div>
      </div>
    </div>
  );
}
