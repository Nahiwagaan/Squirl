import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { getRecentTransactions, getUserProfile, HistoryTransaction, UserProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
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

type HistoryPeriod = 'today' | 'yesterday' | 'month' | 'customMonth' | 'all';

const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  month: 'This Month',
  customMonth: 'Custom Month',
  all: 'All',
};

export default function HistoryScreen() {
  const { colors } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [transactions, setTransactions] = React.useState<HistoryTransaction[]>([]);
  const [period, setPeriod] = React.useState<HistoryPeriod>('today');
  const [selectedMonth, setSelectedMonth] = React.useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(() => new Date().getFullYear());
  const [showPeriodPicker, setShowPeriodPicker] = React.useState(false);

  const loadData = React.useCallback(() => {
    setProfile(getUserProfile());
    setTransactions(getRecentTransactions(500));
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      loadData();
    }, [loadData])
  );

  if (!fontsLoaded) return null;
  const font = 'Inter_400Regular';
  const userName = profile?.name || 'USER';
  const filteredTransactions = transactions.filter((item) => isInPeriod(item.created_at, period, selectedMonth, selectedYear));
  const filterLabel = period === 'customMonth'
    ? new Date(selectedYear, selectedMonth, 1).toLocaleDateString('en-US', { month: 'long' })
    : PERIOD_LABELS[period];
  const periodIncome = filteredTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const periodExpense = filteredTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <Text style={[styles.pageTitle, { fontFamily: font, color: colors.textPrimary }]}>History</Text>
          <TouchableOpacity style={[styles.filterBtn, { borderColor: colors.border }]} activeOpacity={0.85} onPress={() => setShowPeriodPicker(true)}>
            <Text style={[styles.filterText, { fontFamily: font, color: colors.textPrimary }]}>{filterLabel}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryBlock}>
            <Text style={[styles.summaryLabel, { fontFamily: font }]}>INCOME</Text>
            <Text style={[styles.summaryValueIn, { fontFamily: font, color: colors.teal }]}>+PHP {new Intl.NumberFormat('en-PH').format(periodIncome)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryBlock}>
            <Text style={[styles.summaryLabel, { fontFamily: font }]}>EXPENSES</Text>
            <Text style={[styles.summaryValueOut, { fontFamily: font, color: colors.textPrimary }]}>-PHP {new Intl.NumberFormat('en-PH').format(periodExpense)}</Text>
          </View>
        </View>

        <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <Text style={[styles.emptyStateText, { fontFamily: font, color: colors.textMuted }]}>No transactions for {filterLabel.toLowerCase()}.</Text>
            </View>
          ) : filteredTransactions.map((item, index) => (
            <View key={`${item.type}-${item.id}-${index}`} style={[styles.historyRow, index !== filteredTransactions.length - 1 && styles.historyDivider, { borderBottomColor: colors.border }]}>
              <View style={styles.leftWrap}>
                <View style={[styles.historyIcon, { backgroundColor: colors.bgSecondary }]} />
                <View>
                  <Text style={[styles.historyName, { fontFamily: font, color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.historyMeta, { fontFamily: font, color: colors.textMuted }]}>{formatMeta(item)}</Text>
                </View>
              </View>
              <Text style={[styles.historyAmount, { fontFamily: font }, item.type === 'income' ? { color: colors.teal } : { color: colors.textPrimary }]}>
                {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {showPeriodPicker && (
        <View style={styles.dropdownWrap}>
          <View style={[styles.periodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(['today', 'yesterday', 'month'] as HistoryPeriod[]).map((item) => {
              const isActive = period === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.periodOption, isActive && { backgroundColor: colors.teal }]}
                  onPress={() => {
                    setPeriod(item);
                    setShowPeriodPicker(false);
                    scrollRef.current?.scrollTo({ y: 0, animated: false });
                  }}
                >
                  <Text style={[styles.periodOptionText, { fontFamily: font, color: colors.textPrimary }, isActive && { color: '#FFFFFF' }]}>{PERIOD_LABELS[item]}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.monthDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.monthPickerLabel, { fontFamily: font, color: colors.textMuted }]}>Month</Text>
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }).map((_, index) => {
                const monthLabel = new Date(selectedYear, index, 1).toLocaleDateString('en-US', { month: 'short' });
                const active = period === 'customMonth' && selectedMonth === index;
                return (
                  <TouchableOpacity
                    key={monthLabel}
                    style={[styles.monthOption, active && { backgroundColor: colors.teal }]}
                    onPress={() => {
                      setSelectedMonth(index);
                      setSelectedYear(new Date().getFullYear());
                      setPeriod('customMonth');
                      setShowPeriodPicker(false);
                      scrollRef.current?.scrollTo({ y: 0, animated: false });
                    }}
                  >
                    <Text style={[styles.monthOptionText, { fontFamily: font, color: colors.textPrimary }, active && { color: '#FFFFFF' }]}>{monthLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.periodOption, period === 'all' && { backgroundColor: colors.teal }]}
              onPress={() => {
                setPeriod('all');
                setShowPeriodPicker(false);
                scrollRef.current?.scrollTo({ y: 0, animated: false });
              }}
            >
              <Text style={[styles.periodOptionText, { fontFamily: font, color: colors.textPrimary }, period === 'all' && { color: '#FFFFFF' }]}>All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  emptyStateWrap: { paddingVertical: 24, alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#687068' },
  dropdownWrap: { position: 'absolute', top: 272, right: 14, zIndex: 20 },
  periodCard: {
    width: 184,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C6CBC6',
    padding: 6,
  },
  periodOption: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  periodOptionActive: { backgroundColor: '#207A67' },
  periodOptionText: { fontSize: 15, color: TEXT_DARK, fontWeight: '700' },
  periodOptionTextActive: { color: '#FFFFFF' },
  monthDivider: { height: 1, backgroundColor: '#E1E4E1', marginVertical: 6 },
  monthPickerLabel: { fontSize: 12, color: '#687068', fontWeight: '700', marginHorizontal: 8, marginBottom: 6 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  monthOption: { width: 38, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  monthOptionText: { fontSize: 12, color: TEXT_DARK, fontWeight: '700' },
});
const formatCurrency = (amount: number) => `₱ ${new Intl.NumberFormat('en-PH').format(amount)}`;
const formatMeta = (item: HistoryTransaction) => {
  const date = new Date(item.created_at);
  const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${item.meta} · ${dateLabel}`;
};

const isInPeriod = (dateIso: string, period: HistoryPeriod, selectedMonth: number, selectedYear: number) => {
  if (period === 'all') return true;

  const date = new Date(dateIso);
  const now = new Date();

  if (period === 'month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  if (period === 'customMonth') {
    return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
  }

  const target = new Date(now);
  if (period === 'yesterday') target.setDate(now.getDate() - 1);

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
};
