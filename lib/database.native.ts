import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('squirl.db');

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id            INTEGER PRIMARY KEY,
      name          TEXT,
      language      TEXT,
      income_type   TEXT,
      gross_salary  REAL,
      pay_frequency TEXT,
      deductions    TEXT,
      next_payday   TEXT
    );
  `);

  try {
    db.execSync('ALTER TABLE user_profile ADD COLUMN next_payday TEXT;');
  } catch {
    // Column already exists on older installs.
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS income_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      amount     REAL NOT NULL,
      note       TEXT,
      category   TEXT NOT NULL,
      account    TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS expense_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      amount     REAL NOT NULL,
      note       TEXT,
      category   TEXT NOT NULL,
      account    TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS wallet_accounts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      currency   TEXT NOT NULL,
      balance    REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS debt_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL,
      person     TEXT NOT NULL,
      amount     REAL NOT NULL,
      note       TEXT,
      settled_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT NOT NULL,
      target_total     REAL NOT NULL,
      saved_total      REAL NOT NULL DEFAULT 0,
      remaining_to_go  REAL NOT NULL,
      progress         REAL NOT NULL DEFAULT 0,
      icon             TEXT,
      funding_account  TEXT,
      created_at       TEXT NOT NULL,
      is_hidden        INTEGER DEFAULT 0
    );
  `);

  try {
    db.execSync('ALTER TABLE savings_goals ADD COLUMN is_hidden INTEGER DEFAULT 0;');
  } catch {
    // Column already exists on older installs.
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS bills (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      amount     REAL NOT NULL,
      due_day    INTEGER NOT NULL,
      frequency  TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.execSync('ALTER TABLE debt_entries ADD COLUMN settled_at TEXT;');
  } catch {
    // Column already exists on older installs.
  }

  const existingAccounts = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM wallet_accounts');
  if ((existingAccounts?.count ?? 0) === 0) {
    const nowIso = new Date().toISOString();
    const defaults = ['Cash'];
    defaults.forEach((name) => {
      db.runSync(
        'INSERT INTO wallet_accounts (name, currency, balance, created_at) VALUES (?, ?, ?, ?)',
        [name, 'PHP', 0, nowIso]
      );
    });
  }
}

export function saveBasicProfile(
  name: string,
  language: string,
  incomeType: string
) {
  const existing = db.getFirstSync<{ id: number }>(
    'SELECT id FROM user_profile LIMIT 1'
  );
  if (existing) {
    db.runSync(
      'UPDATE user_profile SET name = ?, language = ?, income_type = ? WHERE id = ?',
      [name, language, incomeType, existing.id]
    );
  } else {
    db.runSync(
      'INSERT INTO user_profile (name, language, income_type) VALUES (?, ?, ?)',
      [name, language, incomeType]
    );
  }
}

export function saveSalaryProfile(
  grossSalary: number | null,
  payFrequency: string,
  deductions: string[],
  nextPayday: string | null
) {
  db.runSync(
    'UPDATE user_profile SET gross_salary = ?, pay_frequency = ?, deductions = ?, next_payday = ?',
    [
      grossSalary,
      grossSalary ? payFrequency : null,
      grossSalary ? JSON.stringify(deductions) : null,
      grossSalary ? nextPayday : null,
    ]
  );
}

export type UserProfile = {
  id: number;
  name: string;
  language: string;
  income_type: string;
  gross_salary: number | null;
  pay_frequency: string | null;
  deductions: string | null;
  next_payday: string | null;
};

export type IncomeEntry = {
  id: number;
  amount: number;
  note: string;
  category: string;
  account: string;
  created_at: string;
};

export type ExpenseEntry = {
  id: number;
  amount: number;
  note: string;
  category: string;
  account: string;
  created_at: string;
};

export type CashflowMonth = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export type HistoryTransaction = {
  id: number;
  type: 'income' | 'expense';
  name: string;
  meta: string;
  amount: number;
  created_at: string;
};

export type WalletAccount = {
  id: number;
  name: string;
  currency: string;
  balance: number;
  created_at: string;
};

export type DebtEntry = {
  id: number;
  type: 'iowe' | 'owed';
  person: string;
  amount: number;
  note: string;
  created_at: string;
  settled_at?: string | null;
};

export function getUserProfile(): UserProfile | null {
  return db.getFirstSync<UserProfile>('SELECT * FROM user_profile LIMIT 1') ?? null;
}

