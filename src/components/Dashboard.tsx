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
import { Calendar, TrendingUp, TrendingDown, PieChart, Activity, DollarSign, ArrowUp, ArrowDown, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
      staggerChildren: 0.04
    }
  }
};

const itemVar = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

import { usePreferences } from '../contexts/PreferencesContext';

export default function Dashboard({ db, activeWall, onViewMore }: Props) {
  const { formatCurrency, t, isDark, language, showBalances, setShowBalances } = usePreferences();
  const [periodoFluxo, setPeriodoFluxo] = useState(6);
  const [periodoCat, setPeriodoCat] = useState(6);
  const [catCustomDates, setCatCustomDates] = useState<{ from: string, to: string } | null>(null);
  const [isCatPickerOpen, setIsCatPickerOpen] = useState(false);
  
  const [updateTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  
  const chartColors = {
    font: { family: "var(--sf)", size: 11 },
    color: isDark ? 'rgba(235,235,245,0.55)' : '#8e8e93',
    grid: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(60,60,67,0.07)',
    legendColor: isDark ? 'rgba(235,235,245,0.75)' : '#48484a',
  };

  const currentMonthKey = dbService.getCurrentMonth();
  
  const getPrevMonthKey = (monthKey: string): string => {
    if (!monthKey || !monthKey.includes('-')) return '';
    const [yearStr, monthStr] = monthKey.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    return `${prevY}-${String(prevM).padStart(2, '0')}`;
  };
  
  const prevMonthKey = getPrevMonthKey(currentMonthKey);

  const tm = dbService.getTotais(db.lancamentos, currentMonthKey);
  const pm = dbService.getTotais(db.lancamentos, prevMonthKey);
  const tudo = dbService.getTotais(db.lancamentos);
  const totalInv = activeWall?.tipo === 'Empresarial' ? 0 : db.investimentos.reduce((s, i) => s + i.valor, 0);

  const getPercentageDiff = (curr: number, prev: number) => {
    if (prev === 0) {
      if (curr === 0) return 0;
      return curr > 0 ? 100 : -100;
    }
    return ((curr - prev) / prev) * 100;
  };

  const recPct = getPercentageDiff(tm.rec, pm.rec);
  const despPct = getPercentageDiff(tm.desp, pm.desp);
  const saldoPct = getPercentageDiff(tm.saldo, pm.saldo);

  const totalInvCurrent = activeWall?.tipo === 'Empresarial' 
    ? 0 
    : db.investimentos
        .filter(i => {
          const iMonth = i.data ? i.data.slice(0, 7) : '';
          return iMonth <= currentMonthKey;
        })
        .reduce((s, i) => s + i.valor, 0);

  const totalInvPrev = activeWall?.tipo === 'Empresarial' 
    ? 0 
    : db.investimentos
        .filter(i => {
          const iMonth = i.data ? i.data.slice(0, 7) : '';
          return iMonth <= prevMonthKey;
        })
        .reduce((s, i) => s + i.valor, 0);

  const invPct = getPercentageDiff(totalInvCurrent, totalInvPrev);

  const vsText = language === 'en-US' ? 'vs previous month' : language === 'es-ES' ? 'vs mes anterior' : 'vs mês anterior';

  const formatPercent = (val: number) => {
    if (Math.abs(val) < 0.05) {
      return '0,0%';
    }
    const sign = val > 0 ? '+' : '';
    const formatted = val.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return `${sign}${formatted}%`;
  };

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
      <motion.div className="saldo-box" variants={itemVar}>
        <div className="saldo-col">
          <div className="saldo-label">
            {t('patrimony')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="saldo-main">
              {showBalances ? formatCurrency(tudo.saldo - tudo.inv + totalInv) : '••••'}
            </div>
            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.85,
                transition: 'opacity 0.2s',
                padding: '4px'
              }}
              title={showBalances ? 'Esconder saldos' : 'Mostrar saldos'}
            >
              {showBalances ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
            </button>
          </div>
          <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '5px', fontWeight: '500' }}>
            {language === 'en-US' ? 'Updated today at' : language === 'es-ES' ? 'Actualizado hoy, a las' : 'Atualizado hoje, às'} {updateTime}
          </div>
        </div>

        <div className="saldo-divider" />

        <div className="saldo-col">
          <div className="saldo-chip-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUp size={11} strokeWidth={3} className="text-emerald-300" /> {t('revenue_month')}
          </div>
          <div className="saldo-chip-val" style={{ fontSize: '20px', fontWeight: '700' }}>
            {showBalances ? formatCurrency(tm.rec) : '••••'}
          </div>
          <div className="saldo-compare" style={{ fontSize: '11px', color: recPct >= 0 ? '#6ee7b7' : '#fca5a5', fontWeight: '600', marginTop: '4px' }}>
            {formatPercent(recPct)} {vsText}
          </div>
        </div>

        <div className="saldo-divider" />

        <div className="saldo-col">
          <div className="saldo-chip-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDown size={11} strokeWidth={3} className="text-rose-300" /> {t('expenses_month')}
          </div>
          <div className="saldo-chip-val" style={{ fontSize: '20px', fontWeight: '700' }}>
            {showBalances ? formatCurrency(tm.desp) : '••••'}
          </div>
          <div className="saldo-compare" style={{ fontSize: '11px', color: despPct <= 0 ? '#6ee7b7' : '#fca5a5', fontWeight: '600', marginTop: '4px' }}>
            {formatPercent(despPct)} {vsText}
          </div>
        </div>

        <div className="saldo-divider" />

        <div className="saldo-col">
          <div className="saldo-chip-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={11} strokeWidth={3} style={{ color: 'rgba(255,255,255,0.8)' }} /> {t('balance_month')}
          </div>
          <div className="saldo-chip-val" style={{ fontSize: '20px', fontWeight: '700' }}>
            {showBalances ? formatCurrency(tm.saldo) : '••••'}
          </div>
          <div className="saldo-compare" style={{ fontSize: '11px', color: tm.saldo >= 0 ? '#6ee7b7' : '#fca5a5', fontWeight: '600', marginTop: '4px' }}>
            {formatPercent(saldoPct)} {vsText}
          </div>
        </div>
      </motion.div>
      <div className="cards-row" style={activeWall?.tipo === 'Empresarial' ? { gridTemplateColumns: 'repeat(3, 1fr)' } : {}}>        <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
          <div className="metric-icon" style={{ background: 'var(--green-g)' }}>
             <TrendingUp size={16} strokeWidth={2.5} color="var(--green)" />
          </div>
          <div className="metric-label">{t('revenue_month')}</div>
          <div className="metric-val pos">{showBalances ? formatCurrency(tm.rec) : '••••'}</div>
          <div className="metric-compare" style={{ marginTop: '5px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3.5px', fontWeight: '500' }}>
            <span style={{ color: recPct >= 0 ? '#05df72' : 'var(--red)', fontWeight: '700' }}>{formatPercent(recPct)}</span>
            <span style={{ color: isDark ? 'rgba(235,235,245,0.45)' : '#8e8e93' }}>{vsText}</span>
          </div>
        </motion.div>
        <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
          <div className="metric-icon" style={{ background: 'var(--red-g)' }}>
             <TrendingDown size={16} strokeWidth={2.5} color="var(--red)" />
          </div>
          <div className="metric-label">{t('expenses_month')}</div>
          <div className="metric-val neg">{showBalances ? formatCurrency(tm.desp) : '••••'}</div>
          <div className="metric-compare" style={{ marginTop: '5px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3.5px', fontWeight: '500' }}>
            <span style={{ color: despPct <= 0 ? '#05df72' : 'var(--red)', fontWeight: '700' }}>{formatPercent(despPct)}</span>
            <span style={{ color: isDark ? 'rgba(235,235,245,0.45)' : '#8e8e93' }}>{vsText}</span>
          </div>
        </motion.div>
        <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
          <div className="metric-icon" style={{ background: tm.saldo >= 0 ? 'var(--green-g)' : 'var(--red-g)' }}>
               <DollarSign size={16} strokeWidth={2.5} color={tm.saldo >= 0 ? 'var(--green)' : 'var(--red)'} />
          </div>
          <div className="metric-label">{t('balance_month')}</div>
          <div className={`metric-val ${tm.saldo >= 0 ? 'pos' : 'neg'}`}>{showBalances ? formatCurrency(tm.saldo) : '••••'}</div>
          <div className="metric-compare" style={{ marginTop: '5px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3.5px', fontWeight: '500' }}>
            <span style={{ color: saldoPct >= 0 ? '#05df72' : 'var(--red)', fontWeight: '700' }}>{formatPercent(saldoPct)}</span>
            <span style={{ color: isDark ? 'rgba(235,235,245,0.45)' : '#8e8e93' }}>{vsText}</span>
          </div>
        </motion.div>
        {activeWall?.tipo !== 'Empresarial' && (
          <motion.div className="metric" variants={itemVar} whileHover={{ y: -4 }}>
            <div className="metric-icon" style={{ background: 'rgba(175,82,222,0.13)' }}>
              <TrendingUp size={16} strokeWidth={2.5} color="#af52de" />
            </div>
            <div className="metric-label">{t('investments')}</div>
            <div className="metric-val" style={{ color: 'var(--purple)' }}>{showBalances ? formatCurrency(totalInv) : '••••'}</div>
            <div className="metric-compare" style={{ marginTop: '5px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3.5px', fontWeight: '500' }}>
              <span style={{ color: invPct >= 0 ? '#af52de' : 'var(--red)', fontWeight: '700' }}>{formatPercent(invPct)}</span>
              <span style={{ color: isDark ? 'rgba(235,235,245,0.45)' : '#8e8e93' }}>{vsText}</span>
            </div>
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
                    className="custom-picker-dropdown"
                    style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0 }}
                  >
                    <div className="custom-picker-header">{t('custom')}</div>
                    
                    <div className="custom-date-container">
                      <input 
                        type="date" 
                        value={catCustomDates?.from || ''} 
                        onChange={e => setCatCustomDates(prev => ({ from: e.target.value, to: prev?.to || dbService.getToday() }))}
                      />
                    </div>
                    
                    <div className="custom-date-container">
                      <input 
                        type="date" 
                        value={catCustomDates?.to || ''} 
                        onChange={e => setCatCustomDates(prev => ({ from: prev?.from || dbService.getToday(), to: e.target.value }))}
                      />
                    </div>
                    
                    <button 
                      onClick={() => setIsCatPickerOpen(false)} 
                      className="custom-picker-confirm-btn"
                    >
                      {t('ready')}
                    </button>
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
                  layout: {
                    padding: 8
                  },
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
                  {showBalances ? `${l.tipo === 'despesa' ? '-' : l.tipo === 'receita' ? '+' : ''} ${formatCurrency(l.valor)}` : '••••'}
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
                gap: '5px',
                letterSpacing: '0.5px',
                opacity: 0.8
              }}
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('see_all')}
              <ArrowRight size={14} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </motion.div>


    </motion.div>
  );
}

