import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { CashflowMonth, getCashflowLast6Months, getTodayExpenseTotal, getTodayIncomeTotal, getUserProfile, UserProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const InclusiveSans_400Regular = require('../../node_modules/@expo-google-fonts/inclusive-sans/400Regular/InclusiveSans_400Regular.ttf');
const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const TEAL = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';

export default function HomeDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayIncomeTotal, setTodayIncomeTotal] = useState(0);
  const [todayExpenseTotal, setTodayExpenseTotal] = useState(0);
  const [cashflowMonths, setCashflowMonths] = useState<CashflowMonth[]>([]);

  const [fontsLoaded] = useFonts({ InclusiveSans_400Regular, Inter_400Regular });

  useEffect(() => {
    setProfile(getUserProfile());
    setTodayIncomeTotal(getTodayIncomeTotal());
    setTodayExpenseTotal(getTodayExpenseTotal());
    setCashflowMonths(getCashflowLast6Months());
  }, []);

  useFocusEffect(
    useCallback(() => {
      setProfile(getUserProfile());
      setTodayIncomeTotal(getTodayIncomeTotal());
      setTodayExpenseTotal(getTodayExpenseTotal());
      setCashflowMonths(getCashflowLast6Months());
    }, [])
  );

  const maxCashflowValue = Math.max(
    1,
    ...cashflowMonths.flatMap((month) => [month.income, month.expense])
  );

  if (!fontsLoaded) return null;
  const font = 'InclusiveSans_400Regular';

  const userName = profile?.name || 'USER';
  const salaryAmount = profile?.gross_salary ?? null;
  const paydayIso = profile?.next_payday ?? null;

  const formatPeso = (amount: number) =>
    `₱ ${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(amount)}`;


  const formatPesoCents = (amount: number) =>
    `₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  const getUpcomingPayday = () => {
    if (!paydayIso) return null;

    const parsed = new Date(paydayIso);
    if (Number.isNaN(parsed.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = new Date(parsed);
    upcoming.setHours(0, 0, 0, 0);

    const frequency = profile?.pay_frequency ?? 'Monthly';
    let guard = 0;

    while (upcoming < today && guard < 120) {
      if (frequency === 'Weekly') {
        upcoming.setDate(upcoming.getDate() + 7);
      } else if (frequency === 'Semi-mo') {
        upcoming.setDate(upcoming.getDate() + 15);
      } else {
        upcoming.setMonth(upcoming.getMonth() + 1);
      }
      guard += 1;
    }

    return upcoming;
  };

  const upcomingPayday = getUpcomingPayday();
  const daysUntilPayday = upcomingPayday
    ? Math.max(0, Math.round((upcomingPayday.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000))
    : null;

  const nextPaydayText = upcomingPayday
    ? upcomingPayday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader userName={userName} fontFamily="Inter_400Regular" />
        <SquirlBanner
          fontFamily={font}
          userName={userName}
          mascot={require('@/assets/images/squirl/Hi.png')}
          message="Welcome, {name}! I'm Squirl. I'll help you track expenses, income, budgets, goals, debt, and money owed to you in one place."
        />

        {/* Summary Cards */}
        <View style={styles.row}>
          {/* Expense Distribution */}
          <View style={[styles.card, { flex: 1, marginRight: 6 }]}>
            <View style={styles.cashflowHeadRow}>
              <View>
                <Text style={[styles.cashflowLabel, { fontFamily: font }]}>Cashflow</Text>
                <Text style={[styles.cardTitle, { fontFamily: font }]}>6-month trend</Text>
              </View>
              <View style={styles.monthTag}>
                <Text style={[styles.monthTagText, { fontFamily: font }]}>PHP</Text>
              </View>
            </View>

            <View style={styles.cashflowChartWrap}>
              <View style={styles.cashflowGridLine} />
              <View style={styles.cashflowGridLine} />
              <View style={styles.cashflowGridLine} />
              <View style={styles.cashflowGridLine} />

              <View style={styles.cashflowBarsRow}>
                {cashflowMonths.map((month) => {
                  const incomeHeight = Math.max(4, Math.round((month.income / maxCashflowValue) * 94));
                  const expenseHeight = Math.max(4, Math.round((month.expense / maxCashflowValue) * 94));
                  return (
                    <View key={month.key} style={styles.cashflowMonthCol}>
                      <View style={styles.cashflowDualBarWrap}>
                        <View style={[styles.cashflowBarExpense, { height: expenseHeight }]} />
                        <View style={[styles.cashflowBarIncome, { height: incomeHeight }]} />
                      </View>
                      <Text style={[styles.cashflowMonthText, { fontFamily: font }]}>{month.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.monthSummaryWrap}>
            <View style={styles.monthCard}>
              <View style={styles.monthHeadRow}>
                <Text style={[styles.monthLabel, { fontFamily: font }]}>THIS MONTH OUT</Text>
                <View style={styles.monthTag}>
                  <Text style={[styles.monthTagText, { fontFamily: font }]}>OUT</Text>
                </View>
              </View>
              <Text style={[styles.monthAmountOut, { fontFamily: 'Inter_400Regular' }]}>{formatPesoCents(todayExpenseTotal)}</Text>
              <Text style={[styles.monthSubText, { fontFamily: font }]}>Logged spending in the current month</Text>
            </View>

            <View style={[styles.monthCard, styles.monthInCard]}>
              <View style={styles.monthHeadRow}>
                <Text style={[styles.monthLabel, { fontFamily: font }]}>THIS MONTH IN</Text>
                <View style={styles.monthTag}>
                  <Text style={[styles.monthTagText, { fontFamily: font }]}>IN</Text>
                </View>
              </View>
              <Text style={[styles.monthAmountIn, { fontFamily: 'Inter_400Regular' }]}>{formatPesoCents(todayIncomeTotal)}</Text>
              <Text style={[styles.monthSubText, { fontFamily: font }]}>Logged income in the current month</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {typeof salaryAmount === 'number' && salaryAmount > 0 && daysUntilPayday !== null && nextPaydayText ? (
          <TouchableOpacity style={styles.paydayCard} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2FA084', '#D9D9D9']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.paydayGradient}
            >
              <View style={styles.paydayLeft}>
                <View style={styles.paydayIconWrap}>
                  <Ionicons name="stats-chart" size={20} color="#000000" />
                </View>
                <View>
                  <Text style={[styles.paydayLabel, { fontFamily: font }]}>Days until payday</Text>
                  <Text style={[styles.paydayDays, { fontFamily: font }]}>{daysUntilPayday} Days</Text>
                </View>
              </View>
              <View style={styles.paydayRight}>
                <Text style={[styles.paydayAmount, { fontFamily: font }]}>{formatPeso(salaryAmount)}</Text>
                <Text style={[styles.paydayDate, { fontFamily: font }]}>{nextPaydayText}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : typeof salaryAmount === 'number' && salaryAmount > 0 ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D9D9D9' }]} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionSubtitle, { fontFamily: font, color: '#555' }]}>Payday reminder</Text>
              <Text style={[styles.actionTitle, { fontFamily: font, color: TEXT_DARK }]}>Set your payday date in Setup</Text>
            </View>
            <Text style={[styles.actionArrow, { color: '#555', fontFamily: font }]}>&gt;</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D9D9D9' }]} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionSubtitle, { fontFamily: font, color: '#555' }]}>Are you employed?</Text>
              <Text style={[styles.actionTitle, { fontFamily: font, color: TEXT_DARK }]}>Track your salaries monthly</Text>
            </View>
            <Text style={[styles.actionArrow, { color: '#555', fontFamily: font }]}>&gt;</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: TEAL }]} activeOpacity={0.8}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="pie-chart" size={18} color={TEXT_DARK} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.actionTitle, { fontFamily: font, color: '#FFFFFF' }]}>Set your first budget</Text>
            <Text style={[styles.actionSubtitle, { fontFamily: font, color: 'rgba(255,255,255,0.8)' }]}>Warn when nearing or over budget</Text>
          </View>
          <Text style={[styles.actionArrow, { color: '#FFFFFF', fontFamily: font }]}>&gt;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: TEAL }]} activeOpacity={0.8}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="bookmark" size={18} color={TEXT_DARK} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.actionTitle, { fontFamily: font, color: '#FFFFFF' }]}>Set a personal goal</Text>
            <Text style={[styles.actionSubtitle, { fontFamily: font, color: 'rgba(255,255,255,0.8)' }]}>Track bigger plans like a house, car, or vacation so progress feels visible</Text>
          </View>
          <Text style={[styles.actionArrow, { color: '#FFFFFF', fontFamily: font }]}>&gt;</Text>
        </TouchableOpacity>

        {/* Ready to track */}
        <View style={styles.readyCard}>
          <Image
            source={require('@/assets/images/squirl/readytotrack.png')}
            style={styles.readyMascot}
            resizeMode="contain"
          />
          <Text style={[styles.readyTitle, { fontFamily: font }]}>Ready to track?</Text>
          <Text style={[styles.readyText, { fontFamily: font }]}>
            Hit the &quot;+&quot; button below to log you first expense and start your journey.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 20,
    color: TEXT_DARK,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: '#EAEAEA',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Banner */
  bannerContainer: {
    position: 'relative',
    height: 152,
    marginTop: 4,
    marginBottom: 20,
  },
  bannerBackground: {
    position: 'absolute',
    bottom: 0,
    left: -16, // Bleed out of padding
    right: -16,
    height: 108,
    backgroundColor: TEAL_DARK,
  },
  bannerMascot: {
    position: 'absolute',
    left: 0,
    bottom: -8,
    width: 136,
    height: 146,
    zIndex: 2,
  },
  bannerBubbleWrap: {
    position: 'absolute',
    right: 6,
    top: 52,
    left: 132,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  bannerBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  bannerBubbleTail: {
    width: 0,
    height: 0,
    borderTopWidth: 24,
    borderBottomWidth: 24,
    borderRightWidth: 32,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFFFFF',
    marginRight: -2,
  },
  bannerBubbleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEAL,
    marginBottom: 2,
  },
  bannerBubbleText: {
    fontSize: 13,
    color: TEXT_DARK,
    lineHeight: 18,
  },

  /* Cards row */
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 10,
  },

  cashflowHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cashflowLabel: {
    fontSize: 13,
    color: '#5F6660',
    marginBottom: 2,
  },
  cashflowChartWrap: {
    borderWidth: 1,
    borderColor: '#E4E7E2',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    gap: 14,
  },
  cashflowGridLine: {
    height: 1,
    backgroundColor: '#E8EAE7',
  },
  cashflowBarsRow: {
    marginTop: -92,
    height: 126,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  cashflowMonthCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cashflowDualBarWrap: {
    width: '72%',
    maxWidth: 18,
    height: 98,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cashflowBarIncome: {
    width: 8,
    backgroundColor: '#4E8E5A',
    borderRadius: 8,
  },
  cashflowBarExpense: {
    width: 8,
    backgroundColor: '#BFCFC2',
    borderRadius: 8,
  },
  cashflowMonthText: {
    fontSize: 10,
    color: '#687068',
  },

  monthSummaryWrap: {
    flex: 1,
    gap: 10,
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE1DC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  monthInCard: {
    backgroundColor: '#ECF1EC',
  },
  monthHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  monthLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    color: '#5A625B',
    fontWeight: '700',
  },
  monthTag: {
    backgroundColor: '#DFE5DF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  monthTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A625B',
  },
  monthAmountOut: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2A21',
    marginBottom: 4,
  },
  monthAmountIn: {
    fontSize: 24,
    fontWeight: '700',
    color: '#123328',
    marginBottom: 4,
  },
  monthSubText: {
    fontSize: 11,
    color: '#5F6660',
    lineHeight: 14,
  },

  /* Action Buttons */
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    marginLeft: 8,
  },

  paydayCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    marginBottom: 12,
    overflow: 'hidden',
  },
  paydayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  paydayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paydayIconWrap: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  paydayLabel: {
    fontSize: 13,
    color: '#EAF8F4',
  },
  paydayDays: {
    fontSize: 22,
    color: '#000000',
    lineHeight: 24,
    fontWeight: '700',
  },
  paydayRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },
  paydayAmount: {
    fontSize: 22,
    color: '#0D7D66',
    fontWeight: '700',
    lineHeight: 24,
  },
  paydayDate: {
    fontSize: 13,
    color: '#4D4D4D',
    marginTop: 2,
  },

  /* Ready Card */
  readyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 80,
    alignItems: 'center',
    position: 'relative',
  },
  readyMascot: {
    position: 'absolute',
    top: -7,
    width: 126,
    height: 100,
  },
  readyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  readyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
