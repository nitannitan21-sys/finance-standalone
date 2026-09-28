import React, { useState, useMemo } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import {
  formatMoneyByCurrency,
  accountName,
  txAccountCurrency
} from '@/lib/finance';
import { supabase } from '@/api/supabaseClient';
import TransactionModal from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ReceiptText
} from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Money In' },
  { key: 'expense', label: 'Money Out' },
  { key: 'transfer', label: 'Transfers' }
];

function TransactionIcon({ type }) {
  if (type === 'income') {
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
        <ArrowDownRight className="w-5 h-5 text-emerald-500" />
      </div>
    );
  }

  if (type === 'expense') {
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
        <ArrowUpRight className="w-5 h-5 text-rose-500" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <ArrowLeftRight className="w-5 h-5 text-primary" />
    </div>
  );
}

function TypeBadge({ type }) {
  const styles = {
    income: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    expense: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    transfer: 'bg-primary/10 text-primary'
  };

  const labels = {
    income: 'Money In',
    expense: 'Money Out',
    transfer: 'Transfer'
  };

  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
        styles[type] || 'bg-muted text-muted-foreground'
      }`}
    >
      {labels[type] || type}
    </span>
  );
}

export default function Transactions() {
  const {
    transactions,
    accounts,
    loading,
    refresh
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const list = useMemo(() => {
    let l = [...transactions].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );

    if (filter !== 'all') {
      l = l.filter((t) => t.type === filter);
    }

    return l;
  }, [transactions, filter]);

  const shown = expanded ? list : list.slice(0, 10);

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading transactions…
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;

    setDeleting(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('You are not signed in.');
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await refresh();
    } catch (e) {
      console.error('Transaction delete error:', e);
      alert(e.message || 'Failed to delete transaction.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-9 rounded-full bg-primary" />

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Transactions
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              {list.length} record{list.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Transaction
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-2 mb-5 shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setExpanded(false);
              }}
              className={`
                px-4 h-9 rounded-xl text-xs font-semibold
                whitespace-nowrap transition-all
                ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/70 rounded-2xl overflow-hidden shadow-sm">

        {list.length ? (
          <div className="divide-y divide-border/70">

            {shown.map((t) => {
              const currency = txAccountCurrency(t, accounts);

              const amountPrefix =
                t.type === 'income'
                  ? '+'
                  : t.type === 'expense'
                    ? '-'
                    : '↔';

              const amountColor =
                t.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : t.type === 'expense'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-primary';

              const fromAccount = accountName(
                accounts,
                t.account_id
              );

              const toAccount =
                t.type === 'transfer'
                  ? accountName(accounts, t.to_account_id)
                  : null;

              return (
                <div
                  key={t.id}
                  className="
                    group
                    px-3 sm:px-4 md:px-5 py-4
                    hover:bg-muted/30
                    transition-colors
                  "
                >
                <div className="flex items-start gap-3">
  {/* Icon */}
  <TransactionIcon type={t.type} />

  {/* Main transaction content */}
  <div className="flex-1 min-w-0">
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
      <div className="font-semibold text-foreground break-words leading-snug">
        {t.note || 'No description'}
      </div>

      <div className="shrink-0">
        <TypeBadge type={t.type} />
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-muted-foreground">
      <span>{t.date}</span>

      <span className="text-border">•</span>

      <span className="break-words">
        {fromAccount}
        {toAccount ? ` → ${toAccount}` : ''}
      </span>

      {t.category && (
        <>
          <span className="text-border">•</span>
          <span>{t.category}</span>
        </>
      )}
    </div>
  </div>

  {/* Amount + actions */}
  <div className="flex flex-col items-end shrink-0 gap-1">
    <div
      className={`font-extrabold text-base md:text-lg ${amountColor}`}
    >
      {amountPrefix}{' '}
      {formatMoneyByCurrency(
        t.amount,
        currency
      )}
    </div>

    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
      {currency}
    </div>

    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={() => {
          setEditing(t);
          setModalOpen(true);
        }}
        className="
          p-2 rounded-lg
          text-muted-foreground
          hover:text-foreground
          hover:bg-accent
          transition-colors
        "
        title="Edit transaction"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleDelete(t.id)}
        disabled={deleting}
        className="
          p-2 rounded-lg
          text-muted-foreground
          hover:text-rose-600
          hover:bg-rose-500/10
          disabled:opacity-50
          transition-colors
        "
        title="Delete transaction"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
</div>
                </div>
              );
            })}

          </div>
        ) : (

          /* Empty state */
          <div className="p-12 text-center">

            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="w-6 h-6 text-primary" />
            </div>

            <h2 className="font-bold text-foreground text-lg">
              No transactions
            </h2>

            <p className="text-sm text-muted-foreground mt-1 mb-5">
              There are no transactions in this view yet.
            </p>

            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Transaction
            </Button>

          </div>
        )}

        {/* See more */}
        {list.length > 10 && (
          <div className="p-3 border-t border-border/70 text-center bg-muted/10">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="
                text-sm font-semibold
                text-muted-foreground
                hover:text-primary
                transition-colors
              "
            >
              {expanded
                ? 'See Less'
                : `See More (${list.length - 10})`}
            </button>
          </div>
        )}

      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
}