export function saveIncomeEntry(
  amount: number,
  note: string,
  category: string,
  account: string
) {
  db.runSync(
    'INSERT INTO income_entries (amount, note, category, account, created_at) VALUES (?, ?, ?, ?, ?)',
    [amount, note, category, account, new Date().toISOString()]
  );
}

export function deleteIncomeEntry(id: number) {
  db.runSync('DELETE FROM income_entries WHERE id = ?', [id]);
}

export function getTodayIncomeTotal(): number {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM income_entries WHERE created_at >= ? AND created_at < ?',
    [start.toISOString(), end.toISOString()]
  );

  return row?.total ?? 0;
}

export function saveExpenseEntry(
  amount: number,
  note: string,
  category: string,
  account: string
) {
  db.runSync(
    'INSERT INTO expense_entries (amount, note, category, account, created_at) VALUES (?, ?, ?, ?, ?)',
    [amount, note, category, account, new Date().toISOString()]
  );
}

export function deleteExpenseEntry(id: number) {
  db.runSync('DELETE FROM expense_entries WHERE id = ?', [id]);
}

export function getTodayExpenseTotal(): number {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expense_entries WHERE created_at >= ? AND created_at < ?',
    [start.toISOString(), end.toISOString()]
  );

  return row?.total ?? 0;
}

