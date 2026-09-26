import React, { useState, useMemo } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import {
  formatMoney,
  formatMoneyByCurrency,
  monthTransactions,
  monthlySummary,
  monthLabel,
  accountName,
  txAccountCurrency,
  sumByCategoryPHP
} from '@/lib/finance';
import TransactionModal from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

function Card({ children, className }) {
  return <div className={`bg-card border border-border rounded-2xl p-5 ${className || ''}`}>{children}</div>;
}

export default function Month() {
  const { transactions, accounts, budget, loading, rate } = useFinance();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [modalOpen, setModalOpen] = useState(false);

  const shift = (n) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + n);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const mTx = useMemo(() => monthTransactions(transactions, month), [transactions, month]);
  const s = useMemo(() => monthlySummary(transactions, accounts, rate, month), [transactions, accounts, rate, month]);
  const list = useMemo(() => [...mTx].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [mTx]);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? list : list.slice(0, 10);

  const plan = [
    ['Savings', budget?.savings_pct || 0, s.savings],
    ['Sent Home', budget?.sent_home_pct || 0, s.sentHome],
    ['Needs', budget?.needs_pct || 0, sumByCategoryPHP(mTx, accounts, rate, 'Needs')],
    ['Miscellaneous', budget?.misc_pct || 0, sumByCategoryPHP(mTx, accounts, rate, 'Miscellaneous')]
  ];

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold text-foreground">Month</h1>
        <Button onClick={() => setModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="flex items-center justify-center gap-3 mb-5">
        <Button variant="outline" size="icon" onClick={() => shift(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="font-semibold text-foreground min-w-[170px] text-center">{monthLabel(month)}</span>
        <Button variant="outline" size="icon" onClick={() => shift(1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Income</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatMoney(s.income)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Expenses</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{formatMoney(s.expenses)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Money Left</div>
          <div className={`text-2xl font-extrabold mt-1 ${s.moneyLeft < 0 ? 'text-red-600' : 'text-foreground'}`}>{formatMoney(s.moneyLeft)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Saved</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{formatMoney(s.savings)}</div>
        </Card>
      </div>

      <Card className="mb-4">
        <h2 className="font-bold text-foreground mb-3">Monthly Plan vs Budget</h2>
        {plan.map(([name, pct, actual]) => {
          const target = (s.income * pct) / 100;
          const p = target ? Math.min(100, (actual / target) * 100) : 0;
          return (
            <div key={name} className="mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{name}</span>
                <span className="text-muted-foreground">{formatMoney(actual)} / {formatMoney(target)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary rounded-full" style={{ width: `${p}%` }} />
              </div>
            </div>
          );
        })}
        {!s.income && <p className="text-sm text-muted-foreground">No income this month yet.</p>}
      </Card>

      <Card>
        <h2 className="font-bold text-foreground mb-3">Transactions</h2>
        {list.length ? (
          <>
            <div className="flex flex-col divide-y divide-border">
              {shown.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{t.note || t.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.date} · {accountName(accounts, t.account_id)}
                      {t.type === 'transfer' ? ` → ${accountName(accounts, t.to_account_id)}` : ''}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-red-600' : 'text-foreground'}`}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                    {formatMoneyByCurrency(t.amount, txAccountCurrency(t, accounts))}
                  </div>
                </div>
              ))}
            </div>
            {list.length > 10 && (
              <div className="pt-3 text-center">
                <button onClick={() => setExpanded((e) => !e)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {expanded ? 'See Less' : `See More (${list.length - 10})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No transactions this month.</p>
        )}
      </Card>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} editing={null} />
    </div>
  );
}