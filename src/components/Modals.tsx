import React, { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ArrowUpCircle, ArrowDownCircle, TrendingUp, Plus } from 'lucide-react';
import { OperationType, CATS, Lancamento, Meta, Investimento, Carteira, CAT_MAP, COLOR_MAP } from '../types';
import { dbService } from '../services/dbService';
import { usePreferences } from '../contexts/PreferencesContext';

import CustomSelect from './ui/CustomSelect';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  saveVariant?: 'primary' | 'danger';
}

export function GenericModal({ isOpen, onClose, title, children, onSave, onDelete, saveLabel, saveVariant = 'primary' }: ModalProps) {
  const { t } = usePreferences();
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="overlay" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div 
              className="modal"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 30, stiffness: 420 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-title">{title}</div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                  }
                }}
              >
                {children}
              </motion.div>
              <div className="modal-actions" style={{ marginTop: '32px', display: 'flex', gap: '12px', width: '100%' }}>
                {onDelete && (
                  <button 
                    className="btn btn-danger" 
                    onClick={onDelete} 
                    style={{ 
                      flex: '1', 
                      justifyContent: 'center',
                      background: 'var(--red-g)',
                      color: 'var(--red)',
                      border: '1.5px solid rgba(239, 68, 68, 0.15)',
                      padding: '12px 16px',
                      borderRadius: 'var(--r-md)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t('delete')}
                  </button>
                )}
                <button 
                  className="btn" 
                  onClick={onClose}
                  style={{ 
                    flex: onDelete ? '1.2' : '1', 
                    justifyContent: 'center',
                    background: 'var(--bg-from, rgba(255, 255, 255, 0.9))',
                    border: '1.5px solid var(--glass-border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--text)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t('cancel')}
                </button>
                <button 
                  className={`btn btn-${saveVariant}`} 
                  onClick={onSave}
                  style={{ 
                    flex: onDelete ? '1.5' : '1.2', 
                    justifyContent: 'center',
                    background: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    color: '#ffffff',
                    fontWeight: '700',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(0, 100, 45, 0.15)'
                  }}
                >
                  {saveLabel || t('save')}
                </button>
              </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

// ── TRANSACTION MODAL ──
interface LancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Lancamento>) => void;
  editData?: Lancamento | null;
}

export function LancamentoModal({ isOpen, onClose, onSave, editData }: LancamentoModalProps) {
  const { t, currency } = usePreferences();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
  const [tipo, setTipo] = useState<OperationType>(OperationType.DESPESA);
  const [data, setData] = useState(dbService.getToday());
  const [valor, setValor] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (editData) {
      setTipo(editData.tipo);
      setData(editData.data);
      setValor(String(editData.valor));
      setDesc(editData.desc);
      setCat(editData.cat);
      setObs(editData.obs || '');
    } else {
      setTipo(OperationType.DESPESA);
      setData(dbService.getToday());
      setValor('');
      setDesc('');
      setCat(CATS[OperationType.DESPESA][0]);
      setObs('');
    }
  }, [editData, isOpen]);

  const handleTipoChange = (newTipo: OperationType) => {
    setTipo(newTipo);
    setCat(CATS[newTipo][0]);
  };

  const handleSave = () => {
    if (!valor || parseFloat(valor) <= 0 || !desc || !data) return;
    onSave({ tipo, data, valor: parseFloat(valor), desc, cat, obs });
  };

  return (
    <GenericModal isOpen={isOpen} onClose={onClose} title={editData ? t('edit_transaction') : t('new_transaction_modal')} onSave={handleSave}>
      <div className="fg">
        <label>{t('transaction_type')}</label>
        <div className="type-selector">
          <button 
            className={`type-btn ${tipo === OperationType.RECEITA ? 'active receita' : ''}`}
            onClick={() => handleTipoChange(OperationType.RECEITA)}
          >
            <ArrowUpCircle size={18} />
            {t('income')}
          </button>
          <button 
            className={`type-btn ${tipo === OperationType.DESPESA ? 'active despesa' : ''}`}
            onClick={() => handleTipoChange(OperationType.DESPESA)}
          >
            <ArrowDownCircle size={18} />
            {t('expense')}
          </button>
          <button 
            className={`type-btn ${tipo === OperationType.INVESTIMENTO ? 'active investimento' : ''}`}
            onClick={() => handleTipoChange(OperationType.INVESTIMENTO)}
          >
            <TrendingUp size={18} />
            {t('invest')}
          </button>
        </div>
      </div>
      
      <div className="fr">
        <div className="fg"><label>{t('date')}</label><input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
        <div className="fg">
          <label>{t('value')} ({currencySymbol})</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="number" 
              step="0.01" 
              value={valor} 
              onChange={e => setValor(e.target.value)} 
              placeholder="0,00" 
            />
          </div>
        </div>
      </div>

      <div className="fg"><label>{t('description')}</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('placeholder_description_modal')} /></div>
      
      <div className="fg">
        <label>{t('category')}</label>
        <div className="category-grid">
          {CATS[tipo].map(c => (
            <div 
              key={c} 
              className={`cat-chip ${cat === c ? 'active' : ''}`}
              onClick={() => setCat(c)}
            >
              {t(CAT_MAP[c]) || c}
            </div>
          ))}
        </div>
      </div>

      <div className="fg"><label>{t('optional_note')}</label><input type="text" value={obs} onChange={e => setObs(e.target.value)} placeholder={t('details_placeholder')} /></div>
    </GenericModal>
  );
}

