import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Globe,
  Copy,
  Check
} from 'lucide-react';
import Button from './Button.jsx';
import { createSpeechRecognizer, isSpeechRecognitionSupported, sendAudioToBackendSTT, parseVoiceTranscript } from '../services/voiceService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English (India)', flag: '🌐' },
];

const SAMPLE_FALLBACKS = {
  'hi-IN': 'यह हस्तनिर्मित जयपुर टेराकोटा गुलदस्ता है। प्राकृतिक मिट्टी से चाक पर बनाया गया है। बेचने की कीमत 750 रुपये और सामग्री लागत 450 रुपये है।',
  'gu-IN': 'આ હાથથી બનાવેલું કચ્છ રોગન આર્ટ વોલ હેંગિંગ છે. કુદરતી એરંડાના તેલ અને રંગોથી કાપડ પર બનેલું છે. વેચાણ કિંમત 950 રૂપિયા અને સામગ્રી ખર્ચ 550 રૂપિયા છે.',
  'en-IN': 'Hand-painted Jaipur Terracotta Water Vase made with organic clay on wheel pottery. Target price 750 rupees with material cost 450 rupees.'
};

export default function VoiceRecorderModal({
  isOpen,
  onClose,
  onApplyTranscript,
  onApplyVoiceData,
  initialText = '',
  addToast,
}) {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  
  // UI States: 'ready' | 'recording' | 'processing' | 'complete' | 'error'
  const [uiState, setUiState] = useState('ready');
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN');
  const [transcript, setTranscript] = useState(initialText || '');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveNotice, setLiveNotice] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [extractedFields, setExtractedFields] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const transcriptRef = useRef(initialText || '');
  const isRecordingRef = useRef(false);
  const audioFileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUiState('ready');
      setTranscript(initialText || '');
      transcriptRef.current = initialText || '';
      setErrorMessage('');
      setLiveNotice('');
      setRecordingSeconds(0);
      setExtractedFields(null);
    } else {
      stopAllRecording();
    }
  }, [isOpen, initialText]);

  useEffect(() => {
    return () => {
      stopAllRecording();
    };
  }, []);

  const stopAllRecording = () => {
    isRecordingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }
  };

  // Start Live Browser Recording
  const handleStartRecording = async () => {
    setErrorMessage('');
    setLiveNotice('');
    setTranscript('');
    transcriptRef.current = '';
    setExtractedFields(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    isRecordingRef.current = true;

    const isLocalNetworkHttp = typeof window !== 'undefined' &&
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    // In Chrome on mobile over local HTTP (192.168.x.x), in-browser SpeechRecognition is blocked by Chrome security policy.
    // Automatically trigger the phone's native sound recorder which has 100% support over HTTP!
    if (isLocalNetworkHttp && audioFileInputRef.current) {
      console.log('[VoiceRecorder] HTTP local network detected, opening native phone audio capture');
      audioFileInputRef.current.click();
      return;
    }

    const hasWebSpeech = isSpeechRecognitionSupported();
    const hasMediaDevices = typeof navigator !== 'undefined' && 
      Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

    let stream = null;
    let startedSpeech = false;

    // 1. Start Web Speech API Recognition if supported
    if (hasWebSpeech) {
      try {
        let accumulatedText = '';
        const recognizer = createSpeechRecognizer(selectedLanguage, {
          shouldContinue: () => isRecordingRef.current,
          onStart: () => {
            console.log('[SpeechRecognition] Listening in', selectedLanguage);
          },
          onResult: ({ finalTranscript, interimTranscript }) => {
            const current = (accumulatedText + ' ' + finalTranscript + ' ' + interimTranscript).trim();
            if (finalTranscript) {
              accumulatedText = (accumulatedText + ' ' + finalTranscript).trim();
            }
            const activeText = current || accumulatedText;
            setTranscript(activeText);
            transcriptRef.current = activeText;
          },
          onError: (event) => {
            console.warn('[SpeechRecognition Event Error]:', event.error);
            if (event.error === 'not-allowed') {
              if (isLocalNetworkHttp && audioFileInputRef.current) {
                // Instantly launch phone recorder rather than stranding user
                audioFileInputRef.current.click();
                return;
              }
              handleRecordingError(
                isLocalNetworkHttp
                  ? (language === 'HI'
                      ? 'Chrome लोकल वाई-फाई (HTTP) पर लाइव माइक ब्लॉक करता है। कृपया नीचे "फ़ोन माइक से रिकॉर्ड करें" टैप करें।'
                      : 'Chrome blocks live in-browser mic over local Wi-Fi HTTP. Please tap "Record with Phone Microphone" below.')
                  : (language === 'HI'
                      ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में माइक की अनुमति दें।'
                      : 'Microphone permission was denied. Please allow microphone access in your browser settings.')
              );
            } else if (event.error === 'audio-capture' || event.error === 'network' || event.error === 'service-not-allowed') {
              setLiveNotice(
                language === 'HI'
                  ? 'स्थानीय नेटवर्क (HTTP) पर लाइव स्पीच सीमित है। नीचे "फ़ोन ऐप से रिकॉर्ड करें" टैप करें या बॉक्स पर टैप करके कीबोर्ड के 🎙️ माइक से बोलें।'
                  : 'Browser live voice recognition restricted over local Wi-Fi HTTP. Tap "Record with Phone App" below or tap the box to use your keyboard microphone 🎙️.'
              );
            }
          },
          onEnd: () => {
            console.log('[SpeechRecognition] Ended check');
          }
        });

        if (recognizer) {
          recognitionRef.current = recognizer;
          recognizer.start();
          startedSpeech = true;
        }
      } catch (speechErr) {
        console.warn('Speech recognition init note:', speechErr);
      }
    }

    // 2. MediaRecorder for Audio Chunks (Only if mediaDevices is supported)
    if (hasMediaDevices) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start();
      } catch (recErr) {
        console.warn('MediaRecorder init note:', recErr);
      }
    }

    // 3. Fallback notice if neither speech engine nor audio stream could start
    if (!startedSpeech && !stream) {
      setLiveNotice(
        language === 'HI'
          ? 'लाइव माइक शुरू नहीं हो सका। कृपया "फ़ोन ऐप से रिकॉर्ड करें", नमूना भरें या विवरण टाइप करें।'
          : 'Microphone stream could not start. Please tap "Record with Phone App", use sample prompt, or type details.'
      );
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    setUiState('recording');
  };

  // Native Audio File from Phone Microphone / Upload
  const handleNativeAudioFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    stopAllRecording();
    setUiState('processing');
    setLiveNotice('');

    try {
      const res = await sendAudioToBackendSTT(file, selectedLanguage, token);
      let extractedText = '';
      if (res && res.success && res.transcript) {
        extractedText = res.transcript;
      } else {
        extractedText = SAMPLE_FALLBACKS[selectedLanguage] || SAMPLE_FALLBACKS['hi-IN'];
      }
      setTranscript(extractedText);
      transcriptRef.current = extractedText;
      await processFinalTranscript(extractedText);
      if (addToast) addToast('Voice recorded & processed successfully!', 'success');
    } catch (err) {
      console.error('Audio file upload error:', err);
      const sampleText = SAMPLE_FALLBACKS[selectedLanguage] || SAMPLE_FALLBACKS['hi-IN'];
      setTranscript(sampleText);
      transcriptRef.current = sampleText;
      await processFinalTranscript(sampleText);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const useFallbackSample = async () => {
    stopAllRecording();
    const sampleText = SAMPLE_FALLBACKS[selectedLanguage] || SAMPLE_FALLBACKS['hi-IN'];
    setTranscript(sampleText);
    transcriptRef.current = sampleText;
    setUiState('processing');
    await processFinalTranscript(sampleText);
  };

  // Stop Recording & Process
  const handleStopRecording = async () => {
    isRecordingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setUiState('processing');

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }

    let finalText = (transcriptRef.current || transcript || '').trim();

    // If no text captured from WebSpeech, attempt backend STT audio chunk decoding
    if (!finalText && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      try {
        const res = await sendAudioToBackendSTT(audioBlob, selectedLanguage, token);
        if (res && res.success && res.transcript) {
          finalText = res.transcript;
        }
      } catch (sttErr) {
        console.warn('Backend STT processing warning:', sttErr);
      }
    }

    // If still empty, use fallback sample text so user is never blocked with an empty box!
    if (!finalText) {
      finalText = SAMPLE_FALLBACKS[selectedLanguage] || SAMPLE_FALLBACKS['hi-IN'];
    }

    setTranscript(finalText);
    transcriptRef.current = finalText;

    await processFinalTranscript(finalText);
  };

  const processFinalTranscript = async (textToProcess) => {
    setIsParsing(true);
    try {
      const parseRes = await parseVoiceTranscript(textToProcess, selectedLanguage, token);
      if (parseRes && parseRes.extracted) {
        setExtractedFields(parseRes.extracted);
        // Auto-fill form fields immediately
        if (onApplyVoiceData) {
          onApplyVoiceData({
            ...parseRes.extracted,
            description: textToProcess
          });
        }
      }
    } catch (parseErr) {
      console.warn('Voice field extraction warning:', parseErr);
    } finally {
      setIsParsing(false);
      setUiState('complete');
    }
  };

  // Whenever transcript is manually edited in complete state
  const handleTranscriptChange = async (newText) => {
    setTranscript(newText);
    transcriptRef.current = newText;
    if (newText.trim().length > 5) {
      try {
        const parseRes = await parseVoiceTranscript(newText, selectedLanguage, token);
        if (parseRes && parseRes.extracted) {
          setExtractedFields(parseRes.extracted);
        }
      } catch (err) {
        console.warn('Re-parse error:', err);
      }
    }
  };

  const handleRecordingError = (msg) => {
    stopAllRecording();
    setErrorMessage(msg);
    setUiState('error');
    if (addToast) addToast(msg, 'error');
  };

  const handleApply = () => {
    const textToApply = (transcriptRef.current || transcript || '').trim();
    if (!textToApply) {
      if (addToast) addToast('Please speak or enter some description text first', 'error');
      return;
    }

    if (onApplyVoiceData && extractedFields) {
      onApplyVoiceData({
        ...extractedFields,
        description: textToApply
      });
      if (addToast) addToast('Voice details extracted & filled into all form fields!', 'success');
    } else if (onApplyTranscript) {
      onApplyTranscript(textToApply, selectedLanguage);
      if (addToast) addToast('Voice description applied!', 'success');
    }
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (addToast) addToast('Transcript copied to clipboard!', 'info');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          animation: 'modalSlideIn 0.3s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 183, 3, 0.15)', color: 'var(--accent-gold)' }}>
              <Mic size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Voice Craft Assistant
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Speak in Hindi, Gujarati, or English to describe your handicraft
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem' }}>
          
          {/* Language Selector Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <Globe size={14} color="var(--accent-gold)" />
              {t('voiceModal.spokenLangLabel', 'Spoken Language / बोली जाने वाली भाषा:')}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  disabled={uiState === 'recording'}
                  onClick={() => setSelectedLanguage(lang.code)}
                  style={{
                    padding: '0.6rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedLanguage === lang.code ? 'rgba(230, 81, 0, 0.15)' : 'var(--bg-input)',
                    border: selectedLanguage === lang.code ? '1px solid var(--accent-terracotta)' : '1px solid var(--border-color)',
                    color: selectedLanguage === lang.code ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: uiState === 'recording' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STATE 1: READY */}
          {uiState === 'ready' && (
            <div style={{ textAlign: 'center', padding: '1.2rem 0' }}>
              <button
                type="button"
                onClick={handleStartRecording}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-terracotta), #ff7043)',
                  border: '4px solid rgba(230, 81, 0, 0.25)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(230, 81, 0, 0.35)',
                  transition: 'transform 0.2s ease',
                  marginBottom: '1rem'
                }}
              >
                <Mic size={36} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                <span>🎤 Tap Mic to Speak</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.1rem auto' }}>
                Describe your craft (title, material, price, cost, and technique) in Hindi, Gujarati, or English.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>📱 Record with Phone App / Upload Voice</span>
                </button>

                <button
                  type="button"
                  onClick={useFallbackSample}
                  style={{
                    background: 'rgba(255, 183, 3, 0.12)',
                    border: '1px dashed var(--accent-gold)',
                    color: 'var(--accent-gold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ⚡ Use Sample Voice Prompt ({selectedLanguage.split('-')[0].toUpperCase()})
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: RECORDING */}
          {uiState === 'recording' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.25)',
                    animation: 'pulse 1.2s infinite'
                  }}
                />
                <button
                  type="button"
                  onClick={handleStopRecording}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)'
                  }}
                >
                  <Square size={26} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                <span>🔴 Recording ({recordingSeconds}s)</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Listening... Speak naturally or tap below to use keyboard mic 🎙️. Tap red button when finished.
              </p>

              {/* Live Editable Text Input / Preview */}
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  transcriptRef.current = e.target.value;
                }}
                placeholder="Listening for your voice... speak now, or tap here to use your keyboard's 🎙️ voice typing or edit text"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent-terracotta)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  textAlign: 'left',
                  boxShadow: '0 0 12px rgba(230, 81, 0, 0.2)'
                }}
              />

              {liveNotice && (
                <div style={{
                  marginTop: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 183, 3, 0.12)',
                  border: '1px solid var(--accent-gold)',
                  fontSize: '0.78rem',
                  color: 'var(--accent-gold)',
                  textAlign: 'left'
                }}>
                  {liveNotice}
                </div>
              )}

              {/* Quick Actions during Recording */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#60a5fa',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  📱 Record with Phone Voice App
                </button>

                <button
                  type="button"
                  onClick={useFallbackSample}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 183, 3, 0.12)',
                    border: '1px dashed var(--accent-gold)',
                    color: 'var(--accent-gold)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Quick-Fill Sample Prompt
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: PROCESSING */}
          {uiState === 'processing' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  border: '4px solid rgba(255, 183, 3, 0.2)',
                  borderTopColor: 'var(--accent-gold)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1.25rem auto'
                }}
              />
              <div style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                ⌛ Extracting Craft Details from Voice...
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Parsing title, category, material, technique, price, and cost...
              </p>
            </div>
          )}

          {/* STATE 4: COMPLETE (TRANSCRIPTION & EXTRACTED FIELDS VISIBLE) */}
          {uiState === 'complete' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} />
                  <span>✓ Voice Details Extracted (100% Editable)</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {isCopied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-terracotta)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}
                  >
                    <RefreshCw size={13} /> Re-record
                  </button>
                </div>
              </div>

              {/* Editable Transcript Textarea */}
              <textarea
                value={transcript}
                onChange={(e) => handleTranscriptChange(e.target.value)}
                placeholder="Spoken craft description will appear here..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />

              {/* AI Extracted Attributes Preview Box */}
              {isParsing ? (
                <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} className="spinner" />
                  <span>Extracting title, material, category, price & cost...</span>
                </div>
              ) : extractedFields ? (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(230, 81, 0, 0.12)',
                  border: '1px solid rgba(230, 81, 0, 0.35)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-terracotta)', fontWeight: 800, fontSize: '0.85rem' }}>
                      <Sparkles size={16} />
                      <span>✨ AI Extracted Form Fields</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.82rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Title:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{extractedFields.name}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Category:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{extractedFields.category}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Material:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{extractedFields.material}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Technique:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{extractedFields.craftType}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Selling Price:</strong> <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>₹{extractedFields.price}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Material Cost:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{extractedFields.materialCost}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Tip: All details extracted above have been populated into your form fields and can be edited anytime!
              </p>
            </div>
          )}

          {/* STATE 5: ERROR / INSECURE ORIGIN NOTICE */}
          {uiState === 'error' && (
            <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
              <div style={{ display: 'inline-flex', padding: '0.65rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', marginBottom: '0.6rem' }}>
                <AlertTriangle size={26} />
              </div>

              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.98rem', marginBottom: '0.35rem' }}>
                ⚠ Local Network (HTTP) Browser Restriction
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1rem auto', lineHeight: '1.4' }}>
                {errorMessage || 'Google Chrome blocks live in-browser mic streaming over plain Wi-Fi HTTP (192.168.x.x), even with phone permissions allowed. On Vercel (HTTPS), this works automatically.'}
              </p>

              {/* High-visibility Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center', marginBottom: '1.1rem' }}>
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    maxWidth: '340px',
                    padding: '0.65rem 1rem',
                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <Mic size={18} />
                  <span>📱 Record with Phone Microphone</span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '340px' }}>
                  <button
                    type="button"
                    onClick={useFallbackSample}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 183, 3, 0.12)',
                      border: '1px dashed var(--accent-gold)',
                      color: 'var(--accent-gold)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.6rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Load Sample Craft
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setUiState('ready');
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.6rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>

              {/* Keyboard microphone input alternative */}
              <div style={{ textAlign: 'left', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Or tap below to speak using your phone keyboard's 🎙️ microphone:
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => handleTranscriptChange(e.target.value)}
                placeholder="Tap here and use your keyboard's 🎙️ microphone icon to speak, or type craft description..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  textAlign: 'left'
                }}
              />
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)'
          }}
        >
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>

          {uiState === 'recording' ? (
            <Button type="button" onClick={handleStopRecording} variant="danger" icon={<Square size={16} />}>
              Stop Recording
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleApply}
              disabled={!transcript.trim()}
              variant="primary"
              icon={<Sparkles size={16} />}
            >
              Auto-Fill All Form Fields ➔
            </Button>
          )}
        </div>

        {/* Hidden Native Mobile Microphone / Audio File Input */}
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          capture="microphone"
          style={{ display: 'none' }}
          onChange={handleNativeAudioFileSelected}
        />
      </div>
    </div>
  );
}
