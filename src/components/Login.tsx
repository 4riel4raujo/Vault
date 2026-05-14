import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AppIcon from './AppIcon';

import { usePreferences } from '../contexts/PreferencesContext';

export default function Login() {
  const { login, loginWithApple, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const { t } = usePreferences();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      if (!email) return;
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        await resetPassword(email);
        setSuccess(t('reset_email_sent'));
      } catch (err: any) {
        console.error('Reset Error:', err);
        setError(t('reset_email_err'));
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (!email || !password) return;
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log('Attempting auth:', isRegister ? 'register' : 'login', email);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      const errorCode = err.code || '';
      const errorMsg = err.message || '';
      
      if (errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'invalid-credential' ||
          errorCode === 'auth/invalid-login-credentials' ||
          errorMsg.includes('auth/invalid-credential')) {
        setError(t('invalid_credentials'));
      } else if (errorCode === 'auth/email-already-in-use') {
        setError(t('email_in_use'));
      } else if (errorCode === 'auth/weak-password') {
        setError(t('weak_password'));
      } else if (errorCode === 'auth/invalid-email') {
        setError(t('invalid_email_err'));
      } else if (errorCode === 'auth/network-request-failed') {
        setError(t('connection_error'));
      } else if (errorCode === 'auth/too-many-requests') {
        setError(t('too_many_requests'));
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está ativado no Firebase Console. Ative-o em Authentication > Sign-in method.');
      } else {
        setError(t('generic_error') + ' (' + errorCode + ')');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(t('popup_blocked_err') || 'Popup blocked. Please allow popups or open in a new tab.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Just stop loading, don't show error
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`Domínio não autorizado (${domain}). Para corrigir, acesse o Console do Firebase > Authentication > Settings > Authorized domains e adicione este domínio.`);
      } else {
        setError(t('google_error') + ' ' + (t('login_hint') || 'Tente abrir o app em uma nova aba se o problema persistir.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithApple();
    } catch (err: any) {
      console.error('Apple Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(t('popup_blocked_err') || 'Popup blocked. Please allow popups or open in a new tab.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Just stop loading, don't show error
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login da Apple não está ativado ou configurado corretamente no Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`Domínio não autorizado (${domain}). Adicione este domínio no Firebase Console (Authentication > Settings).`);
      } else {
        setError(t('apple_error') + ' ' + (t('login_hint') || 'Tente abrir o app em uma nova aba se o problema persistir.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <AppIcon size={64} animate={true} className="mx-auto mb-4" />
        
        <motion.h1 
          className="page-title" 
          style={{ 
            fontSize: '28px', 
            textAlign: 'center', 
            marginBottom: '2px',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 800,
            letterSpacing: '2px',
            color: 'var(--text)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Vault
        </motion.h1>
        
        <motion.p 
          className="page-sub" 
          style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 700,
            opacity: 0.6
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {t('smart_finance_management')}
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? 'register' : 'login'}
            initial={{ opacity: 0, x: isRegister ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRegister ? -10 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-field" style={{ marginBottom: '4px' }}>
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  placeholder={t('email')} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              
              {!isForgotPassword && (
                <div className="input-field" style={{ marginBottom: '8px' }}>
                  <Lock size={16} className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={t('password')} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    required
                  />
                  <button 
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="error-message"
                  >
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="success-message"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      color: 'var(--accent)', 
                      fontSize: '12px', 
                      background: 'var(--accent-low/10)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isRegister && !isForgotPassword && (
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  style={{ 
                    alignSelf: 'flex-end', 
                    fontSize: '12px', 
                    color: 'var(--muted)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '0 4px',
                    marginTop: '-4px',
                    marginBottom: '4px'
                  }}
                >
                  {t('forgot_password')}
                </button>
              )}

              {isForgotPassword && (
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(false); setSuccess(null); setError(null); }}
                  style={{ 
                    alignSelf: 'flex-end', 
                    fontSize: '12px', 
                    color: 'var(--muted)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '0 4px',
                    marginTop: '-4px',
                    marginBottom: '4px'
                  }}
                >
                  {t('back_to_login')}
                </button>
              )}

              <motion.button 
                type="submit"
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '16px',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginTop: '8px'
                }} 
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (isForgotPassword ? t('send_reset_email') : (isRegister ? t('create_account') : t('login')))}
              </motion.button>
            </form>
          </motion.div>
        </AnimatePresence>

        {!isForgotPassword && (
          <>
            <div className="divider" style={{ margin: '14px 0' }}>
              <span>{t('or')}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button 
                className="btn btn-secondary" 
                style={{ 
                  flex: 1,
                  padding: '12px', 
                  borderRadius: '12px',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: 'var(--glass-strong)',
                  border: '1px solid var(--glass-border)'
                }} 
                onClick={handleGoogleLogin}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  style={{ width: '16px', height: '16px', marginRight: '8px' }} 
                />
                Google
              </motion.button>

              <motion.button 
                className="btn btn-secondary" 
                style={{ 
                  flex: 1,
                  padding: '12px', 
                  borderRadius: '12px',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: 'var(--glass-strong)',
                  border: '1px solid var(--glass-border)'
                }} 
                onClick={handleAppleLogin}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg viewBox="0 0 384 512" style={{ width: '16px', height: '16px', marginRight: '8px', fill: 'currentColor' }}>
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                Apple
              </motion.button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button 
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccess(null);
                }}
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}
              >
                {isRegister ? t('have_account') : t('no_account')}
              </button>
            </div>
          </>
        )}
        
        <motion.div 
          style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: 'var(--muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('protected_by')}
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(150deg, var(--bg-from) 0%, var(--bg-to) 100%);
          padding: 20px;
          padding-bottom: calc(20px + var(--safe-b));
        }
        .login-card {
          background: var(--glass);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 28px;
          width: 100%;
          max-width: 380px;
          box-shadow: var(--shadow-glass);
        }
        .input-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--muted);
          opacity: 0.6;
        }
        .input-field input {
          width: 100%;
          padding: 14px 44px 14px 42px;
          background: var(--input-bg);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          font-size: 14px;
          color: var(--text) !important;
          outline: none;
          transition: all 0.2s;
        }
        .input-field input::placeholder {
          color: var(--muted) !important;
          opacity: 0.7 !important;
        }
        .input-field input:-webkit-autofill,
        .input-field input:-webkit-autofill:hover, 
        .input-field input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--text) !important;
          -webkit-box-shadow: 0 0 0px 1000px var(--bg-from) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .password-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          opacity: 0.6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: opacity 0.2s;
        }
        .password-toggle:hover {
          opacity: 1;
        }
        .input-field input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 2px rgba(0, 200, 83, 0.1);
        }
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--glass-border);
        }
        .divider span {
          padding: 0 10px;
        }
        .link-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ff5252;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255, 82, 82, 0.1);
          padding: 8px 12px;
          border-radius: 10px;
          margin-bottom: 8px;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
