import React from 'react';
import { motion } from 'motion/react';
import { Plus, Settings, CreditCard, Landmark, Wallet, Check, ArrowRight } from 'lucide-react';
import { DBState, Carteira } from '../types';

interface Props {
  db: DBState;
  activeCarteiraId: string | null;
  onSelect: (id: string) => void;
  onEdit: (wall: Carteira) => void;
  onNew: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVar = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

import { usePreferences } from '../contexts/PreferencesContext';

export default function WalletsPage({ db, activeCarteiraId, onSelect, onEdit, onNew }: Props) {
  const { t } = usePreferences();

  return (
    <motion.div 
      className="wallets-page"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {db.carteiras.map(wall => (
          <motion.div 
            key={wall.id}
            variants={itemVar}
            whileHover={{ y: -5 }}
            className={`card ${activeCarteiraId === wall.id ? 'active-wall-card' : ''}`}
            onClick={() => onSelect(wall.id)}
            style={{ 
              cursor: 'pointer', 
              position: 'relative', 
              borderRadius: '24px',
              border: activeCarteiraId === wall.id ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '16px', background: 'var(--accent-low)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
              }}>
                {wall.tipo === 'Empresarial' ? <Landmark size={28} /> : <Wallet size={28} />}
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-h3">{wall.nome}</div>
                <div className="t-sm t-muted">{wall.tipo === 'Empresarial' ? t('business') : t('personal')}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  onClick={(e) => { e.stopPropagation(); onEdit(wall); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px' }}
                >
                  <Settings size={18} />
                </motion.button>
                
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '16px', 
                  background: activeCarteiraId === wall.id ? 'var(--accent)' : 'var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeCarteiraId === wall.id ? 'white' : 'var(--muted)',
                  transition: 'all 0.3s'
                }}>
                  {activeCarteiraId === wall.id ? <Check size={18} /> : <ArrowRight size={18} />}
                </div>
              </div>
            </div>

            {wall.tipo === 'Pessoal' && (wall.nomeCompleto || wall.cpf) && (
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                {wall.nomeCompleto && (
                  <>
                    <div className="t-xs t-muted t-uppercase t-bold">{t('full_name')}</div>
                    <div className="t-body t-semibold">{wall.nomeCompleto}</div>
                  </>
                )}
                {wall.cpf && (
                  <>
                    <div className="t-body t-bold" style={{ marginTop: '6px' }}>{t('cpf')}</div>
                    <div className="t-body">{wall.cpf}</div>
                  </>
                )}
              </div>
            )}

            {wall.tipo === 'Empresarial' && (
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                <div className="t-xs t-muted t-uppercase t-bold">{t('business_name')}</div>
                <div className="t-body t-semibold">{wall.razaoSocial}</div>
                <div className="t-xs t-muted t-uppercase t-bold" style={{ marginTop: '6px' }}>{t('cnpj')}</div>
                <div className="t-body">{wall.cnpj}</div>
              </div>
            )}

            {wall.descricao && (
              <p className="t-body t-muted" style={{ margin: 0, opacity: 0.8 }}>{wall.descricao}</p>
            )}

            {activeCarteiraId === wall.id && (
              <div 
                className="t-xs t-bold t-uppercase"
                style={{ 
                  position: 'absolute', bottom: '24px', right: '24px', background: 'var(--accent)', 
                  color: 'white', padding: '4px 12px', borderRadius: '20px',
                  letterSpacing: '0.05em'
                }}
              >
                {t('selected_caps')}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