// ── GOAL MODAL ──
interface MetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Meta>) => void;
  editData?: Meta | null;
}

export function MetaModal({ isOpen, onClose, onSave, editData }: MetaModalProps) {
  const { t, currency } = usePreferences();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [atual, setAtual] = useState('');
  const [prazo, setPrazo] = useState('');
  const [cor, setCor] = useState('#00843D');

  useEffect(() => {
    if (editData) {
      setTitulo(editData.titulo);
      setValor(String(editData.valor));
      setAtual(String(editData.atual));
      setPrazo(editData.prazo);
      setCor(editData.cor);
    } else {
      setTitulo(''); setValor(''); setAtual(''); setPrazo(''); setCor('#00843D');
    }
  }, [editData, isOpen]);

  const handleSave = () => {
    if (!titulo || !valor) return;
    onSave({ titulo, valor: parseFloat(valor), atual: parseFloat(atual) || 0, prazo, cor });
  };

  return (
    <GenericModal isOpen={isOpen} onClose={onClose} title={editData ? t('edit_goal') : t('new_goal_modal')} onSave={handleSave}>
      <div className="fg"><label>{t('new_goal')}</label><input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('placeholder_emergency_fund')} /></div>
      <div className="fr">
        <div className="fg"><label>{t('target_value')} ({currencySymbol})</label><input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" /></div>
        <div className="fg"><label>{t('already_saved')} ({currencySymbol})</label><input type="number" value={atual} onChange={e => setAtual(e.target.value)} placeholder="0,00" /></div>
      </div>
      <div className="fr">
        <div className="fg"><label>{t('deadline')}</label><input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
        <div className="fg">
          <label>{t('color')}</label>
          <CustomSelect
            value={cor}
            onChange={setCor}
            options={[
              { value: '#00843D', label: t('green') },
              { value: '#00A94F', label: t('light_green') },
              { value: '#af52de', label: t('purple') },
              { value: '#ff9500', label: t('orange') },
              { value: '#ff3b30', label: t('red_color') }
            ]}
            menuPlacement="top"
          />
        </div>
      </div>
    </GenericModal>
  );
}

// ── INVESTMENT MODAL ──
interface InvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Investimento>) => void;
  editData?: Investimento | null;
}

