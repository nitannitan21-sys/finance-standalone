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

const PRESETS = [
  { name: 'BPI', type: 'Bank', purpose: 'Savings' },
  { name: 'BDO', type: 'Bank', purpose: 'Savings' },
  { name: 'MariBank', type: 'Bank', purpose: 'Savings' },
  { name: 'GCash', type: 'E-wallet', purpose: 'Needs' },
  { name: 'Maya', type: 'E-wallet', purpose: 'Needs' }
];

export default function AccountModal({ open, onClose, editing }) {
  const { refresh } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank');
  const [purpose, setPurpose] = useState('General');
  const [opening, setOpening] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setName(editing.name);
      setType(editing.type || 'Bank');
      setPurpose(editing.purpose || 'General');
      setOpening(String(editing.opening_balance ?? ''));
      setCurrency(editing.currency || 'PHP');
    } else {
      setName('');
      setType('Bank');
      setPurpose('General');
      setOpening('');
      setCurrency('PHP');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Enter an account name.');
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
        name: name.trim(),
        type,
        purpose: purpose.trim() || 'General',
        opening_balance: Number(opening) || 0,
        currency
      };

      if (editing) {
        const { error } = await supabase
          .from('accounts')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert({
            ...payload,
            user_id: user.id
          });

        if (error) throw error;
      }

      await refresh();
      onClose();
    } catch (e) {
      console.error('Account save error:', e);
      alert(e.message || 'Failed to save account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Account' : 'Add Account'}
          </DialogTitle>
        </DialogHeader>

        {!editing && (
          <div className="flex flex-wrap gap-2 mb-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setName(p.name);
                  setType(p.type);
                  setPurpose(p.purpose);
                }}
                className="px-3 h-8 rounded-full text-xs font-medium border border-border bg-card hover:bg-accent"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="col-span-2">
            <Label>Account Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BPI / GCash / Cash"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="E-wallet">E-wallet</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHP">PHP (₱)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Purpose</Label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Savings / Needs"
              className="mt-1"
            />
          </div>

          <div className="col-span-2">
            <Label>Opening Balance</Label>
            <Input
              type="number"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="0.00"
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