// Finance calculation helpers (pure functions over loaded records).
// Balances are kept in each account's own currency; totals convert to PHP.

export function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2
  }).format(Number(n) || 0);
}

export function formatMoneyByCurrency(amount, currency) {
  const c = currency || 'PHP';
  return new Intl.NumberFormat(c === 'USD' ? 'en-US' : 'en-PH', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

export function accountCurrency(account) {
  return account?.currency || 'PHP';
}

export function toPHP(amount, currency, rate) {
  return (currency || 'PHP') === 'USD' ? (Number(amount) || 0) * (Number(rate) || 58) : Number(amount) || 0;
}

// Balance in the account's own currency.
export function accountBalance(account, transactions) {
  let bal = Number(account.opening_balance) || 0;
  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.account_id === account.id) {
      if (t.type === 'income') bal += amt;
      else if (t.type === 'expense') bal -= amt;
      else if (t.type === 'transfer') bal -= amt;
    }
    if (t.type === 'transfer' && t.to_account_id === account.id) bal += amt;
  }
  return bal;
}

export function accountBalancePHP(account, transactions, rate) {
  return toPHP(accountBalance(account, transactions), accountCurrency(account), rate);
}

export function totalBalancePHP(accounts, transactions, rate) {
  return accounts.reduce((s, a) => s + accountBalancePHP(a, transactions, rate), 0);
}

export function txAccountCurrency(transaction, accounts) {
  const a = accounts.find((x) => x.id === transaction.account_id);
  return accountCurrency(a);
}

export function sumByTypePHP(transactions, accounts, rate, type) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate), 0);
}

export function sumByCategoryPHP(transactions, accounts, rate, category) {
  return transactions
    .filter((t) => t.type === 'expense' && t.category === category)
    .reduce((s, t) => s + toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate), 0);
}

export function monthTransactions(transactions, month) {
  return transactions.filter((t) => (t.date || '').slice(0, 7) === month);
}

export function savingsTotalPHP(transactions, accounts, rate) {
  const cat = sumByCategoryPHP(transactions, accounts, rate, 'Savings');
  const transfers = transactions
    .filter((t) => t.type === 'transfer')
    .filter((t) => {
      const dest = accounts.find((a) => a.id === t.to_account_id);
      return dest && /savings/i.test(dest.purpose || '');
    })
    .reduce((s, t) => s + toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate), 0);
  return cat + transfers;
}

export function safeToSpend(monthIncome, monthExpenses, savings, sentHome, budget) {
  const s = Number(budget?.savings_pct) || 0;
  const h = Number(budget?.sent_home_pct) || 0;
  return Math.max(
    0,
    monthIncome - (monthIncome * s) / 100 - (monthIncome * h) / 100 - Math.max(0, monthExpenses - savings - sentHome)
  );
}

export function spendingByCategoryPHP(transactions, accounts, rate) {
  const map = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      const key = t.category || 'Other';
      map[key] = (map[key] || 0) + toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate);
    }
  }
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function netWorthSeries(transactions, accounts, rate) {
  const months = [...new Set(transactions.map((t) => (t.date || '').slice(0, 7)))].sort();
  if (!months.length) return [];
  const base = accounts.reduce((s, a) => s + toPHP(Number(a.opening_balance) || 0, accountCurrency(a), rate), 0);
  const series = [];
  let cum = base;
  for (const m of months) {
    let delta = 0;
    for (const t of transactions) {
      if ((t.date || '').slice(0, 7) === m) {
        const amt = toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate);
        if (t.type === 'income') delta += amt;
        else if (t.type === 'expense') delta -= amt;
      }
    }
    cum += delta;
    series.push({ month: m, netWorth: cum });
  }
  return series;
}

export function monthlySummary(transactions, accounts, rate, month) {
  const mTx = monthTransactions(transactions, month);
  const income = sumByTypePHP(mTx, accounts, rate, 'income');
  const expenses = sumByTypePHP(mTx, accounts, rate, 'expense');
  const transfersOut = mTx
    .filter((t) => t.type === 'transfer')
    .reduce((s, t) => s + toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate), 0);
  const savings = savingsTotalPHP(mTx, accounts, rate);
  const sentHome = sumByCategoryPHP(mTx, accounts, rate, 'Sent Home');
  const moneyLeft = income - expenses - transfersOut;
  return { income, expenses, transfersOut, savings, sentHome, moneyLeft };
}

export function yearSummary(transactions, accounts, rate, year) {
  const yTx = transactions.filter((t) => (t.date || '').startsWith(String(year)));
  const income = sumByTypePHP(yTx, accounts, rate, 'income');
  const expenses = sumByTypePHP(yTx, accounts, rate, 'expense');
  const transfersOut = yTx
    .filter((t) => t.type === 'transfer')
    .reduce((s, t) => s + toPHP(Number(t.amount) || 0, txAccountCurrency(t, accounts), rate), 0);
  const savings = savingsTotalPHP(yTx, accounts, rate);
  const sentHome = sumByCategoryPHP(yTx, accounts, rate, 'Sent Home');
  const moneyLeft = income - expenses - transfersOut;
  return { income, expenses, transfersOut, savings, sentHome, moneyLeft };
}

export function accountName(accounts, id) {
  const a = accounts.find((x) => x.id === id);
  return a ? a.name : '—';
}

export function monthLabel(month) {
  return new Date(month + '-01').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

export function monthShort(month) {
  return new Date(month + '-01').toLocaleDateString('en-PH', { month: 'short' });
}

export function bankBrand(name, type) {
  const n = (name || '').toLowerCase();
  if (n.includes('bpi')) return { label: 'BPI', bg: 'linear-gradient(135deg,#a3121a,#e11d48)' };
  if (n.includes('bdo')) return { label: 'BDO', bg: 'linear-gradient(135deg,#0f4acb,#2563eb)' };
  if (n.includes('mari')) return { label: 'MARI', bg: 'linear-gradient(135deg,#0f766e,#14b8a6)' };
  if (n.includes('gcash')) return { label: 'GCASH', bg: 'linear-gradient(135deg,#0369a1,#38bdf8)' };
  if (n.includes('maya')) return { label: 'MAYA', bg: 'linear-gradient(135deg,#047857,#22c55e)' };
  if ((type || '').toLowerCase() === 'cash') return { label: 'CASH', bg: 'linear-gradient(135deg,#57534e,#a8a29e)' };
  return { label: (name || 'ACC').slice(0, 4).toUpperCase(), bg: 'linear-gradient(135deg,#44403c,#78716c)' };
}