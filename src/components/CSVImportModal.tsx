import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { Lancamento, OperationType } from '../types';
import { GenericModal } from './Modals';
import { usePreferences } from '../contexts/PreferencesContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Partial<Lancamento>[]) => void;
}

interface TempTransaction {
  id: string;
  data: string;
  desc: string;
  valor: number;
  tipo: OperationType;
  cat: string;
  selecionado: boolean;
}

export default function CSVImportModal({ isOpen, onClose, onImport }: Props) {
  const { t } = usePreferences();
  const [step, setStep] = useState(1);
  const [transacoes, setTransacoes] = useState<TempTransaction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // If not open, the GenericModal will handle the null return internally or via its props
  // but we keep the logic clean here.

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setTransacoes(rows);
      setStep(2);
      categorizeAI(rows);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const parseCSV = (text: string): TempTransaction[] => {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const delim = lines.some(l => l.includes(';')) ? ';' : ',';

    const parseLine = (line: string) => {
      const cells: string[] = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQ = !inQ;
        else if (c === delim && !inQ) { cells.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      cells.push(cur.trim());
      return cells.map(c => c.replace(/^"|"$/g, '').trim());
    };

    // Find header
    let headerIdx = -1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const cells = parseLine(lines[i]);
      if (cells.length >= 3 && cells.some(c => /data/i.test(c))) { headerIdx = i; break; }
    }
    if (headerIdx < 0) headerIdx = 0;

    const headers = parseLine(lines[headerIdx]).map(h => h.toLowerCase());
    const colData = headers.findIndex(h => h.includes('data'));
    const colDesc = headers.findIndex(h => /descri|histo|memo/.test(h));
    const colVal = headers.findIndex(h => h.includes('valor'));

    const items: TempTransaction[] = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cells = parseLine(lines[i]);
      if (cells.length < 3) continue;

      const rawData = cells[colData >= 0 ? colData : 0];
      const data = parseDate(rawData);
      if (!data) continue;

      const rawVal = cells[colVal >= 0 ? colVal : cells.length - 1];
      const v = parseVal(rawVal);
      if (v === 0) continue;

      items.push({
        id: 'l' + Date.now() + Math.floor(Math.random() * 1000) + i,
        data,
        desc: cells[colDesc >= 0 ? colDesc : 1] || t('csv_transaction_fallback') || 'Transação',
        valor: Math.abs(v),
        tipo: v < 0 ? OperationType.DESPESA : OperationType.RECEITA,
        cat: 'Outros',
        selecionado: true
      });
    }
    return items;
  };

  const parseDate = (s: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (!m) return null;
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  };

  const parseVal = (s: string) => {
    if (!s) return 0;
    let clean = s.replace(/[R$\s]/g, '');
    if (clean.includes(',') && clean.indexOf(',') > clean.length - 4) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes('.') && clean.indexOf('.') <= clean.length - 4 && clean.includes(',')) {
       clean = clean.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(clean) || 0;
  };

  const categorizeAI = (rows: TempTransaction[]) => {
    setIsAnalyzing(true);
    const rules = [
      { cat: 'Alimentação', re: /mercado|ifood|restaurante|padaria/i },
      { cat: 'Transporte', re: /uber|posto|99|gasolina/i },
      { cat: 'Lazer', re: /netflix|spotify|cinema/i },
      { cat: 'Salário', re: /salário|pagamento|folha/i },
    ];

    const updated = rows.map(r => {
      const rule = rules.find(rule => rule.re.test(r.desc));
      return rule ? { ...r, cat: rule.cat } : r;
    });

    setTimeout(() => {
      setTransacoes(updated);
      setIsAnalyzing(false);
    }, 1500);
  };

  const confirmarImport = () => {
    const sel = transacoes.filter(tItem => tItem.selecionado);
    onImport(sel.map(tItem => ({
      id: tItem.id,
      tipo: tItem.tipo,
      data: tItem.data,
      valor: tItem.valor,
      desc: tItem.desc,
      cat: tItem.cat,
      obs: t('imported_via_csv') || 'Importado via CSV'
    })));
    onClose();
    setStep(1);
    setTransacoes([]);
  };

  const saveLabel = step === 1 ? (t('import_csv') || 'Importar') : `${t('import_csv') || 'Importar'} (${transacoes.filter(tItem => tItem.selecionado).length})`;

  return (
    <GenericModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('import_csv') || 'Importar CSV'}
      onSave={step === 2 ? confirmarImport : () => document.getElementById('csv-up')?.click()}
      saveLabel={step === 1 ? (t('select_file') || 'Selecionar Arquivo') : saveLabel}
    >
      <div style={{ minWidth: '400px' }}>
        {step === 1 && (
          <div style={{ background: 'rgba(34,197,94,0.03)', border: '2px dashed #22C55E', padding: '40px', borderRadius: '24px', textAlign: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('csv-up')?.click()}>
             <div style={{ fontSize: '42px', marginBottom: '12px' }}>📂</div>
             <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '16px' }}>{t('click_or_drag_csv') || 'Clique aqui ou arraste o arquivo CSV'}</div>
             <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>{t('supported_formats') || 'Formatos suportados: .csv'}</div>
             <input type="file" id="csv-up" style={{ display: 'none' }} accept=".csv" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isAnalyzing && (
              <div style={{ padding: '12px', background: 'rgba(0,230,118,0.1)', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#00843D', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                {t('categorizing_ai') || 'Categorizando transações com IA...'}
              </div>
            )}
            <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                 <thead style={{ background: 'var(--input-bg)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                   <tr>
                     <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>✓</th>
                     <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv_date') || 'Data'}</th>
                     <th style={{ padding: '12px', textAlign: 'left' }}>{t('csv_description') || 'Descrição'}</th>
                     <th style={{ padding: '12px', textAlign: 'right' }}>{t('csv_value') || 'Valor'}</th>
                   </tr>
                 </thead>
                 <tbody>
                    {transacoes.map((tItem, idx) => (
                      <tr key={tItem.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <input type="checkbox" checked={tItem.selecionado} onChange={() => {
                            const n = [...transacoes]; n[idx].selecionado = !n[idx].selecionado; setTransacoes(n);
                          }} style={{ width: '16px', height: '16px' }} />
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 500 }}>{dbService.formatDate(tItem.data)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tItem.desc}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }} className={tItem.tipo === 'receita' ? 'pos' : 'neg'}>
                          {dbService.formatCurrency(tItem.valor)}
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
            <button className="btn" onClick={() => setStep(1)} style={{ width: '100%', justifyContent: 'center', border: 'none', color: 'var(--muted)', fontWeight: 600 }}>
              {t('csv_back') || 'Voltar e trocar arquivo'}
            </button>
          </div>
        )}
      </div>
    </GenericModal>
  );
}
