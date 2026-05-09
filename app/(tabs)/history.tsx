import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { getRecentTransactions, getTodayExpenseTotal, getTodayIncomeTotal, getUserProfile, HistoryTransaction, UserProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';

export default function HistoryScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [todayIncome, setTodayIncome] = React.useState(0);
  const [todayExpense, setTodayExpense] = React.useState(0);
  const [transactions, setTransactions] = React.useState<HistoryTransaction[]>([]);

  const loadData = React.useCallback(() => {
    setProfile(getUserProfile());
    setTodayIncome(getTodayIncomeTotal());
    setTodayExpense(getTodayExpenseTotal());
    setTransactions(getRecentTransactions(20));
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(loadData);

  if (!fontsLoaded) return null;
  const font = 'Inter_400Regular';
  const userName = profile?.name || 'USER';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader userName={userName} fontFamily={font} />
        <SquirlBanner
          compact
          fontFamily={font}
          userName={userName}
          mascot={require('@/assets/images/squirl/History.png')}
          mascotScale={1}
          mascotBottomOffset={-8}
          message="Let’s see your transaction history!"
        />

        <View style={styles.pageHead}>
          <Text style={[styles.pageTitle, { fontFamily: font }]}>History</Text>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
            <Text style={[styles.filterText, { fontFamily: font }]}>Today</Text>
            <Ionicons name="chevron-down" size={18} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryStrip}>
          <View style={styles.summaryBlock}>
            <Text style={[styles.summaryLabel, { fontFamily: font }]}>INCOME</Text>
            <Text style={[styles.summaryValueIn, { fontFamily: font }]}>+PHP {new Intl.NumberFormat('en-PH').format(todayIncome)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={[styles.summaryLabel, { fontFamily: font }]}>EXPENSES</Text>
            <Text style={[styles.summaryValueOut, { fontFamily: font }]}>-PHP {new Intl.NumberFormat('en-PH').format(todayExpense)}</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {transactions.map((item, index) => (
            <View key={`${item.type}-${item.id}-${index}`} style={[styles.historyRow, index !== transactions.length - 1 && styles.historyDivider]}>
              <View style={styles.leftWrap}>
                <View style={styles.historyIcon} />
                <View>
                  <Text style={[styles.historyName, { fontFamily: font }]}>{item.name}</Text>
                  <Text style={[styles.historyMeta, { fontFamily: font }]}>{formatMeta(item)}</Text>
                </View>
              </View>
              <Text style={[styles.historyAmount, { fontFamily: font }, item.type === 'income' ? styles.amountIn : styles.amountOut]}>
                {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 30 },

  pageHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle: { fontSize: 24, color: TEXT_DARK, fontWeight: '700' },
  filterBtn: {
    minWidth: 124,
    borderWidth: 1,
    borderColor: '#B8BCB8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterText: { fontSize: 16, color: TEXT_DARK, fontWeight: '700' },

  summaryStrip: {
    borderWidth: 1,
    borderColor: '#C7CCC7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFDFC',
  },
  summaryBlock: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#D8DDD8',
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 16,
    letterSpacing: 1.4,
    color: '#6B746D',
    marginBottom: 4,
  },
  summaryValueIn: {
    fontSize: 24,
    color: '#1F7D69',
    fontWeight: '700',
  },
  summaryValueOut: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '700',
  },

  listCard: {
    borderWidth: 1,
    borderColor: '#BFC3BF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: '#D2D5D2' },
  leftWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  historyIcon: { width: 32, height: 32, borderRadius: 7, backgroundColor: '#D1D2D1' },
  historyName: { fontSize: 16, color: TEXT_DARK },
  historyMeta: { fontSize: 12, color: '#687068', marginTop: 2 },
  historyAmount: { fontSize: 18, fontWeight: '700' },
  amountIn: { color: '#1A7D65' },
  amountOut: { color: '#1A1A1A' },
});
const formatCurrency = (amount: number) => `₱ ${new Intl.NumberFormat('en-PH').format(amount)}`;
const formatMeta = (item: HistoryTransaction) => {
  const date = new Date(item.created_at);
  const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${item.meta} · ${dateLabel}`;
};
