import React, { useMemo } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import {
  formatMoney,
  sumByTypePHP,
  savingsTotalPHP,
  sumByCategoryPHP,
  monthTransactions,
  monthShort
} from '@/lib/finance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

function Card({ children, className }) {
  return <div className={`bg-card border border-border rounded-2xl p-5 ${className || ''}`}>{children}</div>;
}

export default function History() {
  const { transactions, accounts, loading, rate } = useFinance();

  const allIncome = sumByTypePHP(transactions, accounts, rate, 'income');
  const allExpenses = sumByTypePHP(transactions, accounts, rate, 'expense');
  const allSavings = savingsTotalPHP(transactions, accounts, rate);
  const allSentHome = sumByCategoryPHP(transactions, accounts, rate, 'Sent Home');

  const chartMonths = useMemo(() => {
    const ms = [...new Set(transactions.map((t) => (t.date || '').slice(0, 7)))].sort().slice(-8);
    return ms.map((m) => ({
      month: monthShort(m),
      income: sumByTypePHP(monthTransactions(transactions, m), accounts, rate, 'income'),
      expenses: sumByTypePHP(monthTransactions(transactions, m), accounts, rate, 'expense')
    }));
  }, [transactions, accounts, rate]);

  const years = useMemo(() => {
    const ys = [...new Set(transactions.map((t) => (t.date || '').slice(0, 4)))].sort().reverse();
    return ys.map((y) => {
      const yTx = transactions.filter((t) => (t.date || '').startsWith(y));
      return {
        y,
        income: sumByTypePHP(yTx, accounts, rate, 'income'),
        expenses: sumByTypePHP(yTx, accounts, rate, 'expense'),
        savings: savingsTotalPHP(yTx, accounts, rate),
        sentHome: sumByCategoryPHP(yTx, accounts, rate, 'Sent Home')
      };
    });
  }, [transactions, accounts, rate]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold text-foreground mb-1">History</h1>
      <p className="text-sm text-muted-foreground mb-5">All-time totals, net worth growth & yearly breakdown</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">All-Time Income</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatMoney(allIncome)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">All-Time Expenses</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{formatMoney(allExpenses)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">All-Time Savings</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{formatMoney(allSavings)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Sent Home</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{formatMoney(allSentHome)}</div>
        </Card>
      </div>

      <Card className="mb-4">
        <h2 className="font-bold text-foreground mb-3">Income vs Expenses</h2>
        {chartMonths.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartMonths} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => '₱' + (v >= 1000 ? v / 1000 + 'k' : v)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-muted-foreground py-12 text-center">No data yet.</div>
        )}
      </Card>

      <Card>
        <h2 className="font-bold text-foreground mb-3">Yearly History</h2>
        {years.length ? (
          <div className="flex flex-col divide-y divide-border">
            {years.map((y) => (
              <div key={y.y} className="py-3">
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">{y.y}</span>
                  <span className={`font-bold ${y.income - y.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatMoney(y.income - y.expenses)} net
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Income {formatMoney(y.income)} · Expenses {formatMoney(y.expenses)} · Savings {formatMoney(y.savings)} · Sent Home {formatMoney(y.sentHome)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No yearly history yet.</p>
        )}
      </Card>
    </div>
  );
}