import React from 'react';
import { motion } from 'motion/react';
import { Line } from 'react-chartjs-2';
import { FileDown, TrendingUp, PieChart } from 'lucide-react';
import { dbService } from '../services/dbService';
import { DBState, COLORS } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

interface Props {
  db: DBState;
  onExportCSV: () => void;
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

export default function Reports({ db, onExportCSV }: Props) {
  const { isDark, t, language, formatCurrency } = usePreferences();
  const tudo = dbService.getTotais(db.lancamentos);
  const totalValue = db.investimentos.reduce((s, i) => s + i.valor, 0);
  const taxaPoupanca = tudo.rec > 0 ? ((tudo.rec - tudo.desp) / tudo.rec * 100).toFixed(1) : '0.0';
  const totPatrimonio = tudo.saldo + totalValue;

  const metrics = [
    { label: t('total_income'), val: formatCurrency(tudo.rec), cls: 'pos' },
    { label: t('total_expense'), val: formatCurrency(tudo.desp), cls: 'neg' },
    { label: t('savings_rate'), val: taxaPoupanca + '%', cls: parseFloat(taxaPoupanca) >= 20 ? 'pos' : 'neg' },
    { label: t('net_worth'), val: formatCurrency(totPatrimonio), cls: '' },
  ];

  // Ranking categorias
  const cats: Record<string, number> = {};
  db.lancamentos.filter(l => l.tipo === 'despesa').forEach(l => {
    cats[l.cat] = (cats[l.cat] || 0) + l.valor;
  });
  const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxV = sortedCats[0] ? sortedCats[0][1] : 1;
  const totalDesp = sortedCats.reduce((s, [, v]) => s + v, 0);

  // Evolução Patrimonial (Simplified approximation based on historical transactions)
  const today = new Date();
  const last6Months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today); d.setMonth(d.getMonth() - i);
    last6Months.push(dbService.getMonthKey(d.toISOString().slice(0, 10)));
  }

  let cumulativeSaldo = db.lancamentos
    .filter(l => dbService.getMonthKey(l.data) < last6Months[0])
    .reduce((s, l) => s + (l.tipo === 'receita' ? l.valor : -l.valor), 0);
  
  const historyVals: number[] = [];
  last6Months.forEach(m => {
    const monthTotal = dbService.getTotais(db.lancamentos, m);
    cumulativeSaldo += monthTotal.rec - monthTotal.desp;
    
    // Calculate investments up to this month
    const invUpToMonth = db.investimentos
      .filter(i => {
        // If NO date is provided, only show it from the current month onwards
        if (!i.data) {
          return m >= dbService.getCurrentMonth();
        }
        return dbService.getMonthKey(i.data) <= m;
      })
      .reduce((s, i) => s + (i.qtd * i.preco), 0);

    historyVals.push(cumulativeSaldo + invUpToMonth);
  });

  const trend = historyVals[historyVals.length - 1] - historyVals[0];
  const lineColor = trend >= 0 ? (isDark ? '#22C55E' : '#00843D') : '#ff3b30';

  const chartData = {
    labels: last6Months.map(m => {
        const [y, mo] = m.split('-');
        return new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString(language, { month: 'short' });
    }),
    datasets: [{
      label: t('patrimony'),
      data: historyVals,
      borderColor: lineColor,
      backgroundColor: trend >= 0 
        ? (isDark ? 'rgba(0,230,118,0.18)' : 'rgba(0,132,61,0.10)')
        : (isDark ? 'rgba(255,69,58,0.18)' : 'rgba(255,59,48,0.08)'),
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      borderWidth: 2
    }]
  };

  return (
    <motion.div 
      className="reports-page"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="cards-row" style={{ marginBottom: '18px' }}>
        {metrics.map((m, i) => (
          <motion.div key={i} className="metric" variants={itemVar}>
            <div className="metric-label">{m.label}</div>
            <div className={`metric-val ${m.cls}`}>{m.val}</div>
          </motion.div>
        ))}
      </div>

      <motion.div className="card" style={{ marginBottom: '14px' }} variants={itemVar}>
        <div className="card-title"><TrendingUp size={14} /> {t('equity_evolution')}</div>
        <div style={{ height: '220px' }}>
          <Line 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }
              }
            }}
          />
        </div>
      </motion.div>

      <motion.div className="card" variants={itemVar}>
        <div className="card-title"><PieChart size={14} /> {t('expense_ranking')}</div>
        <div style={{ padding: '8px 0' }}>
          {sortedCats.length ? sortedCats.map(([c, v], i) => {
            const pct = totalDesp > 0 ? ((v / totalDesp) * 100).toFixed(1) : '0';
            const progress = (v / maxV * 100).toFixed(1);
            return (
              <div key={c} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500 }}>{c}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{formatCurrency(v)} ({pct}%)</span>
                </div>
                <div className="prog-bar">
                  <motion.div 
                    className="prog-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ background: COLORS[i % COLORS.length] }} 
                  />
                </div>
              </div>
            );
          }) : (
            <div className="empty">{t('no_expenses_recorded')}</div>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
