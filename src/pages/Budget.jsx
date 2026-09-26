import React, { useState, useEffect } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import { formatMoney } from '@/lib/finance';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELDS = [
  { key: 'savings_pct', label: 'Savings' },
  { key: 'sent_home_pct', label: 'Sent Home' },
  { key: 'needs_pct', label: 'Needs' },
  { key: 'misc_pct', label: 'Miscellaneous' },
  { key: 'emergency_pct', label: 'Emergency / Flex' }
];

const DEFAULT = {
  savings_pct: 25,
  sent_home_pct: 20,
  needs_pct: 35,
  misc_pct: 10,
  emergency_pct: 10,
  usd_php_rate: 58
};

export default function Budget() {
  const {
    budget,
    defaultBudget,
    loading,
    refresh
  } = useFinance();

  const [vals, setVals] = useState(DEFAULT);
  const [income, setIncome] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (budget) {
      setVals({
        ...DEFAULT,
        ...budget
      });
    } else {
      setVals({
        ...DEFAULT,
        ...defaultBudget
      });
    }
  }, [budget, defaultBudget]);

  const total = FIELDS.reduce(
    (sum, field) => sum + (Number(vals[field.key]) || 0),
    0
  );

  const valid = total === 100;

  const inc =
    Number(String(income).replace(/,/g, '')) || 0;

  const handleChange = (key, value) => {
    setVals((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!valid) {
      alert('Percentages must total exactly 100%.');
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
        user_id: user.id,
        savings_pct: Number(vals.savings_pct) || 0,
        sent_home_pct: Number(vals.sent_home_pct) || 0,
        needs_pct: Number(vals.needs_pct) || 0,
        misc_pct: Number(vals.misc_pct) || 0,
        emergency_pct: Number(vals.emergency_pct) || 0,
        usd_php_rate: Number(vals.usd_php_rate) || 58
      };

      if (budget?.id) {
        const { error } = await supabase
          .from('budgets')
          .update(payload)
          .eq('id', budget.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert(payload);

        if (error) throw error;
      }

      await refresh();

      alert('Budget saved.');
    } catch (e) {
      console.error('Budget save error:', e);
      alert(e.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Budget
        </h1>

        <p className="text-sm text-muted-foreground">
          Adjust how you want to allocate your income.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="rounded-xl border bg-card p-4"
          >
            <Label>{field.label}</Label>

            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={vals[field.key]}
                onChange={(e) =>
                  handleChange(
                    field.key,
                    e.target.value
                  )
                }
              />

              <span className="text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Total Allocation
          </span>

          <span
            className={
              valid
                ? 'font-semibold'
                : 'font-semibold text-destructive'
            }
          >
            {total}%
          </span>
        </div>

        {!valid && (
          <p className="text-sm text-destructive mt-2">
            Your percentages must total exactly 100%.
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div>
          <Label>Income to Calculate</Label>

          <Input
            inputMode="decimal"
            value={income}
            onChange={(e) =>
              setIncome(e.target.value)
            }
            placeholder="25,000"
            className="mt-1"
          />
        </div>

        {inc > 0 && (
          <div className="space-y-2 pt-2">
            {FIELDS.map((field) => {
              const percentage =
                Number(vals[field.key]) || 0;

              const amount =
                inc * (percentage / 100);

              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{field.label}</span>

                  <span className="font-medium">
                    {formatMoney(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !valid}
        >
          {saving ? 'Saving…' : 'Save Budget'}
        </Button>
      </div>
    </div>
  );
}