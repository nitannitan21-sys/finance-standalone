
import React, { useMemo } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import {
  formatMoney,
  yearSummary,
  monthlySummary,
  monthShort,
  sumByCategoryPHP
} from '@/lib/finance';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  ChartNoAxesCombined,
  CircleDollarSign
} from 'lucide-react';
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
    blue: {
      icon: 'bg-primary/10 text-primary',
      value: 'text-primary'
    },
    purple: {
      icon: 'bg-violet-500/10 text-violet-500',
      value: 'text-violet-600 dark:text-violet-400'
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

export default function Year() {
  const {
    transactions,
    accounts,
    loading,
    rate
  } = useFinance();

  const [year, setYear] = React.useState(
    new Date().getFullYear()
  );

  const s = useMemo(
    () =>
      yearSummary(
        transactions,
        accounts,
        rate,
        year
      ),
    [transactions, accounts, rate, year]
  );

  const months = Array.from(
    { length: 12 },
    (_, i) =>
      `${year}-${String(i + 1).padStart(2, '0')}`
  );

  const breakdown = useMemo(
    () =>
      months.map((m) => ({
        m,
        ...monthlySummary(
          transactions,
          accounts,
          rate,
          m
        )
      })),
    [transactions, accounts, rate, year]
  );

  const yearTransactions = useMemo(
    () =>
      transactions.filter((t) =>
        (t.date || '').startsWith(String(year))
      ),
    [transactions, year]
  );

  const allocation = [
    ['Savings', s.savings],
    ['Sent Home', s.sentHome],
    [
      'Needs',
      sumByCategoryPHP(
        yearTransactions,
        accounts,
        rate,
        'Needs'
      )
    ],
    [
      'Miscellaneous',
      sumByCategoryPHP(
        yearTransactions,
        accounts,
        rate,
        'Miscellaneous'
      )
    ]
  ];

  const allocMax = Math.max(
    1,
    ...allocation.map((a) => a[1])
  );

  const chartData = breakdown.map((b) => ({
    month: monthShort(b.m),
    income: b.income,
    expenses: b.expenses
  }));

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading year…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">
          <div className="w-2 h-9 rounded-full bg-primary" />

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Year
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Annual financial overview
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/10">
          Full-year summary
        </div>

      </div>

      {/* Year selector */}
      <Card className="p-3 mb-5">
        <div className="flex items-center justify-between gap-3">

          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Selected year
            </div>

            <div className="text-2xl font-extrabold text-foreground mt-0.5">
              {year}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y + 1)}
            className="rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

        </div>
      </Card>

      {/* Annual statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

        <StatCard
          label="Income"
          value={formatMoney(s.income)}
          icon={ArrowDownRight}
          tone="green"
        />

        <StatCard
          label="Expenses"
          value={formatMoney(s.expenses)}
          icon={ArrowUpRight}
          tone="red"
        />

        <StatCard
          label="Saved"
          value={formatMoney(s.savings)}
          icon={PiggyBank}
          tone="purple"
        />

        <StatCard
          label="Money Left"
          value={formatMoney(s.moneyLeft)}
          icon={Wallet}
          tone={s.moneyLeft < 0 ? 'red' : 'blue'}
        />

      </div>

      {/* Charts and allocation */}
      <div className="grid xl:grid-cols-2 gap-5">

        {/* Monthly breakdown */}
        <Card className="p-5">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChartNoAxesCombined className="w-5 h-5 text-primary" />
            </div>

            <div>
              <h2 className="font-bold text-foreground">
                Monthly Breakdown
              </h2>

              <p className="text-xs text-muted-foreground mt-0.5">
                Income and expenses throughout the year
              </p>
            </div>

          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
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
                formatter={(value) => formatMoney(value)}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))'
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

        </Card>

        {/* Annual allocation */}
        <Card className="p-5">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-primary" />
            </div>

            <div>
              <h2 className="font-bold text-foreground">
                Annual Allocation
              </h2>

              <p className="text-xs text-muted-foreground mt-0.5">
                Where your money went during {year}
              </p>
            </div>

          </div>

          <div className="space-y-6">

            {allocation.map(([name, val]) => {

              const percentage =
                (val / allocMax) * 100;

              return (
                <div key={name}>

                  <div className="flex items-center justify-between gap-3 mb-2">

                    <span className="text-sm font-semibold text-foreground">
                      {name}
                    </span>

                    <span className="text-sm font-semibold text-muted-foreground">
                      {formatMoney(val)}
                    </span>

                  </div>

                  <div className="h-3 bg-muted rounded-full overflow-hidden">

                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </Card>

      </div>

    </div>
  );
}