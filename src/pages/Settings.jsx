import React, { useRef, useState } from 'react';
import { Download, Database, ShieldCheck, Upload } from 'lucide-react';
import { useFinance } from '@/lib/FinanceContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { accounts, transactions, budgets } = useFinance();
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleDownloadBackup = async () => {
    setExporting(true);

    try {
      const userId = user?.id;

      if (!userId) {
        throw new Error('Your account could not be identified.');
      }

      const [
        { data: profile, error: profileError },
        { data: budgetRows, error: budgetError },
        { data: goalRows, error: goalError }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),

        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userId),

        supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
      ]);

      if (profileError) throw profileError;
      if (budgetError) throw budgetError;
      if (goalError) throw goalError;

      const backup = {
        app: 'SFinance',
        backup_version: 1,
        exported_at: new Date().toISOString(),

        user: {
          id: userId,
          email: user?.email || null
        },

        profile: profile || null,

        accounts: accounts || [],
        transactions: transactions || [],
        budgets: budgetRows || budgets || [],
        goals: goalRows || []
      };

      const json = JSON.stringify(backup, null, 2);

      const blob = new Blob([json], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      link.href = url;
      link.download = `SFinance-Backup-${date}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup export failed:', error);
      alert(error.message || 'Failed to create backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreBackup = async (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = '';

    if (!file) return;

    setRestoring(true);

    try {
      const userId = user?.id;

      if (!userId) {
        throw new Error('Your account could not be identified.');
      }

      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Please select an SFinance JSON backup file.');
      }

      const text = await file.text();

      let backup;

      try {
        backup = JSON.parse(text);
      } catch {
        throw new Error('The selected file is not valid JSON.');
      }

      // Basic backup validation.
      if (
        !backup ||
        backup.app !== 'SFinance' ||
        backup.backup_version !== 1
      ) {
        throw new Error(
          'This is not a valid SFinance backup file.'
        );
      }

      if (backup.user?.id !== userId) {
        throw new Error(
          'This backup belongs to a different SFinance account.'
        );
      }

      if (!Array.isArray(backup.accounts)) {
        throw new Error('The backup is missing account data.');
      }

      if (!Array.isArray(backup.transactions)) {
        throw new Error('The backup is missing transaction data.');
      }

      if (!Array.isArray(backup.budgets)) {
        throw new Error('The backup is missing budget data.');
      }

      if (!Array.isArray(backup.goals)) {
        throw new Error('The backup is missing goal data.');
      }

      const confirmed = window.confirm(
        'Restore this SFinance backup?\n\n' +
        'Your backup data will be added back to your account. ' +
        'Existing records with the same IDs will be updated.'
      );

      if (!confirmed) {
        return;
      }

      // Never trust user_id values stored inside the backup.
      // Every restored row is forced to belong to the logged-in user.
      const restoredAccounts = backup.accounts.map((row) => ({
        ...row,
        user_id: userId
      }));

      const restoredTransactions = backup.transactions.map((row) => ({
        ...row,
        user_id: userId
      }));

      const restoredBudgets = backup.budgets.map((row) => ({
        ...row,
        user_id: userId
      }));

      const restoredGoals = backup.goals.map((row) => ({
        ...row,
        user_id: userId
      }));

      // Restore parent records first.
      if (restoredAccounts.length > 0) {
        const { error } = await supabase
          .from('accounts')
          .upsert(restoredAccounts, {
            onConflict: 'id'
          });

        if (error) throw error;
      }

      // Transactions can reference accounts.
      if (restoredTransactions.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .upsert(restoredTransactions, {
            onConflict: 'id'
          });

        if (error) throw error;
      }

      if (restoredBudgets.length > 0) {
        const { error } = await supabase
          .from('budgets')
          .upsert(restoredBudgets, {
            onConflict: 'id'
          });

        if (error) throw error;
      }

      if (restoredGoals.length > 0) {
        const { error } = await supabase
          .from('goals')
          .upsert(restoredGoals, {
            onConflict: 'id'
          });

        if (error) throw error;
      }

      alert(
        'Backup restored successfully.\n\n' +
        'SFinance will now refresh your data.'
      );

      window.location.reload();
    } catch (error) {
      console.error('Backup restore failed:', error);
      alert(error.message || 'Failed to restore backup.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          Manage your SFinance data and account.
        </p>
      </div>

      <div className="space-y-4">

        {/* DATA & BACKUP */}
        <div className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">

            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-lg text-foreground">
                Data & Backup
              </h2>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Download a complete copy of your SFinance data as a JSON file,
                or restore data from a previous SFinance backup.
              </p>

              <div className="flex flex-wrap gap-3 mt-4">

                <Button
                  onClick={handleDownloadBackup}
                  disabled={exporting || restoring}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting
                    ? 'Creating backup...'
                    : 'Download Backup'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRestoreClick}
                  disabled={exporting || restoring}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {restoring
                    ? 'Restoring...'
                    : 'Restore Backup'}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreBackup}
                />

              </div>
            </div>
          </div>
        </div>

        {/* BACKUP INFORMATION */}
        <div className="rounded-2xl border border-border/70 bg-card/90 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">

            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <h2 className="font-bold text-lg text-foreground">
                Your Backup
              </h2>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Backup files are created directly on this device.
                SFinance does not upload your backup file anywhere.
              </p>

              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Restore only JSON files created by SFinance.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}