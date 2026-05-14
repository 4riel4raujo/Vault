import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarElement, 
  CategoryScale, 
  Chart as ChartJS, 
  Legend, 
  LinearScale, 
  Title, 
  Tooltip, 
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Calendar, TrendingUp, PieChart, Activity } from 'lucide-react';
import { dbService } from '../services/dbService';
import { DBState, COLORS, Carteira, CAT_MAP } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface Props {
  db: DBState;
  activeWall?: Carteira | null;
  onViewMore?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVar = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

import { usePreferences } from '../contexts/PreferencesContext';

export default function Dashboard({ db, activeWall, onViewMore }: Props) {
  const { formatCurrency, t, isDark, language } = usePreferences();
  const [periodoFluxo, setPeriodoFluxo] = useState(6);
  const [periodoCat, setPeriodoCat] = useState(6);
  const [catCustomDates, setCatCustomDates] = useState<{ from: string, to: string } | null>(null);
  const [isCatPickerOpen, setIsCatPickerOpen] = useState(false);
  
  const chartColors = {
    font: { family: "var(--sf)", size: 11 },
    color: isDark ? 'rgba(235,235,245,0.55)' : '#8e8e93',
    grid: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(60,60,67,0.07)',
    legendColor: isDark ? 'rgba(235,235,245,0.75)' : '#48484a',
  };

  const tm = dbService.getTotais(db.lancamentos, dbService.getCurrentMonth());
  const tudo = dbService.getTotais(db.lancamentos);
  const totalInv = activeWall?.tipo === 'Empresarial' ? 0 : db.investimentos.reduce((s, i) => s + i.valor, 0);

  // Fluxo de Caixa Logic
  const fluxoLabels: string[] = [];
  const fluxoSoldos: { rec: number[], desp: number[] } = { rec: [], desp: [] };
  
  if (periodoFluxo === 1) {
    // Show last 4 weeks
    for (let w = 3; w >= 0; w--) {
      const fr = new Date(); fr.setDate(fr.getDate() - (w + 1) * 7);
      const to = new Date(); to.setDate(to.getDate() - w * 7);
      fluxoLabels.push(`${t('week') || 'Sem'} ${4 - w}`);
      const weekLanc = db.lancamentos.filter(l => {
        const d = new Date(l.data + 'T00:00:00');
        return d >= fr && d < to;
      });
      const tTotais = dbService.getTotais(weekLanc);
      fluxoSoldos.rec.push(tTotais.rec);
      fluxoSoldos.desp.push(tTotais.desp);
    }
  } else {
    for (let i = periodoFluxo - 1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = dbService.getMonthKey(d.toISOString().slice(0, 10));
      fluxoLabels.push(d.toLocaleDateString(language, { month: 'short' }));
      const tTotais = dbService.getTotais(db.lancamentos, key);
      fluxoSoldos.rec.push(tTotais.rec);
      fluxoSoldos.desp.push(tTotais.desp);
    }
  }

  const fluxoData = {
    labels: fluxoLabels,
    datasets: [
      {
        label: t('income'),
        data: fluxoSoldos.rec,
        backgroundColor: isDark ? 'rgba(0,212,100,0.90)' : 'rgba(0,180,80,0.88)',
        borderRadius: 8,
      },
      {
        label: t('expense'),
        data: fluxoSoldos.desp,
        backgroundColor: isDark ? 'rgba(255,65,54,0.90)' : 'rgba(255,45,35,0.88)',
        borderRadius: 8,
      }
    ]
  };

  // Categorias Logic
  const catMap: Record<string, number> = {};
  let corteFrom: Date | null = null;
  let corteTo: Date | null = null;

  if (catCustomDates) {
    corteFrom = new Date(catCustomDates.from + 'T00:00:00');
    corteTo = new Date(catCustomDates.to + 'T23:59:59');
  } else {
    corteFrom = new Date();
    corteFrom.setMonth(corteFrom.getMonth() - periodoCat);
  }

  db.lancamentos
    .filter(l => {
      if (l.tipo !== 'despesa') return false;
      const d = new Date(l.data + 'T00:00:00');
      if (corteFrom && d < corteFrom) return false;
      if (corteTo && d > corteTo) return false;
      return true;
    })
    .forEach(l => {
      catMap[l.cat] = (catMap[l.cat] || 0) + l.valor;
    });
  
  const catLabels = Object.keys(catMap).map(c => t(CAT_MAP[c]) || c);
  const catVals = Object.values(catMap);
  const catData = {
    labels: catLabels,
    datasets: [{
      data: catVals,
      backgroundColor: COLORS.slice(0, catLabels.length),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const recent = [...db.lancamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);

  return (
    <motion.div 
      className="dashboard-page"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="saldo-box" variants={itemVar} style={{ marginBottom: '24px' }}>
        <div>
          <div className="saldo-label">{t('patrimony')}</div>
          <div className="saldo-main">{formatCurrency(tudo.saldo + totalInv)}</div>
        </div>
        <div className="saldo-chips">
          <div>
            <div className="saldo-chip-lbl">↑ {t('revenue_month')}</div>
            <div className="saldo-chip-val">{formatCurrency(tm.rec)}</div>
          </div>
          <div>
            <div className="saldo-chip-lbl">↓ {t('expenses_month')}</div>
            <div className="saldo-chip-val">{formatCurrency(tm.desp)}</div>
          </div>
        </div>
      </motion.div>

      <div className="cards-row" style={activeWall?.tipo === 'Empresarial' ? { gridTemplateColumns: 'repeat(3, 1fr)' } : {}}>
        <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
          <div className="metric-icon" style={{ background: 'var(--green-g)' }}>
             <TrendingUpIcon color="var(--green)" />
          </div>
          <div className="metric-label">{t('revenue_month')}</div>
          <div className="metric-val pos">{formatCurrency(tm.rec)}</div>
        </motion.div>
        <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
          <div className="metric-icon" style={{ background: 'var(--red-g)' }}>
             <TrendingDownIcon color="var(--red)" />
          </div>
          <div className="metric-label">{t('expenses_month')}</div>
          <div className="metric-val neg">{formatCurrency(tm.desp)}</div>
        </motion.div>
        <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
          <div className="metric-icon" style={{ background: tm.saldo >= 0 ? 'var(--green-g)' : 'var(--red-g)' }}>
             <span className="t-body-lg t-bold" style={{ color: tm.saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>$</span>
          </div>
          <div className="metric-label">{t('balance_month')}</div>
          <div className={`metric-val ${tm.saldo >= 0 ? 'pos' : 'neg'}`}>{formatCurrency(tm.saldo)}</div>
        </motion.div>
        {activeWall?.tipo !== 'Empresarial' && (
          <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
            <div className="metric-icon" style={{ background: 'rgba(175,82,222,0.13)' }}>
              <TrendingUpIcon color="#af52de" />
            </div>
            <div className="metric-label">{t('investments')}</div>
            <div className="metric-val" style={{ color: 'var(--purple)' }}>{formatCurrency(totalInv)}</div>
          </motion.div>
        )}
      </div>

      <div className="charts-row">
        <motion.div className="card" variants={itemVar} whileHover={{ y: -2 }}>
          <div className="chart-header">
            <div className="card-title"><TrendingUp size={14} /> {t('cash_flow')}</div>
            <div className="period-btns">
               {[1, 3, 6, 12].map(m => (
                 <button 
                  key={m} 
                  className={`period-btn ${periodoFluxo === m ? 'active' : ''}`}
                  onClick={() => setPeriodoFluxo(m)}
                >
                  {m < 12 ? `${m}${t('month_short')}` : `1${t('year_short')}`}
                </button>
               ))}
            </div>
          </div>
          <div style={{ height: '185px' }}>
            <Bar 
              data={fluxoData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                  legend: { display: false },
                  tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.raw as number)}` } }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: chartColors.color, font: chartColors.font } },
                  y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.color, font: chartColors.font } }
                }
              }} 
            />
          </div>
        </motion.div>
        <motion.div className="card" variants={itemVar} whileHover={{ y: -2 }}>
          <div className="chart-header">
            <div className="card-title"><PieChart size={14} /> {t('by_category')}</div>
            <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
              <div className="period-btns">
                {[1, 3, 6].map(m => (
                  <button 
                    key={m} 
                    className={`period-btn ${periodoCat === m && !catCustomDates ? 'active' : ''}`}
                    onClick={() => { setPeriodoCat(m); setCatCustomDates(null); }}
                  >
                    {m}{t('month_short')}
                  </button>
                ))}
                <button 
                  className={`period-btn ${catCustomDates ? 'active' : ''}`}
                  onClick={() => setIsCatPickerOpen(!isCatPickerOpen)}
                >
                  <Calendar size={13} />
                </button>
              </div>

              <AnimatePresence>
                {isCatPickerOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                      background: 'var(--glass-strong)', 
                      backdropFilter: 'blur(30px)',
                      WebkitBackdropFilter: 'blur(30px)',
                      border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '14px',
                      boxShadow: 'var(--shadow-glass)', minWidth: '220px'
                    }}
                  >
                    <div className="t-xs t-bold t-muted t-uppercase" style={{ marginBottom: '8px' }}>{t('custom')}</div>
                    <input 
                      type="date" 
                      value={catCustomDates?.from || ''} 
                      onChange={e => setCatCustomDates(prev => ({ from: e.target.value, to: prev?.to || dbService.getToday() }))}
                      className="t-sm"
                      style={{ marginBottom: '8px', padding: '8px' }}
                    />
                    <input 
                      type="date" 
                      value={catCustomDates?.to || ''} 
                      onChange={e => setCatCustomDates(prev => ({ from: prev?.from || dbService.getToday(), to: e.target.value }))}
                      className="t-sm"
                      style={{ padding: '8px' }}
                    />
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                      <button onClick={() => setIsCatPickerOpen(false)} className="t-sm t-semibold" style={{ color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer' }}>{t('ready')}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div style={{ height: '185px' }}>
            {catVals.length > 0 ? (
              <Doughnut 
                data={catData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: { 
                      position: window.innerWidth < 768 ? 'bottom' as const : 'right' as const,
                      labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 }, color: chartColors.legendColor }
                    },
                    tooltip: {
                      callbacks: {
                        label: ctx => {
                          const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                          const pct = (((ctx.raw as number) / total) * 100).toFixed(1);
                          return ` ${dbService.formatCurrency(ctx.raw as number)} (${pct}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="empty t-body t-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                {t('no_expenses_recorded')}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" variants={itemVar} style={{ marginTop: '14px', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 18px 0 18px' }}>
          <div className="card-title" style={{ marginBottom: '12px' }}>
            <Activity size={14} /> {t('recent_transactions')}
          </div>
        </div>
        <div style={{ padding: '0' }}>
          {recent.length > 0 ? recent.map((l) => (
            <div key={l.id} className="transaction-row">
              <div style={{ flex: 1 }}>
                <div className="t-body t-semibold">{l.desc}</div>
                <div className="t-xs t-muted" style={{ marginTop: '2px' }}>
                  {dbService.formatDate(l.data)} · <span className="tag" style={{ padding: '0px 6px', fontSize: '9px' }}>{t(CAT_MAP[l.cat]) || l.cat}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`t-body t-bold ${l.tipo === 'receita' ? 'pos' : l.tipo === 'despesa' ? 'neg' : 'accent-txt'}`}>
                  {l.tipo === 'despesa' ? '-' : l.tipo === 'receita' ? '+' : ''} {formatCurrency(l.valor)}
                </div>
                <div className="t-xs t-muted" style={{ opacity: 0.7 }}>
                  {l.tipo === 'investimento' ? t('investment_aporte') || 'Aporte' : t(l.tipo) || l.tipo}
                </div>
              </div>
            </div>
          )) : (
            <div className="empty" style={{ padding: '40px' }}>{t('no_recent_transactions') || 'Nenhuma transação recente'}</div>
          )}
        </div>
        {recent.length > 0 && (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <motion.button 
              onClick={onViewMore}
              className="t-sm t-bold t-uppercase"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--accent)', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                letterSpacing: '0.5px',
                opacity: 0.8
              }}
              whileHover={{ scale: 1.05, opacity: 1, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('see_all')}
            </motion.button>
          </div>
        )}
      </motion.div>


    </motion.div>
  );
}

function TrendingUpIcon({ color }: { color: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" style={{ width: '17px', height: '17px' }}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
}

function TrendingDownIcon({ color }: { color: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" style={{ width: '17px', height: '17px' }}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
}

