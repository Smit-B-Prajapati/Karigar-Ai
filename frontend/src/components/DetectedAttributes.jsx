import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Tag,
  Palette,
  Layers,
  Feather,
  CheckCircle2,
  Edit2,
  Plus,
  X,
  ShieldCheck,
  HelpCircle,
  Wand2
} from 'lucide-react';
import Button from './Button.jsx';
import Input from './Input.jsx';

export default function DetectedAttributes({
  analysis,
  isAnalyzing = false,
  onApply,
  onAnalysisChange,
  addToast,
}) {
  const [editedAttributes, setEditedAttributes] = useState({
    productType: '',
    category: '',
    material: '',
    craftType: '',
    colors: [],
    style: '',
    visibleCharacteristics: [],
  });

  const [newColorInput, setNewColorInput] = useState('');
  const [newCharInput, setNewCharInput] = useState('');

  // Sync incoming analysis from AI service
  useEffect(() => {
    if (analysis) {
      setEditedAttributes({
        productType: analysis.productType || 'Unknown',
        category: analysis.category || 'General Craft',
        material: analysis.material || 'Unknown',
        craftType: analysis.craftType || 'Unknown',
        colors: Array.isArray(analysis.colors) ? [...analysis.colors] : [],
        style: analysis.style || 'Traditional',
        visibleCharacteristics: Array.isArray(analysis.visibleCharacteristics) ? [...analysis.visibleCharacteristics] : [],
      });
    }
  }, [analysis]);

  const handleFieldChange = (field, value) => {
    setEditedAttributes(prev => {
      const updated = { ...prev, [field]: value };
      if (onAnalysisChange) onAnalysisChange(updated);
      return updated;
    });
  };

  const handleAddColor = () => {
    if (!newColorInput.trim()) return;
    if (editedAttributes.colors.includes(newColorInput.trim())) {
      setNewColorInput('');
      return;
    }
    const updatedColors = [...editedAttributes.colors, newColorInput.trim()];
    handleFieldChange('colors', updatedColors);
    setNewColorInput('');
  };

  const handleRemoveColor = (colorToRemove) => {
    const updatedColors = editedAttributes.colors.filter(c => c !== colorToRemove);
    handleFieldChange('colors', updatedColors);
  };

  const handleAddCharacteristic = () => {
    if (!newCharInput.trim()) return;
    const updatedChars = [...editedAttributes.visibleCharacteristics, newCharInput.trim()];
    handleFieldChange('visibleCharacteristics', updatedChars);
    setNewCharInput('');
  };

  const handleRemoveCharacteristic = (idx) => {
    const updatedChars = editedAttributes.visibleCharacteristics.filter((_, i) => i !== idx);
    handleFieldChange('visibleCharacteristics', updatedChars);
  };

  const handleApplyToForm = () => {
    if (onApply) {
      onApply(editedAttributes);
    }
    if (addToast) {
      addToast('AI-detected attributes applied to craft details!', 'success');
    }
  };

  if (isAnalyzing) {
    return (
      <div
        style={{
          padding: '2rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 183, 3, 0.05)',
          border: '1px solid rgba(255, 183, 3, 0.25)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              border: '3px solid rgba(255, 183, 3, 0.2)',
              borderTopColor: 'var(--accent-gold)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="var(--accent-gold)" />
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Analyzing Craft Image...
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Multimodal AI is visually inspecting material, craft technique, colors, and design characteristics.
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        animation: 'fadeIn 0.4s ease'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 183, 3, 0.15)', color: 'var(--accent-gold)' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Detected Attributes
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Strict visual analysis • Edit any field manually before applying
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleApplyToForm}
          variant="primary"
          size="sm"
          icon={<CheckCircle2 size={15} />}
        >
          Apply to Craft Form
        </Button>
      </div>

      {/* Editable Attribute Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* Product Type */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <Tag size={13} color="var(--accent-terracotta)" />
            Product Type
          </label>
          <input
            type="text"
            value={editedAttributes.productType}
            onChange={(e) => handleFieldChange('productType', e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <Layers size={13} color="var(--accent-gold)" />
            Category
          </label>
          <input
            type="text"
            value={editedAttributes.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          />
        </div>

        {/* Material */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <Feather size={13} color="var(--accent-terracotta)" />
            Material
          </label>
          <input
            type="text"
            value={editedAttributes.material}
            onChange={(e) => handleFieldChange('material', e.target.value)}
            placeholder="e.g. Terracotta, Silk, Cotton"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          />
        </div>

        {/* Craft Type / Technique */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <Edit2 size={13} color="var(--accent-gold)" />
            Craft Type / Technique
          </label>
          <input
            type="text"
            value={editedAttributes.craftType}
            onChange={(e) => handleFieldChange('craftType', e.target.value)}
            placeholder="e.g. Bandhani, Handloom, Pottery"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          />
        </div>

        {/* Style */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <Wand2 size={13} color="var(--accent-terracotta)" />
            Style
          </label>
          <input
            type="text"
            value={editedAttributes.style}
            onChange={(e) => handleFieldChange('style', e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          />
        </div>

      </div>

      {/* Colors Tag Editor */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
          <Palette size={13} color="var(--accent-gold)" />
          Identified Colors
        </label>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {editedAttributes.colors.map((col, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.7rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(230, 81, 0, 0.12)',
                border: '1px solid rgba(230, 81, 0, 0.3)',
                color: 'var(--accent-terracotta)',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              {col}
              <button
                type="button"
                onClick={() => handleRemoveColor(col)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-terracotta)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <X size={13} />
              </button>
            </span>
          ))}

          {/* Add color input */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <input
              type="text"
              placeholder="+ Add color"
              value={newColorInput}
              onChange={(e) => setNewColorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-input)',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                width: '110px'
              }}
            />
            {newColorInput.trim() && (
              <Button type="button" size="sm" variant="outline" onClick={handleAddColor} style={{ padding: '0.25rem 0.5rem' }}>
                <Plus size={13} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Visible Characteristics Editor */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
          <ShieldCheck size={13} color="var(--success)" />
          Visible Characteristics
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {editedAttributes.visibleCharacteristics.map((char, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                fontSize: '0.84rem',
                color: 'var(--text-primary)'
              }}
            >
              <span>• {char}</span>
              <button
                type="button"
                onClick={() => handleRemoveCharacteristic(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add characteristic input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
            <input
              type="text"
              placeholder="+ Add visible observation (e.g. geometric border pattern)"
              value={newCharInput}
              onChange={(e) => setNewCharInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCharacteristic(); } }}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem'
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddCharacteristic}
              disabled={!newCharInput.trim()}
              icon={<Plus size={14} />}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
