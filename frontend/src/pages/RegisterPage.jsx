import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { User, Mail, Phone, Lock, MapPin, Sparkles } from 'lucide-react';

export default function RegisterPage({ addToast }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    preferredLanguage: language || 'EN',
    location: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(language === 'HI' ? 'कृपया अपना पूरा नाम दर्ज करें' : 'Please enter your full name');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setError(language === 'HI' ? 'कृपया ईमेल या फोन नंबर प्रदान करें' : 'Please provide either an email or phone number');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError(language === 'HI' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(formData);
      if (addToast) addToast(language === 'HI' ? `पंजीकरण सफल! स्वागत है, ${res.user.name}` : `Registration successful! Welcome, ${res.user.name}`, 'success');
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || (language === 'HI' ? 'पंजीकरण विफल' : 'Registration failed'));
      if (addToast) addToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-container" style={{ maxWidth: '520px', paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
          {t('auth.registerTitle', 'Create Artisan Account')}
        </h1>
        <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
          {t('auth.registerSubtitle', 'Join KarigarAI to transform handmade crafts into market-ready listings.')}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <div 
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)',
                fontSize: '0.88rem',
                marginBottom: '1.25rem',
                fontWeight: 600
              }}
            >
              {error}
            </div>
          )}

          <Input 
            label={`${t('auth.fullNameLabel', 'Full Name')} *`}
            placeholder={t('auth.fullNamePlaceholder', 'e.g. Rameshbhai Prajapati')}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            icon={<User size={18} />}
            required
          />

          <Input 
            label={t('auth.emailLabel', 'Email Address')}
            type="email"
            placeholder={t('auth.emailPlaceholder', 'e.g. ramesh@karigar.in')}
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={18} />}
            helperText={language === 'HI' ? 'नीचे ईमेल या फ़ोन नंबर प्रदान करें' : 'Provide email or phone number below'}
          />

          <Input 
            label={t('auth.phoneLabel', 'Phone Number')}
            type="tel"
            placeholder={t('auth.phonePlaceholder', 'e.g. 9876543210')}
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={18} />}
          />

          <Input 
            label={t('auth.passwordLabel', 'Password')}
            type="password"
            placeholder={language === 'HI' ? 'कम से कम 6 अक्षर' : 'At least 6 characters'}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            icon={<Lock size={18} />}
            required
          />

          <Input 
            label={t('profile.preferredLangLabel', 'Preferred Language (English / हिंदी)')}
            type="select"
            value={formData.preferredLanguage}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
            options={[
              { value: 'EN', label: t('profile.englishLabel', 'English (EN)') },
              { value: 'HI', label: t('profile.hindiLabel', 'Hindi (हिंदी)') },
            ]}
          />

          <Input 
            label={t('auth.locationLabel', 'Workshop Location / Village / City')}
            placeholder={t('auth.locationPlaceholder', 'e.g. Kutch, Gujarat')}
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            icon={<MapPin size={18} />}
          />

          <Button 
            type="submit" 
            fullWidth={true} 
            isLoading={isSubmitting} 
            icon={<Sparkles size={18} />}
            style={{ marginTop: '0.75rem' }}
          >
            {t('auth.registerBtn', 'Register Artisan Account')}
          </Button>
        </form>

        <div 
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}
        >
          {t('auth.haveAccount', 'Already have an account?')}{' '}
          <Link to="/login" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>
            {t('auth.loginLink', 'Log In Here')}
          </Link>
        </div>
      </Card>
    </div>
  );
}

