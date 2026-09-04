import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Lock, Mail, Phone, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage({ addToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/home';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone.trim()) {
      setError(language === 'HI' ? 'कृपया अपना ईमेल या फोन नंबर दर्ज करें' : 'Please enter your email or phone number');
      return;
    }
    if (!password) {
      setError(language === 'HI' ? 'कृपया अपना पासवर्ड दर्ज करें' : 'Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(emailOrPhone, password);
      if (addToast) addToast(language === 'HI' ? `वापसी पर स्वागत है, ${res.user.name}!` : `Welcome back, ${res.user.name}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || (language === 'HI' ? 'लॉगिन विफल। अमान्य क्रेडेंशियल्स।' : 'Login failed. Invalid credentials.'));
      if (addToast) addToast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillDemoUser = () => {
    setEmailOrPhone('ramesh@karigar.in');
    setPassword('artisan123');
  };

  return (
    <div className="main-container" style={{ maxWidth: '460px', paddingTop: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
          {t('auth.loginTitle', 'Welcome Back to KarigarAI')}
        </h1>
        <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
          {t('auth.loginSubtitle', 'Log in to manage your craft catalogue and studio listings.')}
        </p>
      </div>

      <Card>
        <form onSubmit={handleLogin}>
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
            label={t('auth.emailOrPhone', 'Email or Phone Number')}
            type="text"
            placeholder={t('auth.emailOrPhonePlaceholder', 'e.g. ramesh@karigar.in or 9876543210')}
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            icon={<Mail size={18} />}
            required
          />

          <Input 
            label={t('auth.passwordLabel', 'Password')}
            type="password"
            placeholder={t('auth.passwordPlaceholder', 'Enter your secret password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />

          <Button 
            type="submit" 
            fullWidth={true} 
            isLoading={isSubmitting} 
            icon={<ArrowRight size={18} />}
            style={{ marginTop: '0.5rem' }}
          >
            {t('auth.loginBtn', 'Log In to Artisan Account')}
          </Button>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={autofillDemoUser}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-gold)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ⚡ {t('auth.demoLogin', 'Fill Demo Login Credentials')}
            </button>
          </div>
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
          {t('auth.noAccount', "Don't have an account yet?")}{' '}
          <Link to="/register" style={{ color: 'var(--accent-terracotta)', fontWeight: 700 }}>
            {t('auth.registerLink', 'Register as Artisan')}
          </Link>
        </div>
      </Card>
    </div>
  );
}

