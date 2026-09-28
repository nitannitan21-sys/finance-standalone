import React, { useState } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import { formatMoney } from '@/lib/finance';
import { supabase } from '@/api/supabaseClient';
import GoalModal from '@/components/GoalModal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Trophy,
  CircleCheck
} from 'lucide-react';

export default function Goals() {
  const { goals, loading, refresh } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading goals…
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;

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
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await refresh();
    } catch (e) {
      console.error('Goal delete error:', e);
      alert(e.message || 'Failed to delete goal.');
    } finally {
      setDeleting(false);
    }
  };

  const completedGoals = goals.filter(
    (g) =>
      Number(g.target || 0) > 0 &&
      Number(g.current || 0) >= Number(g.target || 0)
  ).length;

  const totalTarget = goals.reduce(
    (sum, g) => sum + Number(g.target || 0),
    0
  );

  const totalSaved = goals.reduce(
    (sum, g) => sum + Number(g.current || 0),
    0
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">
          <div className="w-2 h-9 rounded-full bg-primary" />

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Savings Goals
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Track what you're saving toward
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
          Add Goal
        </Button>

      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">

          <div className="bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-4">

            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4 text-primary" />

              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Goals
              </span>
            </div>

            <div className="text-2xl font-extrabold text-foreground mt-2">
              {goals.length}
            </div>

          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-4">

            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-4 h-4 text-violet-500" />

              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Completed
              </span>
            </div>

            <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-2">
              {completedGoals}
            </div>

          </div>

          <div className="hidden md:block bg-card/80 backdrop-blur-sm border border-border/70 rounded-2xl p-4">

            <div className="flex items-center gap-2 text-muted-foreground">
              <CircleCheck className="w-4 h-4 text-emerald-500" />

              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Saved Toward Goals
              </span>
            </div>

            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatMoney(totalSaved)}
            </div>

            <div className="text-[11px] text-muted-foreground mt-0.5">
              of {formatMoney(totalTarget)}
            </div>

          </div>

        </div>
      )}

      {/* Goals */}
      {goals.length === 0 ? (

        <div className="bg-card/95 backdrop-blur-sm border border-dashed border-border rounded-2xl p-12 text-center shadow-sm">

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>

          <h2 className="font-bold text-foreground text-lg">
            No savings goals yet
          </h2>

          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Set your first savings target and track your progress.
          </p>

          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Goal
          </Button>

        </div>

      ) : (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          {goals.map((g) => {

            const target = Number(g.target || 0);
            const current = Number(g.current || 0);

            const pct = target
              ? Math.min(100, (current / target) * 100)
              : 0;

            const remain = Math.max(
              0,
              target - current
            );

            const completed =
              target > 0 && current >= target;

            return (
              <div
                key={g.id}
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

                {/* Decorative glow */}
                <div
                  className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/5"
                  aria-hidden="true"
                />

                <div className="relative">

                  {/* Goal heading */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {completed ? (
                          <Trophy className="w-5 h-5 text-violet-500" />
                        ) : (
                          <Target className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      <div className="min-w-0">

                        <div className="font-bold text-foreground truncate">
                          {g.name}
                        </div>

                        <div className="text-xs text-muted-foreground mt-0.5">
                          {completed
                            ? 'Goal completed'
                            : 'Savings goal'}
                        </div>

                      </div>

                    </div>

                    <span
                      className={`
                        text-sm font-extrabold
                        px-2.5 py-1
                        rounded-full
                        whitespace-nowrap
                        ${
                          completed
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'bg-primary/10 text-primary'
                        }
                      `}
                    >
                      {pct.toFixed(0)}%
                    </span>

                  </div>

                  {/* Amount */}
                  <div className="mt-6">

                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Progress
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-1">

                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {formatMoney(current)}
                      </span>

                      <span className="text-sm text-muted-foreground">
                        / {formatMoney(target)}
                      </span>

                    </div>

                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">

                    <div className="h-3 bg-muted rounded-full overflow-hidden">

                      <div
                        className={`
                          h-full rounded-full transition-all duration-500
                          ${
                            completed
                              ? 'bg-violet-500'
                              : 'bg-primary'
                          }
                        `}
                        style={{
                          width: `${pct}%`
                        }}
                      />

                    </div>

                  </div>

                  {/* Remaining */}
                  <div className="flex items-center justify-between mt-3">

                    <span className="text-xs text-muted-foreground">
                      {completed
                        ? 'Target reached'
                        : 'Remaining'}
                    </span>

                    <span
                      className={`text-xs font-semibold ${
                        completed
                          ? 'text-violet-500'
                          : 'text-foreground'
                      }`}
                    >
                      {completed
                        ? formatMoney(0)
                        : formatMoney(remain)}
                    </span>

                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-5 pt-4 border-t border-border/60">

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl flex-1"
                      onClick={() => {
                        setEditing(g);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-rose-500 hover:text-rose-500 hover:bg-rose-500/10"
                      onClick={() =>
                        handleDelete(g.id)
                      }
                      disabled={deleting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      {deleting
                        ? 'Deleting…'
                        : 'Delete'}
                    </Button>

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />

    </div>
  );
}