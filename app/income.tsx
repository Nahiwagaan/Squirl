import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { getWalletAccounts, initDatabase, saveIncomeEntry } from '@/lib/database';
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

const Inter_400Regular = require('../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const TEAL = '#2FA084';
const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#9A9A9A';
const BORDER = '#2E2E2E';

const CATEGORIES = ['Salary', 'Freelance', 'Business', 'Gift', 'Investment', 'Allowance', 'Refund', 'Others'];
export default function IncomeScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Salary');
  const [selectedAccount, setSelectedAccount] = useState('Cash');
  const [accounts, setAccounts] = useState<string[]>(['Cash']);
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
  }, []);

  useFocusEffect(loadAccounts);

  if (!fontsLoaded) return null;
  const font = 'Inter_400Regular';

  const formattedAmount = (() => {
    if (!amount.trim()) return '0.00';

    const cleaned = amount.replace(/,/g, '');
    if (cleaned === '.') return '';

    const [integerPart, decimalPart] = cleaned.split('.');
    const safeInteger = integerPart ? Number(integerPart) : 0;
    const integerDisplay = Number.isNaN(safeInteger)
      ? '0'
      : safeInteger.toLocaleString('en-PH');

    if (decimalPart !== undefined) {
      return `${integerDisplay}.${decimalPart}`;
    }

    return integerDisplay;
  })();

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleSaveIncome = () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) return;

    initDatabase();
    saveIncomeEntry(numericAmount, note.trim(), selectedCategory, selectedAccount);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={[styles.cancelText, { fontFamily: font }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: font }]}>New Income</Text>
          <View style={{ width: 56 }} />
        </View>

        <TouchableOpacity
          style={styles.amountCard}
          activeOpacity={0.95}
          onPress={() => amountInputRef.current?.focus()}
        >
          <Text style={[styles.amountLabel, { fontFamily: font }]}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.peso, { fontFamily: font }]}>₱</Text>
            <Text style={[styles.amountText, { fontFamily: font }]}>{formattedAmount}</Text>
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

        <Text style={[styles.sectionTitle, { fontFamily: font }]}>Note (optional)</Text>
        <TextInput
          style={[styles.noteInput, { fontFamily: font }]}
          placeholder="e.g. April salary, freelance project..."
          placeholderTextColor={TEXT_MUTED}
          value={note}
          onChangeText={setNote}
        />

        <Text style={[styles.sectionTitle, { fontFamily: font }]}>Category</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => {
              if (typeof value === 'string') setSelectedCategory(value);
            }}
            style={styles.picker}
            dropdownIconColor={TEXT_MUTED}
          >
            {CATEGORIES.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.sectionTitle, { fontFamily: font }]}>To Account</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedAccount}
            onValueChange={(value) => {
              if (typeof value === 'string') setSelectedAccount(value);
            }}
            style={styles.picker}
            dropdownIconColor={TEXT_MUTED}
          >
            {accounts.map((item) => (
              <Picker.Item key={item} label={`${item} · PHP`} value={item} />
            ))}
          </Picker>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSaveIncome}>
          <Text style={[styles.saveText, { fontFamily: font }]}>Save Income</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
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
  peso: { fontSize: 48, color: TEAL, fontWeight: '700' },
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
  filterInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip: {
    backgroundColor: '#D2D3D4',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: { backgroundColor: TEAL },
  chipText: { fontSize: 16, color: '#1E1E1E' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
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
    backgroundColor: TEAL,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
