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

export function hasCompletedOnboarding(): boolean {
  const user = getUserProfile();
  return !!user && !!user.name;
}
