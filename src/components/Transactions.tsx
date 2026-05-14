import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, Trash2, Edit2, FileUp, LayoutList, ArrowUpCircle, ArrowDownCircle, TrendingUp, Check } from 'lucide-react';
import { dbService } from '../services/dbService';
import { DBState, OperationType, Lancamento, CATS } from '../types';

interface Props {
  db: DBState;
  onEdit: (l: Lancamento) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkEditCat: (ids: string[], cat: string) => Promise<void>;
  onBulkEditType: (ids: string[], type: string) => Promise<void>;
  onNew: () => void;
  onImport: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVar = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

import { usePreferences } from '../contexts/PreferencesContext';
import CustomSelect from './ui/CustomSelect';

export default function Transactions({ db, onEdit, onDelete, onBulkDelete, onBulkEditCat, onBulkEditType, onNew, onImport }: Props) {
  const { formatCurrency, t, language } = usePreferences();
  const [busca, setBusca] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const meses = [...new Set(db.lancamentos.map(l => dbService.getMonthKey(l.data)))]
    .filter(Boolean)
    .sort()
    .reverse();

  let filtered = [...db.lancamentos].sort((a, b) => b.data.localeCompare(a.data));

  if (tipoFiltro !== 'todos') {
    filtered = filtered.filter(l => l.tipo === tipoFiltro);
  }
  if (mesFiltro) {
    filtered = filtered.filter(l => dbService.getMonthKey(l.data) === mesFiltro);
  }
  if (busca) {
    const b = busca.toLowerCase();
    filtered = filtered.filter(l => 
      l.desc.toLowerCase().includes(b) || 
      l.cat.toLowerCase().includes(b) || 
      l.tipo.toLowerCase().includes(b) ||
      (l.obs || '').toLowerCase().includes(b)
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(l => l.id));
    }
  };

  const handleBulkCatSubmit = async (cat: string) => {
    if (cat && selectedIds.length > 0) {
      const idsToUpdate = [...selectedIds];
      await onBulkEditCat(idsToUpdate, cat);
      setSelectedIds([]);
    }
  };

  const handleBulkTypeSubmit = async (type: string) => {
    if (type && selectedIds.length > 0) {
      const idsToUpdate = [...selectedIds];
      await onBulkEditType(idsToUpdate, type);
      setSelectedIds([]);
    }
  };

  const allCats = [...new Set([
    ...CATS[OperationType.RECEITA],
    ...CATS[OperationType.DESPESA],
    ...CATS[OperationType.INVESTIMENTO],
    ...db.lancamentos.map(l => l.cat)
  ])].filter(Boolean).sort();

