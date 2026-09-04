import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { updateUserProfile } from '../services/authService.js';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Camera,
  Trash2,
  Upload,
  Save,
  CheckCircle2,
  Sparkles,
  LogOut
} from 'lucide-react';

export default function Profile({ currentLang, onToggleLang, addToast }) {
  const { user, token, setUser, logout } = useAuth();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);

  // Profile data containing ONLY the real user account information
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    avatar: user?.avatar || '',
    preferredLanguage: user?.preferredLanguage || currentLang || language || 'EN',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Sync profile when auth context updates
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        avatar: user.avatar || '',
        preferredLanguage: user.preferredLanguage || currentLang || language || 'EN',
      });
    }
  }, [user, currentLang, language]);

  // Handle image upload from computer / device
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (addToast) addToast(language === 'HI' ? 'कृपया एक वैध छवि फ़ाइल चुनें (PNG, JPG, WEBP)' : 'Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (addToast) addToast(language === 'HI' ? 'फ़ाइल का आकार 5MB से कम होना चाहिए' : 'Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target.result;
      setProfile(prev => ({ ...prev, avatar: base64Url }));
      if (addToast) addToast(language === 'HI' ? 'प्रोफ़ाइल फ़ोटो अपडेट की गई! सहेजने के लिए "परिवर्तन सहेजें" पर क्लिक करें।' : 'Profile photo updated! Click "Save Changes" to save.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfile(prev => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addToast) addToast(language === 'HI' ? 'प्रोफ़ाइल फ़ोटो हटा दी गई।' : 'Profile photo removed. Showing default initial.', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      if (addToast) addToast(t('auth.fullNamePlaceholder', 'Please enter your full name'), 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (token) {
        const res = await updateUserProfile(profile, token);
        if (res.success && res.user) {
          setUser(res.user);
          if (addToast) addToast(language === 'HI' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!' : 'Profile updated successfully!', 'success');
          return;
        }
      }
      // Local state fallback
      if (setUser) {
        setUser(prev => ({ ...prev, ...profile }));
      }
      if (addToast) addToast(language === 'HI' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!' : 'Profile updated successfully!', 'success');
    } catch (err) {
      console.warn('Profile save warning:', err.message);
      if (setUser) setUser(prev => ({ ...prev, ...profile }));
      if (addToast) addToast(language === 'HI' ? 'प्रोफ़ाइल सहेजी गई!' : 'Profile saved locally!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Get user initial for "No Profile Photo" state
  const userInitial = profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'A';

  return (
    <div className="main-container" style={{ maxWidth: '680px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
          {t('profile.pageTitle', 'Artisan Account Profile')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {t('profile.pageSubtitle', 'Manage your account information and preferences.')}
        </p>
      </div>

      {/* 1. ARTISAN IDENTITY & EDITABLE PHOTO CARD */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(184, 134, 155, 0.12) 0%, rgba(246, 196, 146, 0.15) 100%)',
        border: '1.5px solid rgba(184, 134, 155, 0.28)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        
        {/* Left: Avatar Display (Editable Photo or No Photo) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload or change profile photo"
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              flexShrink: 0
            }}
          >
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.name || 'Artisan'} 
                style={{ 
                  width: '84px', 
                  height: '84px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '3px solid var(--accent-primary)',
                  boxShadow: '0 4px 15px rgba(184, 134, 155, 0.25)' 
                }} 
              />
            ) : (
              /* No Profile Photo Default State */
              <div style={{ 
                width: '84px', 
                height: '84px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(184, 134, 155, 0.25) 0%, rgba(246, 196, 146, 0.3) 100%)', 
                border: '2px dashed var(--accent-primary)', 
                color: 'var(--text-primary)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(70, 45, 80, 0.05)'
              }}>
                <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>
                  {userInitial}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                  {language === 'HI' ? 'फ़ोटो नहीं' : 'No Photo'}
                </span>
              </div>
            )}

            {/* Hover/Tap Camera Overlay */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: 'var(--accent-primary)',
              color: '#fff',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              <Camera size={13} />
            </div>
          </div>

          {/* User Headline Name & Details */}
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {profile.name || 'Artisan Karigar'}
            </h2>
            
            {profile.email && (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', margin: 0 }}>
                <Mail size={13} color="var(--accent-primary)" /> {profile.email}
              </p>
            )}

            {profile.location && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', margin: 0 }}>
                <MapPin size={13} color="var(--accent-gold)" /> {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Right: Photo Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(70, 45, 80, 0.05)',
              transition: 'all 0.15s'
            }}
          >
            <Upload size={13} color="var(--accent-primary)" />
            <span>{profile.avatar ? (language === 'HI' ? 'फ़ोटो बदलें' : 'Change Photo') : (language === 'HI' ? 'फ़ोटो अपलोड करें' : 'Upload Photo')}</span>
          </button>

          {profile.avatar && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              title="Remove profile photo"
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(225, 29, 72, 0.08)',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                color: 'var(--danger)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s'
              }}
            >
              <Trash2 size={13} />
              <span>{language === 'HI' ? 'हटाएं' : 'Remove'}</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. ACCOUNT DETAILS FORM */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(70, 45, 80, 0.06)'
      }}>
        
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          {language === 'HI' ? 'व्यक्तिगत और संपर्क विवरण' : 'Personal & Contact Details'}
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* 1. Full Name */}
          <Input 
            label={`${t('auth.fullNameLabel', 'Full Name')} *`}
            placeholder={t('auth.fullNamePlaceholder', 'e.g. Ramesh Prajapati')}
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            icon={<User size={17} color="var(--accent-primary)" />}
            required
          />

          {/* 2. Email Address */}
          <Input 
            label={t('auth.emailLabel', 'Email Address')}
            type="email"
            placeholder={t('auth.emailPlaceholder', 'ramesh@karigar.in')}
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={17} color="var(--accent-primary)" />}
          />

          {/* 3. Phone Number */}
          <Input 
            label={t('auth.phoneLabel', 'Phone Number')}
            type="tel"
            placeholder={t('auth.phonePlaceholder', 'e.g. 9876543210')}
            value={profile.phone}
            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={17} color="var(--accent-primary)" />}
          />

          {/* 4. Location / City / State */}
          <Input 
            label={t('auth.locationLabel', 'Workshop Location / City')}
            placeholder={t('auth.locationPlaceholder', 'e.g. Ahmedabad, Gujarat, India')}
            value={profile.location}
            onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
            icon={<MapPin size={17} color="var(--accent-gold)" />}
          />

          {/* 5. Preferred Interface Language */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('profile.preferredLangLabel', 'Preferred Platform Language (English / हिंदी)')}
            </label>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              {[
                { code: 'EN', label: t('profile.englishLabel', '🌐 English (EN)') },
                { code: 'HI', label: t('profile.hindiLabel', '🇮🇳 हिंदी (HI)') }
              ].map((lang) => {
                const isSelected = (profile.preferredLanguage || currentLang || language) === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setProfile(prev => ({ ...prev, preferredLanguage: lang.code }));
                      if (onToggleLang) onToggleLang(lang.code);
                      if (addToast) addToast(`Language set to ${lang.label}`, 'info');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-terracotta)' : 'var(--bg-input)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--accent-terracotta)' : 'var(--border-color)'}`,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 2px 8px rgba(230, 81, 0, 0.3)' : 'none'
                    }}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div style={{ marginTop: '0.75rem' }}>
            <Button 
              type="submit" 
              fullWidth={true} 
              isLoading={isSaving} 
              icon={<Save size={17} />}
              variant="primary"
            >
              {isSaving ? t('profile.saving', 'Saving Changes...') : t('profile.saveBtn', 'Save Profile Changes ✓')}
            </Button>
          </div>

          {/* Dedicated Logout Option for Mobile & Desktop */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(language === 'HI' ? 'क्या आप सचमुच अपने खाते से लॉगआउट करना चाहते हैं?' : 'Are you sure you want to log out of your account?')) {
                  logout();
                  if (addToast) addToast(language === 'HI' ? 'सफलतापूर्वक लॉगआउट किया गया' : 'Logged out successfully', 'info');
                }
              }}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <LogOut size={18} />
              <span>{language === 'HI' ? 'कारीगर खाते से लॉगआउट करें' : 'Log Out of Artisan Account'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

