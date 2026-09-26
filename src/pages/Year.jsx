import React, { useState, useMemo } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import { formatMoney, yearSummary, monthlySummary, monthShort, sumByCategoryPHP } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

function Card({ children, className }) {
  return <div className={`bg-card border border-border rounded-2xl p-5 ${className || ''}`}>{children}</div>;
}

export default function Year() {
  const { transactions, accounts, budget, loading, rate } = useFinance();
  const [year, setYear] = useState(new Date().getFullYear());

  const s = useMemo(() => yearSummary(transactions, accounts, rate, year), [transactions, accounts, rate, year]);

  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const breakdown = useMemo(
    () => months.map((m) => ({ m, ...monthlySummary(transactions, accounts, rate, m) })),
    [transactions, accounts, rate, year]
  );

  const allocation = [
    ['Savings', s.savings],
    ['Sent Home', s.sentHome],
    ['Needs', sumByCategoryPHP(transactions.filter((t) => (t.date || '').startsWith(String(year))), accounts, rate, 'Needs')],
    ['Miscellaneous', sumByCategoryPHP(transactions.filter((t) => (t.date || '').startsWith(String(year))), accounts, rate, 'Miscellaneous')]
  ];
  const allocMax = Math.max(1, ...allocation.map((a) => a[1]));

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-5">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-2xl font-extrabold text-foreground min-w-[100px] text-center">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}><ChevronRight className="w-4 h-4" /></Button>
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
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Saved</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{formatMoney(s.savings)}</div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Money Left</div>
          <div className={`text-2xl font-extrabold mt-1 ${s.moneyLeft < 0 ? 'text-red-600' : 'text-foreground'}`}>{formatMoney(s.moneyLeft)}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold text-foreground mb-3">Monthly Breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={breakdown.map((b) => ({ month: monthShort(b.m), income: b.income, expenses: b.expenses }))} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => '₱' + (v >= 1000 ? v / 1000 + 'k' : v)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="font-bold text-foreground mb-3">Annual Allocation</h2>
          <div className="flex flex-col gap-3">
            {allocation.map(([name, val]) => (
              <div key={name}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{name}</span>
                  <span className="text-muted-foreground">{formatMoney(val)}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(val / allocMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}