export function getCashflowLast6Months(): CashflowMonth[] {
  const incomeEntries = db.getAllSync<IncomeEntry>('SELECT amount, created_at FROM income_entries');
  const expenseEntries = db.getAllSync<ExpenseEntry>('SELECT amount, created_at FROM expense_entries');
  const now = new Date();

  const months: CashflowMonth[] = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short' });
    return { key, label, income: 0, expense: 0 };
  });

  const monthMap = new Map(months.map((m) => [m.key, m]));

  incomeEntries.forEach((entry) => {
    const d = new Date(entry.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthMap.get(key);
    if (bucket) bucket.income += entry.amount;
  });

  expenseEntries.forEach((entry) => {
    const d = new Date(entry.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthMap.get(key);
    if (bucket) bucket.expense += entry.amount;
  });

  return months;
}

export function getRecentTransactions(limit = 20): HistoryTransaction[] {
  const rows = db.getAllSync<{
    id: number;
    entry_type: 'income' | 'expense';
    note: string | null;
    category: string;
    amount: number;
    created_at: string;
  }>(
    `
      SELECT id, 'income' as entry_type, note, category, amount, created_at FROM income_entries
      UNION ALL
      SELECT id, 'expense' as entry_type, note, category, amount, created_at FROM expense_entries
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [limit]
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.entry_type,
    name: row.note?.trim() || row.category,
    meta: row.category,
    amount: row.amount,
    created_at: row.created_at,
  }));
}

export function getRecentExpenseEntries(limit = 5): ExpenseEntry[] {
  return db.getAllSync<ExpenseEntry>(
    "SELECT * FROM expense_entries WHERE category != 'Debt Payment' ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export function getRecentIncomeEntries(limit = 5): IncomeEntry[] {
  return db.getAllSync<IncomeEntry>(
    "SELECT * FROM income_entries WHERE category != 'Debt Collection' ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export function hasCompletedOnboarding(): boolean {
  const user = getUserProfile();
  return !!user && !!user.name;
}

export function saveDebtEntry(type: 'iowe' | 'owed', person: string, amount: number, note: string) {
  const trimmedPerson = person.trim();
  if (!trimmedPerson || amount <= 0) return;

  db.runSync(
    'INSERT INTO debt_entries (type, person, amount, note, settled_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [type, trimmedPerson, amount, note.trim(), null, new Date().toISOString()]
  );
}

export function updateDebtEntry(id: number, person: string, amount: number, note: string) {
  const trimmedPerson = person.trim();
  if (!trimmedPerson || amount <= 0) return;

  db.runSync(
    'UPDATE debt_entries SET person = ?, amount = ?, note = ? WHERE id = ? AND settled_at IS NULL',
    [trimmedPerson, amount, note.trim(), id]
  );
}

export function getDebtEntries(type?: 'iowe' | 'owed', includeSettled = false): DebtEntry[] {
  if (type) {
    if (includeSettled) {
      return db.getAllSync<DebtEntry>('SELECT * FROM debt_entries WHERE type = ? ORDER BY created_at DESC', [type]);
    }
    return db.getAllSync<DebtEntry>('SELECT * FROM debt_entries WHERE type = ? AND settled_at IS NULL ORDER BY created_at DESC', [type]);
  }
  if (!includeSettled) {
    return db.getAllSync<DebtEntry>('SELECT * FROM debt_entries WHERE settled_at IS NULL ORDER BY created_at DESC');
  }
  return db.getAllSync<DebtEntry>('SELECT * FROM debt_entries ORDER BY created_at DESC');
}

export function getDebtTotal(type: 'iowe' | 'owed'): number {
  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM debt_entries WHERE type = ? AND settled_at IS NULL',
    [type]
  );
  return row?.total ?? 0;
}

export function settleDebtEntry(id: number): boolean {
  const entry = db.getFirstSync<DebtEntry>('SELECT * FROM debt_entries WHERE id = ? LIMIT 1', [id]);
  if (!entry || entry.settled_at) return false;

  db.runSync('UPDATE debt_entries SET settled_at = ? WHERE id = ?', [new Date().toISOString(), id]);

  if (entry.type === 'iowe') {
    saveExpenseEntry(entry.amount, `Paid debt to ${entry.person}`, 'Debt Payment', 'Cash');
  } else {
    saveIncomeEntry(entry.amount, `Collected debt from ${entry.person}`, 'Debt Collection', 'Cash');
  }

  return true;
}

export function getAccountBalances(): Record<string, number> {
  const incomes = db.getAllSync<{ account: string; amount: number }>('SELECT account, amount FROM income_entries');
  const expenses = db.getAllSync<{ account: string; amount: number }>('SELECT account, amount FROM expense_entries');
  const balances: Record<string, number> = {};

  incomes.forEach((entry) => {
    balances[entry.account] = (balances[entry.account] || 0) + entry.amount;
  });

  expenses.forEach((entry) => {
    balances[entry.account] = (balances[entry.account] || 0) - entry.amount;
  });

  return balances;
}

export function getWalletAccounts(): WalletAccount[] {
  const accounts = db.getAllSync<WalletAccount>('SELECT * FROM wallet_accounts ORDER BY created_at ASC');
  const legacyDefaultsOld = ['GCash', 'MariBank', 'BPI', 'Wise', 'Cash on hand'];
  const legacyDefaultsNew = ['GCash', 'MariBank', 'BPI', 'Wise', 'Cash'];
  const names = accounts.map((a) => a.name).sort();
  const oldSorted = [...legacyDefaultsOld].sort();
  const newSorted = [...legacyDefaultsNew].sort();
  const isLegacyDefaultSetOld = names.length === oldSorted.length && names.every((name, idx) => name === oldSorted[idx]);
  const isLegacyDefaultSetNew = names.length === newSorted.length && names.every((name, idx) => name === newSorted[idx]);

  if (isLegacyDefaultSetOld || isLegacyDefaultSetNew) {
    db.runSync('DELETE FROM wallet_accounts');
    db.runSync(
      'INSERT INTO wallet_accounts (name, currency, balance, created_at) VALUES (?, ?, ?, ?)',
      ['Cash', 'PHP', 0, new Date().toISOString()]
    );
    return db.getAllSync<WalletAccount>('SELECT * FROM wallet_accounts ORDER BY created_at ASC');
  }

  return accounts;
}

export function addWalletAccount(name: string, currency = 'PHP') {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const existing = db.getFirstSync<{ id: number }>(
    'SELECT id FROM wallet_accounts WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [trimmedName]
  );
  if (existing) return;

  db.runSync(
    'INSERT INTO wallet_accounts (name, currency, balance, created_at) VALUES (?, ?, ?, ?)',
    [trimmedName, currency, 0, new Date().toISOString()]
  );
}

export function updateWalletAccount(oldName: string, newName: string) {
  const trimmedNewName = newName.trim();
  if (!trimmedNewName) return;

  const existing = db.getFirstSync<{ id: number }>(
    'SELECT id FROM wallet_accounts WHERE LOWER(name) = LOWER(?) AND LOWER(name) != LOWER(?) LIMIT 1',
    [trimmedNewName, oldName]
  );
  if (existing) return;

  db.runSync(
    'UPDATE wallet_accounts SET name = ? WHERE LOWER(name) = LOWER(?)',
    [trimmedNewName, oldName]
  );

  db.runSync(
    'UPDATE income_entries SET account = ? WHERE LOWER(account) = LOWER(?)',
    [trimmedNewName, oldName]
  );

  db.runSync(
    'UPDATE expense_entries SET account = ? WHERE LOWER(account) = LOWER(?)',
    [trimmedNewName, oldName]
  );
}

export function deleteWalletAccount(name: string) {
  db.runSync(
    'DELETE FROM wallet_accounts WHERE LOWER(name) = LOWER(?)',
    [name]
  );
}

// ─── Savings Goals ───────────────────────────────────────────────────────────

export type SavingsGoal = {
  id: number;
  name: string;
  target_total: number;
  saved_total: number;
  remaining_to_go: number;
  progress: number;
  icon: string | null;
  funding_account: string | null;
  created_at: string;
  is_hidden?: number;
};

export function getSavingsGoals(): SavingsGoal[] {
  return db.getAllSync<SavingsGoal>('SELECT * FROM savings_goals ORDER BY created_at ASC');
}

export function saveSavingsGoal(
  name: string,
  targetTotal: number,
  savedTotal: number,
  icon: string | null,
  fundingAccount: string | null
): number {
  const remainingToGo = Math.max(targetTotal - savedTotal, 0);
  const progress = targetTotal > 0 ? savedTotal / targetTotal : 0;
  const result = db.runSync(
    'INSERT INTO savings_goals (name, target_total, saved_total, remaining_to_go, progress, icon, funding_account, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, targetTotal, savedTotal, remainingToGo, progress, icon, fundingAccount, new Date().toISOString()]
  );
  return result.lastInsertRowId as number;
}

export function updateSavingsGoalProgress(
  id: number,
  newSavedTotal: number,
  targetTotal: number
) {
  const remaining = Math.max(targetTotal - newSavedTotal, 0);
  const progress = targetTotal > 0 ? newSavedTotal / targetTotal : 0;
  db.runSync(
    'UPDATE savings_goals SET saved_total = ?, remaining_to_go = ?, progress = ? WHERE id = ?',
    [newSavedTotal, remaining, progress, id]
  );
}

export function updateSavingsGoalVisibility(id: number, isHidden: boolean) {
  db.runSync(
    'UPDATE savings_goals SET is_hidden = ? WHERE id = ?',
    [isHidden ? 1 : 0, id]
  );
}

export function deleteSavingsGoal(id: number) {
  db.runSync('DELETE FROM savings_goals WHERE id = ?', [id]);
}

// ─── Bills ───────────────────────────────────────────────────────────────────

export type BillEntry = {
  id: number;
  name: string;
  amount: number;
  due_day: number;
  frequency: string;
  created_at: string;
};

export function getBills(): BillEntry[] {
  return db.getAllSync<BillEntry>('SELECT * FROM bills ORDER BY due_day ASC');
}

export function saveBill(
  name: string,
  amount: number,
  dueDay: number,
  frequency: string
): number {
  const result = db.runSync(
    'INSERT INTO bills (name, amount, due_day, frequency, created_at) VALUES (?, ?, ?, ?, ?)',
    [name, amount, dueDay, frequency, new Date().toISOString()]
  );
  return result.lastInsertRowId as number;
}

export function updateBill(
  id: number,
  name: string,
  amount: number,
  dueDay: number,
  frequency: string
) {
  db.runSync(
    'UPDATE bills SET name = ?, amount = ?, due_day = ?, frequency = ? WHERE id = ?',
    [name, amount, dueDay, frequency, id]
  );
}

export function deleteBill(id: number) {
  db.runSync('DELETE FROM bills WHERE id = ?', [id]);
}

// ─── Data management ─────────────────────────────────────────────────────────

export function clearFinancialData() {
  db.runSync('DELETE FROM income_entries');
  db.runSync('DELETE FROM expense_entries');
  db.runSync('DELETE FROM debt_entries');
  db.runSync('DELETE FROM savings_goals');
  db.runSync('DELETE FROM bills');
  db.runSync('DELETE FROM wallet_accounts');
  db.runSync(
    'INSERT INTO wallet_accounts (name, currency, balance, created_at) VALUES (?, ?, ?, ?)',
    ['Cash', 'PHP', 0, new Date().toISOString()]
  );
}

export function resetAppData() {
  clearFinancialData();
  db.runSync('DELETE FROM user_profile');
}
