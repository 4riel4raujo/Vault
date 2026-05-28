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
    transition: { staggerChildren: 0.05 }
  }
};

const itemVar = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
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
            whileHover={{ y: -6, scale: 1.01, boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}
            className={`card ${activeCarteiraId === wall.id ? 'active-wall-card' : ''}`}
            onClick={() => onSelect(wall.id)}
            style={{ 
              cursor: 'pointer', 
              position: 'relative', 
              borderRadius: 'var(--r-xl)',
              border: activeCarteiraId === wall.id ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px',
              transition: 'border-color 0.25s ease, background-color 0.25s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', 
                  background: activeCarteiraId === wall.id ? 'rgba(27, 135, 81, 0.12)' : 'var(--accent-low)',
                  border: activeCarteiraId === wall.id ? '1px solid rgba(27, 135, 81, 0.25)' : '1px solid rgba(27, 135, 81, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                  transition: 'all 0.3s'
                }}>
                  {wall.tipo === 'Empresarial' ? <Landmark size={26} /> : <Wallet size={26} />}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-h3" style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {wall.nome}
                  </div>
                  <div className="t-sm t-muted" style={{ fontWeight: 500, fontSize: '12px', marginTop: '2px' }}>
                    {wall.tipo === 'Empresarial' ? t('business') : t('personal')}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onEdit(wall); }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--muted)', 
                      cursor: 'pointer', 
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Settings size={18} />
                  </motion.button>
                  
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: activeCarteiraId === wall.id ? 'var(--accent)' : 'var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: activeCarteiraId === wall.id ? 'white' : 'var(--muted)',
                    transition: 'all 0.3s',
                    boxShadow: activeCarteiraId === wall.id ? '0 4px 10px rgba(0, 169, 79, 0.25)' : 'none'
                  }}>
                    {activeCarteiraId === wall.id ? <Check size={18} strokeWidth={2.5} /> : <ArrowRight size={18} />}
                  </div>
                </div>
              </div>

              {wall.tipo === 'Pessoal' && (wall.nomeCompleto || wall.cpf) && (
                <div style={{ 
                  background: 'var(--input-bg)', 
                  border: '1px solid var(--glass-border)', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  marginBottom: '16px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  {wall.nomeCompleto && (
                    <div style={{ marginBottom: wall.cpf ? '10px' : '0' }}>
                      <div className="t-xs t-muted t-uppercase t-bold" style={{ fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px', opacity: 0.75 }}>
                        {t('full_name')}
                      </div>
                      <div className="t-body t-semibold" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        {wall.nomeCompleto}
                      </div>
                    </div>
                  )}
                  {wall.cpf && (
                    <div>
                      <div className="t-xs t-muted t-uppercase t-bold" style={{ fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px', opacity: 0.75 }}>
                        {t('cpf')}
                      </div>
                      <div className="t-body" style={{ fontSize: '14px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                        {wall.cpf}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wall.tipo === 'Empresarial' && (wall.razaoSocial || wall.cnpj) && (
                <div style={{ 
                  background: 'var(--input-bg)', 
                  border: '1px solid var(--glass-border)', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  marginBottom: '16px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  {wall.razaoSocial && (
                    <div style={{ marginBottom: wall.cnpj ? '10px' : '0' }}>
                      <div className="t-xs t-muted t-uppercase t-bold" style={{ fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px', opacity: 0.75 }}>
                        {t('business_name')}
                      </div>
                      <div className="t-body t-semibold" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        {wall.razaoSocial}
                      </div>
                    </div>
                  )}
                  {wall.cnpj && (
                    <div>
                      <div className="t-xs t-muted t-uppercase t-bold" style={{ fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px', opacity: 0.75 }}>
                        {t('cnpj')}
                      </div>
                      <div className="t-body" style={{ fontSize: '14px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                        {wall.cnpj}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginTop: '12px', 
              gap: '12px', 
              flexWrap: 'wrap',
              minHeight: '32px'
            }}>
              <p className="t-body t-muted" style={{ margin: 0, opacity: 0.8, fontSize: '13px', fontStyle: 'italic', flex: '1', minWidth: '150px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                {wall.descricao || ''}
              </p>
              {activeCarteiraId === wall.id && (
                <div 
                  className="t-xs t-bold t-uppercase"
                  style={{ 
                    background: 'var(--accent)', 
                    color: 'white', 
                    padding: '6px 14px', 
                    borderRadius: '20px',
                    letterSpacing: '0.05em',
                    fontSize: '11px',
                    fontWeight: '700',
                    boxShadow: '0 2px 8px rgba(0, 169, 79, 0.2)'
                  }}
                >
                  {t('selected_caps')}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
