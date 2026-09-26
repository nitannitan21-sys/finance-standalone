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
import { Plus, Pencil, Trash2 } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Money In' },
  { key: 'expense', label: 'Money Out' },
  { key: 'transfer', label: 'Transfers' }
];

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
        Loading…
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Transactions
          </h1>

          <p className="text-sm text-muted-foreground">
            {list.length} record{list.length === 1 ? '' : 's'}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 h-8 rounded-full text-xs font-medium border whitespace-nowrap ${
              filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {list.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">
                    Date
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Description
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Category
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Account
                  </th>

                  <th className="text-right px-4 py-3 font-semibold">
                    Amount
                  </th>

                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {shown.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {t.date}
                    </td>

                    <td className="px-4 py-3 text-foreground">
                      {t.note || '—'}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {t.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {accountName(accounts, t.account_id)}

                      {t.type === 'transfer'
                        ? ` → ${accountName(
                            accounts,
                            t.to_account_id
                          )}`
                        : ''}
                    </td>

                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        t.type === 'income'
                          ? 'text-emerald-600'
                          : t.type === 'expense'
                            ? 'text-red-600'
                            : 'text-foreground'
                      }`}
                    >
                      {t.type === 'income'
                        ? '+'
                        : t.type === 'expense'
                          ? '-'
                          : '↔ '}

                      {formatMoneyByCurrency(
                        t.amount,
                        txAccountCurrency(t, accounts)
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(t);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting}
                        className="p-1.5 text-muted-foreground hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No transactions here.
          </div>
        )}

        {list.length > 10 && (
          <div className="p-3 text-center border-t border-border">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
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