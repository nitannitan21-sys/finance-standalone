import React, { useState } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import {
  formatMoneyByCurrency,
  formatMoney,
  accountBalance,
  accountCurrency,
  bankBrand
} from '@/lib/finance';
import { supabase } from '@/api/supabaseClient';
import AccountModal from '@/components/AccountModal';
import TransactionModal from '@/components/TransactionModal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ArrowLeftRight
} from 'lucide-react';

export default function Accounts() {
  const {
    accounts,
    transactions,
    loading,
    refresh,
    rate,
    rateInfo
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [visible, setVisible] = useState({});
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading accounts…
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;

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
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await refresh();
    } catch (e) {
      console.error('Account delete error:', e);
      alert(e.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Accounts
          </h1>

          <p className="text-sm text-muted-foreground">
            Banks, e-wallets & cash
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border whitespace-nowrap"
            title={
              rateInfo?.live
                ? 'Live USD→PHP rate'
                : 'Using manual rate from Budget settings'
            }
          >
            1 USD ≈ ₱{Number(rate).toFixed(2)}{' '}
            {rateInfo?.live ? '· live' : '· manual'}
          </span>

          <Button
            variant="outline"
            onClick={() => setTransferOpen(true)}
          >
            <ArrowLeftRight className="w-4 h-4 mr-1" />
            Transfer
          </Button>

          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Account
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No accounts yet. Add your first bank or e-wallet.
          </p>

          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map((a) => {
            const brand = bankBrand(a.name, a.type);
            const bal = accountBalance(a, transactions);
            const cur = accountCurrency(a);
            const show = visible[a.id];

            return (
              <div
                key={a.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-extrabold"
                      style={{ background: brand.bg }}
                    >
                      {brand.label}
                    </div>

                    <div>
                      <div className="font-bold text-foreground">
                        {a.name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {a.purpose || 'General'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    {a.type}
                  </span>
                </div>

                <div className="text-3xl font-extrabold text-foreground mt-5">
                  {show
                    ? formatMoneyByCurrency(bal, cur)
                    : '••••••••'}
                </div>

                <div className="text-xs text-muted-foreground">
                  {show ? `${cur} available` : 'Tap eye to reveal'}
                </div>

                {show && cur === 'USD' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ≈ {formatMoney(bal * rate)}{' '}
                    {rateInfo?.live ? '(live)' : '(manual rate)'}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVisible((v) => ({
                        ...v,
                        [a.id]: !v[a.id]
                      }))
                    }
                  >
                    {show ? (
                      <EyeOff className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 mr-1" />
                    )}

                    {show ? 'Hide' : 'Show'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(a);
                      setModalOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDelete(a.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />

      <TransactionModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        editing={null}
        presetType="transfer"
      />
    </div>
  );
}