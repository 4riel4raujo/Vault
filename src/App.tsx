import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Target, 
  TrendingUp, 
  FileText,
  ShieldCheck,
  Plus,
  FileUp,
  FileDown,
  LogOut,
  Wallet,
  User,
  Briefcase,
  Trash2,
  Settings,
  MoreVertical,
  Menu,
  X as XIcon,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from './services/dbService';
import { DBState, Lancamento, Meta, Investimento, Carteira, OperationType, ShoppingItem, GastoFixo } from './types';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Investments from './components/Investments';
import Reports from './components/Reports';
import WalletsPage from './components/WalletsPage';
import SettingsPage from './components/Settings';
import Planning from './components/Planning';
import { LancamentoModal, MetaModal, InvModal, CarteiraModal, ConfirmModal } from './components/Modals';
import CSVImportModal from './components/CSVImportModal';
import AppIcon from './components/AppIcon';
import { useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import Login from './components/Login';

// Types for navigation
type PageId = 'dashboard' | 'lancamentos' | 'metas' | 'investimentos' | 'planning' | 'relatorio' | 'carteiras' | 'ajustes';

export default function App() {
  return (
    <PreferencesProvider>
      <AppContent />
    </PreferencesProvider>
  );
}

import { usePreferences } from './contexts/PreferencesContext';

function AppContent() {
  const { user, logout } = useAuth();
  const { t, language, isDark } = usePreferences();
  const [db, setDb] = useState<DBState>({ 
    lancamentos: [], 
    metas: [], 
    investimentos: [], 
    carteiras: [],
    shoppingItems: [],
    gastosFixos: []
  });
  const [activeCarteiraId, setActiveCarteiraId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(new Date());
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'none' | 'lancamento' | 'meta' | 'investimento' | 'csv' | 'carteira'>('none');
  const [editLanc, setEditLanc] = useState<Lancamento | null>(null);
  const [editMeta, setEditMeta] = useState<Meta | null>(null);
  const [editInv, setEditInv] = useState<Investimento | null>(null);
  const [editCarteira, setEditCarteira] = useState<Carteira | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'carteira' | 'lancamento' | 'meta' | 'investimento' | 'bulk_lancamento'>('carteira');
  const [bulkTargets, setBulkTargets] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'ok' | 'erro'>('ok');

  // 1. Sync Carteiras first
  useEffect(() => {
    if (!user) return;

    return dbService.subscribeCarteiras(user.uid, (data) => {
      setDb(prev => ({ ...prev, carteiras: data }));
      
      // If no wallet active, pick the first one or create default
      if (!activeCarteiraId && data.length > 0) {
        setActiveCarteiraId(data[0].id);
      } else if (data.length === 0) {
        // Create default wallet
        const createDefault = async () => {
          try {
            const defaultWall: Carteira = {
              id: 'col_default_' + Date.now(),
              nome: t('default_wallet_name'),
              tipo: 'Pessoal',
              descricao: t('default_wallet_desc'),
              userId: user.uid
            };
            await dbService.saveCarteira(defaultWall, user.uid);
            showToast(t('default_wallet_created'));
          } catch (error) {
            console.error('Error creating default wallet:', error);
            showToast('Erro ao criar carteira padrão. Verifique as regras do Firebase.', 'erro');
          }
        };
        createDefault();
      }
    });
  }, [user]);

  // 2. Sync Items based on activeCarteiraId
  useEffect(() => {
    if (!user || !activeCarteiraId) return;

    dbService.testConnection();

    const unsubLanc = dbService.subscribeLancamentos(user.uid, activeCarteiraId, (data) => {
      setDb(prev => ({ ...prev, lancamentos: data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) }));
    });
    const unsubMetas = dbService.subscribeMetas(user.uid, activeCarteiraId, (data) => {
      setDb(prev => ({ ...prev, metas: data }));
    });
    const unsubInv = dbService.subscribeInvestimentos(user.uid, activeCarteiraId, (data) => {
      setDb(prev => ({ ...prev, investimentos: data }));
    });

    const unsubFixed = dbService.subscribeGastosFixos(user.uid, (data) => {
      setDb(prev => ({ ...prev, gastosFixos: data }));
    });

    const unsubShopping = dbService.subscribeShoppingItems(user.uid, (data) => {
      setDb(prev => ({ ...prev, shoppingItems: data }));
    });

    return () => {
      unsubLanc();
      unsubMetas();
      unsubInv();
      unsubFixed();
      unsubShopping();
    };
  }, [user, activeCarteiraId]);

  // Handle redirect if page becomes hidden
  useEffect(() => {
    const activeWall = db.carteiras.find(c => c.id === activeCarteiraId);
    if (activeWall?.tipo === 'Empresarial' && ['investimentos'].includes(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [db.carteiras, activeCarteiraId, currentPage]);

  // Auto-sync: keep investment transactions in sync with investments
  useEffect(() => {
    if (!user || !activeCarteiraId || db.investimentos.length === 0) return;

    db.investimentos.forEach(inv => {
      const lancId = 'l_inv_' + inv.id;
      const custoAporte = (inv.qtd && inv.preco) ? (inv.qtd * inv.preco) : inv.valor;
      const existingLanc = db.lancamentos.find(l => l.id === lancId);

      if (!existingLanc) {
        dbService.saveLancamento({
          id: lancId,
          tipo: OperationType.INVESTIMENTO,
          data: inv.data || dbService.getToday(),
          valor: custoAporte,
          desc: `Investimento: ${inv.ativo}`,
          cat: inv.tipo,
          obs: 'Lançamento automático via carteira de ativos (Sincronização)',
          carteiraId: activeCarteiraId
        } as Lancamento, user.uid);
      } else if (existingLanc.valor !== custoAporte || existingLanc.desc !== `Investimento: ${inv.ativo}` || existingLanc.cat !== inv.tipo) {
        // Correct the transaction details if mismatch (including old 0.00 balances or description/category changes)
        dbService.saveLancamento({
          ...existingLanc,
          valor: custoAporte,
          desc: `Investimento: ${inv.ativo}`,
          cat: inv.tipo
        }, user.uid);
      }
    });
  }, [user, activeCarteiraId, db.investimentos, db.lancamentos]);

  const [lastSignIn, setLastSignIn] = useState<string>('');

  useEffect(() => {
    setLastSignIn(new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }));
  }, [lastSync, language]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return <Login />;

  const activeWall = db.carteiras.find(c => c.id === activeCarteiraId);

  const showToast = (msg: string, type: 'ok' | 'erro' = 'ok') => {
    setToastMsg(msg);
    setToastType(type);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 2600);
  };

  // CRUD HANDLERS
  const saveLanc = async (data: Partial<Lancamento>) => {
    if (!activeCarteiraId) return;
    setIsSyncing(true);
    const id = editLanc ? editLanc.id : 'l' + Date.now() + Math.floor(Math.random() * 1000);
    try {
      await dbService.saveLancamento({ ...data, id, carteiraId: activeCarteiraId } as Lancamento, user.uid);
      showToast(editLanc ? t('updated') : t('saved'));
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
      setActiveModal('none');
    }
  };

  const deleteLanc = async (id: string) => {
    setDeleteTargetId(id);
    setDeleteType('lancamento');
    setIsConfirmOpen(true);
  };

  const deleteBulkLanc = async (ids: string[]) => {
    setBulkTargets(ids);
    setDeleteType('bulk_lancamento');
    setIsConfirmOpen(true);
  };

  const editBulkCat = async (ids: string[], newCat: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const updates = db.lancamentos
        .filter(l => ids.includes(l.id))
        .map(l => ({ ...l, cat: newCat }));
      
      if (updates.length > 0) {
        await dbService.saveLancamentoBatch(updates, user.uid);
        showToast(`${ids.length} categorias atualizadas`);
      }
    } catch (error) {
      console.error('Bulk Cat Error:', error);
      showToast(t('error_updating'), 'erro');
    } finally {
      setIsSyncing(false);
    }
  };

  const editBulkType = async (ids: string[], newType: string) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const updates = db.lancamentos
        .filter(l => ids.includes(l.id))
        .map(l => ({ ...l, tipo: newType as any }));
      
      if (updates.length > 0) {
        await dbService.saveLancamentoBatch(updates, user.uid);
        showToast(`${ids.length} tipos atualizados`);
      }
    } catch (error) {
      console.error('Bulk Type Error:', error);
      showToast(t('error_updating'), 'erro');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveMeta = async (data: Partial<Meta>) => {
    if (!activeCarteiraId) return;
    setIsSyncing(true);
    const id = editMeta ? editMeta.id : 'm' + Date.now() + Math.floor(Math.random() * 1000);
    try {
      await dbService.saveMeta({ ...data, id, carteiraId: activeCarteiraId } as Meta, user.uid);
      showToast(editMeta ? t('updated') : t('created'));
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
      setActiveModal('none');
    }
  };

  const deleteMeta = async (id: string) => {
    setDeleteTargetId(id);
    setDeleteType('meta');
    setIsConfirmOpen(true);
  };

  const saveInv = async (data: Partial<Investimento>) => {
    if (!activeCarteiraId) return;
    setIsSyncing(true);
    const id = editInv ? editInv.id : 'i' + Date.now() + Math.floor(Math.random() * 1000);
    try {
      const fullInv = { ...data, id, carteiraId: activeCarteiraId } as Investimento;
      await dbService.saveInvestimento(fullInv, user.uid);
      
      // Criar/atualizar lançamento vinculado para histórico
      const custoAporte = (fullInv.qtd && fullInv.preco) ? (fullInv.qtd * fullInv.preco) : fullInv.valor;
      const lancId = 'l_inv_' + id;
      
      await dbService.saveLancamento({
        id: lancId,
        tipo: OperationType.INVESTIMENTO,
        data: fullInv.data || dbService.getToday(),
        valor: custoAporte,
        desc: `Investimento: ${fullInv.ativo}`,
        cat: fullInv.tipo,
        obs: 'Lançamento automático via carteira de ativos',
        carteiraId: activeCarteiraId
      } as Lancamento, user.uid);

      showToast(editInv ? t('updated') : t('saved'));
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
      setActiveModal('none');
    }
  };

  const deleteInv = async (id: string) => {
    setDeleteTargetId(id);
    setDeleteType('investimento');
    setIsConfirmOpen(true);
  };

  const saveCarteira = async (data: Partial<Carteira>) => {
    setIsSyncing(true);
    const id = editCarteira ? editCarteira.id : 'c' + Date.now() + Math.floor(Math.random() * 1000);
    try {
      await dbService.saveCarteira({ ...data, id, userId: user.uid } as Carteira, user.uid);
      setActiveCarteiraId(id);
      showToast(editCarteira ? t('wallet_updated') : t('wallet_created'));
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
      setActiveModal('none');
    }
  };

  const deleteCarteira = async (id: string) => {
    if (db.carteiras.length <= 1) {
      showToast(t('min_wallet_warning') || 'Você precisa ter pelo menos uma carteira.', 'erro');
      return;
    }
    setDeleteTargetId(id);
    setDeleteType('carteira');
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsSyncing(true);
    try {
      if (deleteType === 'carteira' && deleteTargetId) {
        await dbService.deleteCarteira(deleteTargetId);
        if (activeCarteiraId === deleteTargetId) {
          const nextWall = db.carteiras.find(c => c.id !== deleteTargetId);
          setActiveCarteiraId(nextWall?.id || null);
        }
        showToast(t('wallet_deleted'));
      } else if (deleteType === 'lancamento' && deleteTargetId) {
        await dbService.deleteLancamento(deleteTargetId);
        showToast(t('transaction_deleted'));
      } else if (deleteType === 'meta' && deleteTargetId) {
        await dbService.deleteMeta(deleteTargetId);
        showToast(t('goal_deleted'));
      } else if (deleteType === 'investimento' && deleteTargetId) {
        await dbService.deleteInvestimento(deleteTargetId);
        try {
          await dbService.deleteLancamento('l_inv_' + deleteTargetId);
        } catch (e) {
          // Lançamento pode não existir ou já ter sido removido
        }
        showToast(t('investment_deleted'));
      } else if (deleteType === 'bulk_lancamento' && bulkTargets.length > 0) {
        for (const id of bulkTargets) {
          await dbService.deleteLancamento(id);
        }
        showToast(`${bulkTargets.length} ${t('bulk_deleted')}`);
      }
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
      setIsConfirmOpen(false);
      setDeleteTargetId(null);
      setBulkTargets([]);
    }
  };

  const handleWallClick = (id: string) => {
    setActiveCarteiraId(id);
    showToast(t('wallet_changed'));
  };

  const handleExportCSV = () => {
    const rows = [['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Observação']];
    db.lancamentos.forEach(l => {
      rows.push([dbService.formatDate(l.data), l.desc, l.tipo, l.cat, l.valor.toFixed(2).replace('.', ','), l.obs || '']);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `extrato_${dbService.getToday()}.csv`;
    a.click();
    showToast(t('export_success'));
  };

  const handleImportCSV = async (items: Partial<Lancamento>[]) => {
    if (!activeCarteiraId) return;
    setIsSyncing(true);
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await dbService.saveLancamento({ 
          ...item, 
          id: 'l' + Date.now() + i + Math.floor(Math.random() * 1000),
          carteiraId: activeCarteiraId 
        } as Lancamento, user.uid);
      }
      showToast(`${items.length} ${t('import_success')}`);
      setLastSync(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: 'lancamentos', label: t('transactions'), icon: <PlusCircle size={20} /> },
    { id: 'investimentos', label: t('investments'), icon: <TrendingUp size={20} /> },
    { id: 'relatorio', label: t('reports'), icon: <FileText size={20} /> },
    { id: 'metas', label: t('goals'), icon: <Target size={20} /> },
    { id: 'planning', label: t('planning'), icon: <ClipboardList size={20} /> },
    { id: 'carteiras', label: t('wallets'), icon: <Wallet size={20} /> },
    { id: 'ajustes', label: t('settings'), icon: <Settings size={20} /> },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (activeWall?.tipo === 'Empresarial') {
      return !['investimentos'].includes(item.id);
    }
    return true;
  });

  const handlePageChange = (id: PageId) => {
    setCurrentPage(id);
    setIsSidebarOpen(false);
    const main = document.querySelector('.main-content');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderHeaderButtons = (isMobile: boolean = false) => {
    const btnStyle = isMobile ? { padding: '8px 14px', fontSize: '13px' } : {};
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
        {currentPage === 'lancamentos' && (
          <button className="btn" style={btnStyle} onClick={() => setActiveModal('csv')}>
            <FileUp size={isMobile ? 18 : 16} strokeWidth={2} />
            <span style={{ display: isMobile ? 'none' : 'inline', marginLeft: '6px' }}>{t('import_csv')}</span>
          </button>
        )}
        
        {currentPage === 'relatorio' && (
          <button className="btn" style={btnStyle} onClick={handleExportCSV}>
            <FileDown size={isMobile ? 18 : 16} strokeWidth={2} />
            <span style={{ display: isMobile ? 'none' : 'inline', marginLeft: '6px' }}>{t('export_csv')}</span>
          </button>
        )}

        {!['relatorio', 'ajustes', 'planning'].includes(currentPage) && (
          <button className="btn btn-primary" style={btnStyle} onClick={() => {
            if (currentPage === 'metas') { setEditMeta(null); setActiveModal('meta'); }
            else if (currentPage === 'investimentos') { setEditInv(null); setActiveModal('investimento'); }
            else if (currentPage === 'carteiras') { setEditCarteira(null); setActiveModal('carteira'); }
            else { setEditLanc(null); setActiveModal('lancamento'); }
          }}>
            <Plus size={isMobile ? 18 : 16} strokeWidth={2.5} />
            <span style={{ display: isMobile ? 'none' : 'inline', marginLeft: '6px' }}>
              {currentPage === 'metas' ? t('new_goal_modal') : 
               currentPage === 'investimentos' ? t('new_investment_modal') : 
               currentPage === 'carteiras' ? t('new_wallet_modal') : t('new_transaction')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="app">
      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.15)', 
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 1050 
            }}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <motion.div 
          className="logo" 
          onClick={() => handlePageChange('dashboard')} 
          style={{ cursor: 'pointer', padding: '0 18px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AppIcon size={52} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <div className="t-h1" style={{ 
              color: 'var(--text)', 
              fontFamily: '"Outfit", sans-serif',
              letterSpacing: '2px',
              textShadow: '0 2px 4px rgba(0,0,0,0.05)',
              lineHeight: '1'
            }}>
              Vault
            </div>
            <div className="t-xs t-bold t-uppercase" style={{ 
              opacity: 0.5, 
              fontFamily: '"Outfit", sans-serif',
              letterSpacing: '1.2px',
              color: 'var(--text)',
              marginTop: '3px',
              paddingLeft: '2px'
            }}>
              {t('finance_management') || 'Gestão Financeira'}
            </div>
          </div>
        </motion.div>
        
        <div className="nav-container">
          <div className="nav-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredNavItems.map(item => (
              <motion.div 
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handlePageChange(item.id as PageId)}
                style={{ margin: '0 12px', position: 'relative' }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentPage === item.id && (
                  <motion.div 
                    layoutId="active-nav-pill"
                    style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'var(--glass-strong)',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      boxShadow: 'var(--shadow-card)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <div className="nav-iw">{item.icon}</div>
                {item.label}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="sidebar-foot" style={{ padding: '16px', borderTop: '1px solid var(--sep)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <motion.div 
              className="user-foot-item"
              whileHover={{ x: 4 }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', 
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                marginLeft: '-4px'
              }}
              onClick={() => handlePageChange('ajustes')}
            >
              <img 
                src={user.photoURL || ''} 
                referrerPolicy="no-referrer" 
                style={{ width: '32px', height: '32px', borderRadius: '16px', border: '1.5px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
                alt="avatar" 
              />
              <div className="t-body t-bold" style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                {user.displayName || user.email?.split('@')[0] || t('unnamed_user')}
              </div>
            </motion.div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px', marginTop: '2px' }}>
               <div style={{ 
                 color: 'var(--muted)', letterSpacing: '0.04em', opacity: 0.5, 
                 display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px',
                 fontWeight: 800, textTransform: 'uppercase'
               }}>
                  <ShieldCheck size={10} strokeWidth={3} />
                  <span>Firebase Protected</span>
               </div>
               <motion.button 
                 whileHover={{ scale: 1.05, opacity: 1, color: 'var(--red)' }}
                 whileTap={{ scale: 0.95 }}
                 onClick={logout} 
                 style={{ 
                   background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', 
                   display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0', opacity: 0.5,
                   transition: 'all 0.2s'
                 }}
               >
                 <LogOut size={10} strokeWidth={3} />
                 <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>{t('logout')}</span>
               </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${activeCarteiraId}`}
            initial={{ opacity: 0, scale: 0.982, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.982, y: -10 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="page"
          >
            <div className="page-header lg-flex">
               <div>
                 <div className="page-title">
                   {navItems.find(n => n.id === currentPage)?.label}
                 </div>
                 <div className="page-sub">
                   {currentPage === 'dashboard' ? new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 
                    currentPage === 'metas' ? t('goals_sub') || 'Seus objetivos financeiros' :
                    currentPage === 'investimentos' ? t('investments_sub') || 'Sua carteira de ativos' :
                    currentPage === 'relatorio' ? t('reports_sub') || 'Visão consolidada' : 
                    currentPage === 'planning' ? t('planning_desc') : 
                    currentPage === 'carteiras' ? t('wallets_sub') || 'Selecione ou gerencie suas carteiras' :
                    currentPage === 'ajustes' ? t('settings_sub') || 'Configurações de conta e segurança' : ''}
                 </div>
               </div>
               {renderHeaderButtons()}
            </div>
            
            {/* Mobile Title View (Only if not desktop) */}
            <div className="mobile-page-title lg-hidden" style={{ marginBottom: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h1 className="h2">
                    {navItems.find(n => n.id === currentPage)?.label}
                  </h1>
                  {renderHeaderButtons(true)}
               </div>
            </div>

            {currentPage === 'dashboard' && <Dashboard db={db} activeWall={activeWall} onViewMore={() => handlePageChange('lancamentos')} />}
            {currentPage === 'planning' && <Planning activeCarteiraId={activeCarteiraId} />}
            {currentPage === 'lancamentos' && (
              <Transactions 
                db={db} 
                onEdit={(l) => { setEditLanc(l); setActiveModal('lancamento'); }} 
                onDelete={deleteLanc}
                onBulkDelete={deleteBulkLanc}
                onBulkEditCat={editBulkCat}
                onBulkEditType={editBulkType}
                onNew={() => { setEditLanc(null); setActiveModal('lancamento'); }}
                onImport={() => setActiveModal('csv')}
              />
            )}
            {currentPage === 'metas' && <Goals db={db} onEdit={(m) => { setEditMeta(m); setActiveModal('meta'); }} onDelete={deleteMeta} />}
            {currentPage === 'investimentos' && <Investments db={db} onEdit={(i) => { setEditInv(i); setActiveModal('investimento'); }} onDelete={deleteInv} />}
            {currentPage === 'relatorio' && <Reports db={db} onExportCSV={handleExportCSV} />}
            {currentPage === 'carteiras' && (
              <WalletsPage 
                db={db} 
                activeCarteiraId={activeCarteiraId} 
                onSelect={(id) => { setActiveCarteiraId(id); showToast(t('wallet_changed')); }}
                onEdit={(w) => { setEditCarteira(w); setActiveModal('carteira'); }}
                onNew={() => { setEditCarteira(null); setActiveModal('carteira'); }}
              />
            )}
            {currentPage === 'ajustes' && <SettingsPage />}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* MOBILE TAB BAR */}
      <div className="tab-bar">
        <div 
          className={`tab-item ${currentPage === 'dashboard' && !isSidebarOpen ? 'active' : ''}`} 
          onClick={() => { handlePageChange('dashboard'); setIsSidebarOpen(false); }}
        >
          <LayoutDashboard size={20} />
          <span>{t('dashboard_short')}</span>
        </div>
        <div 
          className={`tab-item ${currentPage === 'lancamentos' && !isSidebarOpen ? 'active' : ''}`} 
          onClick={() => { handlePageChange('lancamentos'); setIsSidebarOpen(false); }}
        >
          <Plus size={20} />
          <span>{t('add_short')}</span>
        </div>
        <div 
          className={`tab-item ${currentPage === 'investimentos' && !isSidebarOpen ? 'active' : ''}`} 
          onClick={() => { handlePageChange('investimentos'); setIsSidebarOpen(false); }}
        >
          <TrendingUp size={20} />
          <span>{t('assets_short')}</span>
        </div>
        <div 
          className={`tab-item ${isSidebarOpen ? 'active' : ''}`} 
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
          <span>{t('menu')}</span>
        </div>
      </div>

      {/* MODALS */}
      <LancamentoModal 
        isOpen={activeModal === 'lancamento'} 
        onClose={() => { setActiveModal('none'); setEditLanc(null); }} 
        onSave={saveLanc} 
        editData={editLanc} 
      />
      <MetaModal 
        isOpen={activeModal === 'meta'} 
        onClose={() => { setActiveModal('none'); setEditMeta(null); }} 
        onSave={saveMeta} 
        editData={editMeta} 
      />
      <InvModal 
        isOpen={activeModal === 'investimento'} 
        onClose={() => { setActiveModal('none'); setEditInv(null); }} 
        onSave={saveInv} 
        editData={editInv} 
      />
      <CSVImportModal 
        isOpen={activeModal === 'csv'} 
        onClose={() => setActiveModal('none')} 
        onImport={handleImportCSV} 
      />

      <CarteiraModal
        isOpen={activeModal === 'carteira'}
        onClose={() => { setActiveModal('none'); setEditCarteira(null); }}
        onSave={saveCarteira}
        onDelete={deleteCarteira}
        editData={editCarteira}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('confirm_delete')}
        message={
          deleteType === 'bulk_lancamento' 
            ? t('confirm_delete_bulk', { count: bulkTargets.length })
            : t('confirm_delete_msg')
        }
      />

      {/* TOAST */}
      <div className={`toast ${isToastVisible ? 'show' : ''}`} style={toastType === 'erro' ? { background: 'rgba(208, 42, 34, 0.9)' } : {}}>
        {toastMsg}
      </div>
    </div>
  );
}
