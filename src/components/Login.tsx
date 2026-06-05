import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, TrendingUp, Target, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { usePreferences } from '../contexts/PreferencesContext';

export default function Login() {
  const { login, loginWithApple, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const { t, language } = usePreferences();
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
      
      if (errorCode === 'auth/user-not-found' || 
          errorCode === 'auth/wrong-password' || 
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'invalid-credential' ||
          errorCode === 'auth/invalid-login-credentials' ||
          errorMsg.includes('auth/invalid-credential')) {
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
      className="absolute inset-0 min-h-screen w-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 xl:px-12 overflow-y-auto"
      style={{
        backgroundImage: `url('/login_background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background ultra-soft subtle forest mist overlay */}
      <div className="absolute inset-0 bg-[#0c1f13]/5 pointer-events-none" />

      {/* Main Container - Holds Left Branding Column & Right Glass Login Card */}
      <div className="relative w-full max-w-[1380px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 z-10 my-auto">
        
        {/* Left Column: Branding and Features List */}
        <motion.div 
          className="relative flex flex-col w-full lg:w-[54%] justify-start gap-y-10 py-4 lg:py-8 pr-0 lg:pr-6 select-none text-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Soft, light mist gradient overlay matching background landscape tones to guarantee text legibility */}
          <div className="absolute -inset-x-6 sm:-inset-x-10 -inset-y-6 lg:-inset-x-14 lg:-inset-y-10 bg-gradient-to-br from-[#f3faf6]/70 via-[#e4f2ea]/45 to-transparent rounded-[48px] blur-3xl -z-10 pointer-events-none" />
          
          {/* Logo brand row matching screenshot exactly */}
          <div className="flex items-center gap-3.5">
            <Logo size={52} />
            <div>
              <h1 className="text-[34px] font-extrabold tracking-tight text-[#0c2f1d] font-sans antialiased leading-none">Vault</h1>
              <p className="text-[10px] tracking-[0.25em] font-black text-[#15803d] uppercase leading-none mt-1">Smart Finance</p>
            </div>
          </div>

          {/* Slogan & Subtitle */}
          <div className="py-2">
            <h2 className="text-[32px] lg:text-[38px] font-extrabold text-[#0c2f1d] tracking-tight leading-[1.28] max-w-xl mb-5 antialiased">
              Gestão financeira com mais controle, <span className="text-[#12a14b] font-extrabold block sm:inline">clareza e segurança</span>
            </h2>
            <p className="text-[#2d4d3a]/85 text-[15.5px] font-semibold leading-relaxed max-w-xl antialiased">
              Tecnologia inteligente para controlar receitas, despesas, planejar investimentos e acompanhar sua evolução patrimonial em tempo real.
            </p>
          </div>

          {/* Feature Lists matching screenshot closely */}
          <div className="flex flex-col gap-y-9 max-w-xl mt-10">
            {/* Feature 1 */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#0c2f1d]/5 border border-[#0c2f1d]/12 flex items-center justify-center text-[#1c5f32] shadow-sm">
                <TrendingUp size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-[16px] text-[#0c2f1d] leading-snug">Fluxo de Caixa Inteligente</h3>
                <p className="text-sm text-[#3d5c4b]/95 mt-1 leading-relaxed">Acompanhe entradas, saídas e saldo em tempo real com clareza.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#0c2f1d]/5 border border-[#0c2f1d]/12 flex items-center justify-center text-[#1c5f32] shadow-sm">
                <Target size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-[16px] text-[#0c2f1d] leading-snug">Planejamento de Investimentos</h3>
                <p className="text-sm text-[#3d5c4b]/95 mt-1 leading-relaxed">Organize seus objetivos e invista com estratégia e segurança.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#0c2f1d]/5 border border-[#0c2f1d]/12 flex items-center justify-center text-[#1c5f32] shadow-sm">
                <ShieldCheck size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-[16px] text-[#0c2f1d] leading-snug">Segurança de Alto Nível</h3>
                <p className="text-sm text-[#3d5c4b]/95 mt-1 leading-relaxed">Seus dados protegidos com criptografia de nível bancário.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Frosted Glassmorphism Login Card Form */}
        <div className="w-full lg:w-[42%] flex flex-col items-center lg:items-end justify-center">
          <motion.div 
            className="relative w-full max-w-[460px] bg-white/[0.14] backdrop-blur-[28px] border border-white/30 shadow-[0_32px_64px_-16px_rgba(8,30,16,0.18)] rounded-[44px] flex flex-col justify-center overflow-hidden z-10"
            style={{
              paddingLeft: '38px',
              paddingRight: '38px',
              paddingTop: '28px',
              paddingBottom: '52px'
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
                  <div className="mb-11 select-none text-center">
                    <h3 className="text-[32px] font-extrabold text-[#0c2f1d]/95 tracking-tight leading-none antialiased">
                      Recuperar senha
                    </h3>
                    <p className="text-[13px] text-[#2d4d3a] mt-2 antialiased font-semibold tracking-normal">
                      Digite seu e-mail para continuar no Vault
                    </p>
                  </div>

                  {/* Alert Boxes inside motion block */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-900 p-3.5 rounded-[18px] text-xs font-bold flex items-center gap-2 mb-4">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-900 p-3.5 rounded-[18px] text-xs font-bold flex items-center gap-2 mb-4">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    {/* Email field */}
                    <div>
                      <label className="block text-[10px] font-extrabold tracking-[0.16em] !text-[#0c2d1c] mb-2 uppercase select-none text-left">
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={18} className="absolute left-[18px] !text-[#0c2d1c]/80 pointer-events-none z-10" />
                        <input
                          type="email"
                          placeholder="Seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-[54px] bg-white/20 hover:bg-white/25 focus:bg-white/30 border border-white/35 focus:border-[#22c55e]/45 rounded-[18px] !pl-[52px] !pr-5 !text-[#0c2d1c] font-semibold placeholder-[#2d4d3a]/65 outline-none transition duration-200 text-[14.5px] shadow-sm backdrop-blur-md"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Spacing for layout alignment */}
                    <div className="h-5" />

                    {/* Back to login option */}
                    <div className="text-right select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-[#0e4224] hover:text-[#1c5f2b] text-[13.5px] font-bold tracking-tight hover:underline transition duration-150"
                      >
                        Voltar para o login
                      </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="w-full h-[54px] bg-gradient-to-b from-[#2d874c] to-[#12552b] text-white hover:brightness-[1.04] active:brightness-[0.96] shadow-lg shadow-[#12552b]/20 hover:shadow-[#12552b]/30 rounded-[18px] font-extrabold tracking-[0.12em] text-[15px] flex items-center justify-center gap-2 transition-all duration-200 mt-2.5 uppercase text-center"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-white" size={20} />
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
                  <div className="mb-11 select-none text-center">
                    <h3 className="text-[32px] font-extrabold text-[#0c2f1d]/95 tracking-tight leading-none antialiased">
                      Crie sua conta
                    </h3>
                    <p className="text-[13px] text-[#2d4d3a] mt-2 antialiased font-semibold tracking-normal">
                      Entre com seus dados para se cadastrar
                    </p>
                  </div>

                  {/* Alert Boxes */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-900 p-3.5 rounded-[18px] text-xs font-bold flex items-center gap-2 mb-4">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-900 p-3.5 rounded-[18px] text-xs font-bold flex items-center gap-2 mb-4">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    {/* Email field */}
                    <div>
                      <label className="block text-[10px] font-extrabold tracking-[0.16em] !text-[#0c2d1c] mb-2 uppercase select-none text-left">
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={18} className="absolute left-[18px] !text-[#0c2d1c]/80 pointer-events-none z-10" />
                        <input
                          type="email"
                          placeholder="Seu melhor email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-[54px] bg-white/20 hover:bg-white/25 focus:bg-white/30 border border-white/35 focus:border-[#22c55e]/45 rounded-[18px] !pl-[52px] !pr-5 !text-[#0c2d1c] font-semibold placeholder-[#2d4d3a]/65 outline-none transition duration-200 text-[14.5px] shadow-sm backdrop-blur-md"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="block text-[10px] font-extrabold tracking-[0.16em] !text-[#0c2d1c] mb-2 uppercase select-none text-left">
                        Senha
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={18} className="absolute left-[18px] !text-[#0c2d1c]/80 pointer-events-none z-10" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie uma senha forte"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-[54px] bg-white/20 hover:bg-white/25 focus:bg-white/30 border border-white/35 focus:border-[#22c55e]/45 rounded-[18px] !pl-[52px] !pr-[52px] !text-[#0c2d1c] font-semibold placeholder-[#2d4d3a]/65 outline-none transition duration-200 text-[14.5px] shadow-sm backdrop-blur-md"
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 !text-[#0c2d1c]/70 hover:!text-[#0c2d1c] transition duration-150"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Spacing for layout alignment */}
                    <div className="h-5" />

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="w-full h-[54px] bg-gradient-to-b from-[#2d874c] to-[#12552b] text-white hover:brightness-[1.04] active:brightness-[0.96] shadow-lg shadow-[#12552b]/20 hover:shadow-[#12552b]/30 rounded-[18px] font-extrabold tracking-[0.12em] text-[15px] flex items-center justify-center gap-2 transition-all duration-200 mt-2.5 uppercase text-center"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-white" size={20} />
                      ) : (
                        <div className="flex items-center justify-center mx-auto">
                          <span>Criar Conta</span>
                        </div>
                      )}
                    </motion.button>
                  </form>

                  {/* Separador e Social Providers */}
                  <div className="w-full">
                    <div className="flex items-center my-9 select-none">
                      <div className="flex-grow border-t border-white/20"></div>
                      <span className="mx-4 text-[10px] font-extrabold text-[#2d4d3a]/80 uppercase tracking-[0.2em]">ou</span>
                      <div className="flex-grow border-t border-white/20"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        className="flex items-center justify-center gap-2.5 h-12 border border-white/20 bg-transparent rounded-[16px] text-sm font-extrabold text-white transition-all duration-200 shadow-sm cursor-pointer"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google"
                          className="w-[18px] h-[18px]"
                          referrerPolicy="no-referrer"
                        />
                        <span>Google</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="flex items-center justify-center gap-2.5 h-12 border border-white/20 bg-transparent rounded-[16px] text-sm font-extrabold text-white transition-all duration-200 shadow-sm cursor-pointer"
                        onClick={handleAppleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <svg viewBox="0 0 384 512" className="w-[15px] h-[15px] fill-white">
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                        </svg>
                        <span>Apple</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Alternate Screen Toggle */}
                  <div className="mt-24 text-center select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setIsForgotPassword(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-[#2d4d3a]/90 hover:text-[#0c2f1d]/100 text-[13.5px] font-bold tracking-tight transition duration-150"
                    >
                      Já tem uma conta? <span className="text-[#135d25] underline decoration-[#135d25] decoration-2 underline-offset-4 font-extrabold">Conecte-se</span>
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
                  <div className="mb-11 select-none text-center">
                    <h3 className="text-[32px] font-extrabold text-[#0c2f1d]/95 tracking-tight leading-none antialiased">
                      Acesse sua conta
                    </h3>
                    <p className="text-[13px] text-[#2d4d3a] mt-2 antialiased font-semibold tracking-normal">
                      Entre com seus dados para continuar no Vault
                    </p>
                  </div>

                  {/* Alert Boxes */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-900 p-3.5 rounded-[18px] text-xs font-bold flex items-center gap-2 mb-4">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-900 p-3.5 rounded-[18px] text-xs font-bold flex items-center gap-2 mb-4">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    {/* Email field */}
                    <div>
                      <label className="block text-[10px] font-extrabold tracking-[0.16em] !text-[#0c2d1c] mb-2 uppercase select-none text-left">
                        E-mail
                      </label>
                      <div className="relative flex items-center">
                        <Mail size={18} className="absolute left-[18px] !text-[#0c2d1c]/80 pointer-events-none z-10" />
                        <input
                          type="email"
                          placeholder="Seu email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-[54px] bg-white/20 hover:bg-white/25 focus:bg-white/30 border border-white/35 focus:border-[#22c55e]/45 rounded-[18px] !pl-[52px] !pr-5 !text-[#0c2d1c] font-semibold placeholder-[#2d4d3a]/65 outline-none transition duration-200 text-[14.5px] shadow-sm backdrop-blur-md"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="block text-[10px] font-extrabold tracking-[0.16em] !text-[#0c2d1c] mb-2 uppercase select-none text-left">
                        Senha
                      </label>
                      <div className="relative flex items-center">
                        <Lock size={18} className="absolute left-[18px] !text-[#0c2d1c]/80 pointer-events-none z-10" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-[54px] bg-white/20 hover:bg-white/25 focus:bg-white/30 border border-white/35 focus:border-[#22c55e]/45 rounded-[18px] !pl-[52px] !pr-[52px] !text-[#0c2d1c] font-semibold placeholder-[#2d4d3a]/65 outline-none transition duration-200 text-[14.5px] shadow-sm backdrop-blur-md"
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 !text-[#0c2d1c]/70 hover:!text-[#0c2d1c] transition duration-150"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password Container */}
                    <div className="text-right select-none h-5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-[#0e4224] hover:text-[#1c5f2b] text-[13.5px] font-bold tracking-tight hover:underline transition duration-150"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      className="w-full h-[54px] bg-gradient-to-b from-[#2d874c] to-[#12552b] text-white hover:brightness-[1.04] active:brightness-[0.96] shadow-lg shadow-[#12552b]/20 hover:shadow-[#12552b]/30 rounded-[18px] font-extrabold tracking-[0.12em] text-[15px] flex items-center justify-center gap-2 transition-all duration-200 mt-2.5 uppercase text-center"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin text-white" size={20} />
                      ) : (
                        <div className="flex items-center justify-center mx-auto">
                          <span>Entrar</span>
                        </div>
                      )}
                    </motion.button>
                  </form>

                  {/* Separador e Social Providers */}
                  <div className="w-full">
                    <div className="flex items-center my-9 select-none">
                      <div className="flex-grow border-t border-white/20"></div>
                      <span className="mx-4 text-[10px] font-extrabold text-[#2d4d3a]/80 uppercase tracking-[0.2em]">ou</span>
                      <div className="flex-grow border-t border-white/20"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        className="flex items-center justify-center gap-2.5 h-12 border border-white/20 bg-transparent rounded-[16px] text-sm font-extrabold text-white transition-all duration-200 shadow-sm cursor-pointer"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google"
                          className="w-[18px] h-[18px]"
                          referrerPolicy="no-referrer"
                        />
                        <span>Google</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        className="flex items-center justify-center gap-2.5 h-12 border border-white/20 bg-transparent rounded-[16px] text-sm font-extrabold text-white transition-all duration-200 shadow-sm cursor-pointer"
                        onClick={handleAppleLogin}
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                      >
                        <svg viewBox="0 0 384 512" className="w-[15px] h-[15px] fill-white">
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                        </svg>
                        <span>Apple</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Alternate Screen Toggle */}
                  <div className="mt-24 text-center select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setIsForgotPassword(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-[#2d4d3a]/90 hover:text-[#0c2f1d]/100 text-[13.5px] font-bold tracking-tight transition duration-150"
                    >
                      Não tem uma conta? <span className="text-[#135d25] underline decoration-[#135d25] decoration-2 underline-offset-4 font-extrabold">Crie agora</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>

      {/* Elegant minimalist bottom footer credits - aligned left */}
      <div className="absolute bottom-6 left-6 md:left-12 text-[10px] tracking-[0.16em] text-[#2d4d3a]/75 font-extrabold uppercase select-none z-10">
        © 2026 Vault Inc. • Todos os direitos reservados
      </div>
    </div>
  );
}
