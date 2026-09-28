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
  ArrowLeftRight,
  Landmark,
  WalletCards
} from 'lucide-react';

function AccountCard({
  account,
  transactions,
  rate,
  rateInfo,
  visible,
  setVisible,
  onEdit,
  onDelete,
  deleting
}) {
  const brand = bankBrand(account.name, account.type);
  const bal = accountBalance(account, transactions);
  const cur = accountCurrency(account);
  const show = visible[account.id];

  return (
    <div
      className="
        relative overflow-hidden
        bg-card/95 backdrop-blur-sm
        border border-border/70
        rounded-2xl
        p-5
        shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-lg
      "
    >
      {/* Decorative ocean glow */}
      <div
        className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/5"
        aria-hidden="true"
      />

      <div className="relative">

        {/* ACCOUNT HEADER */}
        <div className="flex items-start justify-between gap-3">

          <div className="flex items-center gap-3 min-w-0">

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-sm"
              style={{ background: brand.bg }}
            >
              {brand.label}
            </div>

            <div className="min-w-0">
              <div className="font-bold text-foreground truncate">
                {account.name}
              </div>

              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {account.purpose || 'General'}
              </div>
            </div>

          </div>

          <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/10 whitespace-nowrap">
            {account.type}
          </span>

        </div>

        {/* BALANCE */}
        <div className="mt-6">

          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Available balance
          </div>

          <div className="text-3xl font-extrabold tracking-tight text-foreground">
            {show
              ? formatMoneyByCurrency(bal, cur)
              : '••••••••'}
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {show
              ? `${cur} available`
              : 'Tap Show to reveal balance'}
          </div>

          {show && cur === 'USD' && (
            <div className="text-xs text-primary font-medium mt-2">
              ≈ {formatMoney(bal * rate)}{' '}
              <span className="text-muted-foreground font-normal">
                {rateInfo?.live
                  ? '(live rate)'
                  : '(manual rate)'}
              </span>
            </div>
          )}

        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-border/60">

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              setVisible((v) => ({
                ...v,
                [account.id]: !v[account.id]
              }))
            }
          >
            {show ? (
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Eye className="w-3.5 h-3.5 mr-1.5" />
            )}

            {show ? 'Hide' : 'Show'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onEdit(account)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
            onClick={() => onDelete(account.id)}
            disabled={deleting}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>

        </div>

      </div>
    </div>
  );
}

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">

          <div className="w-2 h-9 rounded-full bg-primary" />

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Accounts
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Banks, e-wallets & cash
            </p>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">

          <span
            className="
              text-[11px] px-3 py-2 rounded-xl
              bg-primary/10
              text-primary
              border border-primary/10
              whitespace-nowrap
              font-semibold
            "
            title={
              rateInfo?.live
                ? 'Live USD→PHP rate'
                : 'Using manual rate from Budget settings'
            }
          >
            1 USD ≈ ₱{Number(rate).toFixed(2)}{' '}
            <span className="font-normal text-muted-foreground">
              {rateInfo?.live ? '· live' : '· manual'}
            </span>
          </span>

          <Button
            variant="outline"
            onClick={() => setTransferOpen(true)}
            className="rounded-xl"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5" />
            Transfer
          </Button>

          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Account
          </Button>

        </div>

      </div>

      {/* ACCOUNT SUMMARY */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">

          <div className="bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Landmark className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Accounts
              </span>
            </div>

            <div className="text-2xl font-extrabold text-foreground mt-2">
              {accounts.length}
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <WalletCards className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Currencies
              </span>
            </div>

            <div className="text-2xl font-extrabold text-foreground mt-2">
              {new Set(accounts.map((a) => accountCurrency(a))).size}
            </div>
          </div>

          
        </div>
      )}

      {/* EMPTY STATE */}
      {accounts.length === 0 ? (

        <div
          className="
            bg-card/95 backdrop-blur-sm
            border border-dashed border-border
            rounded-2xl
            p-12
            text-center
            shadow-sm
          "
        >

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-6 h-6 text-primary" />
          </div>

          <h2 className="font-bold text-foreground text-lg">
            No accounts yet
          </h2>

          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Add your first bank, e-wallet, or cash account.
          </p>

          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Account
          </Button>

        </div>

      ) : (

        /* ACCOUNT GRID */
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              transactions={transactions}
              rate={rate}
              rateInfo={rateInfo}
              visible={visible}
              setVisible={setVisible}
              onEdit={(account) => {
                setEditing(account);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}

        </div>
      )}

      {/* MODALS */}
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