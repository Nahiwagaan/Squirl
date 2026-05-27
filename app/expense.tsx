import { ExpenseEntry, getRecentExpenseEntries, getWalletAccounts, initDatabase, saveExpenseEntry } from '@/lib/database';
import { setPendingToast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const Inter_400Regular = require('../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const RED = '#C30F1A';
const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#9A9A9A';
const BORDER = '#2E2E2E';

const CATEGORIES = [
  { name: 'Food', icon: 'fast-food' },
  { name: 'Bills', icon: 'receipt' },
  { name: 'Fun', icon: 'game-controller' },
  { name: 'Family Expense', icon: 'home' },
  { name: 'Transport', icon: 'car' },
  { name: 'Others', icon: 'ellipsis-horizontal' },
] as const;
export default function ExpenseScreen() {
  const { colors, isDark } = useTheme();
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [selectedAccount, setSelectedAccount] = useState('Cash');
  const [accounts, setAccounts] = useState<string[]>(['Cash']);
  const [recentLogs, setRecentLogs] = useState<ExpenseEntry[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const amountInputRef = useRef<TextInput>(null);

  const loadAccounts = useCallback(() => {
    initDatabase();
    const list = getWalletAccounts().map((a) => a.name).sort((a, b) => {
      if (a === 'Cash') return -1;
      if (b === 'Cash') return 1;
      return a.localeCompare(b);
    });
    setAccounts(list.length ? list : ['Cash']);
    setSelectedAccount((prev) => (list.includes(prev) ? prev : (list[0] || 'Cash')));
    setRecentLogs(getRecentExpenseEntries(8));
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      loadAccounts();
    }, [loadAccounts])
  );

  if (!fontsLoaded) return null;
  const font = 'Inter_400Regular';

  const formattedAmount = (() => {
    if (!amount.trim()) return '0.00';
    const cleaned = amount.replace(/,/g, '');
    if (cleaned === '.') return '';
    const [integerPart, decimalPart] = cleaned.split('.');
    const safeInteger = integerPart ? Number(integerPart) : 0;
    const integerDisplay = Number.isNaN(safeInteger) ? '0' : safeInteger.toLocaleString('en-PH');
    if (decimalPart !== undefined) return `${integerDisplay}.${decimalPart}`;
    return integerDisplay;
  })();

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleSaveExpense = () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) return;
    initDatabase();
    saveExpenseEntry(numericAmount, note.trim(), selectedCategory, selectedAccount);
    setPendingToast(JSON.stringify({
      type: 'Expense',
      amount: `₱${numericAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      account: selectedAccount
    }));
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={[styles.cancelText, { fontFamily: font }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: font, color: colors.textPrimary }]}>New Expense</Text>
            <View style={{ width: 56 }} />
          </View>

          <TouchableOpacity style={[styles.amountCard, { borderColor: colors.border }]} activeOpacity={0.95} onPress={() => amountInputRef.current?.focus()}>
            <Text style={[styles.amountLabel, { fontFamily: font, color: colors.textMuted }]}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.peso, { fontFamily: font, color: colors.expense }]}>₱</Text>
              <Text style={[styles.amountText, { fontFamily: font, color: colors.textPrimary }]}>{formattedAmount}</Text>
            </View>
            <TextInput
              ref={amountInputRef}
              style={[styles.amountInput, { fontFamily: font }]}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="transparent"
            />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Note (optional)</Text>
          <TextInput
            style={[styles.noteInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="e.g. Electric bill, groceries..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
          />

          <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Category</Text>
          <View style={styles.pillContainer}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.name)}
                  style={[styles.pill, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7E5' }, isActive && { backgroundColor: colors.expense }]}
                >
                  <Ionicons name={cat.icon as any} size={16} color={isActive ? '#FFFFFF' : colors.textPrimary} />
                  <Text style={[styles.pillText, { fontFamily: font, color: colors.textPrimary }, isActive && styles.pillTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {recentLogs.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Recent Expenses</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {recentLogs.map((log) => (
                  <TouchableOpacity
                    key={log.id}
                    style={[styles.recentLogCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setAmount(log.amount.toString());
                      setNote(log.note);
                      setSelectedCategory(log.category);
                      if (accounts.includes(log.account)) setSelectedAccount(log.account);
                    }}
                  >
                    <Text style={[styles.recentLogTitle, { fontFamily: font, color: colors.textMuted }]} numberOfLines={1}>{log.note || log.category}</Text>
                    <Text style={[styles.recentLogAmount, { fontFamily: font, color: colors.textPrimary }]}>₱{log.amount.toLocaleString('en-PH')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>To Account</Text>
          <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Picker
              selectedValue={selectedAccount}
              onValueChange={(value) => {
                if (typeof value === 'string') setSelectedAccount(value);
              }}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textMuted}
            >
              {accounts.map((item) => (
                <Picker.Item key={item} label={`${item} · PHP`} value={item} />
              ))}
            </Picker>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.expense }]} activeOpacity={0.85} onPress={handleSaveExpense}>
            <Text style={[styles.saveText, { fontFamily: font }]}>Save Expense</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  keyboardWrap: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  cancelText: { color: '#8B8B8B', fontSize: 19 },
  headerTitle: { color: TEXT_DARK, fontSize: 34, fontWeight: '700' },
  amountCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '700' },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  peso: { fontSize: 48, color: RED, fontWeight: '700' },
  amountText: { fontSize: 56, color: TEXT_DARK, fontWeight: '700', marginLeft: 6 },
  amountInput: {
    marginTop: 4,
    width: '100%',
    fontSize: 1,
    color: 'transparent',
    textAlign: 'center',
    height: 18,
  },
  sectionTitle: { fontSize: 20, color: TEXT_DARK, fontWeight: '700', marginBottom: 8 },
  noteInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  dropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#F6F7F7',
  },
  picker: {
    height: 52,
    color: TEXT_DARK,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  saveButton: {
    backgroundColor: RED,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  pillActiveExpense: {
    backgroundColor: RED,
  },
  pillText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recentLogCard: {
    backgroundColor: '#F6F7F7',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    minWidth: 120,
    maxWidth: 180,
  },
  recentLogTitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  recentLogAmount: {
    fontSize: 16,
    color: TEXT_DARK,
    fontWeight: '700',
  },
});
