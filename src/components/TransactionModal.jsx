import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/api/supabaseClient';
import { useFinance } from '@/lib/FinanceContext';

const INCOME_CATS = [
  'Salary',
  'Overtime',
  'Bonus',
  'Side Income',
  'Other Income'
];

const EXPENSE_CATS = [
  'Savings',
  'Sent Home',
  'Needs',
  'Food',
  'Bills',
  'Transportation',
  'Shopping',
  'Loans',
  'Insurance',
  'Miscellaneous',
  'Other'
];

export default function TransactionModal({
  open,
  onClose,
  editing,
  presetType
}) {
  const { accounts, refresh } = useFinance();

  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setType(editing.type);
      setDate(editing.date);
      setCategory(editing.category || '');
      setAccountId(editing.account_id || '');
      setToAccountId(editing.to_account_id || '');
      setAmount(String(editing.amount ?? ''));
      setNote(editing.note || '');
    } else {
      setType(presetType || 'expense');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setAmount('');
      setNote('');
    }
  }, [open, editing, accounts, presetType]);

  const cats =
    type === 'income'
      ? INCOME_CATS
      : type === 'expense'
        ? EXPENSE_CATS
        : ['Transfer'];

  const handleSave = async () => {
    const amt = Number(String(amount).replace(/,/g, ''));

    if (!amt || amt <= 0 || !date || !accountId) {
      alert('Enter a valid date, account, and amount.');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      alert('Choose a different destination account.');
      return;
    }

    if (type !== 'transfer' && !category) {
      alert('Select a category.');
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('You are not signed in.');
      }

      const payload = {
        type,
        date,
        category: type === 'transfer' ? 'Transfer' : category,
        account_id: accountId,
        amount: amt,
        note: note.trim()
      };

      if (type === 'transfer') {
        payload.to_account_id = toAccountId;
      } else {
        payload.to_account_id = null;
      }

      if (editing) {
        const { error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert({
            ...payload,
            user_id: user.id
          });

        if (error) throw error;
      }

      await refresh();
      onClose();
    } catch (e) {
      console.error('Transaction save error:', e);
      alert(e.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2">
            <Label>Type</Label>

            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setCategory('');
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="income">Money In</SelectItem>
                <SelectItem value="expense">Money Out</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Amount (₱)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          {type !== 'transfer' && (
            <div className="col-span-2">
              <Label>Category</Label>

              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Account</Label>

            <Select
              value={accountId}
              onValueChange={setAccountId}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>

              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} • {a.purpose || 'General'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'transfer' && (
            <div>
              <Label>To Account</Label>

              <Select
                value={toAccountId}
                onValueChange={setToAccountId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>

                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} • {a.purpose || 'General'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="col-span-2">
            <Label>Note</Label>

            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