export function InvModal({ isOpen, onClose, onSave, editData }: InvModalProps) {
  const { t, currency } = usePreferences();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
  const [ativo, setAtivo] = useState('');
  const [tipo, setTipo] = useState('Ações');
  const [valor, setValor] = useState('');
  const [qtd, setQtd] = useState('');
  const [preco, setPreco] = useState('');
  const [data, setData] = useState(dbService.getToday());
  const [rentabilidade, setRentabilidade] = useState('');

  useEffect(() => {
    if (editData) {
      setAtivo(editData.ativo); setTipo(editData.tipo);
      setValor(String(editData.valor)); setQtd(String(editData.qtd));
      setPreco(String(editData.preco));
      setData(editData.data || dbService.getToday());
      setRentabilidade(editData.rentabilidadeMensal ? String(editData.rentabilidadeMensal) : '');
    } else {
      setAtivo(''); setTipo('Ações'); setValor(''); setQtd(''); setPreco('');
      setData(dbService.getToday()); setRentabilidade('');
    }
  }, [editData, isOpen]);

  const handleYieldChange = (y: string) => {
    setRentabilidade(y);
    const yieldVal = parseFloat(y);
    const currentVal = parseFloat(valor);
    if (!isNaN(yieldVal) && !isNaN(currentVal) && yieldVal !== 0) {
      const newVal = currentVal * (1 + yieldVal / 100);
      setValor(newVal.toFixed(2));
    }
  };

  const handleSave = () => {
    if (!ativo || !valor) return;
    onSave({ 
      ativo, 
      tipo, 
      valor: parseFloat(valor), 
      qtd: parseFloat(qtd) || 0, 
      preco: parseFloat(preco) || 0,
      data,
      rentabilidadeMensal: parseFloat(rentabilidade) || 0
    });
  };

  return (
    <GenericModal isOpen={isOpen} onClose={onClose} title={editData ? t('edit_investment') : t('new_investment_modal')} onSave={handleSave}>
      <div className="fg"><label>{t('asset')}</label><input type="text" value={ativo} onChange={e => setAtivo(e.target.value)} placeholder={t('placeholder_asset')} /></div>
      <div className="fg">
        <label>{t('type')}</label>
        <CustomSelect
          value={tipo}
          onChange={setTipo}
          options={[
            { value: 'Ações', label: t('stocks') },
            { value: 'FIIs', label: t('fiis') },
            { value: 'Tesouro', label: t('treasury') },
            { value: 'Cripto', label: t('crypto') },
            { value: 'Renda Fixa', label: t('fixed_income') },
            { value: 'Outros Ativos', label: t('other_assets') }
          ]}
        />
      </div>
      <div className="fr">
        <div className="fg"><label>{t('contribution_date')}</label><input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
        <div className="fg"><label>{t('total_value')} ({currencySymbol})</label><input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" /></div>
      </div>
      <div className="fr">
        <div className="fg"><label>{t('quantity')}</label><input type="number" value={qtd} onChange={e => setQtd(e.target.value)} placeholder="Ex: 100" /></div>
        <div className="fg"><label>{t('average_price')} ({currencySymbol})</label><input type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" /></div>
      </div>
      <div className="fg">
        <label>{t('monthly_yield')} (%)</label>
        <input 
          type="number" 
          step="0.01" 
          value={rentabilidade} 
          onChange={e => handleYieldChange(e.target.value)} 
          placeholder="0.00%" 
        />
        <div className="t-xs t-muted" style={{ marginTop: '4px' }}>
          {t('yield_calculation_info') || 'Ao alterar, o valor total será ajustado proporcionalmente.'}
        </div>
      </div>
    </GenericModal>
  );
}

// ── WALLET (CARTEIRA) MODAL ──
interface CarteiraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Carteira>) => void;
  onDelete?: (id: string) => void;
  editData?: Carteira | null;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
}) {
  const { t } = usePreferences();
  return (
    <GenericModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      onSave={onConfirm}
      saveLabel={t('delete_now')}
      saveVariant="danger"
    >
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <p style={{ color: 'var(--text)', fontSize: '15px' }}>{message}</p>
        <p style={{ color: 'var(--red)', fontSize: '12px', marginTop: '12px', fontWeight: 500 }}>
          {t('cannot_be_undone')}
        </p>
      </div>
    </GenericModal>
  );
}

