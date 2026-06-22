import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, TrendingUp, Target, ShieldCheck, Sun, Moon } from 'lucide-react';
import Logo from './Logo';
import { usePreferences } from '../contexts/PreferencesContext';

export default function Login() {
  const { login, loginWithApple, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const { t, language, themeMode, setThemeMode, isDark } = usePreferences();
  const [isMobile, setIsMobile] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      if (!email) return;
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        await resetPassword(email);
        setSuccess(language === 'pt-BR' || language === 'pt' ? 'E-mail de recuperação enviado!' : t('reset_email_sent'));
      } catch (err: any) {
        console.error('Reset Error:', err);
        setError(t('reset_email_err') || 'Erro ao enviar e-mail de recuperação.');
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
      const errorStrLower = (errorCode + ' ' + errorMsg).toLowerCase();
      
      if (errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'invalid-credential' ||
          errorCode === 'auth/invalid-login-credentials' ||
          errorStrLower.includes('invalid-credential') ||
          errorStrLower.includes('wrong-password') ||
          errorStrLower.includes('credentials') ||
          errorStrLower.includes('user-not-found')) {
        setError(t('invalid_credentials') || 'Credenciais inválidas.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError(t('email_in_use') || 'Este e-mail já está em uso.');
      } else if (errorCode === 'auth/weak-password') {
        setError(t('weak_password') || 'A senha é muito fraca.');
      } else if (errorCode === 'auth/invalid-email') {
        setError(t('invalid_email_err') || 'E-mail inválido.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError(t('connection_error') || 'Erro de conexão.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError(t('too_many_requests') || 'Muitas tentativas. Tente mais tarde.');
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está ativado no Firebase Console. Ative-o em Authentication.');
      } else {
        setError((t('generic_error') || 'Erro ao autenticar') + ' (' + errorCode + ')');
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
        setError(t('popup_blocked_err') || 'Popup bloqueado. Por favor, ative os popups ou abra em nova aba.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        if (language === 'en-US') {
          setError('Google Auth was closed or blocked. If you are inside the AI Studio editor, please click the "Open in new window" button in the upper right corner to run the application in a full window and try again.');
        } else if (language === 'es-ES') {
          setError('El inicio de sesión de Google se cerró o bloqueó. Si se encontra dentro del editor de AI Studio, haga clic en el botón "Open in new window" en la esquina superior derecha para abrir el app en pantalla completa e inténtelo de nuevo.');
        } else {
          setError('O login do Google foi fechado ou bloqueado. Se você estiver dentro do editor do AI Studio, clique no botão "Open in new window" no canto superior direito para executar o aplicativo em uma janela cheia e tente novamente.');
        }
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`Domínio não autorizado (${domain}). Adicione no console do Firebase.`);
      } else {
        setError((t('google_error') || 'Erro com o Google.') + ' ' + (t('login_hint') || 'Tente em uma nova aba.'));
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
        setError(t('popup_blocked_err') || 'Popup bloqueado. Por favor, ative os popups ou abra em nova aba.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        if (language === 'en-US') {
          setError('Apple Auth was closed or blocked. If you are inside the AI Studio editor, please click the "Open in new window" button in the upper right corner to run the application in a full window and try again.');
        } else if (language === 'es-ES') {
          setError('El inicio de sesión de Apple se cerró o bloqueó. Si se encontra dentro del editor de AI Studio, haga clic en el botón "Open in new window" en la esquina superior derecha para abrir el app en pantalla completa e inténtelo de nuevo.');
        } else {
          setError('O login da Apple foi fechado ou bloqueado. Se você estiver dentro do editor do AI Studio, clique no botão "Open in new window" no canto superior direito para executar o aplicativo em uma janela cheia e tente novamente.');
        }
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login da Apple não está ativado no Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`Domínio não autorizado (${domain}). Adicione no console do Firebase.`);
      } else {
        setError((t('apple_error') || 'Erro com a Apple.') + ' ' + (t('login_hint') || 'Tente em uma nova aba.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const viewKey = isForgotPassword ? 'forgot' : (isRegister ? 'register' : 'login');

  return (
    <div 
      className="fixed inset-0 w-full h-full transition-colors duration-500 overflow-hidden"
      style={{
        backgroundColor: isDark ? '#04120C' : '#f0f6f3'
      }}
    >
      {/* Background stabilized forest image */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: isDark ? `url('/login_background_dark.png')` : `url('/login_background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: 0
        }}
      />
      {/* Background premium forest overlay, balanced transparency to keep image beautifully visible */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark 
            ? 'linear-gradient(to bottom, rgba(4, 18, 12, 0.55), rgba(7, 26, 18, 0.70))' 
            : 'linear-gradient(to bottom, rgba(240, 246, 243, 0.05), rgba(220, 235, 226, 0.15))',
          mixBlendMode: isDark ? 'multiply' : 'normal',
          zIndex: 1
        }}
      />
      
      {/* Neblina verde escura (emerald mist / indirect lighting shadows) */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        {/* Glow left center */}
        <div 
          className="absolute -left-1/4 top-1/4 w-[60%] h-[60%] rounded-full blur-[160px] transition-all duration-700" 
          style={{
            background: isDark ? '#0C6B37' : '#34D399',
            opacity: isDark ? 0.12 : 0.06
          }}
        />
        {/* Glow right bottom */}
        <div 
          className="absolute -right-1/4 -bottom-1/4 w-[70%] h-[70%] rounded-full blur-[200px] transition-all duration-700" 
          style={{
            background: isDark ? '#22C55E' : '#15803D',
            opacity: isDark ? 0.14 : 0.08
          }}
        />
        {/* Neblina overlay */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: isDark 
              ? 'radial-gradient(circle at 50% 50%, rgba(4, 18, 12, 0) 45%, rgba(4, 18, 12, 0.65) 100%)' 
              : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 60%, rgba(240, 246, 243, 0.05) 100%)',
          }}
        />
      </div>

      {/* Center wrapper to perfectly align everything between the top of the page and the footer line */}
      <div className="flex-1 flex items-center justify-center w-full z-10 px-7 sm:px-10 py-8 lg:px-12 pt-6 lg:pt-10 pb-8 lg:pb-12">
        {/* Main Container - Holds Left Branding Column & Right Glass Login Card */}
        <div 
          className="relative w-full max-w-[1380px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 lg:px-4"
          style={{ width: isMobile ? '100%' : '1384px', maxWidth: '100%', zIndex: 10 }}
        >
        
        {/* Left Column: Branding and Features List */}
        <motion.div 
          className="relative flex flex-col w-full lg:w-[54%] items-center lg:items-start justify-center lg:justify-start gap-y-4 lg:gap-y-10 py-4 lg:py-8 pr-0 lg:pr-6 select-none text-center lg:text-left px-0"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            paddingLeft: '0px',
            marginLeft: '0px',
            paddingRight: '0px',
            paddingTop: '0px',
            marginRight: '0px',
            marginBottom: isMobile ? '12px' : '65px',
            height: isMobile ? 'auto' : '550px'
          }}
        >
          {/* Soft ambient mist overlay behind branding to ensure readability without any hard borders or shapes */}
          <div 
            className="absolute lg:-inset-x-24 lg:-inset-y-24 -inset-x-6 -inset-y-6 blur-[80px] -z-10 pointer-events-none transition-all duration-500"
            style={{
              background: isDark 
                ? 'radial-gradient(circle at center, rgba(4, 18, 12, 0.85) 0%, rgba(4, 18, 12, 0) 80%)' 
                : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0) 80%)',
            }}
          />
          
          {/* Logo brand row */}
          <div 
            className="flex items-center justify-center lg:justify-start gap-3.5 w-full"
            style={isMobile ? {
              marginBottom: '0px',
              paddingBottom: '0px',
              paddingTop: '15px',
              paddingLeft: '0px'
            } : undefined}
          >
            <Logo size={48} />
            <div className="text-left font-sans">
              <h1 
                className={`font-semibold tracking-tight font-sans antialiased leading-none transition-colors duration-200 ${isDark ? 'text-[#F8FAFC]' : 'text-[#04120C]'}`}
                style={{ fontSize: '30px' }}
              >
                Vault
              </h1>
              <p 
                className={`text-[9px] tracking-[0.3em] font-black uppercase leading-none mt-1 transition-colors duration-200 ${isDark ? 'text-[#22C55E]' : 'text-[#0C6B37]'}`}
                style={isMobile ? {
                  paddingRight: '0px',
                  marginBottom: '0px',
                  marginTop: '1px'
                } : undefined}
              >
                Smart Finance
              </p>
            </div>
          </div>

          {/* Slogan & Subtitle with Pure White and Institutional Green Highlight */}
          <div 
            className="hidden lg:flex py-1 lg:py-2 flex-col items-center lg:items-start w-full"
            style={{ marginTop: '10px' }}
          >
            <h2 
              className={`font-extrabold tracking-tight leading-[1.25] lg:leading-[1.28] max-w-xl mb-3 lg:mb-5 antialiased transition-colors duration-200 ${isDark ? 'text-[#F8FAFC]' : 'text-[#04120C]'}`}
              style={{
                fontSize: '34px',
                textAlign: 'left'
              }}
            >
              Gestão financeira com mais controle, <span className="font-extrabold block sm:inline transition-colors duration-200" style={{ color: isDark ? '#22C55E' : '#0C6B37' }}>clareza e segurança</span>
            </h2>
            <p 
              className={`text-sm sm:text-base font-medium leading-relaxed max-w-xl antialiased transition-colors duration-200 text-center lg:text-left ${isDark ? 'text-[#94A3B8]' : 'text-[#0f172a]'}`}
            >
              Tecnologia inteligente para controlar receitas, despesas, planejar investimentos e acompanhar sua evolução patrimonial em tempo real.
            </p>
          </div>

          {/* Feature Lists matching Dashboard standard card layout perfectly */}
          <div 
            className="hidden lg:flex flex-col gap-y-4 lg:gap-y-6 max-w-xl w-full"
            style={{
              lineHeight: '24px',
              width: isMobile ? '100%' : '576px',
              height: isMobile ? 'auto' : '200px',
              paddingLeft: '0px',
              paddingTop: '0px',
              fontSize: '16px',
              marginTop: '30px'
            }}
          >
            {/* Feature 1 */}
            <div className="flex items-start gap-4 max-w-md mx-auto lg:mx-0 w-full text-left">
              <div 
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(12, 107, 55, 0.15)',
                  border: isDark ? '1px solid rgba(34, 197, 94, 0.12)' : '1px solid rgba(12, 107, 55, 0.22)',
                  color: isDark ? '#22C55E' : '#042f1a'
                }}
              >
                <TrendingUp size={20} className="stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h3 
                  className={`font-bold text-sm leading-snug transition-colors duration-200 ${isDark ? 'text-[#F8FAFC]' : 'text-[#04120C]'}`}
                  style={{ fontSize: '14px' }}
                >
                  Fluxo de Caixa Inteligente
                </h3>
                <p 
                  className={`text-xs leading-relaxed transition-colors duration-200 ${isDark ? 'text-[#94A3B8]' : 'text-[#0f172a]'}`}
                  style={{
                    width: '460px',
                    marginTop: '3px',
                    paddingTop: '0px',
                    marginBottom: '15px'
                  }}
                >
                  Acompanhe entradas, saídas e saldo em tempo real com clareza absoluta.
                </p>
              </div>
            </div>
 
            {/* Feature 2 */}
            <div className="flex items-start gap-4 max-w-md mx-auto lg:mx-0 w-full text-left">
              <div 
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(12, 107, 55, 0.15)',
                  border: isDark ? '1px solid rgba(34, 197, 94, 0.12)' : '1px solid rgba(12, 107, 55, 0.22)',
                  color: isDark ? '#22C55E' : '#042f1a'
                }}
              >
                <Target size={20} className="stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm leading-snug transition-colors duration-200 ${isDark ? 'text-[#F8FAFC]' : 'text-[#04120C]'}`}>Planejamento de Investimentos</h3>
                <p 
                  className={`text-xs leading-relaxed transition-colors duration-200 ${isDark ? 'text-[#94A3B8]' : 'text-[#0f172a]'}`}
                  style={{
                    width: '460px',
                    marginTop: '3px',
                    marginBottom: '15px'
                  }}
                >
                  Organize seus objetivos e invista com estratégia bem delineada e segurança.
                </p>
              </div>
            </div>
 
            {/* Feature 3 */}
            <div className="flex items-start gap-4 max-w-md mx-auto lg:mx-0 w-full text-left">
              <div 
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(12, 107, 55, 0.15)',
                  border: isDark ? '1px solid rgba(34, 197, 94, 0.12)' : '1px solid rgba(12, 107, 55, 0.22)',
                  color: isDark ? '#22C55E' : '#042f1a'
                }}
              >
                <ShieldCheck size={20} className="stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm leading-snug transition-colors duration-200 ${isDark ? 'text-[#F8FAFC]' : 'text-[#04120C]'}`}>Segurança de Alto Nível</h3>
                <p 
                  className={`text-xs leading-relaxed transition-colors duration-200 ${isDark ? 'text-[#94A3B8]' : 'text-[#0f172a]'}`}
                  style={{
                    width: '460px',
                    marginTop: '3px'
                  }}
                >
                  Seus dados protegidos de ponta a ponta com criptografia de padrão bancário.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Liquid Glass Premium Login Card */}
        <div className="w-full lg:w-[42%] flex flex-col items-center lg:items-end justify-center px-0 lg:px-0">
          <motion.div 
            className="relative w-full rounded-[30px] flex flex-col justify-center overflow-hidden z-10 transition-all duration-500"
            style={{
              paddingLeft: isMobile ? '24px' : '38px',
              paddingRight: isMobile ? '24px' : '38px',
              paddingTop: '28px',
              paddingBottom: '28px',
              marginBottom: '0px',
              marginRight: '0px',
              width: isMobile ? '92%' : '440px',
              maxWidth: isMobile ? '400px' : '440px',
              height: isMobile ? 'auto' : '500px',
              background: isDark 
                ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(6, 22, 15, 0.82) 40%, rgba(12, 107, 55, 0.18) 100%)' 
                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 246, 243, 0.72) 45%, rgba(12, 107, 55, 0.09) 100%)',
              backdropFilter: 'blur(35px) saturate(120%)',
              WebkitBackdropFilter: 'blur(35px) saturate(120%)',
              border: isDark 
                ? '1px solid rgba(255, 255, 255, 0.14)' 
                : '1px solid rgba(255, 255, 255, 0.65)',
              boxShadow: isDark 
                ? 'inset 0 1.5px 2px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.4), 0 25px 50px -12px rgba(0, 0, 0, 0.75)' 
                : 'inset 0 1.5px 3px rgba(255,255,255,0.9), inset 0 -1px 1.5px rgba(12, 107, 55, 0.05), 0 25px 50px -12px rgba(12, 47, 29, 0.12)'
            }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Liquid glass specular and refraction simulation */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isDark 
                  ? 'linear-gradient(125deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 35%, rgba(34,197,94,0.06) 65%, rgba(255,255,255,0.02) 100%)'
                  : 'linear-gradient(125deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 30%, rgba(12,107,55,0.04) 60%, rgba(255,255,255,0.15) 100%)',
                zIndex: -1
              }}
            />
            
            <AnimatePresence mode="wait" initial={false}>
              {isForgotPassword ? (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 18, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -18, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col"
                >
                  {/* Header / Intro */}
                  <div className="mb-7 select-none text-center">
                    <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight leading-none antialiased transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]/95'}`}>
                      Recuperar senha
                    </h3>
                    <p 
                      className={`text-xs mt-1.5 antialiased font-semibold tracking-normal transition-colors duration-200 ${isDark ? 'text-green-200/80' : 'text-[#2d4d3a]'}`}
                      style={{ marginBottom: '8px', paddingBottom: '26px', color: '#779d8a' }}
                    >
                      Digite seu e-mail para continuar no Vault
                    </p>
                  </div>

                  {/* Alert Boxes inside motion block */}
                  {error && (
                    <div className={`p-3 rounded-[14px] text-xs font-bold flex items-center gap-2 mb-3.5 border transition-all duration-200 ${
                      isDark 
                        ? 'bg-red-500/20 border-red-500/20 text-red-200' 
                        : 'bg-red-500/10 border-red-500/20 text-red-900'
                    }`}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className={`p-3 rounded-[14px] text-xs font-bold flex items-center gap-2 mb-3.5 border transition-all duration-200 ${
                      isDark 
                        ? 'bg-green-600/20 border-green-600/20 text-green-200' 
                        : 'bg-green-600/10 border-green-600/20 text-green-900'
                    }`}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form 
                    onSubmit={handleSubmit} 
                    className="flex flex-col gap-3.5 w-full"
                    style={{
                      marginRight: '0px',
                      marginBottom: '0px',
                      paddingBottom: '0px',
                      paddingTop: '10px'
                    }}
                  >
                    {/* Email field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-400' : 'text-[#0c2d1c]'
                      }`}>
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-400/80' : 'text-[#0C6B37]/80'
                        }`} />
                        <input
                          type="email"
                          placeholder="Seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-4 font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md"
                          style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(12, 107, 55, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                            borderColor: 'rgba(34, 197, 94, 0.15)',
                            color: isDark ? '#F8FAFC' : '#04120C',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.40)';
                            e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.15)';
                            e.target.style.boxShadow = 'none';
                          }}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Spacing for layout alignment */}
                    <div className="h-2" />

                    {/* Back to login option */}
                    <div className="text-right select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError(null);
                          setSuccess(null);
                        }}
                        className={`text-xs font-bold tracking-tight hover:underline transition duration-150 ${
                          isDark ? 'text-green-400 hover:text-green-300' : 'text-[#0C6B37] hover:text-[#1c5f2b]'
                        }`}
                      >
                        Voltar para o login
                      </button>
                    </div>

                    {/* Submit Button with dashboard premium gradient and hover */}
                    <motion.button
                      type="submit"
                      className="w-full h-[44px] text-white hover:brightness-110 active:scale-[0.98] rounded-[12px] font-extrabold tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-all duration-300 mt-2 uppercase text-center cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #15803D, #22C55E)',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
                      }}
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-white" size={16} />
                      ) : (
                        <div className="flex items-center justify-center mx-auto">
                          <span>Enviar link</span>
                        </div>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : isRegister ? (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 18, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -18, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col"
                >
                  {/* Header / Intro */}
                  <div className="mb-7 select-none text-center">
                    <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight leading-none antialiased transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]/95'}`}>
                      Crie sua conta
                    </h3>
                    <p 
                      className={`text-xs mt-1.5 antialiased font-semibold tracking-normal transition-colors duration-200 ${isDark ? 'text-green-200/80' : 'text-[#2d4d3a]'}`}
                      style={{ marginBottom: '8px', paddingBottom: '26px', color: '#779d8a' }}
                    >
                      Entre com seus dados para se cadastrar
                    </p>
                  </div>

                  {/* Alert Boxes */}
                  {error && (
                    <div className={`p-3 rounded-[14px] text-xs font-bold flex items-center gap-2 mb-3.5 border transition-all duration-150 ${
                      isDark 
                        ? 'bg-red-500/20 border-red-500/20 text-red-200' 
                        : 'bg-red-500/10 border-red-500/20 text-red-900'
                    }`}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className={`p-3 rounded-[14px] text-xs font-bold flex items-center gap-2 mb-3.5 border transition-all duration-200 ${
                      isDark 
                        ? 'bg-green-600/20 border-green-600/20 text-green-200' 
                        : 'bg-green-600/10 border-green-600/20 text-green-900'
                    }`}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form 
                    onSubmit={handleSubmit} 
                    className="flex flex-col gap-3.5 w-full"
                    style={{
                      marginRight: '0px',
                      marginBottom: '0px',
                      paddingBottom: '0px',
                      paddingTop: '10px'
                    }}
                  >
                    {/* Email field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-400' : 'text-[#0c2d1c]'
                      }`}>
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-400/80' : 'text-[#0C6B37]/80'
                        }`} />
                        <input
                          type="email"
                          placeholder="Seu melhor email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-4 font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md"
                          style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(12, 107, 55, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                            borderColor: 'rgba(34, 197, 94, 0.15)',
                            color: isDark ? '#F8FAFC' : '#04120C',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.40)';
                            e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.15)';
                            e.target.style.boxShadow = 'none';
                          }}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-400' : 'text-[#0c2d1c]'
                      }`}>
                        Senha
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-400/80' : 'text-[#0C6B37]/80'
                        }`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha forte"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-[44px] font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md"
                          style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(12, 107, 55, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                            borderColor: 'rgba(34, 197, 94, 0.15)',
                            color: isDark ? '#F8FAFC' : '#04120C',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.40)';
                            e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.15)';
                            e.target.style.boxShadow = 'none';
                          }}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 transition duration-150 z-10 ${
                            isDark ? 'text-green-400/70 hover:text-green-300' : 'text-[#0C6B37]/70 hover:text-[#0C6B37]'
                          }`}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Spacing for layout alignment */}
                    <div className="h-2" />

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="w-full h-[44px] text-white hover:brightness-110 active:scale-[0.98] rounded-[12px] font-extrabold tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-all duration-300 mt-2 uppercase text-center cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #15803D, #22C55E)',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
                      }}
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-white" size={16} />
                      ) : (
                        <div className="flex items-center justify-center mx-auto">
                          <span>Criar Conta</span>
                        </div>
                      )}
                    </motion.button>
                  </form>

                  {/* Separador e Social Providers */}
                  <div className="w-full">
                    <div 
                      className="flex items-center my-6 select-none"
                      style={{
                        marginRight: '0px',
                        marginBottom: '5px',
                        marginTop: '5px'
                      }}
                    >
                      <div className={`flex-grow border-t transition-colors duration-200 ${isDark ? 'border-white/10' : 'border-[#0c2f1d]/15'}`}></div>
                      <span className={`mx-4 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-colors duration-200 ${
                        isDark ? 'text-green-300/60' : 'text-[#2d4d3a]/80'
                      }`}>ou</span>
                      <div className={`flex-grow border-t transition-colors duration-200 ${isDark ? 'border-white/10' : 'border-[#0c2f1d]/15'}`}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        className={`flex items-center justify-center gap-2 h-[40px] border rounded-[12px] text-xs font-extrabold transition-all duration-200 shadow-sm cursor-pointer ${
                          isDark 
                            ? 'border-white/10 bg-transparent hover:bg-white/5 text-white' 
                            : 'border-[#0c2f1d]/15 bg-transparent hover:bg-[#0c2f1d]/5 text-[#0c2f1d]'
                        }`}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <svg viewBox="0 0 24 24" className={`w-[13px] h-[13px] transition-colors duration-250 ${isDark ? 'fill-white' : 'fill-[#0c2f1d]'}`}>
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className={`flex items-center justify-center gap-2 h-[40px] border rounded-[12px] text-[12.5px] font-extrabold transition-all duration-200 shadow-sm cursor-pointer ${
                          isDark 
                            ? 'border-white/10 bg-transparent hover:bg-white/5 text-white' 
                            : 'border-[#0c2f1d]/15 bg-transparent hover:bg-[#0c2f1d]/5 text-[#0c2f1d]'
                        }`}
                        onClick={handleAppleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <svg viewBox="0 0 384 512" className={`w-[13px] h-[13px] transition-colors duration-250 ${isDark ? 'fill-white' : 'fill-[#0c2f1d]'}`}>
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                        </svg>
                        <span>Apple</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Alternate Screen Toggle */}
                  <div 
                    className="mt-6 text-center select-none"
                    style={{
                      paddingBottom: '0px',
                      paddingTop: '0px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setIsForgotPassword(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`text-xs font-bold tracking-tight transition duration-150 ${
                        isDark ? 'text-green-400 hover:text-green-300' : 'text-[#2d4d3a]/90 hover:text-[#0c2f1d]/100'
                      }`}
                      style={{
                        marginBottom: '0px',
                        paddingBottom: '0px',
                        paddingTop: '10px',
                        marginTop: '0px'
                      }}
                    >
                      Já tem uma conta? <span className={`font-extrabold hover:underline ${
                        isDark ? 'text-[#22c55e]' : 'text-[#135d25]'
                      }`}>Conecte-se</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 18, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -18, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col"
                >
                  {/* Header / Intro */}
                  <div className="mb-7 select-none text-center">
                    <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight leading-none antialiased transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]/95'}`}>
                      Acesse sua conta
                    </h3>
                    <p 
                      className={`text-xs mt-1.5 antialiased font-semibold tracking-normal transition-colors duration-200 ${isDark ? 'text-green-200/80' : 'text-[#2d4d3a]'}`}
                      style={{ marginBottom: '8px', paddingBottom: '26px', color: '#779d8a' }}
                    >
                      Entre com seus dados para continuar no Vault
                    </p>
                  </div>

                  {/* Alert Boxes */}
                  {error && (
                    <div className={`p-3 rounded-[14px] text-xs font-bold flex items-center gap-2 mb-3.5 border transition-all duration-200 ${
                      isDark 
                        ? 'bg-red-500/20 border-red-500/20 text-red-200' 
                        : 'bg-red-500/10 border-red-500/20 text-red-900'
                    }`}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className={`p-3 rounded-[14px] text-xs font-bold flex items-center gap-2 mb-3.5 border transition-all duration-200 ${
                      isDark 
                        ? 'bg-green-600/20 border-green-600/20 text-green-200' 
                        : 'bg-green-600/10 border-green-600/20 text-green-900'
                    }`}>
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form 
                    onSubmit={handleSubmit} 
                    className="flex flex-col gap-3.5 w-full"
                    style={{
                      marginRight: '0px',
                      marginBottom: '0px',
                      paddingBottom: '0px',
                      paddingTop: '10px'
                    }}
                  >
                    {/* Email field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-400' : 'text-[#0c2d1c]'
                      }`}>
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-400/80' : 'text-[#0C6B37]/80'
                        }`} />
                        <input
                          type="email"
                          placeholder="Seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-4 font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md"
                          style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(12, 107, 55, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                            borderColor: 'rgba(34, 197, 94, 0.15)',
                            color: isDark ? '#F8FAFC' : '#04120C',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.40)';
                            e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.15)';
                            e.target.style.boxShadow = 'none';
                          }}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-400' : 'text-[#0c2d1c]'
                      }`}>
                        Senha
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-400/80' : 'text-[#0C6B37]/80'
                        }`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-[44px] font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md"
                          style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(12, 107, 55, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                            borderColor: 'rgba(34, 197, 94, 0.15)',
                            color: isDark ? '#F8FAFC' : '#04120C',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.40)';
                            e.target.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(34, 197, 94, 0.15)';
                            e.target.style.boxShadow = 'none';
                          }}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 transition duration-150 z-10 ${
                            isDark ? 'text-green-300/70 hover:text-green-350' : 'text-[#0C6B37]/70 hover:text-[#0C6B37]'
                          }`}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password Container */}
                    <div className="text-right select-none h-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                          setSuccess(null);
                        }}
                        className={`text-xs font-bold tracking-tight hover:underline transition duration-150 ${
                          isDark ? 'text-green-400 hover:text-green-350' : 'text-[#0C6B37] hover:text-[#1c5f2b]'
                        }`}
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="w-full h-[44px] text-white hover:brightness-110 active:scale-[0.98] rounded-[12px] font-extrabold tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-all duration-300 mt-2 uppercase text-center cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #15803D, #22C55E)',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
                      }}
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-white" size={16} />
                      ) : (
                        <div className="flex items-center justify-center mx-auto">
                          <span>Entrar</span>
                        </div>
                      )}
                    </motion.button>
                  </form>

                  {/* Separador e Social Providers */}
                  <div className="w-full">
                     <div 
                      className="flex items-center my-6 select-none"
                      style={{
                        marginRight: '0px',
                        marginBottom: '5px',
                        marginTop: '5px',
                        height: '15px',
                        width: isMobile ? '100%' : '362.4px'
                      }}
                    >
                      <div className={`flex-grow border-t transition-colors duration-200 ${isDark ? 'border-white/10' : 'border-[#0c2f1d]/15'}`}></div>
                      <span 
                        className={`mx-4 font-extrabold uppercase tracking-[0.2em] transition-colors duration-200 ${
                          isDark ? 'text-emerald-300/60' : 'text-[#2d4d3a]/80'
                        }`}
                        style={{
                          fontSize: '10px',
                          color: '#779d8a'
                        }}
                      >ou</span>
                      <div className={`flex-grow border-t transition-colors duration-200 ${isDark ? 'border-white/10' : 'border-[#0c2f1d]/15'}`}></div>
                    </div>
 
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        className={`flex items-center justify-center gap-2 h-[40px] border rounded-[12px] text-xs font-extrabold transition-all duration-200 shadow-sm cursor-pointer ${
                          isDark 
                            ? 'border-white/10 bg-transparent hover:bg-white/5 text-white' 
                            : 'border-[#0c2f1d]/15 bg-transparent hover:bg-[#0c2f1d]/5 text-[#0c2f1d]'
                        }`}
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <svg viewBox="0 0 24 24" className={`w-[13px] h-[13px] transition-colors duration-250 ${isDark ? 'fill-white' : 'fill-[#0c2f1d]'}`}>
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google</span>
                      </motion.button>
 
                      <motion.button
                        type="button"
                        className={`flex items-center justify-center gap-2 h-[40px] border rounded-[12px] text-xs font-extrabold transition-all duration-200 shadow-sm cursor-pointer ${
                          isDark 
                            ? 'border-white/10 bg-transparent hover:bg-white/5 text-white' 
                            : 'border-[#0c2f1d]/15 bg-transparent hover:bg-[#0c2f1d]/5 text-[#0c2f1d]'
                        }`}
                        onClick={handleAppleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <svg viewBox="0 0 384 512" className={`w-[13px] h-[13px] transition-colors duration-250 ${isDark ? 'fill-white' : 'fill-[#0c2f1d]'}`}>
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                        </svg>
                        <span>Apple</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Alternate Screen Toggle */}
                  <div 
                    className="mt-6 text-center select-none"
                    style={{
                      paddingBottom: '0px',
                      paddingTop: '0px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setIsForgotPassword(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`text-xs font-bold tracking-tight transition duration-150 ${
                        isDark ? 'text-green-400 hover:text-green-300' : 'text-[#2d4d3a]/90 hover:text-[#0c2f1d]/100'
                      }`}
                      style={{
                        marginBottom: '0px',
                        paddingBottom: '0px',
                        paddingTop: '10px',
                        marginTop: '0px'
                      }}
                    >
                      Não tem uma conta? <span className={`font-extrabold hover:underline ${
                        isDark ? 'text-[#22c55e]' : 'text-[#135d25]'
                      }`}>Crie agora</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      </div>
    </div>
  );
}
