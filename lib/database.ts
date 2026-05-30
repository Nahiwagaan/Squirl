// Web fallback — uses localStorage instead of SQLite
// Metro automatically uses database.native.ts on iOS/Android

const STORAGE_KEY = 'squirl_user_profile';
const INCOME_STORAGE_KEY = 'squirl_income_entries';
const EXPENSE_STORAGE_KEY = 'squirl_expense_entries';
const WALLET_ACCOUNTS_STORAGE_KEY = 'squirl_wallet_accounts';
const DEBT_STORAGE_KEY = 'squirl_debt_entries';
const GOALS_STORAGE_KEY = 'squirl_goals';
const BILLS_STORAGE_KEY = 'squirl_bills';

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

const DEFAULT_WALLET_ACCOUNTS: WalletAccount[] = [
  { id: 1, name: 'Cash', currency: 'PHP', balance: 0, created_at: new Date().toISOString() },
];

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

function readWalletAccounts(): WalletAccount[] {
  try {
    const raw = localStorage.getItem(WALLET_ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWalletAccounts(accounts: WalletAccount[]) {
  try {
    localStorage.setItem(WALLET_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

function readDebtEntries(): DebtEntry[] {
  try {
    const raw = localStorage.getItem(DEBT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDebtEntries(entries: DebtEntry[]) {
  try {
    localStorage.setItem(DEBT_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function normalizeDefaultWalletAccounts(accounts: WalletAccount[]): WalletAccount[] {
  const legacyDefaultsOld = ['GCash', 'MariBank', 'BPI', 'Wise', 'Cash on hand'];
  const legacyDefaultsNew = ['GCash', 'MariBank', 'BPI', 'Wise', 'Cash'];
  const names = accounts.map((a) => a.name).sort();
  const oldSorted = [...legacyDefaultsOld].sort();
  const newSorted = [...legacyDefaultsNew].sort();
  const isLegacyDefaultSetOld = names.length === oldSorted.length && names.every((name, idx) => name === oldSorted[idx]);
  const isLegacyDefaultSetNew = names.length === newSorted.length && names.every((name, idx) => name === newSorted[idx]);

  if (!isLegacyDefaultSetOld && !isLegacyDefaultSetNew) return accounts;
  return [{ id: 1, name: 'Cash', currency: 'PHP', balance: 0, created_at: new Date().toISOString() }];
}

export function initDatabase() {
  const existing = readWalletAccounts();
  if (!existing.length) {
    writeWalletAccounts(DEFAULT_WALLET_ACCOUNTS);
  }
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
): number {
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
  return nextId;
}

export function deleteIncomeEntry(id: number) {
  const entries = readIncomeEntries();
  writeIncomeEntries(entries.filter(e => e.id !== id));
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

export function getMonthIncomeTotal(): number {
  const entries = readIncomeEntries();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  return entries
    .filter((entry) => {
      const date = new Date(entry.created_at);
      return date.getFullYear() === year && date.getMonth() === month;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function saveExpenseEntry(
  amount: number,
  note: string,
  category: string,
  account: string
): number {
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
  return nextId;
}

export function deleteExpenseEntry(id: number) {
  const entries = readExpenseEntries();
  writeExpenseEntries(entries.filter(e => e.id !== id));
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

export function getMonthExpenseTotal(): number {
  const entries = readExpenseEntries();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  return entries
    .filter((entry) => {
      const date = new Date(entry.created_at);
      return date.getFullYear() === year && date.getMonth() === month;
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

export function getRecentExpenseEntries(limit = 5): ExpenseEntry[] {
  return readExpenseEntries()
    .filter((e) => e.category !== 'Debt Payment')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function getRecentIncomeEntries(limit = 5): IncomeEntry[] {
  return readIncomeEntries()
    .filter((e) => e.category !== 'Debt Collection')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function getWalletAccounts(): WalletAccount[] {
  const existing = readWalletAccounts();
  if (!existing.length) return DEFAULT_WALLET_ACCOUNTS;
  const normalized = normalizeDefaultWalletAccounts(existing);
  if (normalized.length !== existing.length || normalized[0]?.name !== existing[0]?.name) {
    writeWalletAccounts(normalized);
  }
  return normalized;
}

export function addWalletAccount(name: string, currency = 'PHP') {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const accounts = getWalletAccounts();
  const exists = accounts.some((acc) => acc.name.toLowerCase() === trimmedName.toLowerCase());
  if (exists) return;

  const nextId = accounts.length ? Math.max(...accounts.map((a) => a.id)) + 1 : 1;
  const newAccount: WalletAccount = {
    id: nextId,
    name: trimmedName,
    currency,
    balance: 0,
    created_at: new Date().toISOString(),
  };
  writeWalletAccounts([...accounts, newAccount]);
}

export function updateWalletAccount(oldName: string, newName: string) {
  const trimmedNewName = newName.trim();
  if (!trimmedNewName) return;

  const accounts = getWalletAccounts();
  const index = accounts.findIndex((acc) => acc.name.toLowerCase() === oldName.toLowerCase());
  if (index === -1) return;

  const exists = accounts.some((acc) => acc.name.toLowerCase() === trimmedNewName.toLowerCase() && acc.name.toLowerCase() !== oldName.toLowerCase());
  if (exists) return;

  accounts[index].name = trimmedNewName;
  writeWalletAccounts(accounts);

  const incomes = readIncomeEntries();
  let incomesChanged = false;
  incomes.forEach((inc) => {
    if (inc.account.toLowerCase() === oldName.toLowerCase()) {
      inc.account = trimmedNewName;
      incomesChanged = true;
    }
  });
  if (incomesChanged) writeIncomeEntries(incomes);

  const expenses = readExpenseEntries();
  let expensesChanged = false;
  expenses.forEach((exp) => {
    if (exp.account.toLowerCase() === oldName.toLowerCase()) {
      exp.account = trimmedNewName;
      expensesChanged = true;
    }
  });
  if (expensesChanged) writeExpenseEntries(expenses);
}

export function deleteWalletAccount(name: string) {
  const accounts = getWalletAccounts();
  const filtered = accounts.filter((acc) => acc.name.toLowerCase() !== name.toLowerCase());
  if (filtered.length !== accounts.length) {
    writeWalletAccounts(filtered);
  }
}

export function hasCompletedOnboarding(): boolean {
  const user = getUserProfile();
  return !!user && !!user.name;
}

export function saveDebtEntry(type: 'iowe' | 'owed', person: string, amount: number, note: string) {
  const trimmedPerson = person.trim();
  if (!trimmedPerson || amount <= 0) return;

  const entries = readDebtEntries();
  const nextId = entries.length ? Math.max(...entries.map((e) => e.id)) + 1 : 1;
  const newEntry: DebtEntry = {
    id: nextId,
    type,
    person: trimmedPerson,
    amount,
    note: note.trim(),
    created_at: new Date().toISOString(),
    settled_at: null,
  };
  writeDebtEntries([newEntry, ...entries]);
}

export function updateDebtEntry(id: number, person: string, amount: number, note: string) {
  const trimmedPerson = person.trim();
  if (!trimmedPerson || amount <= 0) return;

  const entries = readDebtEntries();
  const index = entries.findIndex((entry) => entry.id === id && !entry.settled_at);
  if (index === -1) return;

  entries[index] = {
    ...entries[index],
    person: trimmedPerson,
    amount,
    note: note.trim(),
  };
  writeDebtEntries(entries);
}

export function getDebtEntries(type?: 'iowe' | 'owed', includeSettled = false): DebtEntry[] {
  const entries = readDebtEntries()
    .map((entry) => ({ ...entry, settled_at: entry.settled_at ?? null }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return entries.filter((entry) => {
    if (type && entry.type !== type) return false;
    if (!includeSettled && entry.settled_at) return false;
    return true;
  });
}

export function getDebtTotal(type: 'iowe' | 'owed'): number {
  return getDebtEntries(type).reduce((sum, entry) => sum + entry.amount, 0);
}

export function settleDebtEntry(id: number): boolean {
  const entries = readDebtEntries();
  const target = entries.find((entry) => entry.id === id);
  if (!target || target.settled_at) return false;

  target.settled_at = new Date().toISOString();
  writeDebtEntries(entries);

  if (target.type === 'iowe') {
    saveExpenseEntry(target.amount, `Paid debt to ${target.person}`, 'Debt Payment', 'Cash');
  } else {
    saveIncomeEntry(target.amount, `Collected debt from ${target.person}`, 'Debt Collection', 'Cash');
  }

  return true;
}

export function getAccountBalances(): Record<string, number> {
  const incomes = readIncomeEntries();
  const expenses = readExpenseEntries();
  const balances: Record<string, number> = {};

  incomes.forEach((entry) => {
    balances[entry.account] = (balances[entry.account] || 0) + entry.amount;
  });

  expenses.forEach((entry) => {
    balances[entry.account] = (balances[entry.account] || 0) - entry.amount;
  });

  return balances;
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

function readGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((g: any) => ({
      id: g.id,
      name: g.name,
      target_total: g.target_total ?? g.targetTotal ?? 0,
      saved_total: g.saved_total ?? g.savedTotal ?? 0,
      remaining_to_go: g.remaining_to_go ?? g.remainingToGo ?? 0,
      progress: g.progress ?? 0,
      icon: g.icon ?? null,
      funding_account: g.funding_account ?? g.fundingAccount ?? null,
      created_at: g.created_at ?? new Date().toISOString(),
      is_hidden: g.is_hidden ?? 0
    }));
  } catch {
    return [];
  }
}

function writeGoals(goals: SavingsGoal[]) {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch {}
}

export function getSavingsGoals(): SavingsGoal[] {
  return readGoals();
}

export function saveSavingsGoal(
  name: string,
  targetTotal: number,
  savedTotal: number,
  icon: string | null,
  fundingAccount: string | null
): number {
  const goals = readGoals();
  const nextId = goals.length ? Math.max(...goals.map((g) => g.id)) + 1 : 1;
  const remainingToGo = Math.max(targetTotal - savedTotal, 0);
  const progress = targetTotal > 0 ? savedTotal / targetTotal : 0;
  const newGoal: SavingsGoal = {
    id: nextId,
    name,
    target_total: targetTotal,
    saved_total: savedTotal,
    remaining_to_go: remainingToGo,
    progress,
    icon,
    funding_account: fundingAccount,
    created_at: new Date().toISOString(),
    is_hidden: 0
  };
  writeGoals([...goals, newGoal]);
  return nextId;
}

export function updateSavingsGoalProgress(
  id: number,
  newSavedTotal: number,
  targetTotal: number
) {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return;
  const remaining = Math.max(targetTotal - newSavedTotal, 0);
  const progress = targetTotal > 0 ? newSavedTotal / targetTotal : 0;
  goals[idx] = { ...goals[idx], saved_total: newSavedTotal, remaining_to_go: remaining, progress };
  writeGoals(goals);
}

export function updateSavingsGoalVisibility(id: number, isHidden: boolean) {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return;
  goals[idx] = { ...goals[idx], is_hidden: isHidden ? 1 : 0 };
  writeGoals(goals);
}

export function deleteSavingsGoal(id: number) {
  writeGoals(readGoals().filter((g) => g.id !== id));
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

function readBills(): BillEntry[] {
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((b: any) => ({
      id: b.id,
      name: b.name,
      amount: b.amount ?? 0,
      due_day: b.due_day ?? b.dueDay ?? 1,
      frequency: b.frequency ?? 'Monthly',
      created_at: b.created_at ?? new Date().toISOString()
    }));
  } catch {
    return [];
  }
}

function writeBills(bills: BillEntry[]) {
  try {
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
  } catch {}
}

export function getBills(): BillEntry[] {
  return readBills().sort((a, b) => (a.due_day ?? 1) - (b.due_day ?? 1));
}

export function saveBill(
  name: string,
  amount: number,
  dueDay: number,
  frequency: string
): number {
  const bills = readBills();
  const nextId = bills.length ? Math.max(...bills.map((b) => b.id)) + 1 : 1;
  const newBill: BillEntry = {
    id: nextId,
    name,
    amount,
    due_day: dueDay,
    frequency,
    created_at: new Date().toISOString(),
  };
  writeBills([...bills, newBill]);
  return nextId;
}

export function updateBill(
  id: number,
  name: string,
  amount: number,
  dueDay: number,
  frequency: string
) {
  const bills = readBills();
  const idx = bills.findIndex((b) => b.id === id);
  if (idx === -1) return;
  bills[idx] = { ...bills[idx], name, amount, due_day: dueDay, frequency };
  writeBills(bills);
}

export function deleteBill(id: number) {
  writeBills(readBills().filter((b) => b.id !== id));
}

// ─── Data management ─────────────────────────────────────────────────────────

export function clearFinancialData() {
  try {
    localStorage.removeItem(INCOME_STORAGE_KEY);
    localStorage.removeItem(EXPENSE_STORAGE_KEY);
    localStorage.removeItem(DEBT_STORAGE_KEY);
    localStorage.removeItem(GOALS_STORAGE_KEY);
    localStorage.removeItem(BILLS_STORAGE_KEY);
    localStorage.setItem(WALLET_ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_WALLET_ACCOUNTS));
  } catch {}
}

export function resetAppData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INCOME_STORAGE_KEY);
    localStorage.removeItem(EXPENSE_STORAGE_KEY);
    localStorage.removeItem(DEBT_STORAGE_KEY);
    localStorage.removeItem(GOALS_STORAGE_KEY);
    localStorage.removeItem(BILLS_STORAGE_KEY);
    localStorage.setItem(WALLET_ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_WALLET_ACCOUNTS));
  } catch {}
}