export function CarteiraModal({ isOpen, onClose, onSave, onDelete, editData }: CarteiraModalProps) {
  const { t } = usePreferences();
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Pessoal');
  const [descricao, setDescricao] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cpf, setCpf] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (isOpen && editData) {
      setNome(editData.nome);
      setTipo(editData.tipo);
      setDescricao(editData.descricao || '');
      setCnpj(editData.cnpj || '');
      setRazaoSocial(editData.razaoSocial || '');
      setCpf(editData.cpf || '');
      setNomeCompleto(editData.nomeCompleto || '');
    } else if (isOpen && !editData) {
      setNome('');
      setTipo('Pessoal');
      setDescricao('');
      setCnpj('');
      setRazaoSocial('');
      setCpf('');
      setNomeCompleto('');
    }
  }, [editData, isOpen]);

  const handleSave = () => {
    if (!nome) {
      setError(t('wallet_name_required') || 'Nome da carteira é obrigatório');
      return;
    }
    if (tipo === 'Empresarial' && (!cnpj || !razaoSocial)) {
      setError(t('cnpj_razao_required') || 'Razão Social e CNPJ são obrigatórios');
      return;
    }
    setError(null);
    onSave({ 
      nome, 
      tipo, 
      descricao, 
      cnpj: tipo === 'Empresarial' ? cnpj : '', 
      razaoSocial: tipo === 'Empresarial' ? razaoSocial : '',
      cpf: tipo === 'Pessoal' ? cpf : '',
      nomeCompleto: tipo === 'Pessoal' ? nomeCompleto : ''
    });
  };

  return (
    <GenericModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? t('edit_wallet') : t('new_wallet_modal')} 
      onSave={handleSave}
      onDelete={editData && onDelete ? () => { onDelete(editData.id); onClose(); } : undefined}
    >
      {error && (
        <div style={{ 
          padding: '10px 14px', 
          borderRadius: '12px', 
          background: 'rgba(239, 68, 68, 0.12)', 
          border: '1px solid rgba(239, 68, 68, 0.25)', 
          color: '#ff4c4c', 
          fontSize: '13px', 
          fontWeight: '500', 
          marginBottom: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <span style={{ fontSize: '15px' }}>⚠️</span> {error}
        </div>
      )}
      <div className="fg"><label>{t('wallet_name')}</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder={t('placeholder_wallet')} /></div>
      <div className="fg">
        <label>{t('type')}</label>
        <CustomSelect
          value={tipo}
          onChange={setTipo}
          options={[
            { value: 'Pessoal', label: t('personal') },
            { value: 'Empresarial', label: t('business') }
          ]}
        />
      </div>

      {tipo === 'Pessoal' && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          padding: '20px', 
          background: 'var(--input-bg)', 
          borderRadius: 'var(--r-md)', 
          marginBottom: '20px', 
          border: '1.5px solid var(--glass-border)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div className="fg" style={{ marginBottom: 0 }}><label>{t('full_name')}</label><input type="text" value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} placeholder={t('full_name')} /></div>
          <div className="fg" style={{ marginBottom: 0 }}><label>{t('cpf')}</label><input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
        </div>
      )}

      {tipo === 'Empresarial' && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          padding: '20px', 
          background: 'var(--input-bg)', 
          borderRadius: 'var(--r-md)', 
          marginBottom: '20px', 
          border: '1.5px solid var(--glass-border)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div className="fg" style={{ marginBottom: 0 }}><label>{t('business_name')}</label><input type="text" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder={t('business_name')} /></div>
          <div className="fg" style={{ marginBottom: 0 }}><label>{t('cnpj')}</label><input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
        </div>
      )}

      <div className="fg">
        <label>{t('optional_note')}</label>
        <textarea 
          value={descricao} 
          onChange={e => setDescricao(e.target.value)} 
          placeholder={t('notes_placeholder')}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'inherit', resize: 'vertical' }}
        />
      </div>
    </GenericModal>
  );
}