  return (
    <div className="transactions-page">

      <div className="search-row">
        <div className="search-wrap">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={t('search_transactions')} 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="month-filter">
          <CustomSelect
            value={mesFiltro}
            onChange={setMesFiltro}
            options={[
              { value: '', label: t('all_months') },
              ...meses.map(m => ({
                value: m,
                label: new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]) - 1)
                  .toLocaleDateString(language, { month: 'long', year: 'numeric' })
              }))
            ]}
            icon={<Filter size={18} />}
            placeholder={t('all_months')}
          />
        </div>
      </div>

      <div className="chips-row-wrapper">
        <div className="chips-row scroll-x">
          <div className="chips">
            {[
              { id: 'todos', label: t('all') || 'Tudo', icon: LayoutList },
              { id: 'receita', label: t('incomes') || 'Receitas', icon: ArrowUpCircle },
              { id: 'despesa', label: t('expenses') || 'Despesas', icon: ArrowDownCircle },
              { id: 'investimento', label: t('investments') || 'Investimentos', icon: TrendingUp }
            ].map(tItem => (
              <div 
                key={tItem.id}
                className={`chip ${tipoFiltro === tItem.id ? 'active' : ''} chip-${tItem.id}`}
                onClick={() => { setTipoFiltro(tItem.id); setSelectedIds([]); }}
              >
                <tItem.icon size={14} />
                <span>{tItem.label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              className="bulk-actions-inline mobile-bulk"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="bulk-info-badge">
                <Check size={14} />
                <span>{selectedIds.length} {t('selected_count')}</span>
              </div>
              <div className="bulk-divider" />
              <div className="bulk-tools">
                <CustomSelect
                  value=""
                  onChange={handleBulkTypeSubmit}
                  options={['receita', 'despesa', 'investimento'].map(typeKey => ({
                    value: typeKey,
                    label: t(typeKey)
                  }))}
                  icon={<Filter size={14} />}
                  placeholder={t('change_type')}
                  className="bulk-dropdown-wrap"
                  menuPlacement="bottom"
                />

                <div className="bulk-divider" />

                <CustomSelect
                  value=""
                  onChange={handleBulkCatSubmit}
                  options={allCats.map(cat => ({
                    value: cat,
                    label: cat
                  }))}
                  icon={<LayoutList size={14} />}
                  placeholder={t('change_category')}
                  className="bulk-dropdown-wrap"
                  menuPlacement="bottom"
                />

                <button className="btn-bulk-delete" title={t('delete_selected')} onClick={() => onBulkDelete(selectedIds)}>
                  <Trash2 size={15} />
                </button>
                <div className="bulk-divider" />
                <button className="btn-bulk-close" title={t('cancel_selection')} onClick={() => setSelectedIds([])}>
                  <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card card-transactions">
        <table className="desktop-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <div 
                  className={`custom-checkbox ${selectedIds.length === filtered.length && filtered.length > 0 ? 'active' : ''}`}
                  onClick={toggleSelectAll}
                >
                  {selectedIds.length === filtered.length && filtered.length > 0 && <Check size={12} />}
                </div>
              </th>
              <th>{t('date')}</th>
              <th>{t('description')}</th>
              <th>{t('category')}</th>
              <th>{t('type')}</th>
              <th style={{ textAlign: 'right' }}>{t('value')}</th>
              <th style={{ width: '80px' }}></th>
            </tr>
          </thead>
          <motion.tbody variants={container} initial="hidden" animate="show">
            {filtered.map(l => (
              <motion.tr 
                key={l.id} 
                variants={itemVar} 
                whileHover={{ background: 'rgba(0,0,0,0.02)' }}
                className={selectedIds.includes(l.id) ? 'selected-row' : ''}
              >
                <td>
                  <div 
                    className={`custom-checkbox ${selectedIds.includes(l.id) ? 'active' : ''}`}
                    onClick={() => toggleSelect(l.id)}
                  >
                    {selectedIds.includes(l.id) && <Check size={12} />}
                  </div>
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{dbService.formatDate(l.data)}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{l.desc}</div>
                  {l.obs && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{l.obs}</div>}
                </td>
                <td><span className="tag tag-orange">{l.cat}</span></td>
                <td>
                  <span className={`tag ${l.tipo === 'receita' ? 'tag-green' : l.tipo === 'despesa' ? 'tag-red' : 'tag-purple'}`}>
                    {l.tipo === 'investimento' ? t('investment_aporte') || 'Aporte' : t(l.tipo) || l.tipo}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }} className={l.tipo === 'receita' ? 'pos' : l.tipo === 'despesa' ? 'neg' : 'accent-txt'}>
                  {formatCurrency(l.valor)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="action-btn edit" onClick={() => onEdit(l)}><Edit2 size={13} /></button>
                  <button className="action-btn del" onClick={() => onDelete(l.id)}><Trash2 size={13} /></button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>

        <div className="mobile-only-list">
          <motion.div variants={container} initial="hidden" animate="show" className="mobile-list-container">
            {filtered.map(l => (
              <motion.div 
                key={l.id} 
                variants={itemVar}
                className={`mobile-transaction-card ${selectedIds.includes(l.id) ? 'selected' : ''}`}
                onClick={() => toggleSelect(l.id)}
              >
                <div className="mtc-header">
                  <div className="mtc-check">
                    <div className={`custom-checkbox ${selectedIds.includes(l.id) ? 'active' : ''}`}>
                      {selectedIds.includes(l.id) && <Check size={10} />}
                    </div>
                  </div>
                  <div className="mtc-info">
                    <div className="mtc-desc">{l.desc}</div>
                    <div className="mtc-meta">
                      <span>{dbService.formatDate(l.data)}</span>
                      <span className="dot" style={{ width: 3, height: 3, margin: '0 4px', background: 'var(--muted)' }} />
                      <span>{l.cat}</span>
                    </div>
                  </div>
                  <div className={`mtc-value ${l.tipo === 'receita' ? 'pos' : l.tipo === 'despesa' ? 'neg' : 'accent-txt'}`}>
                    {formatCurrency(l.valor)}
                  </div>
                </div>
                <div className="mtc-footer">
                  <span className={`tag tag-mini ${l.tipo === 'receita' ? 'tag-green' : l.tipo === 'despesa' ? 'tag-red' : 'tag-purple'}`}>
                    {l.tipo === 'investimento' ? t('investment_aporte') || 'Aporte' : t(l.tipo) || l.tipo}
                  </span>
                  <div className="mtc-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="action-btn edit" onClick={() => onEdit(l)}><Edit2 size={13} /></button>
                    <button className="action-btn del" onClick={() => onDelete(l.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📋</div>
            {t('none_found')}
          </div>
        )}
      </div>
    </div>
  );
}
