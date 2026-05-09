// Web fallback — uses localStorage instead of SQLite
// Metro automatically uses database.native.ts on iOS/Android

const STORAGE_KEY = 'squirl_user_profile';
const INCOME_STORAGE_KEY = 'squirl_income_entries';
const EXPENSE_STORAGE_KEY = 'squirl_expense_entries';

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

function read(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(profile: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

function readIncomeEntries(): IncomeEntry[] {
  try {
    const raw = localStorage.getItem(INCOME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIncomeEntries(entries: IncomeEntry[]) {
  try {
    localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function readExpenseEntries(): ExpenseEntry[] {
  try {
    const raw = localStorage.getItem(EXPENSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeExpenseEntries(entries: ExpenseEntry[]) {
  try {
    localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function initDatabase() {
  // No-op on web — localStorage needs no initialisation
}

export function saveBasicProfile(
  name: string,
  language: string,
  incomeType: string
) {
  const existing = read();
  write({
    id: existing?.id ?? 1,
    name,
    language,
    income_type: incomeType,
    gross_salary: existing?.gross_salary ?? null,
    pay_frequency: existing?.pay_frequency ?? null,
    deductions: existing?.deductions ?? null,
    next_payday: existing?.next_payday ?? null,
  });
}

export function saveSalaryProfile(
  grossSalary: number | null,
  payFrequency: string,
  deductions: string[],
  nextPayday: string | null
) {
  const existing = read();
  if (!existing) return;
  write({
    ...existing,
    gross_salary: grossSalary,
    pay_frequency: grossSalary ? payFrequency : null,
    deductions: grossSalary ? JSON.stringify(deductions) : null,
    next_payday: grossSalary ? nextPayday : null,
  });
}

export function getUserProfile(): UserProfile | null {
  return read();
}

export function saveIncomeEntry(
  amount: number,
  note: string,
  category: string,
  account: string
) {
  const entries = readIncomeEntries();
  const nextId = entries.length ? Math.max(...entries.map((e) => e.id)) + 1 : 1;
  const newEntry: IncomeEntry = {
    id: nextId,
    amount,
    note,
    category,
    account,
    created_at: new Date().toISOString(),
  };
  writeIncomeEntries([newEntry, ...entries]);
}

export function getTodayIncomeTotal(): number {
  const entries = readIncomeEntries();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  return entries
    .filter((entry) => {
      const date = new Date(entry.created_at);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function saveExpenseEntry(
  amount: number,
  note: string,
  category: string,
  account: string
) {
  const entries = readExpenseEntries();
  const nextId = entries.length ? Math.max(...entries.map((e) => e.id)) + 1 : 1;
  const newEntry: ExpenseEntry = {
    id: nextId,
    amount,
    note,
    category,
    account,
    created_at: new Date().toISOString(),
  };
  writeExpenseEntries([newEntry, ...entries]);
}

export function getTodayExpenseTotal(): number {
  const entries = readExpenseEntries();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  return entries
    .filter((entry) => {
      const date = new Date(entry.created_at);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function getCashflowLast6Months(): CashflowMonth[] {
  const incomeEntries = readIncomeEntries();
  const expenseEntries = readExpenseEntries();
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
  const incomeEntries = readIncomeEntries().map((entry) => ({
    id: entry.id,
    type: 'income' as const,
    name: entry.note?.trim() || entry.category,
    meta: entry.category,
    amount: entry.amount,
    created_at: entry.created_at,
  }));

  const expenseEntries = readExpenseEntries().map((entry) => ({
    id: entry.id,
    type: 'expense' as const,
    name: entry.note?.trim() || entry.category,
    meta: entry.category,
    amount: entry.amount,
    created_at: entry.created_at,
  }));

  return [...incomeEntries, ...expenseEntries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function hasCompletedOnboarding(): boolean {
  const user = getUserProfile();
  return !!user && !!user.name;
}
