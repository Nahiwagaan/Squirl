import { getWalletAccounts, initDatabase } from '@/lib/database';
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

const Inter_400Regular = require('../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#9A9A9A';
const BORDER = '#2E2E2E';
const TEAL_DARK = '#1F7D69';
const ORANGE = '#F47B28';

export default function TransferScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState<string>('Cash');
  const [toAccount, setToAccount] = useState<string>('Cash');
  const [accounts, setAccounts] = useState<string[]>(['Cash']);
  const amountInputRef = useRef<TextInput>(null);

  const loadAccounts = useCallback(() => {
    initDatabase();
    const list = getWalletAccounts().map((a) => a.name).sort((a, b) => {
      if (a === 'Cash') return -1;
      if (b === 'Cash') return 1;
      return a.localeCompare(b);
    });
    const safe = list.length ? list : ['Cash'];
    setAccounts(safe);
    setFromAccount((prev) => (safe.includes(prev) ? prev : safe[0]));
    setToAccount((prev) => (safe.includes(prev) ? prev : safe[0]));
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

  const getAccountChipStyle = (account: string) => {
    if (account === 'GCash') return styles.GCashChip;
    if (account === 'MariBank') return styles.MariBankChip;
    if (account === 'BPI') return styles.BPIChip;
    if (account === 'Wise') return styles.WiseChip;
    return styles.CashonhandChip;
  };

  const renderAccountChip = (
    account: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={account}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.accountChip, getAccountChipStyle(account), selected && styles.selectedChip]}
    >
      <Text style={[styles.accountChipText, { fontFamily: font }, account === 'Cash' && styles.cashText]}>{account}</Text>
    </TouchableOpacity>
  );

  const renderPreviewChip = (account: string) => (
    <View style={[styles.previewChip, getAccountChipStyle(account)]}>
      <Text style={[styles.previewChipText, { fontFamily: font }, account === 'Cash' && styles.cashText]} numberOfLines={1}>
        {account || 'Select'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={[styles.cancelText, { fontFamily: font }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: font }]}>Transfer</Text>
            <View style={{ width: 56 }} />
          </View>

          <TouchableOpacity style={styles.amountCard} activeOpacity={0.95} onPress={() => amountInputRef.current?.focus()}>
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

          <View style={styles.previewCard}>
            {renderPreviewChip(fromAccount)}
            <Text style={[styles.arrow, { fontFamily: font }]}>→</Text>
            {renderPreviewChip(toAccount)}
          </View>

          <Text style={[styles.sectionTitle, { fontFamily: font }]}>From Account</Text>
          <View style={styles.accountWrap}>
            {accounts.map((account) => renderAccountChip(account, fromAccount === account, () => setFromAccount(account)))}
          </View>

          <Text style={[styles.sectionTitle, { fontFamily: font }]}>To Account</Text>
          <View style={styles.accountWrap}>
            {accounts.map((account) => renderAccountChip(account, toAccount === account, () => setToAccount(account)))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
            <Text style={[styles.saveText, { fontFamily: font }]}>Transfer</Text>
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
  amountCard: { borderWidth: 1, borderColor: BORDER, borderRadius: 22, padding: 18, alignItems: 'center', marginBottom: 16 },
  amountLabel: { fontSize: 12, color: TEXT_MUTED, fontWeight: '700' },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  peso: { fontSize: 48, color: TEAL_DARK, fontWeight: '700' },
  amountText: { fontSize: 56, color: TEXT_DARK, fontWeight: '700', marginLeft: 6 },
  amountInput: { marginTop: 4, width: '100%', fontSize: 1, color: 'transparent', textAlign: 'center', height: 18 },
  previewCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewChip: {
    flex: 1,
    maxWidth: 140,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  previewChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  arrow: { fontSize: 40, color: '#111' },
  sectionTitle: { fontSize: 20, color: TEXT_DARK, fontWeight: '700', marginBottom: 10 },
  accountWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  accountChip: {
    minWidth: 124,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
  },
  selectedChip: { borderColor: '#000' },
  accountChipText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cashText: { color: '#111' },
  GCashChip: { backgroundColor: '#148DE2' },
  MariBankChip: { backgroundColor: '#FF970F' },
  BPIChip: { backgroundColor: '#B20D18' },
  WiseChip: { backgroundColor: '#06B39A' },
  CashonhandChip: { backgroundColor: '#D9D9D9' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  saveButton: { backgroundColor: ORANGE, borderRadius: 14, alignItems: 'center', paddingVertical: 16 },
  saveText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
