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
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  PiggyBank,
  Wallet,
  CircleDollarSign
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

function TransactionIcon({ type }) {
  if (type === 'income') {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
        <ArrowDownRight className="w-4 h-4 text-emerald-500" />
      </div>
    );
  }

  if (type === 'expense') {
    return (
      <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
        <ArrowUpRight className="w-4 h-4 text-rose-500" />
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <ArrowLeftRight className="w-4 h-4 text-primary" />
    </div>
  );
}

export default function Month() {
  const {
    transactions,
    accounts,
    budget,
    loading,
    rate
  } = useFinance();

  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const shift = (n) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + n);

    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const mTx = useMemo(
    () => monthTransactions(transactions, month),
    [transactions, month]
  );

  const s = useMemo(
    () =>
      monthlySummary(
        transactions,
        accounts,
        rate,
        month
      ),
    [transactions, accounts, rate, month]
  );

  const list = useMemo(
    () =>
      [...mTx].sort((a, b) =>
        (b.date || '').localeCompare(a.date || '')
      ),
    [mTx]
  );

  const shown = expanded ? list : list.slice(0, 10);

  const plan = [
    [
      'Savings',
      budget?.savings_pct || 0,
      s.savings
    ],
    [
      'Sent Home',
      budget?.sent_home_pct || 0,
      s.sentHome
    ],
    [
      'Needs',
      budget?.needs_pct || 0,
      sumByCategoryPHP(
        mTx,
        accounts,
        rate,
        'Needs'
      )
    ],
    [
      'Miscellaneous',
      budget?.misc_pct || 0,
      sumByCategoryPHP(
        mTx,
        accounts,
        rate,
        'Miscellaneous'
      )
    ]
  ];

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading month…
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
              Month
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Monthly income, spending & plan
            </p>
          </div>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Transaction
        </Button>
      </div>

      {/* Month selector */}
      <Card className="p-3 mb-5">
        <div className="flex items-center justify-between gap-3">

          <Button
            variant="outline"
            size="icon"
            onClick={() => shift(-1)}
            className="rounded-xl shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Selected month
            </div>

            <div className="font-extrabold text-lg text-foreground mt-0.5">
              {monthLabel(month)}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => shift(1)}
            className="rounded-xl shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

        </div>
      </Card>

      {/* Monthly stats */}
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
          label="Money Left"
          value={formatMoney(s.moneyLeft)}
          icon={Wallet}
          tone={s.moneyLeft < 0 ? 'red' : 'blue'}
        />

        <StatCard
          label="Saved"
          value={formatMoney(s.savings)}
          icon={PiggyBank}
          tone="purple"
        />

      </div>

      {/* Monthly plan */}
      <Card className="p-5 mb-5">

        <div className="flex items-start justify-between gap-3 mb-5">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-primary" />
            </div>

            <div>
              <h2 className="font-bold text-foreground">
                Monthly Plan
              </h2>

              <p className="text-xs text-muted-foreground mt-0.5">
                Actual spending compared with your budget
              </p>
            </div>
          </div>

          {s.income > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
              {formatMoney(s.income)} income
            </span>
          )}

        </div>

        <div className="space-y-5">

          {plan.map(([name, pct, actual]) => {

            const target = (s.income * pct) / 100;

            const p =
              target > 0
                ? Math.min(
                    100,
                    (actual / target) * 100
                  )
                : 0;

            return (
              <div key={name}>

                <div className="flex items-center justify-between gap-3 mb-2">

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {name}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {pct}% target
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatMoney(actual)}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      of {formatMoney(target)}
                    </div>
                  </div>

                </div>

                <div className="h-2.5 bg-muted rounded-full overflow-hidden">

                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${p}%` }}
                  />

                </div>

              </div>
            );
          })}

        </div>

        {!s.income && (
          <div className="mt-5 p-4 rounded-xl bg-muted/40 text-sm text-muted-foreground text-center">
            No income this month yet.
          </div>
        )}

      </Card>

      {/* Transactions */}
      <Card className="overflow-hidden">

        <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between gap-3">

          <div>
            <h2 className="font-bold text-foreground">
              Transactions
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              {list.length} transaction
              {list.length === 1 ? '' : 's'} this month
            </p>
          </div>

          {list.length > 10 && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Showing {shown.length}
            </span>
          )}

        </div>

        {list.length ? (

          <div className="divide-y divide-border/70">

            {shown.map((t) => {

              const currency = txAccountCurrency(
                t,
                accounts
              );

              const amountColor =
                t.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : t.type === 'expense'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-primary';

              const prefix =
                t.type === 'income'
                  ? '+'
                  : t.type === 'expense'
                    ? '-'
                    : '↔';

              return (
                <div
                  key={t.id}
                  className="px-5 py-4 hover:bg-muted/30 transition-colors"
                >

                  <div className="flex items-center gap-3">

                    <TransactionIcon type={t.type} />

                    <div className="flex-1 min-w-0">

                      <div className="font-semibold text-sm text-foreground truncate">
                        {t.note || t.category}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">

                        <span>{t.date}</span>

                        <span className="text-border">•</span>

                        <span className="truncate">
                          {accountName(
                            accounts,
                            t.account_id
                          )}

                          {t.type === 'transfer'
                            ? ` → ${accountName(
                                accounts,
                                t.to_account_id
                              )}`
                            : ''}
                        </span>

                        {t.category && (
                          <>
                            <span className="text-border">•</span>
                            <span>{t.category}</span>
                          </>
                        )}

                      </div>

                    </div>

                    <div className="text-right shrink-0">

                      <div
                        className={`font-extrabold text-sm md:text-base ${amountColor}`}
                      >
                        {prefix}{' '}
                        {formatMoneyByCurrency(
                          t.amount,
                          currency
                        )}
                      </div>

                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                        {currency}
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        ) : (

          <div className="p-10 text-center">

            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CircleDollarSign className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-bold text-foreground">
              No transactions this month
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              Add a transaction to start tracking this month.
            </p>

          </div>
        )}

        {list.length > 10 && (
          <div className="p-3 border-t border-border/70 text-center bg-muted/10">

            <button
              onClick={() =>
                setExpanded((e) => !e)
              }
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              {expanded
                ? 'See Less'
                : `See More (${list.length - 10})`}
            </button>

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