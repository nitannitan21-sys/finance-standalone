import React, { useState, useEffect } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import { formatMoney } from '@/lib/finance';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SlidersHorizontal,
  Wallet,
  PiggyBank,
  Send,
  Home,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';

const FIELDS = [
  {
    key: 'savings_pct',
    label: 'Savings',
    icon: PiggyBank,
    description: 'Money you want to set aside',
    tone: 'violet'
  },
  {
    key: 'sent_home_pct',
    label: 'Sent Home',
    icon: Send,
    description: 'Money allocated for home',
    tone: 'blue'
  },
  {
    key: 'needs_pct',
    label: 'Needs',
    icon: Home,
    description: 'Essential living expenses',
    tone: 'emerald'
  },
  {
    key: 'misc_pct',
    label: 'Miscellaneous',
    icon: Sparkles,
    description: 'Flexible spending',
    tone: 'amber'
  },
  {
    key: 'emergency_pct',
    label: 'Emergency / Flex',
    icon: ShieldAlert,
    description: 'Emergency or extra money',
    tone: 'rose'
  }
];

const DEFAULT = {
  savings_pct: 25,
  sent_home_pct: 20,
  needs_pct: 35,
  misc_pct: 10,
  emergency_pct: 10,
  usd_php_rate: 58
};

const TONE_STYLES = {
  violet: {
    icon: 'bg-violet-500/10 text-violet-500',
    value: 'text-violet-600 dark:text-violet-400'
  },
  blue: {
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary'
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-500',
    value: 'text-emerald-600 dark:text-emerald-400'
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-500',
    value: 'text-amber-600 dark:text-amber-400'
  },
  rose: {
    icon: 'bg-rose-500/10 text-rose-500',
    value: 'text-rose-600 dark:text-rose-400'
  }
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
    (sum, field) =>
      sum + (Number(vals[field.key]) || 0),
    0
  );

  const valid = total === 100;

  const inc =
    Number(
      String(income).replace(/,/g, '')
    ) || 0;

  const handleChange = (key, value) => {
    setVals((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleIncomeChange = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');

    const parts = cleaned.split('.');

    const formattedInteger =
      parts[0]
        ? Number(parts[0]).toLocaleString('en-US')
        : '';

    const formatted =
      parts.length > 1
        ? `${formattedInteger}.${parts[1]}`
        : formattedInteger;

    setIncome(formatted);
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
        savings_pct:
          Number(vals.savings_pct) || 0,
        sent_home_pct:
          Number(vals.sent_home_pct) || 0,
        needs_pct:
          Number(vals.needs_pct) || 0,
        misc_pct:
          Number(vals.misc_pct) || 0,
        emergency_pct:
          Number(vals.emergency_pct) || 0,
        usd_php_rate:
          Number(vals.usd_php_rate) || 58
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
      alert(
        e.message || 'Failed to save budget.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading budget…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">

        <div className="w-2 h-9 rounded-full bg-primary" />

        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Budget
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Adjust how you want to allocate your income.
          </p>
        </div>

      </div>

      {/* Allocation summary */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/70 rounded-2xl p-5 mb-5 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </div>

            <div>
              <h2 className="font-bold text-foreground">
                Income Allocation
              </h2>

              <p className="text-xs text-muted-foreground mt-0.5">
                Your percentages should total exactly 100%.
              </p>
            </div>

          </div>

          <div
            className={`
              flex items-center gap-2
              px-3 py-2
              rounded-xl
              text-sm font-bold
              ${
                valid
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }
            `}
          >
            {valid ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}

            {total}% Allocated
          </div>

        </div>

        {/* Allocation bar */}
        <div className="mt-5">

          <div className="h-3 bg-muted rounded-full overflow-hidden flex">

            {FIELDS.map((field) => {

              const percentage =
                Number(vals[field.key]) || 0;

              return (
                <div
                  key={field.key}
                  className="h-full bg-primary/70 first:bg-primary transition-all"
                  style={{
                    width: `${percentage}%`
                  }}
                  title={`${field.label}: ${percentage}%`}
                />
              );
            })}

          </div>

        </div>

        {!valid && (
          <div className="flex items-center gap-2 text-sm text-rose-500 mt-3">
            <AlertCircle className="w-4 h-4" />

            <span>
              Your percentages must total exactly 100%.
            </span>
          </div>
        )}

      </div>

      {/* Percentage controls */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-5">

        {FIELDS.map((field) => {

          const Icon = field.icon;
          const style =
            TONE_STYLES[field.tone] ||
            TONE_STYLES.blue;

          const percentage =
            Number(vals[field.key]) || 0;

          return (
            <div
              key={field.key}
              className="
                bg-card/95
                backdrop-blur-sm
                border border-border/70
                rounded-2xl
                p-5
                shadow-sm
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.icon}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <Label className="text-sm font-bold text-foreground">
                    {field.label}
                  </Label>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {field.description}
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3 mt-5">

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
                  className="h-11 rounded-xl text-lg font-bold"
                />

                <span className="text-sm font-semibold text-muted-foreground">
                  %
                </span>

              </div>

              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">

                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      percentage
                    )}%`
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>

      {/* Income calculator */}
      <div className="bg-card/95 backdrop-blur-sm border border-border/70 rounded-2xl p-5 shadow-sm mb-5">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>

          <div>
            <h2 className="font-bold text-foreground">
              Income Calculator
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              Enter an income amount to see your planned allocation.
            </p>
          </div>

        </div>

        <div className="max-w-md">

          <Label className="text-xs font-semibold text-muted-foreground">
            Income to Calculate
          </Label>

          <div className="relative mt-1.5">

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              ₱
            </span>

            <Input
              inputMode="decimal"
              value={income}
              onChange={(e) =>
                handleIncomeChange(e.target.value)
              }
              placeholder="25,000"
              className="pl-8 h-11 rounded-xl text-lg font-semibold"
            />

          </div>

        </div>

        {inc > 0 && (

          <div className="grid gap-2 mt-5 md:grid-cols-2 xl:grid-cols-3">

            {FIELDS.map((field) => {

              const percentage =
                Number(vals[field.key]) || 0;

              const amount =
                inc * (percentage / 100);

              const Icon = field.icon;
              const style =
                TONE_STYLES[field.tone] ||
                TONE_STYLES.blue;

              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 border border-border/50 p-3"
                >

                  <div className="flex items-center gap-2 min-w-0">

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.icon}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">

                      <div className="text-xs font-semibold text-foreground truncate">
                        {field.label}
                      </div>

                      <div className="text-[10px] text-muted-foreground">
                        {percentage}%
                      </div>

                    </div>

                  </div>

                  <span className="text-sm font-extrabold text-foreground whitespace-nowrap">
                    {formatMoney(amount)}
                  </span>

                </div>
              );
            })}

          </div>

        )}

      </div>

      {/* Save */}
      <div className="flex justify-end">

        <Button
          onClick={handleSave}
          disabled={saving || !valid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10 px-5"
        >
          <Save className="w-4 h-4 mr-1.5" />

          {saving
            ? 'Saving…'
            : 'Save Budget'}
        </Button>

      </div>

    </div>
  );
}