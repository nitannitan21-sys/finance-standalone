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
import { supabase } from '@/api/supabaseClient';
import { useFinance } from '@/lib/FinanceContext';

export default function GoalModal({ open, onClose, editing }) {
  const { refresh } = useFinance();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setName(editing.name);
      setTarget(String(editing.target ?? ''));
      setCurrent(String(editing.current ?? ''));
    } else {
      setName('');
      setTarget('');
      setCurrent('');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim() || !Number(target)) {
      alert('Enter a goal name and target.');
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
        target: Number(target) || 0,
        current: Number(current) || 0
      };

      if (editing) {
        const { error } = await supabase
          .from('goals')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({
            ...payload,
            user_id: user.id
          });

        if (error) throw error;
      }

      await refresh();
      onClose();
    } catch (e) {
      console.error('Goal save error:', e);
      alert(e.message || 'Failed to save goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Goal' : 'Add Goal'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-1">
          <div>
            <Label>Goal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emergency Fund"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target (₱)</Label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Current (₱)</Label>
              <Input
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="mt-1"
              />
            </div>
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