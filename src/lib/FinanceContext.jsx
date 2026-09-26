import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { supabase } from '@/api/supabaseClient';
import { getUsdPhpRate } from '@/api/exchangeRate';

const FinanceContext = createContext(null);

const DEFAULT_BUDGET = {
  savings_pct: 25,
  sent_home_pct: 20,
  needs_pct: 35,
  misc_pct: 10,
  emergency_pct: 10
};

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budget, setBudget] = useState(null);

  const [liveRate, setLiveRate] = useState(null);
  const [rateLive, setRateLive] = useState(false);
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);

  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setTransactions([]);
        setAccounts([]);
        setGoals([]);
        setBudget(null);
        return;
      }

      const [
        transactionsResult,
        accountsResult,
        goalsResult,
        budgetResult
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .limit(500),

        supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: true }),

        supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: true }),

        supabase
          .from('budgets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (accountsResult.error) throw accountsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (budgetResult.error) throw budgetResult.error;

      setTransactions(transactionsResult.data || []);
      setAccounts(accountsResult.data || []);
      setGoals(goalsResult.data || []);
      setBudget(budgetResult.data || null);
    } catch (e) {
      console.error('finance load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    const loadLiveRate = async () => {
      try {
        const result = await getUsdPhpRate();

        if (cancelled) return;

        setLiveRate(result.rate);
        setRateUpdatedAt(result.updated_at);
        setRateLive(true);

           console.log(
          `Live USD/PHP rate: ${result.rate}`,
          `Updated: ${result.updated_at}`
        );
      } catch (error) {
        if (cancelled) return;

        console.warn('Live exchange rate unavailable:', error);
        setRateLive(false);
      }
    };

    loadLiveRate();

    const interval = setInterval(loadLiveRate, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const rate = liveRate || Number(budget?.usd_php_rate) || 58;

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        accounts,
        goals,
        budget,
        defaultBudget: DEFAULT_BUDGET,
        loading,
        refresh,
        rate,
        rateInfo: {
          live: rateLive,
          value: rate,
          manual: Number(budget?.usd_php_rate) || 58,
          updatedAt: rateUpdatedAt
        }
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);

  if (!ctx) {
    throw new Error('useFinance must be used within FinanceProvider');
  }

  return ctx;
}


