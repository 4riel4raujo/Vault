import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import { DBState, Meta } from '../types';

interface Props {
  db: DBState;
  onEdit: (m: Meta) => void;
  onDelete: (id: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVar = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

import { usePreferences } from '../contexts/PreferencesContext';

export default function Goals({ db, onEdit, onDelete }: Props) {
  const { formatCurrency, t } = usePreferences();

  if (db.metas.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon" style={{ fontSize: '48px' }}>🎯</div>
        {t('no_goals_yet')}
      </div>
    );
  }

  return (
    <motion.div className="metas-wrap" variants={container} initial="hidden" animate="show">
      {db.metas.map(m => {
        const pct = Math.min(100, Math.round(m.atual / m.valor * 100));
        const falta = Math.max(0, m.valor - m.atual);
        
        let prazoTxt = '';
        if (m.prazo) {
          const dias = Math.ceil((new Date(m.prazo + 'T00:00:00').getTime() - new Date().getTime()) / 864e5);
          prazoTxt = dias > 0 ? `${dias} ${t('days_remaining')}` : t('deadline_over');
        }

        return (
          <motion.div key={m.id} className="card" style={{ marginBottom: '12px' }} variants={itemVar} whileHover={{ y: -4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{m.titulo}</div>
                {m.prazo && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {prazoTxt} · {dbService.formatDate(m.prazo)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="action-btn edit" onClick={() => onEdit(m)}><Edit2 size={13} /></button>
                <button className="action-btn del" onClick={() => onDelete(m.id)}><Trash2 size={13} /></button>
              </div>
            </div>
            
            <div className="prog-header">
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                {formatCurrency(m.atual)} {t('of')} {formatCurrency(m.valor)}
                {falta > 0 && ` · ${t('remaining')} ${formatCurrency(falta)}`}
              </span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: m.cor }}>{pct}%</span>
            </div>
            
            <div className="prog-bar">
              <motion.div 
                className="prog-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                style={{ background: m.cor }} 
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
