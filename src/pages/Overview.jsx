import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/lib/FinanceContext';
import {
  formatMoney,
  formatMoneyByCurrency,
  totalBalancePHP,
  sumByTypePHP,
  savingsTotalPHP,
  safeToSpend,
  monthTransactions,
  sumByCategoryPHP,
  spendingByCategoryPHP,
  netWorthSeries,
  monthLabel,
  monthShort,
  accountName,
  txAccountCurrency
} from '@/lib/finance';
import TransactionModal from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft
} from 'lucide-react';

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

function Card({ children, className = '' }) {
  return (
    <div
      className={[
        'bg-card/95 backdrop-blur-sm',
        'border border-border/70',
        'rounded-2xl',
        'shadow-sm',
        'p-5',
        className
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    green: {
      icon: 'text-emerald-400',
      value: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    red: {
      icon: 'text-rose-400',
      value: 'text-rose-400',
      bg: 'bg-rose-500/10'
    },
    blue: {
      icon: 'text-sky-400',
      value: 'text-sky-400',
      bg: 'bg-sky-500/10'
    },
    purple: {
      icon: 'text-violet-400',
      value: 'text-violet-400',
      bg: 'bg-violet-500/10'
    },
    neutral: {
      icon: 'text-primary',
      value: 'text-foreground',
      bg: 'bg-primary/10'
    }
  };

  const current = tones[tone] || tones.neutral;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div
          className={[
            'w-9 h-9 rounded-xl flex items-center justify-center',
            current.bg
          ].join(' ')}
        >
          <Icon className={`w-[18px] h-[18px] ${current.icon}`} />
        </div>

        <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
          {label}
        </span>
      </div>

      <div
        className={[
          'text-xl md:text-2xl font-extrabold mt-3 tracking-tight',
          current.value
        ].join(' ')}
      >
        {value}
      </div>

      <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-primary/5" />
    </Card>
  );
}

export default function Overview() {
  const { transactions, accounts, budget, loading, rate } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

  const month = new Date().toISOString().slice(0, 7);

  const mTx = useMemo(
    () => monthTransactions(transactions, month),
    [transactions, month]
  );

  const totalLeft = useMemo(
    () => totalBalancePHP(accounts, transactions, rate),
    [accounts, transactions, rate]
  );

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

  const savings = savingsTotalPHP(
    transactions,
    accounts,
    rate
  );

  const mIncome = sumByTypePHP(
    mTx,
    accounts,
    rate,
    'income'
  );

  const mExpenses = sumByTypePHP(
    mTx,
    accounts,
    rate,
    'expense'
  );

  const mSavings = savingsTotalPHP(
    mTx,
    accounts,
    rate
  );

  const mSentHome = sumByCategoryPHP(
    mTx,
    accounts,
    rate,
    'Sent Home'
  );

  const safe = safeToSpend(
    mIncome,
    mExpenses,
    mSavings,
    mSentHome,
    budget
  );

  const catData = useMemo(
    () =>
      spendingByCategoryPHP(
        transactions,
        accounts,
        rate
      ).slice(0, 6),
    [transactions, accounts, rate]
  );

  const categoryColors = [
    '#38bdf8',
    '#2563eb',
    '#14b8a6',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444'
  ];

  const totalSpending = useMemo(
    () =>
      catData.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [catData]
  );

  const netSeries = useMemo(
    () =>
      netWorthSeries(
        transactions,
        accounts,
        rate
      ),
    [transactions, accounts, rate]
  );

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) =>
          (b.date || '').localeCompare(a.date || '')
        )
        .slice(0, 7),
    [transactions]
  );

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading your finances…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-8 rounded-full bg-primary" />

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                Overview
              </h1>

              <p className="text-sm text-muted-foreground mt-1">
                Your money at a glance ·{' '}
                {new Date().toLocaleDateString('en-PH', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/10 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Transaction
        </Button>
      </div>

      {/* MONEY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

        <Stat
          icon={Wallet}
          label="Money Left"
          value={formatMoney(totalLeft)}
          tone="neutral"
        />

        <Stat
          icon={TrendingUp}
          label="Income"
          value={formatMoney(allIncome)}
          tone="green"
        />

        <Stat
          icon={TrendingDown}
          label="Expenses"
          value={formatMoney(allExpenses)}
          tone="red"
        />

        <Stat
          icon={PiggyBank}
          label="Savings"
          value={formatMoney(savings)}
          tone="blue"
        />

        <Stat
          icon={ShieldCheck}
          label="Safe to Spend"
          value={formatMoney(safe)}
          tone="green"
        />

      </div>

      {/* MAIN TWO-COLUMN AREA */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">

        {/* SPENDING */}
        <Card className="min-h-[350px]">

          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-foreground">
                Spending by Category
              </h2>

              <p className="text-xs text-muted-foreground mt-1">
                Where your money is going
              </p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
          </div>

          {catData.length ? (

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-2">

              {/* DONUT */}
              <div className="w-full sm:w-[55%] h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>

                    <Pie
                      data={catData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={67}
                      outerRadius={98}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {catData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.category}`}
                          fill={
                            categoryColors[
                              index % categoryColors.length
                            ]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        formatMoney(value),
                        name
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border:
                          '1px solid hsl(var(--border))',
                        background:
                          'hsl(var(--popover))',
                        color:
                          'hsl(var(--popover-foreground))',
                        boxShadow:
                          '0 12px 30px rgba(0,0,0,0.18)'
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* LEGEND */}
              <div className="w-full sm:flex-1 space-y-3 px-2">

                {catData.map((entry, index) => {

                  const percentage =
                    totalSpending > 0
                      ? Math.round(
                          (Number(entry.amount || 0) /
                            totalSpending) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={entry.category}
                      className="flex items-center gap-2"
                    >

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            categoryColors[
                              index %
                                categoryColors.length
                            ]
                        }}
                      />

                      <span className="text-sm text-foreground truncate flex-1">
                        {entry.category}
                      </span>

                      <span className="text-xs font-bold text-muted-foreground">
                        {percentage}%
                      </span>

                    </div>
                  );
                })}

              </div>

            </div>

          ) : (

            <div className="text-sm text-muted-foreground py-20 text-center">
              No spending recorded yet.
            </div>

          )}

        </Card>

        {/* RECENT TRANSACTIONS */}
        <Card className="min-h-[350px]">

          <div className="flex items-center justify-between mb-2">

            <div>
              <h2 className="font-bold text-foreground">
                Recent Transactions
              </h2>

              <p className="text-xs text-muted-foreground mt-1">
                Your latest activity
              </p>
            </div>

            <Link
              to="/transactions"
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              View all →
            </Link>

          </div>

          {recent.length ? (

            <div className="flex flex-col mt-2">

              {recent.map((t) => {

                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';
                const isTransfer = t.type === 'transfer';

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0"
                  >

                    {/* ICON */}
                    <div
                      className={[
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isExpense
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-primary/10 text-primary'
                      ].join(' ')}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isExpense ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4" />
                      )}
                    </div>

                    {/* DESCRIPTION */}
                    <div className="min-w-0 flex-1">

                      <div className="text-sm font-semibold text-foreground truncate">
                        {t.note || t.category}
                      </div>

                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {t.date} ·{' '}
                        {accountName(
                          accounts,
                          t.account_id
                        )}

                        {isTransfer
                          ? ` → ${accountName(
                              accounts,
                              t.to_account_id
                            )}`
                          : ''}
                      </div>

                    </div>

                    {/* AMOUNT */}
                    <div
                      className={[
                        'text-sm font-bold whitespace-nowrap',
                        isIncome
                          ? 'text-emerald-400'
                          : isExpense
                          ? 'text-rose-400'
                          : 'text-foreground'
                      ].join(' ')}
                    >
                      {isIncome
                        ? '+'
                        : isExpense
                        ? '-'
                        : ''}

                      {formatMoneyByCurrency(
                        t.amount,
                        txAccountCurrency(
                          t,
                          accounts
                        )
                      )}
                    </div>

                  </div>
                );
              })}

            </div>

          ) : (

            <div className="text-sm text-muted-foreground py-20 text-center">
              No transactions yet. Add your first one.
            </div>

          )}

        </Card>

      </div>

      {/* NET WORTH */}
      <Card className="mt-4">

        <div className="flex items-center justify-between mb-2">

          <div>
            <h2 className="font-bold text-foreground">
              Net Worth Growth
            </h2>

            <p className="text-xs text-muted-foreground mt-1">
              How your total wealth changes over time
            </p>
          </div>

          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>

        </div>

        {netSeries.length ? (

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <AreaChart
              data={netSeries}
              margin={{
                left: 8,
                right: 16,
                top: 15,
                bottom: 5
              }}
            >

              <defs>

                <linearGradient
                  id="nwFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#38bdf8"
                    stopOpacity={0.35}
                  />

                  <stop
                    offset="100%"
                    stopColor="#38bdf8"
                    stopOpacity={0}
                  />
                </linearGradient>

              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.65}
              />

              <XAxis
                dataKey="month"
                tickFormatter={(v) =>
                  monthShort(v)
                }
                tick={{
                  fontSize: 11,
                  fill:
                    'hsl(var(--muted-foreground))'
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(v) =>
                  '₱' +
                  (v >= 1000
                    ? v / 1000 + 'k'
                    : v)
                }
                tick={{
                  fontSize: 11,
                  fill:
                    'hsl(var(--muted-foreground))'
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                labelFormatter={(v) =>
                  monthLabel(v)
                }
                formatter={(v) => [
                  formatMoney(v),
                  'Net Worth'
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border:
                    '1px solid hsl(var(--border))',
                  background:
                    'hsl(var(--popover))',
                  color:
                    'hsl(var(--popover-foreground))',
                  boxShadow:
                    '0 12px 30px rgba(0,0,0,0.18)'
                }}
              />

              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#38bdf8"
                strokeWidth={3}
                fill="url(#nwFill)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#38bdf8'
                }}
              />

            </AreaChart>

          </ResponsiveContainer>

        ) : (

          <div className="text-sm text-muted-foreground py-12 text-center">
            Add transactions to see your net worth grow.
          </div>

        )}

      </Card>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={null}
      />

    </div>
  );
}