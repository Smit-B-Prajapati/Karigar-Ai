import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Sparkles,
  Eye,
  Sliders,
  Check,
  X,
  Maximize2
} from 'lucide-react';
import Button from './Button.jsx';
import { optimizeImageForUpload } from '../utils/imageOptimizer.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB input limit, auto-compressed to ~250KB

export default function ImageUploader({
  value,
  onChange,
  onFileSelect,
  uploadProgress = 0,
  isUploading = false,
  productId = null,
  showPipeline = false,
  addToast,
}) {
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [fileDetails, setFileDetails] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activePipelineTab, setActivePipelineTab] = useState('original'); // 'original' | 'processing' | 'enhanced'
  const [studioPreset, setStudioPreset] = useState('Warm Heritage Glow');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value && value !== previewUrl) {
      setPreviewUrl(value);
    }
  }, [value]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const validateFile = (file) => {
    setValidationError('');

    if (!file) {
      return { valid: false, message: 'No file selected' };
    }

    // Format validation
    const fileType = file.type?.toLowerCase();
    const fileName = file.name?.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMime = ALLOWED_TYPES.includes(fileType);

    if (!hasValidMime && !hasValidExt) {
      const msg = `Unsupported file format. Please upload JPEG, PNG, or WEBP. (Rejected: ${file.name})`;
      setValidationError(msg);
      if (addToast) addToast(msg, 'error');
      return { valid: false, message: msg };
    }

    // Size validation (Max 25MB before client-side optimization)
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const msg = `File is too large (${sizeMB} MB). Maximum allowed image size is 25 MB.`;
      setValidationError(msg);
      if (addToast) addToast(msg, 'error');
      return { valid: false, message: msg };
    }

    return { valid: true };
  };

  const handleSelectedFile = async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      return;
    }

    try {
      setIsOptimizing(true);
      // Downscale and compress mobile camera photos to ~150-300KB (max 1200px)
      const optimized = await optimizeImageForUpload(file, { maxDimension: 1200, quality: 0.85 });

      const finalSizeKb = (optimized.sizeBytes / 1024).toFixed(1);
      const originalSizeMb = (file.size / (1024 * 1024)).toFixed(2);

      setPreviewUrl(optimized.base64);
      setFileDetails({
        name: file.name,
        size: `${finalSizeKb} KB (optimized from ${originalSizeMb} MB)`,
        type: 'image/jpeg',
        rawFile: optimized.file,
      });

      if (onChange) {
        onChange(optimized.base64, optimized.file);
      }
      if (onFileSelect) {
        onFileSelect(optimized.file, optimized.base64);
      }
      if (addToast) {
        addToast(`Photo loaded & optimized for studio enhancement! (${finalSizeKb} KB)`, 'success');
      }
    } catch (optErr) {
      console.warn('Image optimization fallback:', optErr);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        setPreviewUrl(base64Data);
        setFileDetails({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type || 'image/jpeg',
          rawFile: file,
        });

        if (onChange) {
          onChange(base64Data, file);
        }
        if (onFileSelect) {
          onFileSelect(file, base64Data);
        }
        if (addToast) {
          addToast(`Photo "${file.name}" loaded successfully!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setPreviewUrl('');
    setFileDetails(null);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (onChange) onChange('', null);
    if (addToast) addToast('Product image removed', 'info');
  };

  // WebCam live snapshot support
  const startCameraStream = async () => {
    try {
      setValidationError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 200);
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      // Fallback: trigger standard mobile camera input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        if (addToast) addToast('Camera access not supported or denied. Please upload an image.', 'error');
      }
    }
  };

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    stopCameraStream();

    // Create virtual File object
    fetch(base64Image)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `craft-camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleSelectedFile(file);
      });
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        id="image-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Direct mobile camera capture input */}
      <input
        ref={cameraInputRef}
        id="image-camera-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Validation Error Alert */}
      {validationError && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--accent-terracotta)', fontWeight: 600 }}>
              {uploadProgress < 30 ? 'Validating file & format...' : uploadProgress < 85 ? 'Uploading image to MongoDB server...' : 'Finalizing craft photo...'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-terracotta), var(--accent-gold))',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Live Camera Stream Modal */}
      {isCameraActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '540px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={20} color="var(--accent-terracotta)" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Take Craft Photo</span>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '360px', background: '#000' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button type="button" onClick={capturePhotoFromCamera} icon={<Camera size={18} />}>
                Capture Craft Photo
              </Button>
              <Button type="button" onClick={stopCameraStream} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Dropzone or Image Preview */}
      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--accent-terracotta)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: isDragOver ? 'rgba(230, 81, 0, 0.05)' : 'rgba(255,255,255,0.01)',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '50%',
              background: 'rgba(230, 81, 0, 0.12)',
              color: 'var(--accent-terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UploadCloud size={36} />
          </div>

          <div>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Upload or Snap Craft Photo
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Drag and drop craft photo here, or browse from device
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<ImageIcon size={15} />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<Camera size={15} />}
              onClick={(e) => {
                e.stopPropagation();
                startCameraStream();
              }}
            >
              Take Photo
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>Supported: JPEG, PNG, WEBP</span>
            <span>•</span>
            <span>Max size: 5 MB</span>
          </div>
        </div>
      ) : (
        /* Image Preview & Management Card */
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--bg-card)'
          }}
        >
          {/* Top Actions Bar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(0,0,0,0.25)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} color="var(--success)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Craft Photo Ready
              </span>
              {fileDetails && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {fileDetails.size} • {fileDetails.name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={<RefreshCw size={13} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={<Camera size={13} />}
                onClick={startCameraStream}
              >
                Retake
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                icon={<Trash2 size={13} />}
                onClick={handleRemoveImage}
              >
                Remove
              </Button>
            </div>
          </div>

          {/* Optional Image Pipeline Preview */}
          {showPipeline ? (
            <div>
              {/* Pipeline Step Navigator */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '0.4rem',
                  borderBottom: '1px solid var(--border-color)',
                  gap: '0.4rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActivePipelineTab('original')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: activePipelineTab === 'original' ? 'var(--bg-secondary)' : 'transparent',
                    color: activePipelineTab === 'original' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: activePipelineTab === 'original' ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff' }}>1</span>
                  ORIGINAL IMAGE
                </button>

                <button
                  type="button"
                  onClick={() => setActivePipelineTab('processing')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: activePipelineTab === 'processing' ? 'rgba(255,183,3,0.15)' : 'transparent',
                    color: activePipelineTab === 'processing' ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: activePipelineTab === 'processing' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000' }}>2</span>
                  PROCESSING
                </button>

                <button
                  type="button"
                  onClick={() => setActivePipelineTab('enhanced')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: activePipelineTab === 'enhanced' ? 'var(--accent-terracotta)' : 'transparent',
                    color: activePipelineTab === 'enhanced' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: activePipelineTab === 'enhanced' ? '#fff' : 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: activePipelineTab === 'enhanced' ? 'var(--accent-terracotta)' : '#fff' }}>3</span>
                  ENHANCED IMAGE
                </button>
              </div>

              {/* Pipeline Viewport */}
              <div style={{ position: 'relative', width: '100%', height: '320px', background: '#070a12', overflow: 'hidden' }}>
                <img
                  src={previewUrl}
                  alt="Product preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter:
                      activePipelineTab === 'original'
                        ? 'none'
                        : activePipelineTab === 'processing'
                        ? 'blur(1px) contrast(1.1) brightness(0.9)'
                        : 'contrast(1.12) brightness(1.04) saturate(1.15)',
                    transition: 'all 0.4s ease'
                  }}
                />

                {/* Pipeline Status Overlay */}
                {activePipelineTab === 'processing' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ width: '38px', height: '38px', border: '3px solid rgba(255,183,3,0.3)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                      Pipeline Simulation: Analyzing Lighting & Noise...
                    </span>
                  </div>
                )}

                {activePipelineTab === 'enhanced' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(16,185,129,0.92)',
                      color: '#fff',
                      padding: '0.35rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Check size={14} /> Mock Enhancement Preview
                  </div>
                )}
              </div>

              {/* Explicit Disclaimer Notice */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,183,3,0.06)',
                  borderTop: '1px solid rgba(255,183,3,0.2)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Step 5 Notice:</strong> This is a studio lighting simulation / mock enhancement preview. Live AI Image Enhancement will be activated in Step 6.
                </span>
              </div>
            </div>
          ) : (
            /* Simple Direct Preview */
            <div style={{ position: 'relative', width: '100%', height: '260px', background: '#090d16', overflow: 'hidden' }}>
              <img
                src={previewUrl}
                alt="Craft preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
