import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, Shield, Bell, User, LogOut, ChevronRight, Save, 
  Camera, ShieldCheck, Mail, Key, Info, Clock, Languages, Coins, Moon, Sun, 
  Monitor, Briefcase, RefreshCw, Smartphone, X, UserPlus, MapPin, Globe, Calendar as CalendarIcon, UserCircle, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GenericModal } from './Modals';
import { dbService } from '../services/dbService';
import { UserProfile } from '../types';
import CustomSelect from './ui/CustomSelect';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVar = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

import { usePreferences } from '../contexts/PreferencesContext';

export default function Settings() {
  const { user, logout, updateUserInfo, resetPassword } = useAuth();
  const { t, language, setLanguage, currency, setCurrency, themeMode, setThemeMode } = usePreferences();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Profile form state
  const [dataNascimento, setDataNascimento] = useState('');
  const [genero, setGenero] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [pais, setPais] = useState('');
  const [rendimentoMensal, setRendimentoMensal] = useState('');

  useEffect(() => {
    if (user?.uid) {
      const unsub = dbService.subscribeUserProfile(user.uid, (profile) => {
        setUserProfile(profile);
        if (profile) {
          setDataNascimento(profile.dataNascimento || '');
          setGenero(profile.genero || '');
          setCidade(profile.cidade || '');
          setUf(profile.uf || '');
          setPais(profile.pais || '');
          setRendimentoMensal(profile.rendimentoMensal?.toString() || '');
        }
      });
      return () => unsub();
    }
  }, [user?.uid]);
  
  const [newName, setNewName] = useState(user?.displayName || '');
  useEffect(() => {
    if (user?.displayName && !newName) {
      setNewName(user.displayName);
    }
  }, [user?.displayName]);
  const [newPhoto, setNewPhoto] = useState(user?.photoURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }));
  }, [language]);

  const handleManualSync = () => {
    if (isSyncingLocal) return;
    setIsSyncingLocal(true);
    
    // Simulate sync delay
    setTimeout(() => {
      setIsSyncingLocal(false);
      setLastSyncTime(new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }));
    }, 2000);
  };

  const sections = [
    { icon: <User size={18} />, label: t('profile'), sub: t('manage_profile'), action: () => setIsProfileModalOpen(true) },
    { icon: <Shield size={18} />, label: t('security'), sub: t('security_sub'), action: () => setIsSecurityModalOpen(true) },
    { icon: <ShieldCheck size={18} />, label: t('cloud_backup'), sub: t('cloud_sub'), action: () => setIsCloudModalOpen(true) },
    { icon: <Bell size={18} />, label: t('notifications'), sub: t('notif_sub'), action: () => setIsNotificationModalOpen(true) },
    { icon: <SettingsIcon size={18} />, label: t('preferences'), sub: t('pref_sub'), action: () => setIsPreferencesModalOpen(true) },
    { icon: <LogOut size={18} />, label: t('end_session'), sub: t('logout_confirm_desc'), action: () => setIsLogoutConfirmOpen(true) },
  ];

  const handleSavePreferences = () => {
    setIsPreferencesModalOpen(false);
  };

  const isProfileComplete = !!userProfile?.cidade && !!userProfile?.dataNascimento && !!userProfile?.rendimentoMensal;

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserInfo(newName, newPhoto);
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompleteProfile = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await dbService.saveUserProfile(user.uid, {
        dataNascimento,
        genero,
        cidade,
        uf,
        pais,
        rendimentoMensal: parseFloat(rendimentoMensal) || 0
      });
      setIsCompleteProfileModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    try {
      await resetPassword(user.email);
      setResetMessage(t('reset_email_sent'));
    } catch (err) {
      console.error(err);
      setResetMessage(t('reset_email_err'));
    } finally {
      setIsResetting(false);
    }
  };

  const creationDate = user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(language) : 'N/A';
  const lastSignIn = user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString(language) : 'N/A';

  return (
    <motion.div 
      className="settings-page"
      variants={container}
      initial="hidden"
      animate="show"
      style={{ width: '100%', margin: '0' }}
    >
      <motion.div 
        variants={itemVar}
        onClick={handleManualSync}
        style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(0, 200, 83, 0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 200, 83, 0.15)',
          boxShadow: '0 8px 24px rgba(0, 200, 83, 0.03)',
          cursor: 'pointer'
        }}
        whileHover={{ background: 'rgba(0, 200, 83, 0.08)' }}
        whileTap={{ scale: 0.99 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '10px', height: '100%', position: 'absolute', left: '-20px', background: '#00C853', borderRadius: '0 10px 10px 0' }} />
            <motion.div 
              animate={{ 
                scale: isSyncingLocal ? [1, 1.2, 1] : 1,
                opacity: isSyncingLocal ? [1, 0.6, 1] : 1
              }}
              transition={{ repeat: isSyncingLocal ? Infinity : 0, duration: 2 }}
              style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00C853', boxShadow: '0 0 12px rgba(0,200,83,0.5)' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-body t-bold" style={{ color: '#00843D', letterSpacing: '-0.3px' }}>
              {isSyncingLocal ? t('syncing') : t('cloud_synced')}
            </span>
            <span className="t-xs t-semibold" style={{ color: 'var(--muted)' }}>
              {isSyncingLocal ? t('sync_sub') : `${t('ready_for_you')} · ${lastSyncTime}`}
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isSyncingLocal ? 360 : 0 }}
          transition={{ repeat: isSyncingLocal ? Infinity : 0, duration: 1, ease: "linear" }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <RefreshCw size={16} color="#00843D" style={{ opacity: 0.6 }} />
        </motion.div>
      </motion.div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div>
          {sections.map((s, i) => (
            <motion.div 
              key={i}
              variants={itemVar}
              whileHover={{ x: 5, background: 'rgba(0,0,0,0.015)' }}
              onClick={s.action}
              style={{ 
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', 
                cursor: 'pointer', borderBottom: i === sections.length - 1 ? 'none' : '1px solid var(--glass-border)',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '12px', background: 'var(--glass-strong)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-body-lg t-bold" style={{ color: 'var(--text)' }}>{s.label}</div>
                <div className="t-sm t-medium" style={{ color: 'var(--muted)' }}>{s.sub}</div>
              </div>
              <ChevronRight size={18} color="var(--muted)" style={{ opacity: 0.5 }} />
            </motion.div>
          ))}
        </div>
      </div>

         {/* Cloud & Backup Modal */}
      <GenericModal 
        isOpen={isLogoutConfirmOpen} 
        onClose={() => setIsLogoutConfirmOpen(false)} 
        title={t('end_session')}
        onSave={logout}
        saveLabel={t('logout')}
        saveVariant="danger"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', 
            margin: '0 auto 20px auto'
          }}>
            <LogOut size={32} />
          </div>
          <h3 className="t-h3" style={{ marginBottom: '8px' }}>{t('logout_confirm')}</h3>
          <p className="t-body t-muted">{t('logout_confirm_desc')}</p>
        </div>
      </GenericModal>
 
      <GenericModal 
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)} 
        title={t('cloud_save')}
        onSave={() => setIsCloudModalOpen(false)}
        saveLabel={t('confirm')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--accent-low)', borderRadius: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>☁️</div>
            <h3 className="t-h3" style={{ marginBottom: '8px' }}>{t('cloud_save_sub')}</h3>
            <p className="t-body t-muted" style={{ margin: 0, lineHeight: 1.5 }}>
              {t('cloud_save_desc')}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--glass-strong)', borderRadius: '12px' }}>
              <Shield size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="t-body t-bold" style={{ color: 'var(--text)' }}>{t('encryption')}</div>
                <div className="t-xs t-muted">{t('encryption_desc')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--glass-strong)', borderRadius: '12px' }}>
              <Save size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="t-body t-bold" style={{ color: 'var(--text)' }}>{t('auto_backup')}</div>
                <div className="t-xs t-muted">{t('auto_backup_desc')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--glass-strong)', borderRadius: '12px' }}>
              <Monitor size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="t-body t-bold" style={{ color: 'var(--text)' }}>{t('multi_device')}</div>
                <div className="t-xs t-muted">{t('multi_device_desc')}</div>
              </div>
            </div>
          </div>
        </div>
      </GenericModal>

      <GenericModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={t('edit_profile')}
        onSave={() => handleUpdateProfile()}
        saveLabel={isSaving ? t('saving') : t('save')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={triggerFileInput}
            >
              <img 
                src={newPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'} 
                alt="Avatar Preview" 
                style={{ width: '100px', height: '100px', borderRadius: '50px', border: '4px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              />
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: '#22C55E', padding: '8px', borderRadius: '50%', border: '2px solid white', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <Camera size={16} />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange} 
            />

            <div className="t-xs t-semibold t-muted">{t('click_to_change_photo')}</div>
          </div>

          <div className="fg">
            <label>{t('display_name')}</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              required
              placeholder={t('display_name')}
            />
          </div>

          {isProfileComplete ? (
            <div style={{ 
              marginTop: '8px',
              padding: '16px',
              background: 'var(--glass-strong)',
              borderRadius: 'var(--r-xl)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)' }}>
                  <ShieldCheck size={18} />
                  <span className="t-sm t-bold">{t('account_verified')}</span>
                </div>
                <button 
                  onClick={() => setIsCompleteProfileModalOpen(true)}
                  className="t-xs t-bold"
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {t('edit')}
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div className="t-xs t-muted">{t('birth_date')}</div>
                  <div className="t-sm t-bold" style={{ color: 'var(--text)' }}>{userProfile?.dataNascimento}</div>
                </div>
                <div>
                  <div className="t-xs t-muted">{t('gender')}</div>
                  <div className="t-sm t-bold" style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{userProfile?.genero || '-'}</div>
                </div>
                <div>
                  <div className="t-xs t-muted">{t('city')}</div>
                  <div className="t-sm t-bold" style={{ color: 'var(--text)' }}>{userProfile?.cidade}, {userProfile?.uf}</div>
                </div>
                <div>
                  <div className="t-xs t-muted">{t('country')}</div>
                  <div className="t-sm t-bold" style={{ color: 'var(--text)' }}>{userProfile?.pais}</div>
                </div>
              </div>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn btn-secondary w-full"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsCompleteProfileModalOpen(true);
              }}
              style={{ 
                marginTop: '8px', 
                justifyContent: 'center', 
                gap: '8px',
                borderStyle: 'dashed',
                background: 'var(--accent-low)',
                color: 'var(--accent)',
                borderRadius: 'var(--r-xl)'
              }}
            >
              <UserPlus size={18} />
              <span className="t-sm t-bold">{t('verify_account')}</span>
            </button>
          )}
        </div>
      </GenericModal>

      <GenericModal
        isOpen={isCompleteProfileModalOpen}
        onClose={() => setIsCompleteProfileModalOpen(false)}
        title={t('complete_registration')}
        onSave={handleSaveCompleteProfile}
        saveLabel={isSaving ? t('saving') : t('save')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="fg">
              <label>{t('birth_date')}</label>
              <div style={{ position: 'relative' }}>
                <CalendarIcon size={14} style={{ position: 'absolute', left: '12px', top: '50.5%', transform: 'translateY(-50%)', color: 'var(--accent)', zIndex: 1 }} />
                <input 
                  type="date" 
                  value={dataNascimento} 
                  onChange={e => setDataNascimento(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
            <div className="fg">
              <label>{t('gender')}</label>
              <CustomSelect
                value={genero}
                onChange={setGenero}
                options={[
                  { value: '', label: t('select') },
                  { value: 'masculino', label: t('male') },
                  { value: 'feminino', label: t('female') },
                  { value: 'outro', label: t('other') },
                  { value: 'prefiro_nao_dizer', label: t('prefer_not_to_say') }
                ]}
                icon={<UserCircle size={14} style={{ color: 'var(--accent)' }} />}
                className="w-full"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="fg">
              <label>{t('city')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50.5%', transform: 'translateY(-50%)', color: 'var(--accent)', zIndex: 1 }} />
                <input 
                  type="text" 
                  value={cidade} 
                  onChange={e => setCidade(e.target.value)}
                  placeholder={t('city_placeholder')}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
            <div className="fg">
              <label>UF</label>
              <input 
                type="text" 
                value={uf} 
                onChange={e => setUf(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="SP"
              />
            </div>
          </div>

          <div className="fg">
            <label>{t('country')}</label>
            <div style={{ position: 'relative' }}>
              <Globe size={14} style={{ position: 'absolute', left: '12px', top: '50.5%', transform: 'translateY(-50%)', color: 'var(--accent)', zIndex: 1 }} />
              <input 
                type="text" 
                value={pais} 
                onChange={e => setPais(e.target.value)}
                placeholder={t('country_placeholder')}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="fg">
            <label>{t('monthly_income')}</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50.5%', transform: 'translateY(-50%)', color: 'var(--accent)', zIndex: 1 }} />
              <input 
                type="number" 
                value={rendimentoMensal} 
                onChange={e => setRendimentoMensal(e.target.value)}
                placeholder="0,00"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <p className="t-xs t-muted" style={{ marginTop: '4px' }}>
              {t('income_info_desc')}
            </p>
          </div>
        </div>
      </GenericModal>

      {/* Security Modal */}
      <GenericModal
        isOpen={isSecurityModalOpen}
        onClose={() => {
          setIsSecurityModalOpen(false);
          setResetMessage('');
        }}
        title={t('security_account')}
        onSave={() => setIsSecurityModalOpen(false)}
        saveLabel={t('close')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--glass-strong)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div className="t-xs t-bold t-muted" style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={14} style={{ color: 'var(--accent)' }} /> {t('login_info')}
            </div>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <span className="t-sm t-muted">E-mail</span>
                <span className="t-sm t-bold" style={{ wordBreak: 'break-all', textAlign: 'right', color: 'var(--text)' }}>{user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <span className="t-sm t-muted">{t('verified')}</span>
                <span className="t-xs t-bold" style={{ color: user?.emailVerified ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {user?.emailVerified ? <ShieldCheck size={14} /> : <X size={14} />} 
                  {user?.emailVerified ? t('yes') : t('no')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <span className="t-sm t-muted">{t('creation_date')}</span>
                <span className="t-sm t-bold" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                  <Clock size={14} style={{ opacity: 0.5 }} /> {creationDate}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <span className="t-sm t-muted">{t('last_access')}</span>
                <span className="t-sm t-bold" style={{ textAlign: 'right', color: 'var(--text)' }}>{lastSignIn}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--glass-strong)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div className="t-xs t-bold t-muted" style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={14} style={{ color: 'var(--accent)' }} /> {t('password_access')}
            </div>
            
            <p className="t-sm t-muted" style={{ margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {t('password_reset_info')}
            </p>

            <button 
              onClick={handlePasswordReset}
              className="btn btn-primary"
              disabled={isResetting}
              style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
            >
              {isResetting ? t('sending') : <><Mail size={18} /> {t('send_reset_email')}</>}
            </button>

            {resetMessage && (
              <div className="t-xs t-semibold" style={{ 
                marginTop: '12px', padding: '10px 12px', borderRadius: '8px', 
                background: resetMessage.includes('Erro') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 132, 61, 0.1)',
                color: resetMessage.includes('Erro') ? 'var(--red)' : 'var(--green)',
                textAlign: 'center'
              }}>
                {resetMessage}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'start', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
            <Shield size={16} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
            <p className="t-xs t-muted" style={{ margin: 0, lineHeight: 1.4 }}>
              {t('security_footer_info')}
            </p>
          </div>
        </div>
      </GenericModal>

      {/* Notifications Modal */}
      <GenericModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        title={t('notifications')}
        onSave={() => setIsNotificationModalOpen(false)}
        saveLabel={t('confirm')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            padding: '16px', background: 'var(--glass-strong)', borderRadius: '14px',
            border: '1px solid var(--glass-border)'
          }}>
            <div>
              <div className="t-body t-bold" style={{ color: 'var(--text)', marginBottom: '4px' }}>{t('push_notifications')}</div>
              <div className="t-xs t-muted" style={{ lineHeight: 1.3 }}>{t('push_notif_sub')}</div>
            </div>
            <div 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              style={{ 
                width: '44px', height: '24px', borderRadius: '12px', 
                background: notificationsEnabled ? 'var(--accent)' : 'var(--glass-border)',
                padding: '2px', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', flexShrink: 0,
                justifyContent: notificationsEnabled ? 'flex-end' : 'flex-start'
              }}
            >
              <motion.div 
                layout
                style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
              />
            </div>
          </div>

          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            padding: '16px', background: 'var(--glass-strong)', borderRadius: '14px',
            border: '1px solid var(--glass-border)'
          }}>
            <div>
              <div className="t-body t-bold" style={{ color: 'var(--text)', marginBottom: '4px' }}>{t('email_notifications')}</div>
              <div className="t-xs t-muted" style={{ lineHeight: 1.3 }}>{t('email_notif_sub')}</div>
            </div>
            <div 
              onClick={() => setEmailNotifications(!emailNotifications)}
              style={{ 
                width: '44px', height: '24px', borderRadius: '12px', 
                background: emailNotifications ? 'var(--accent)' : 'var(--glass-border)',
                padding: '2px', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', flexShrink: 0,
                justifyContent: emailNotifications ? 'flex-end' : 'flex-start'
              }}
            >
              <motion.div 
                layout
                style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
              />
            </div>
          </div>

          <div className="t-xs t-semibold" style={{ marginTop: '12px', padding: '12px', background: 'var(--accent-low)', borderRadius: '12px', color: 'var(--accent)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>{t('notif_tip')}</span>
          </div>
        </div>
      </GenericModal>

      {/* Preferences Modal */}
      <GenericModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        title={t('preferences')}
        onSave={handleSavePreferences}
        saveLabel={t('save')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Language Selection */}
          <div>
            <div className="t-xs t-bold t-muted" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Languages size={14} style={{ color: 'var(--accent)' }} /> {t('app_language')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'pt-BR', label: 'Português' },
                { id: 'en-US', label: 'English' },
                { id: 'es-ES', label: 'Español' }
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className="t-sm t-semibold"
                  style={{ 
                    padding: '8px', borderRadius: '10px', border: '1px solid',
                    cursor: 'pointer',
                    background: language === lang.id ? 'var(--accent)' : 'var(--glass-strong)',
                    color: language === lang.id ? 'white' : 'inherit',
                    borderColor: language === lang.id ? 'var(--accent)' : 'var(--glass-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <div className="t-xs t-bold t-muted" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coins size={14} style={{ color: 'var(--accent)' }} /> {t('default_currency')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'BRL', label: 'Real (R$)' },
                { id: 'USD', label: 'Dólar ($)' },
                { id: 'EUR', label: 'Euro (€)' }
              ].map(curr => (
                <button
                  key={curr.id}
                  onClick={() => setCurrency(curr.id as any)}
                  className="t-sm t-semibold"
                  style={{ 
                    padding: '8px', borderRadius: '10px', border: '1px solid',
                    cursor: 'pointer',
                    background: currency === curr.id ? 'var(--accent)' : 'var(--glass-strong)',
                    color: currency === curr.id ? 'white' : 'inherit',
                    borderColor: currency === curr.id ? 'var(--accent)' : 'var(--glass-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  {curr.label}
                </button>
              ))}
            </div>
          </div>


        </div>
      </GenericModal>
    </motion.div>
  );
}
