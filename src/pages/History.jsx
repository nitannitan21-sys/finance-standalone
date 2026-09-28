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
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Send,
  ChartNoAxesCombined,
  History as HistoryIcon
} from 'lucide-react';

function Card({ children, className = '' }) {
  return (
    <div
      className={`
        bg-card/95 backdrop-blur-sm
        border border-border/70
        rounded-2xl
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const tones = {
    green: {
      icon: 'bg-emerald-500/10 text-emerald-500',
      value: 'text-emerald-600 dark:text-emerald-400'
    },
    red: {
      icon: 'bg-rose-500/10 text-rose-500',
      value: 'text-rose-600 dark:text-rose-400'
    },
    purple: {
      icon: 'bg-violet-500/10 text-violet-500',
      value: 'text-violet-600 dark:text-violet-400'
    },
    blue: {
      icon: 'bg-primary/10 text-primary',
      value: 'text-primary'
    },
    default: {
      icon: 'bg-muted text-muted-foreground',
      value: 'text-foreground'
    }
  };

  const style = tones[tone] || tones.default;

  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.icon}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div
        className={`text-xl md:text-2xl font-extrabold tracking-tight mt-3 ${style.value}`}
      >
        {value}
      </div>
    </Card>
  );
}

export default function History() {
  const {
    transactions,
    accounts,
    loading,
    rate
  } = useFinance();

  const allIncome = sumByTypePHP(
    transactions,
    accounts,
    rate,
    'income'
  );

  const allExpenses = sumByTypePHP(
    transactions,
    accounts,
    rate,
    'expense'
  );

  const allSavings = savingsTotalPHP(
    transactions,
    accounts,
    rate
  );

  const allSentHome = sumByCategoryPHP(
    transactions,
    accounts,
    rate,
    'Sent Home'
  );

  const chartMonths = useMemo(() => {
    const ms = [
      ...new Set(
        transactions.map((t) =>
          (t.date || '').slice(0, 7)
        )
      )
    ]
      .filter(Boolean)
      .sort()
      .slice(-8);

    return ms.map((m) => ({
      month: monthShort(m),
      income: sumByTypePHP(
        monthTransactions(transactions, m),
        accounts,
        rate,
        'income'
      ),
      expenses: sumByTypePHP(
        monthTransactions(transactions, m),
        accounts,
        rate,
        'expense'
      )
    }));
  }, [transactions, accounts, rate]);

  const years = useMemo(() => {
    const ys = [
      ...new Set(
        transactions.map((t) =>
          (t.date || '').slice(0, 4)
        )
      )
    ]
      .filter(Boolean)
      .sort()
      .reverse();

    return ys.map((y) => {
      const yTx = transactions.filter((t) =>
        (t.date || '').startsWith(y)
      );

      return {
        y,
        income: sumByTypePHP(
          yTx,
          accounts,
          rate,
          'income'
        ),
        expenses: sumByTypePHP(
          yTx,
          accounts,
          rate,
          'expense'
        ),
        savings: savingsTotalPHP(
          yTx,
          accounts,
          rate
        ),
        sentHome: sumByCategoryPHP(
          yTx,
          accounts,
          rate,
          'Sent Home'
        )
      };
    });
  }, [transactions, accounts, rate]);

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading history…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-9 rounded-full bg-primary" />

        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            History
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Your all-time financial history and yearly breakdown
          </p>
        </div>
      </div>

      {/* All-time statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

        <StatCard
          label="All-Time Income"
          value={formatMoney(allIncome)}
          icon={ArrowDownRight}
          tone="green"
        />

        <StatCard
          label="All-Time Expenses"
          value={formatMoney(allExpenses)}
          icon={ArrowUpRight}
          tone="red"
        />

        <StatCard
          label="All-Time Savings"
          value={formatMoney(allSavings)}
          icon={PiggyBank}
          tone="purple"
        />

        <StatCard
          label="Sent Home"
          value={formatMoney(allSentHome)}
          icon={Send}
          tone="blue"
        />

      </div>

      {/* Income vs Expenses */}
      <Card className="p-5 mb-5">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChartNoAxesCombined className="w-5 h-5 text-primary" />
          </div>

          <div>
            <h2 className="font-bold text-foreground">
              Income vs Expenses
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              Your most recent eight months
            </p>
          </div>

        </div>

        {chartMonths.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartMonths}
              margin={{
                top: 8,
                right: 8,
                left: 0,
                bottom: 0
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />

              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: 'hsl(var(--muted-foreground))'
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(v) =>
                  '₱' +
                  (v >= 1000
                    ? `${Math.round(v / 1000)}k`
                    : v)
                }
                tick={{
                  fontSize: 11,
                  fill: 'hsl(var(--muted-foreground))'
                }}
                axisLine={false}
                tickLine={false}
                width={45}
              />

              <Tooltip
                formatter={(value) =>
                  formatMoney(value)
                }
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid hsl(var(--border))',
                  background:
                    'hsl(var(--popover))',
                  color:
                    'hsl(var(--popover-foreground))'
                }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 8
                }}
              />

              <Bar
                dataKey="income"
                name="Income"
                fill="#10b981"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#ef4444"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center">

            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ChartNoAxesCombined className="w-6 h-6 text-primary" />
            </div>

            <p className="text-sm text-muted-foreground">
              No history data yet.
            </p>

          </div>
        )}

      </Card>

      {/* Yearly history */}
      <Card className="overflow-hidden">

        <div className="px-5 py-4 border-b border-border/70 flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HistoryIcon className="w-5 h-5 text-primary" />
          </div>

          <div>
            <h2 className="font-bold text-foreground">
              Yearly History
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              Annual income, expenses, savings and money sent home
            </p>
          </div>

        </div>

        {years.length ? (

          <div className="divide-y divide-border/70">

            {years.map((y) => {

              const net = y.income - y.expenses;

              const netColor =
                net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400';

              return (
                <div
                  key={y.y}
                  className="p-5 hover:bg-muted/30 transition-colors"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                    <div>
                      <div className="text-lg font-extrabold text-foreground">
                        {y.y}
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Annual financial summary
                      </div>
                    </div>

                    <div className="text-left sm:text-right">

                      <div
                        className={`text-lg font-extrabold ${netColor}`}
                      >
                        {formatMoney(net)}
                      </div>

                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        net
                      </div>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Income
                      </div>

                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatMoney(y.income)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Expenses
                      </div>

                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                        {formatMoney(y.expenses)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Savings
                      </div>

                      <div className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-1">
                        {formatMoney(y.savings)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Sent Home
                      </div>

                      <div className="text-sm font-bold text-primary mt-1">
                        {formatMoney(y.sentHome)}
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        ) : (

          <div className="p-12 text-center">

            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-bold text-foreground">
              No yearly history yet
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              Your yearly summaries will appear here.
            </p>

          </div>

        )}

      </Card>

    </div>
  );
}