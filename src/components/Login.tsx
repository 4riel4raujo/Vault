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
      className="absolute inset-0 min-h-screen w-full flex flex-col transition-colors duration-500 overflow-y-auto"
      style={{
        backgroundImage: isDark ? `url('/login_background_dark.png')` : `url('/login_background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background ultra-soft subtle forest mist overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-black/35' : 'bg-[#0c1f13]/5'}`} />

      {/* Center wrapper to perfectly align everything between the top of the page and the footer line */}
      <div className="flex-1 flex items-center justify-center w-full z-10 px-7 sm:px-10 py-8 lg:px-12 pt-6 lg:pt-10 pb-8 lg:pb-[200px]">
        {/* Main Container - Holds Left Branding Column & Right Glass Login Card */}
        <div 
          className="relative w-full max-w-[1380px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 lg:px-4"
          style={{ width: isMobile ? '100%' : '1384px', maxWidth: '100%' }}
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
          {/* Soft, light mist gradient overlay matching background landscape tones to guarantee text legibility */}
          <div className={`absolute -inset-x-6 sm:-inset-x-10 -inset-y-6 lg:-inset-x-14 lg:-inset-y-10 bg-gradient-to-br to-transparent rounded-[48px] blur-3xl -z-10 pointer-events-none transition-all duration-500 ${
            isDark ? 'from-[#052414]/85 via-[#09351e]/50' : 'from-[#f3faf6]/70 via-[#e4f2ea]/45'
          }`} />
          
          {/* Logo brand row matching screenshot exactly */}
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
                className={`font-extrabold tracking-tight font-sans antialiased leading-none transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]'}`}
                style={{ fontSize: '30px' }}
              >
                Vault
              </h1>
              <p 
                className={`text-xs tracking-[0.25em] font-black uppercase leading-none mt-1 transition-colors duration-200 ${isDark ? 'text-green-400' : 'text-[#15803d]'}`}
                style={isMobile ? {
                  paddingRight: '0px',
                  marginBottom: '0px',
                  marginTop: '0px'
                } : undefined}
              >
                Smart Finance
              </p>
            </div>
          </div>

          {/* Slogan & Subtitle */}
          <div className="hidden lg:flex py-1 lg:py-2 flex-col items-center lg:items-start w-full">
            <h2 
              className={`font-extrabold tracking-tight leading-[1.25] lg:leading-[1.28] max-w-xl mb-3 lg:mb-5 antialiased transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]'}`}
              style={{
                fontSize: isMobile ? '24px' : '32px',
                textAlign: isMobile ? 'center' : 'left',
                ...(isMobile ? {
                  paddingTop: '12px',
                  paddingLeft: '0px'
                } : {})
              }}
            >
              Gestão financeira com mais controle, <span className={`font-extrabold block sm:inline transition-colors duration-200 ${isDark ? 'text-green-400' : 'text-[#12a14b]'}`}>clareza e segurança</span>
            </h2>
            <p 
              className={`text-sm sm:text-base font-semibold leading-relaxed max-w-xl antialiased transition-colors duration-200 text-center lg:text-left ${isDark ? 'text-green-200/80' : 'text-[#2d4d3a]/85'}`}
              style={isMobile ? {
                paddingTop: '0px',
                paddingLeft: '0px'
              } : undefined}
            >
              Tecnologia inteligente para controlar receitas, despesas, planejar investimentos e acompanhar sua evolução patrimonial em tempo real.
            </p>
          </div>

          {/* Feature Lists matching screenshot closely */}
          <div 
            className="hidden lg:flex flex-col gap-y-5 lg:gap-y-9 max-w-xl w-full"
            style={{
              lineHeight: '24px',
              height: isMobile ? 'auto' : '240px',
              marginTop: '20px',
              ...(isMobile ? {
                paddingTop: '15px',
                paddingLeft: '0px'
              } : {})
            }}
          >
            {/* Feature 1 */}
            <div className="flex items-start gap-5 max-w-md mx-auto lg:mx-0 w-full text-left">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 ${
                isDark 
                  ? 'bg-green-950/40 border border-green-800/40 text-green-400' 
                  : 'bg-[#0c2f1d]/5 border border-[#0c2f1d]/12 text-[#1c5f32]'
              }`}>
                <TrendingUp size={22} />
              </div>
              <div className="flex-1">
                <h3 className={`font-extrabold text-base leading-snug transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]'}`}>Fluxo de Caixa Inteligente</h3>
                <p 
                  className={`text-sm leading-relaxed transition-colors duration-200 ${isDark ? 'text-green-200/70' : 'text-[#3d5c4b]/95'}`}
                  style={{
                    width: isMobile ? '100%' : '460px',
                    height: isMobile ? 'auto' : '30px',
                    marginTop: '5px'
                  }}
                >
                  Acompanhe entradas, saídas e saldo em tempo real com clareza.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-5 max-w-md mx-auto lg:mx-0 w-full text-left">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 ${
                isDark 
                  ? 'bg-green-950/40 border border-green-800/40 text-green-400' 
                  : 'bg-[#0c2f1d]/5 border border-[#0c2f1d]/12 text-[#1c5f32]'
              }`}>
                <Target size={22} />
              </div>
              <div className="flex-1">
                <h3 className={`font-extrabold text-base leading-snug transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]'}`}>Planejamento de Investimentos</h3>
                <p 
                  className={`text-sm leading-relaxed transition-colors duration-200 ${isDark ? 'text-green-200/70' : 'text-[#3d5c4b]/95'}`}
                  style={{
                    width: isMobile ? '100%' : '460px',
                    height: isMobile ? 'auto' : '30px',
                    marginTop: '5px'
                  }}
                >
                  Organize seus objetivos e invista com estratégia e segurança.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-5 max-w-md mx-auto lg:mx-0 w-full text-left">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 ${
                isDark 
                  ? 'bg-green-950/40 border border-green-800/40 text-green-400' 
                  : 'bg-[#0c2f1d]/5 border border-[#0c2f1d]/12 text-[#1c5f32]'
              }`}>
                <ShieldCheck size={22} />
              </div>
              <div className="flex-1">
                <h3 className={`font-extrabold text-base leading-snug transition-colors duration-200 ${isDark ? 'text-white' : 'text-[#0c2f1d]'}`}>Segurança de Alto Nível</h3>
                <p 
                  className={`text-sm leading-relaxed transition-colors duration-200 ${isDark ? 'text-green-200/70' : 'text-[#3d5c4b]/95'}`}
                  style={{
                    width: isMobile ? '100%' : '460px',
                    height: isMobile ? 'auto' : '30px',
                    marginTop: '5px'
                  }}
                >
                  Seus dados protegidos com criptografia de nível bancário.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Frosted Glassmorphism Login Card Form */}
        <div className="w-full lg:w-[42%] flex flex-col items-center lg:items-end justify-center px-0 lg:px-0">
          <motion.div 
            className={`relative w-full backdrop-blur-[40px] rounded-[36px] flex flex-col justify-center overflow-hidden z-10 transition-all duration-500 ${
              isDark 
                ? 'bg-black/20 border border-white/[0.12] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65)] hover:bg-black/25' 
                : 'bg-white/[0.08] border border-white/45 shadow-[0_32px_64px_-16px_rgba(8,30,16,0.14)] hover:bg-white/[0.12]'
            }`}
            style={{
              paddingLeft: isMobile ? '24px' : '38px',
              paddingRight: isMobile ? '24px' : '38px',
              paddingTop: '18px',
              paddingBottom: '18px',
              marginBottom: '0px',
              marginRight: '0px',
              width: isMobile ? '90%' : '460px',
              maxWidth: isMobile ? '400px' : '460px',
              height: isMobile ? 'auto' : '470px'
            }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
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
                      style={{ marginBottom: '8px', paddingBottom: '26px' }}
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
                        isDark ? 'text-green-300' : 'text-[#0c2d1c]'
                      }`}>
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-300/80' : 'text-[#0c2d1c]/80'
                        }`} />
                        <input
                          type="email"
                          placeholder="Seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-4 font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md ${
                            isDark 
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] focus:bg-white/[0.11] border border-white/10 hover:border-white/15 focus:border-[#22c55e]/60 text-white placeholder-white/30' 
                              : 'bg-[#f0f6f3]/35 hover:bg-[#f0f6f3]/50 focus:bg-[#f0f6f3]/65 border border-[#0c2d1c]/12 hover:border-[#0c2d1c]/22 focus:border-[#22c55e] text-[#0c2d1c] placeholder-[#2d4d3a]/55'
                          }`}
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
                          isDark ? 'text-green-400 hover:text-green-400/80' : 'text-[#0e4224] hover:text-[#1c5f2b]'
                        }`}
                      >
                        Voltar para o login
                      </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className={`w-full h-[44px] bg-gradient-to-b from-[#2d874c] to-[#12552b] text-white hover:brightness-[1.04] active:brightness-[0.96] shadow-lg hover:shadow-[#12552b]/30 rounded-[12px] font-extrabold tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-all duration-200 mt-2 uppercase text-center ${
                        isDark ? 'shadow-[#000000]/30' : 'shadow-[#12552b]/20'
                      }`}
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
                      style={{ marginBottom: '8px', paddingBottom: '26px' }}
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
                        isDark ? 'text-green-300' : 'text-[#0c2d1c]'
                      }`}>
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-300/80' : 'text-[#0c2d1c]/80'
                        }`} />
                        <input
                          type="email"
                          placeholder="Seu melhor email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-4 font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md ${
                            isDark 
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] focus:bg-white/[0.11] border border-white/10 hover:border-white/15 focus:border-[#22c55e]/60 text-white placeholder-white/30' 
                              : 'bg-[#f0f6f3]/35 hover:bg-[#f0f6f3]/50 focus:bg-[#f0f6f3]/65 border border-[#0c2d1c]/12 hover:border-[#0c2d1c]/22 focus:border-[#22c55e] text-[#0c2d1c] placeholder-[#2d4d3a]/55'
                          }`}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-300' : 'text-[#0c2d1c]'
                      }`}>
                        Senha
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-300/80' : 'text-[#0c2d1c]/80'
                        }`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha forte"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-[44px] font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md ${
                            isDark 
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] focus:bg-white/[0.11] border border-white/10 hover:border-white/15 focus:border-[#22c55e]/60 text-white placeholder-white/30' 
                              : 'bg-[#f0f6f3]/35 hover:bg-[#f0f6f3]/50 focus:bg-[#f0f6f3]/65 border border-[#0c2d1c]/12 hover:border-[#0c2d1c]/22 focus:border-[#22c55e] text-[#0c2d1c] placeholder-[#2d4d3a]/55'
                          }`}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 transition duration-150 z-10 ${
                            isDark ? 'text-green-300/70 hover:text-green-200' : 'text-[#0c2d1c]/70 hover:text-[#0c2d1c]'
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
                      className={`w-full h-[44px] bg-gradient-to-b from-[#2d874c] to-[#12552b] text-white hover:brightness-[1.04] active:brightness-[0.96] shadow-lg hover:shadow-[#12552b]/30 rounded-[12px] font-extrabold tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-all duration-200 mt-2 uppercase text-center ${
                        isDark ? 'shadow-[#000000]/30' : 'shadow-[#12552b]/20'
                      }`}
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
                      style={{ marginBottom: '8px', paddingBottom: '26px' }}
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
                        isDark ? 'text-green-300' : 'text-[#0c2d1c]'
                      }`}>
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-300/80' : 'text-[#0c2d1c]/80'
                        }`} />
                        <input
                          type="email"
                          placeholder="Seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-4 font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md ${
                            isDark 
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] focus:bg-white/[0.11] border border-white/10 hover:border-white/15 focus:border-[#22c55e]/60 text-white placeholder-white/30' 
                              : 'bg-[#f0f6f3]/35 hover:bg-[#f0f6f3]/50 focus:bg-[#f0f6f3]/65 border border-[#0c2d1c]/12 hover:border-[#0c2d1c]/22 focus:border-[#22c55e] text-[#0c2d1c] placeholder-[#2d4d3a]/55'
                          }`}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className={`block text-[10px] font-extrabold tracking-[0.16em] mb-1.5 uppercase select-none text-left transition-colors duration-200 ${
                        isDark ? 'text-green-300' : 'text-[#0c2d1c]'
                      }`}>
                        Senha
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={15} className={`absolute left-[15px] pointer-events-none z-10 transition-colors duration-200 ${
                          isDark ? 'text-green-300/80' : 'text-[#0c2d1c]/80'
                        }`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`auth-input w-full h-[44px] rounded-[12px] !pl-[44px] !pr-[44px] font-semibold outline-none transition duration-200 text-sm shadow-sm backdrop-blur-md ${
                            isDark 
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] focus:bg-white/[0.11] border border-white/10 hover:border-white/15 focus:border-[#22c55e]/60 text-white placeholder-white/30' 
                              : 'bg-[#f0f6f3]/35 hover:bg-[#f0f6f3]/50 focus:bg-[#f0f6f3]/65 border border-[#0c2d1c]/12 hover:border-[#0c2d1c]/22 focus:border-[#22c55e] text-[#0c2d1c] placeholder-[#2d4d3a]/55'
                          }`}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 transition duration-150 z-10 ${
                            isDark ? 'text-green-300/70 hover:text-green-200' : 'text-[#0c2d1c]/70 hover:text-[#0c2d1c]'
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
                          isDark ? 'text-green-400 hover:text-green-300' : 'text-[#0e4224] hover:text-[#1c5f2b]'
                        }`}
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className={`w-full h-[44px] bg-gradient-to-b from-[#2d874c] to-[#12552b] text-white hover:brightness-[1.04] active:brightness-[0.96] shadow-lg hover:shadow-[#12552b]/30 rounded-[12px] font-extrabold tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-all duration-200 mt-2 uppercase text-center ${
                        isDark ? 'shadow-[#000000]/30' : 'shadow-[#12552b]/20'
                      }`}
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
                        marginTop: '5px'
                      }}
                    >
                      <div className={`flex-grow border-t transition-colors duration-200 ${isDark ? 'border-white/10' : 'border-[#0c2f1d]/15'}`}></div>
                      <span className={`mx-4 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-colors duration-200 ${
                        isDark ? 'text-emerald-300/60' : 'text-[#2d4d3a]/80'
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

      {/* Elegant modern bottom footer */}
      <div 
        className="relative md:absolute bottom-0 md:bottom-5 left-0 right-0 z-10 flex flex-col gap-2.5 select-none w-[90%] max-w-[400px] md:max-w-none md:w-auto md:left-12 md:right-12 pb-6 md:pb-0 mt-auto md:mt-0 animate-fade-in mx-auto"
        style={{
          width: isMobile ? '90%' : 'auto',
          maxWidth: isMobile ? '400px' : '100%'
        }}
      >
        {/* Subtle horizontal line divider */}
        <div className="w-full border-t border-white/20 transition-colors duration-500" />
        
        {/* Row with all contents aligned on the exact same line */}
        <div className="flex flex-row items-center justify-between gap-2.5 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <ShieldCheck size={13} className="text-white/70 stroke-[1.8] transition-colors duration-500 shrink-0" />
            
            {/* Vertical line separator */}
            <div className="h-3 border-l border-white/20 transition-colors duration-500 shrink-0" />

            {/* Copyright content - compact and scaled down to prevent wrapping on small phone screens */}
            <div className="text-[8px] min-[370px]:text-[9px] sm:text-[10px] tracking-[0.06em] sm:tracking-[0.14em] font-extrabold uppercase flex items-center gap-1 sm:gap-2 transition-colors duration-500 text-white/70 whitespace-nowrap select-none">
              <span>© 2026 Vault Inc.</span>
              <span className="inline-block w-1 h-1 rounded-full bg-current opacity-60" />
              <span>
                Todos os direitos reservados
              </span>
            </div>
          </div>

          {/* iOS/macOS style Toggle on the same right line */}
          <div 
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className={`w-[44px] sm:w-[48px] h-[24px] sm:h-[26px] rounded-full p-[2px] cursor-pointer relative transition-all duration-300 flex items-center border select-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] shrink-0 ${
              isDark 
                ? 'bg-[#22c55e] border-[#22c55e]/30 justify-end' 
                : 'bg-white/15 border-white/25 hover:bg-white/25 justify-start'
            }`}
            title={isDark ? "Mudar para Modo Dia" : "Mudar para Modo Noite"}
          >
            {/* Inner icons to match iOS layout details */}
            <div className="absolute left-[5px] text-white/30 pointer-events-none flex items-center justify-center">
              <Sun size={8} className="stroke-[2.5]" />
            </div>
            <div className="absolute right-[5px] text-white/30 pointer-events-none flex items-center justify-center">
              <Moon size={8} className="stroke-[2.5]" />
            </div>

            {/* Sliding Knob with layout transition */}
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="w-[18px] sm:w-[20px] h-[18px] sm:h-[20px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.22)] flex items-center justify-center bg-white z-10"
            >
              {isDark ? (
                <Moon size={8} className="text-green-700 stroke-[2.5] fill-green-500/10" />
              ) : (
                <Sun size={8} className="text-amber-500 stroke-[2.5] fill-amber-500/10" />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
