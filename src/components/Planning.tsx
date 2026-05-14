import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, Check, Trash2, Plus, ArrowUpRight, TrendingDown, ClipboardList, Wallet, AlertCircle } from 'lucide-react';
import CustomSelect from './ui/CustomSelect';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';
import { ShoppingItem, GastoFixo, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Planning: React.FC = () => {
  const { t } = usePreferences();
  const { user } = useAuth();
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<GastoFixo[]>([]);
  const [incomes, setIncomes] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [newItemPrice, setNewItemPrice] = useState('');
  
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseValue, setNewExpenseValue] = useState('');
  const [newExpenseDue, setNewExpenseDue] = useState('10');

  useEffect(() => {
    if (!user) return;
    const unsubShopping = dbService.subscribeShoppingItems(user.uid, setShoppingItems);
    const unsubFixed = dbService.subscribeGastosFixos(user.uid, setFixedExpenses);
    const unsubProfile = dbService.subscribeUserProfile(user.uid, setUserProfile);
    
    // Subscribe to all carteiras and total incomes to calculate salary commitment
    const unsubCarteiras = dbService.subscribeCarteiras(user.uid, (carteiras) => {
      const currentMonth = dbService.getCurrentMonth();
      let totalSalaryFromTransactions = 0;
      
      const unsubs: (() => void)[] = [];
      carteiras.forEach(c => {
        const u = dbService.subscribeLancamentos(user.uid, c.id, (lancamentos) => {
          const sal = lancamentos
            .filter(l => l.data.startsWith(currentMonth) && (l.cat === 'Salário' || l.cat === 'salary'))
            .reduce((sum, l) => sum + l.valor, 0);
          totalSalaryFromTransactions += sal;
          
          setIncomes(userProfile?.rendimentoMensal || totalSalaryFromTransactions);
        });
        unsubs.push(u);
      });
      return () => unsubs.forEach(u => u());
    });

    return () => {
      unsubShopping();
      unsubFixed();
      unsubProfile();
      unsubCarteiras();
    };
  }, [user, userProfile?.rendimentoMensal]);

  const addShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName) return;
    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      nome: newItemName,
      prioridade: newItemPriority,
      comprado: false,
      precoEstimado: parseFloat(newItemPrice) || 0,
      userId: user.uid
    };
    await dbService.saveShoppingItem(item, user.uid);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemPriority('media');
  };

  const toggleShoppingItem = async (item: ShoppingItem) => {
    if (!user) return;
    await dbService.saveShoppingItem({ ...item, comprado: !item.comprado }, user.uid);
  };

  const deleteShoppingItem = async (id: string) => {
    if (!user) return;
    await dbService.deleteShoppingItem(id);
  };

  const addFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newExpenseName || !newExpenseValue) return;
    const gasto: GastoFixo = {
      id: crypto.randomUUID(),
      nome: newExpenseName,
      valor: parseFloat(newExpenseValue),
      diaVencimento: parseInt(newExpenseDue),
      categoria: 'Fixa',
      userId: user.uid
    };
    await dbService.saveGastoFixo(gasto, user.uid);
    setNewExpenseName('');
    setNewExpenseValue('');
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    await dbService.deleteGastoFixo(id);
  };

  const totalFixed = fixedExpenses.reduce((sum, g) => sum + g.valor, 0);
  const percentageCommitted = incomes > 0 ? (totalFixed / incomes) * 100 : 0;
  const totalShoppingEstimated = shoppingItems.reduce((sum, i) => sum + (i.precoEstimado || 0), 0);

  const sortedShopping = [...shoppingItems].sort((a, b) => {
    if (a.comprado !== b.comprado) return a.comprado ? 1 : -1;
    const pMap = { alta: 0, media: 1, baixa: 2 };
    return pMap[a.prioridade] - pMap[b.prioridade];
  });

  const priorityMeta = {
    alta: { color: 'var(--red)', label: t('high') },
    media: { color: 'var(--orange)', label: t('medium') },
    baixa: { color: 'var(--accent)', label: t('low') }
  };

  const priorityOptions = [
    { value: 'alta', label: t('high'), icon: <span style={{ marginRight: '8px' }}>🔴</span> },
    { value: 'media', label: t('medium'), icon: <span style={{ marginRight: '8px' }}>🟠</span> },
    { value: 'baixa', label: t('low'), icon: <span style={{ marginRight: '8px' }}>🟢</span> }
  ];

  return (
    <div id="planning-page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Fixed Expenses Section */}
        <section className="card">
          <div className="card-title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div className="nav-iw" style={{ background: 'var(--red-g)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} />
              </div>
              <span className="t-bold">{t('fixed_expenses')}</span>
            </div>
            <div className="t-right">
              <div className="t-h3 t-red">{dbService.formatCurrency(totalFixed)}</div>
            </div>
          </div>

          <form onSubmit={addFixedExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px auto', gap: '10px', marginBottom: '24px' }}>
            <input 
              type="text" 
              className="fg" 
              placeholder={t('expense_name') || 'Nome'} 
              value={newExpenseName}
              onChange={e => setNewExpenseName(e.target.value)}
            />
            <input 
              type="number" 
              className="fg" 
              placeholder="R$" 
              value={newExpenseValue}
              onChange={e => setNewExpenseValue(e.target.value)}
            />
            <input 
              type="number" 
              className="fg" 
              title={t('due_day')}
              placeholder="Dia" 
              min="1" max="31"
              value={newExpenseDue}
              onChange={e => setNewExpenseDue(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '44px', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <AnimatePresence initial={false}>
              {fixedExpenses.sort((a,b) => a.diaVencimento - b.diaVencimento).map(expense => (
                <motion.div 
                  layout
                  key={expense.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="transaction-row"
                  style={{ 
                    padding: '14px 0',
                    borderBottom: '1px solid var(--sep)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div className="t-center" style={{ width: '42px', height: '42px', background: 'var(--glass-strong)', borderRadius: '12px', border: '1px solid var(--sep)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
                    <div className="t-xs t-bold" style={{ fontSize: '9px', opacity: 0.6, lineHeight: 1 }}>{t('day_short') || 'DIA'}</div>
                    <div className="t-body t-bold" style={{ lineHeight: 1.2 }}>{expense.diaVencimento}</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="t-body t-semibold l-tight">{expense.nome}</div>
                    <div className="t-xs t-muted" style={{ marginTop: '2px' }}>{t('fixed_recurrent') || 'Recorrência Mensal'}</div>
                  </div>

                  <div className="t-right" style={{ marginRight: '16px' }}>
                    <div className="t-body t-bold t-red">{dbService.formatCurrency(expense.valor)}</div>
                  </div>

                  <button 
                    className="btn btn-danger" 
                    onClick={() => deleteExpense(expense.id)}
                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {fixedExpenses.length === 0 && (
              <div className="empty" style={{ margin: '20px 0', background: 'transparent', border: 'none' }}>
                <TrendingDown size={48} style={{ opacity: 0.2, marginBottom: '16px', transform: 'rotate(180deg)' }} />
                <div className="t-muted">{t('no_fixed_expenses') || 'Nenhuma despesa fixa cadastrada.'}</div>
              </div>
            )}
          </div>

          {/* Salary Commitment footer inside card */}
          {incomes > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                marginTop: '32px', 
                padding: '20px', 
                background: 'var(--glass-strong)', 
                borderRadius: '16px',
                border: '1px solid var(--sep)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={16} className="t-muted" />
                  <span className="t-body t-bold">{t('committed_salary')}</span>
                </div>
                <span className={`t-h3 ${percentageCommitted > 70 ? 't-red' : 't-accent'}`}>
                  {percentageCommitted.toFixed(1)}%
                </span>
              </div>
              
              <div style={{ height: '10px', background: 'var(--sep)', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentageCommitted, 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ 
                    height: '100%', 
                    background: percentageCommitted > 70 ? 'var(--red)' : 'var(--accent)',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <p className="t-xs t-muted" style={{ flex: 1 }}>
                  {t('income_basis') || 'Baseado em ganhos mensais:'} <strong>{dbService.formatCurrency(incomes)}</strong>
                </p>
                {percentageCommitted > 70 && (
                  <div className="t-xs t-medium" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    {t('short_warning') || 'Alto!'}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>

        {/* Shopping List Section */}
        <section className="card">
          <div className="card-title">
            <div className="nav-iw" style={{ background: 'var(--accent-low)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={16} />
            </div>
            <span className="t-bold">{t('shopping_list')}</span>
          </div>

          <form onSubmit={addShoppingItem} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
            <div style={{ flex: '1 1 200px' }}>
              <input 
                type="text" 
                className="input fg w-full"
                placeholder={t('item_name') || 'Item...'}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
              />
            </div>
            <div style={{ width: '100px' }}>
              <input 
                type="number" 
                className="fg w-full"
                placeholder={t('price_short') || 'R$'}
                value={newItemPrice}
                onChange={e => setNewItemPrice(e.target.value)}
              />
            </div>
            <CustomSelect 
              value={newItemPriority} 
              onChange={(val) => setNewItemPriority(val as any)}
              options={priorityOptions}
              className="w-auto"
              style={{ minWidth: '140px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '44px', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} />
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <AnimatePresence initial={false}>
              {sortedShopping.map(item => (
                <motion.div 
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="transaction-row"
                  style={{ 
                    padding: '12px 0',
                    borderBottom: '1px solid var(--sep)',
                    opacity: item.comprado ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div 
                    className={`custom-checkbox ${item.comprado ? 'active' : ''}`}
                    onClick={() => toggleShoppingItem(item)}
                    style={{ 
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  >
                    {item.comprado && <Check size={12} />}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className={`t-body t-semibold l-tight ${item.comprado ? 'line-through' : ''}`}>
                      {item.nome}
                    </div>
                    <div className="t-xs t-medium" style={{ color: priorityMeta[item.prioridade].color, marginTop: '2px', opacity: 0.8 }}>
                      {priorityMeta[item.prioridade].label}
                    </div>
                  </div>

                  <div className="t-right" style={{ marginRight: '16px' }}>
                    <div className="t-body t-bold">{dbService.formatCurrency(item.precoEstimado || 0)}</div>
                  </div>

                  <button 
                    className="btn btn-danger" 
                    onClick={() => deleteShoppingItem(item.id)}
                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {shoppingItems.length > 0 && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--accent-low)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="t-body t-bold">{t('total_estimated')}</span>
                <span className="t-body t-bold t-accent">{dbService.formatCurrency(totalShoppingEstimated)}</span>
              </div>
            )}

            {shoppingItems.length === 0 && (
              <div className="empty" style={{ margin: '20px 0', background: 'transparent', border: 'none' }}>
                <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <div className="t-muted">{t('no_items') || 'Sua lista de compras está vazia.'}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Planning;

