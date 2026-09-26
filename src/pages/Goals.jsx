import React, { useState } from 'react';
import { useFinance } from '@/lib/FinanceContext';
import { formatMoney } from '@/lib/finance';
import { supabase } from '@/api/supabaseClient';
import GoalModal from '@/components/GoalModal';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';

export default function Goals() {
  const { goals, loading, refresh } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">
        Loading…
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Savings Goals
          </h1>

          <p className="text-sm text-muted-foreground">
            Track what you're saving toward
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
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Target className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />

          <p className="text-muted-foreground mb-4">
            No goals yet. Set your first savings target.
          </p>

          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.target
              ? Math.min(100, (g.current / g.target) * 100)
              : 0;

            const remain = Math.max(
              0,
              g.target - g.current
            );

            return (
              <div
                key={g.id}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-foreground">
                    {g.name}
                  </div>

                  <span className="text-sm font-bold text-foreground">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <div className="text-sm text-muted-foreground mt-1">
                  {formatMoney(g.current)} /{' '}
                  {formatMoney(g.target)}
                </div>

                <div className="h-2.5 bg-muted rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  Remaining: {formatMoney(remain)}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(g);
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
                    onClick={() => handleDelete(g.id)}
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

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
}