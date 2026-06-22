import React from 'react';
import { motion } from 'motion/react';
import { Doughnut } from 'react-chartjs-2';
import { Edit2, Trash2, PieChart, Activity, TrendingUp } from 'lucide-react';
import { dbService } from '../services/dbService';
import { DBState, Investimento, COLORS, INV_TYPE_MAP } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

interface Props {
  db: DBState;
  onEdit: (i: Investimento) => void;
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
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

export default function Investments({ db, onEdit, onDelete }: Props) {
  const { isDark, t, formatCurrency } = usePreferences();
  const total = db.investimentos.reduce((s, i) => s + (i.qtd * i.preco), 0);
  const totalOriginal = db.investimentos.reduce((s, i) => s + i.valor, 0); 
  
  const totalPatrimonio = db.investimentos.reduce((s, i) => s + i.valor, 0);
  const totalInvestido = db.investimentos.reduce((s, i) => s + (i.qtd * i.preco), 0);
  const totalLucro = totalPatrimonio - totalInvestido;
  const percTotalValorizacao = totalInvestido > 0 ? (totalLucro / totalInvestido) * 100 : 0;

  // Chart data
  const tiposMap: Record<string, number> = {};
  db.investimentos.forEach(i => {
    tiposMap[i.tipo] = (tiposMap[i.tipo] || 0) + i.valor;
  });
  
  const labels = Object.keys(tiposMap);
  const translatedLabels = labels.map(tipo => {
    const key = INV_TYPE_MAP[tipo];
    return key ? t(key) : tipo;
  });
  const chartData = {
    labels: translatedLabels,
    datasets: [{
      data: Object.values(tiposMap),
      backgroundColor: COLORS.slice(0, labels.length),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <div className="investments-page">
      <div className="charts-row" style={{ marginBottom: '14px' }}>
        <div className="card">
          <div className="card-title"><PieChart size={14} /> {t('distribution')}</div>
          <div style={{ position: 'relative', height: '185px' }}>
            {labels.length > 0 ? (
              <Doughnut 
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  layout: {
                    padding: 8
                  },
                  plugins: {
                    legend: {
                      position: window.innerWidth < 768 ? 'bottom' : 'right',
                      labels: {
                        boxWidth: 8,
                        boxHeight: 8,
                        usePointStyle: false,
                        font: { size: 8.5 },
                        color: isDark ? 'rgba(235,235,245,0.7)' : '#48484a',
                        padding: 6
                      }
                    }
                  }
                }}
              />
            ) : (
                <div className="empty">{t('none_found')}</div>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-title"><Activity size={14} /> {t('summary')}</div>
          <div style={{ padding: '10px 0', borderBottom: '1px solid var(--sep)' }}>
            <div className="saldo-label">{t('current_patrimony')}</div>
            <div className="t-h2" style={{ letterSpacing: '-.5px' }}>
              {formatCurrency(totalPatrimonio)}
            </div>
          </div>
          <div style={{ padding: '10px 0', borderBottom: '1px solid var(--sep)', display: 'flex', gap: '20px' }}>
            <div>
              <div className="saldo-label">{t('total_profit')}</div>
              <div className={`metric-val ${totalLucro >= 0 ? 'pos' : 'neg'} t-body-lg t-bold`}>
                {totalLucro >= 0 ? '+' : ''}{formatCurrency(totalLucro)}
              </div>
            </div>
            <div>
              <div className="saldo-label">{t('appreciation')}</div>
              <div className={`metric-val ${percTotalValorizacao >= 0 ? 'pos' : 'neg'} t-body-lg t-bold`}>
                {percTotalValorizacao >= 0 ? '+' : ''}{percTotalValorizacao.toFixed(2)}%
              </div>
            </div>
          </div>
          <div style={{ padding: '10px 0' }}>
            <div className="saldo-label">{t('total_invested')}</div>
            <div className="t-body t-medium t-muted">
              {formatCurrency(totalInvestido)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><TrendingUp size={14} /> {t('investments')}</div>
        {db.investimentos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📈</div>
            {t('no_investments_yet')}
          </div>
        ) : (
          <motion.div className="inv-lista" variants={container} initial="hidden" animate="show">
            {db.investimentos.map(i => {
              const investido = i.qtd * i.preco;
              const lucro = i.valor - investido;
              const valorizacao = investido > 0 ? (lucro / investido) * 100 : 0;
              
              return (
                <motion.div key={i.id} className="inv-row" variants={itemVar} whileHover={{ x: 5, background: 'rgba(0,0,0,0.02)' }}>
                  <div style={{ flex: 2 }}>
                    <div className="t-body-lg t-bold">{i.ativo}</div>
                    <div className="t-xs t-muted t-medium" style={{ marginTop: '2px' }}>
                      {INV_TYPE_MAP[i.tipo] ? t(INV_TYPE_MAP[i.tipo]) : i.tipo} · {i.qtd} {t('units')} · {formatCurrency(i.preco)}
                      {i.data && ` · ${dbService.formatDate(i.data)}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 1.2, paddingRight: '12px' }}>
                    <div className="t-body t-semibold">{formatCurrency(i.valor)}</div>
                    <div className={`${lucro >= 0 ? 'pos' : 'neg'} t-xs t-bold`} style={{ marginTop: '2px' }}>
                       {lucro >= 0 ? '▲' : '▼'} {valorizacao.toFixed(2)}% ({formatCurrency(lucro)})
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button className="action-btn edit" onClick={() => onEdit(i)}><Edit2 size={13} /></button>
                    <button className="action-btn del" onClick={() => onDelete(i.id)}><Trash2 size={13} /></button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
