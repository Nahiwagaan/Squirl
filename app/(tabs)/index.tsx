import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { useTheme } from '@/context/ThemeContext';
import { CashflowMonth, deleteExpenseEntry, deleteIncomeEntry, getBills, getCashflowLast6Months, getMonthExpenseTotal, getMonthIncomeTotal, getRecentTransactions, getSavingsGoals, getTodayExpenseTotal, getTodayIncomeTotal, getUserProfile, HistoryTransaction, saveSalaryProfile, UserProfile, updateSavingsGoalVisibility } from '@/lib/database';
import { pickBillLogo } from '@/constants/bills';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const InclusiveSans_400Regular = require('../../node_modules/@expo-google-fonts/inclusive-sans/400Regular/InclusiveSans_400Regular.ttf');
const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');
const Inter_700Bold = require('../../node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf');

const TEAL = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';

type HomeGoalItem = {
  id: number;
  name: string;
  targetTotal: number;
  savedTotal: number;
  remainingToGo: number;
  progress: number;
  is_hidden?: number;
};

type HomeBillItem = {
  id: number;
  name: string;
  dueDay: number;
  frequency: string;
  amount: number;
  image: any;
};

export default function HomeDashboard() {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [monthIncomeTotal, setMonthIncomeTotal] = useState(0);
  const [monthExpenseTotal, setMonthExpenseTotal] = useState(0);
  const [cashflowMonths, setCashflowMonths] = useState<CashflowMonth[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<HistoryTransaction[]>([]);
  const [savedGoals, setSavedGoals] = useState<HomeGoalItem[]>([]);
  const [savedBills, setSavedBills] = useState<HomeBillItem[]>([]);
  const [focusCount, setFocusCount] = useState(0);

  const [isSalaryModalVisible, setIsSalaryModalVisible] = useState(false);
  const [modalSalary, setModalSalary] = useState('');
  const [modalPayday, setModalPayday] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateInput, setWebDateInput] = useState('');

  const handleToggleGoalVisibility = (goalId: number, isCurrentlyHidden: boolean) => {
    updateSavingsGoalVisibility(goalId, !isCurrentlyHidden);
    try {
      setSavedGoals(getSavingsGoals().map((g) => ({
        id: g.id,
        name: g.name,
        targetTotal: g.target_total,
        savedTotal: g.saved_total,
        remainingToGo: g.remaining_to_go,
        progress: g.progress,
        is_hidden: g.is_hidden
      })));
    } catch { }
  };

  const [fontsLoaded] = useFonts({ InclusiveSans_400Regular, Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    setProfile(getUserProfile());
    setMonthIncomeTotal(getMonthIncomeTotal());
    setMonthExpenseTotal(getMonthExpenseTotal());
    setCashflowMonths(getCashflowLast6Months());
    setRecentTransactions(getRecentTransactions(5));
    try { setSavedGoals(getSavingsGoals().map((g) => ({ id: g.id, name: g.name, targetTotal: g.target_total, savedTotal: g.saved_total, remainingToGo: g.remaining_to_go, progress: g.progress, is_hidden: g.is_hidden }))); } catch { }
    try { setSavedBills(getBills().map((b) => ({ id: b.id, name: b.name, dueDay: b.due_day, frequency: b.frequency, amount: b.amount, image: pickBillLogo(b.name) }))); } catch { }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocusCount(prev => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setProfile(getUserProfile());
      setMonthIncomeTotal(getMonthIncomeTotal());
      setMonthExpenseTotal(getMonthExpenseTotal());
      setCashflowMonths(getCashflowLast6Months());
      setRecentTransactions(getRecentTransactions(5));
      try { setSavedGoals(getSavingsGoals().map((g) => ({ id: g.id, name: g.name, targetTotal: g.target_total, savedTotal: g.saved_total, remainingToGo: g.remaining_to_go, progress: g.progress, is_hidden: g.is_hidden }))); } catch { }
      try { setSavedBills(getBills().map((b) => ({ id: b.id, name: b.name, dueDay: b.due_day, frequency: b.frequency, amount: b.amount, image: pickBillLogo(b.name) }))); }
      catch { setSavedBills([]); }
    }, [])
  );

  const maxCashflowValue = Math.max(
    1,
    ...cashflowMonths.flatMap((month) => [month.income, month.expense])
  );

  if (!fontsLoaded) return null;
  const font = 'InclusiveSans_400Regular';
  const fontBold = 'Inter_700Bold';

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setModalPayday(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setWebDateInput(`${yyyy}-${mm}-${dd}`);
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: modalPayday ?? new Date(),
        mode: 'date',
        minimumDate: new Date(),
        onChange: onDateChange,
      });
      return;
    }
    setShowDatePicker((prev) => !prev);
  };

  const handleWebDateChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    setWebDateInput(formatted);

    const parts = formatted.split('-');
    if (parts.length !== 3 || parts[2].length !== 4) return;

    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
    if (!month || !day || !year) return;

    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) {
      setModalPayday(parsed);
    }
  };

  const handleSaveSalary = () => {
    const cleanedSalary = modalSalary.replace(/,/g, '').trim();
    const amount = parseFloat(cleanedSalary);

    if (!Number.isNaN(amount) && amount > 0) {
      const freq = profile?.pay_frequency || 'Monthly';
      let deds: string[] = [];
      try {
        if (profile?.deductions) deds = JSON.parse(profile.deductions);
      } catch { }

      saveSalaryProfile(
        amount,
        freq,
        deds,
        modalPayday ? modalPayday.toISOString() : null
      );
    } else {
      const freq = profile?.pay_frequency || 'Monthly';
      saveSalaryProfile(null, freq, [], null);
    }
    setIsSalaryModalVisible(false);
    setProfile(getUserProfile());
  };

  const userName = profile?.name || 'USER';
  const salaryAmount = profile?.gross_salary ?? null;
  const paydayIso = profile?.next_payday ?? null;

  const formatPeso = (amount: number) =>
    `₱ ${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(amount)}`;


  const formatPesoCents = (amount: number) =>
    `₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  const formatMeta = (item: HistoryTransaction) => {
    const date = new Date(item.created_at);
    const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `${item.meta} · ${dateLabel}`;
  };

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

  const groupedTransactions = recentTransactions.reduce((acc, tx) => {
    const date = new Date(tx.created_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let title = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (date.toDateString() === today.toDateString()) title = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) title = 'Yesterday';

    if (!acc[title]) acc[title] = [];
    acc[title].push(tx);
    return acc;
  }, {} as Record<string, HistoryTransaction[]>);

  const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });
  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    const target = thisMonth >= today ? thisMonth : nextMonth;
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  };

  const sortedBills = [...savedBills].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));

  const todayStr = new Date().toDateString();
  const latestTx = recentTransactions.length > 0 ? recentTransactions[0] : null;
  const isLatestToday = latestTx && new Date(latestTx.created_at).toDateString() === todayStr;

  // Use a stable pseudo-random seed to avoid flickering messages on scroll/re-renders
  // Incorporate focusCount so the default greeting changes each time they visit the Home tab
  const seed = isLatestToday && latestTx ? latestTx.id : Math.floor(monthExpenseTotal) + focusCount;
  const pickRandom = (arr: string[]) => arr[seed % arr.length];

  let bannerMessage = pickRandom([
    "Welcome back, {name}! Ready to track some nuts... I mean, finances? 🐿️",
    "Hey there, {name}! Let's make today a great day for your budget! ✨",
    "Hi {name}! I've been keeping your dashboard warm. What are we tracking today? 📊",
    "Good to see you, {name}! Remember, every little bit you save adds up! 🌰",
    "Squirl checking in! 🐿️ Everything is looking good so far, {name}.",
    "Welcome, {name}! I'm Squirl. I'll help you track expenses, income, budgets, goals, and debts all in one place.",
    "Hey {name}! Did you know squirrels can find food buried beneath a foot of snow? Let's find some savings today! ❄️",
  ]);
  let bannerMascot = require('@/assets/images/squirl/Hi.png');

  if (isLatestToday && latestTx) {
    const formattedAmount = new Intl.NumberFormat('en-PH').format(latestTx.amount);
    if (latestTx.type === 'expense') {
      if (latestTx.amount >= 5000) {
        bannerMessage = pickRandom([
          `Whoa, ₱${formattedAmount} on ${latestTx.name}! That's quite a bit, {name}. Let's make sure we're on budget! 📉`,
          `₱${formattedAmount} for ${latestTx.name}?! I hope that was planned, {name}! 🐿️💦`,
          `Ouch! ₱${formattedAmount} just flew out of your wallet for ${latestTx.name}. My little squirrel heart can barely take it! 💔`,
          `Hold your nuts! ₱${formattedAmount} on ${latestTx.name}? We might need to tighten the belt for the rest of the month, {name}. 🤐`
        ]);
        bannerMascot = require('@/assets/images/squirl/Sad.png');
      } else if (latestTx.amount >= 1000) {
        bannerMessage = pickRandom([
          `₱${formattedAmount} for ${latestTx.name}. I'm keeping an eye on your spending, {name}! 👀`,
          `Another ₱${formattedAmount} gone to ${latestTx.name}! Is there a hole in your pocket, {name}? 👖`,
          `Just saw that ₱${formattedAmount} for ${latestTx.name}. We're still doing okay, right {name}? 🤔`
        ]);
        bannerMascot = require('@/assets/images/squirl/Hi.png');
      } else {
        bannerMessage = pickRandom([
          `Just logged ${latestTx.name} for ₱${formattedAmount}? A little treat never hurts, {name}! 🐿️`,
          `₱${formattedAmount} for ${latestTx.name}. Nice and low! Keep it up, {name}. 🌰`,
          `Small spend on ${latestTx.name}! That's how we grow the stash safely. Good job, {name}! 👍`
        ]);
        bannerMascot = require('@/assets/images/squirl/Happy.png');
      }
    } else if (latestTx.type === 'income') {
      if (latestTx.amount >= 5000) {
        bannerMessage = pickRandom([
          `Big payday! ₱${formattedAmount} from ${latestTx.name}. Let's stash some of that in savings, {name}! 💰`,
          `Look at all those nuts! ₱${formattedAmount} from ${latestTx.name} is huge, {name}! 🐿️🎉`,
          `We're rich! Well, ₱${formattedAmount} richer thanks to ${latestTx.name}! Don't spend it all at once! 🤑`
        ]);
        bannerMascot = require('@/assets/images/squirl/Happy.png');
      } else {
        bannerMessage = pickRandom([
          `Every little bit helps! ₱${formattedAmount} from ${latestTx.name} added to your stash, {name}. ✨`,
          `Awesome, {name}! ₱${formattedAmount} from ${latestTx.name} keeps the stash growing! 📈`,
          `Nice! ₱${formattedAmount} from ${latestTx.name}. Can we buy some extra acorns now? 🐿️`
        ]);
        bannerMascot = require('@/assets/images/squirl/Happy.png');
      }
    }
  } else if (monthExpenseTotal > 5000) {
    bannerMessage = pickRandom([
      `Whoa {name}, you've spent quite a bit this month (₱${new Intl.NumberFormat('en-PH').format(monthExpenseTotal)})! Let's make sure we're sticking to the budget.`,
      `{name}, you're burning through cash this month! Time to hide the credit cards? 🏃‍♂️💳`,
      `I'm looking at this month's total and getting a little dizzy, {name}. 😵‍💫 Let's slow down the spending!`
    ]);
    bannerMascot = require('@/assets/images/squirl/Sad.png');
  } else if (cashflowMonths.length > 0) {
    const currentMonth = cashflowMonths[cashflowMonths.length - 1];
    if (currentMonth.expense > 0 && currentMonth.income > 0 && currentMonth.expense >= currentMonth.income * 0.9) {
      bannerMessage = pickRandom([
        `Careful, {name}! Your expenses are getting very close to your income this month.`,
        `Red alert! You've spent almost everything you earned this month, {name}. 🚨`,
        `We are dangerously close to living paycheck to paycheck this month, {name}. Let's reel it in! 🎣`
      ]);
      bannerMascot = require('@/assets/images/squirl/Sad.png');
    } else if (currentMonth.expense > 0 && currentMonth.income === 0 && currentMonth.expense > 10000) {
      bannerMessage = pickRandom([
        `You've been spending a lot this month, {name}! Try to log some income or keep an eye on your budget.`,
        `Over ₱10k spent and zero income logged this month! My squirrel senses are tingling with anxiety, {name}! 🐿️🔥`,
        `Spending without earning? That's a dangerous game, {name}. Let's hope payday is soon! 📅`
      ]);
      bannerMascot = require('@/assets/images/squirl/Sad.png');
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader userName={userName} fontFamily="Inter_400Regular" />
        <SquirlBanner
          key={`${bannerMessage}-${focusCount}`}
          fontFamily={font}
          userName={userName}
          mascot={bannerMascot}
          message={bannerMessage}
        />

        {/* Summary Cards */}
        <View style={styles.row}>
          {/* Expense Distribution */}
          <View style={[styles.card, { flex: 1, marginRight: 6, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.cashflowHeadRow}>
              <View>
                <Text style={[styles.cashflowLabel, { fontFamily: font, color: colors.textMuted }]}>Cashflow</Text>
                <Text style={[styles.cardTitle, { fontFamily: font, color: colors.textPrimary }]}>6-month trend</Text>
              </View>
              <View style={[styles.monthTag, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.monthTagText, { fontFamily: font, color: colors.textMuted }]}>PHP</Text>
              </View>
            </View>

            <View style={[styles.cashflowChartWrap, { borderColor: colors.border }]}>
              <View style={[styles.cashflowGridLine, { backgroundColor: colors.border }]} />
              <View style={[styles.cashflowGridLine, { backgroundColor: colors.border }]} />
              <View style={[styles.cashflowGridLine, { backgroundColor: colors.border }]} />
              <View style={[styles.cashflowGridLine, { backgroundColor: colors.border }]} />

              <View style={styles.cashflowBarsRow}>
                {cashflowMonths.map((month) => {
                  const incomeHeight = Math.max(4, Math.round((month.income / maxCashflowValue) * 94));
                  const expenseHeight = Math.max(4, Math.round((month.expense / maxCashflowValue) * 94));
                  return (
                    <View key={month.key} style={styles.cashflowMonthCol}>
                      <View style={styles.cashflowDualBarWrap}>
                        <View style={[styles.cashflowBarExpense, { height: expenseHeight, backgroundColor: colors.textMuted + '66' }]} />
                        <View style={[styles.cashflowBarIncome, { height: incomeHeight, backgroundColor: colors.teal }]} />
                      </View>
                      <Text style={[styles.cashflowMonthText, { fontFamily: font, color: colors.textMuted }]}>{month.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.monthSummaryWrap}>
            <View style={[styles.monthCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <View style={styles.monthHeadRow}>
                <Text style={[styles.monthLabel, { fontFamily: font, color: colors.textMuted }]}>THIS MONTH OUT</Text>
                <View style={[styles.monthTag, { backgroundColor: colors.bgSecondary }]}>
                  <Text style={[styles.monthTagText, { fontFamily: font, color: colors.textMuted }]}>OUT</Text>
                </View>
              </View>
              <Text style={[styles.monthAmountOut, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>{formatPesoCents(monthExpenseTotal)}</Text>
              <Text style={[styles.monthSubText, { fontFamily: font, color: colors.textMuted }]}>Logged spending in the current month</Text>
            </View>

            <View style={[styles.monthCard, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
              <View style={styles.monthHeadRow}>
                <Text style={[styles.monthLabel, { fontFamily: font, color: colors.textMuted }]}>THIS MONTH IN</Text>
                <View style={[styles.monthTag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.monthTagText, { fontFamily: font, color: colors.textMuted }]}>IN</Text>
                </View>
              </View>
              <Text style={[styles.monthAmountIn, { fontFamily: 'Inter_400Regular', color: '#1a6b3a' }]}>{formatPesoCents(monthIncomeTotal)}</Text>
              <Text style={[styles.monthSubText, { fontFamily: font, color: colors.textMuted }]}>Logged income in the current month</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {typeof salaryAmount === 'number' && salaryAmount > 0 && daysUntilPayday !== null && nextPaydayText ? (
          <TouchableOpacity style={styles.paydayCard} activeOpacity={0.85} onPress={() => setIsSalaryModalVisible(true)}>
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
                <Text style={[styles.paydayAmount, { fontFamily: fontBold }]}>{formatPeso(salaryAmount)}</Text>
                <Text style={[styles.paydayDate, { fontFamily: font }]}>{nextPaydayText}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : typeof salaryAmount === 'number' && salaryAmount > 0 ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D9D9D9' }]} activeOpacity={0.8} onPress={() => setIsSalaryModalVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionSubtitle, { fontFamily: font, color: '#555' }]}>Payday reminder</Text>
              <Text style={[styles.actionTitle, { fontFamily: font, color: TEXT_DARK }]}>Set your payday date in Setup</Text>
            </View>
            <Text style={[styles.actionArrow, { color: '#555', fontFamily: font }]}>&gt;</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D9D9D9' }]} activeOpacity={0.8} onPress={() => setIsSalaryModalVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionSubtitle, { fontFamily: font, color: '#555' }]}>Are you employed?</Text>
              <Text style={[styles.actionTitle, { fontFamily: font, color: TEXT_DARK }]}>Track your salaries monthly</Text>
            </View>
            <Text style={[styles.actionArrow, { color: '#555', fontFamily: font }]}>&gt;</Text>
          </TouchableOpacity>
        )}

        {/* Upcoming Bills */}
        {sortedBills.length > 0 && (
          <View style={styles.billSection}>
            <Text style={[styles.billSectionTitle, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>Upcoming Bills</Text>
            {sortedBills.map((bill) => {
              const days = getDaysUntilDue(bill.dueDay);
              const urgent = days <= 7;
              const today = new Date();
              const dueDate = new Date(today.getFullYear(), days < 0 ? today.getMonth() + 1 : today.getMonth(), bill.dueDay);
              const dueDateLabel = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
              return (
                <TouchableOpacity
                  key={bill.id}
                  style={[styles.billPill, urgent && styles.billPillUrgent, { borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/plan')}
                >
                  {urgent ? (
                    <LinearGradient
                      colors={['#F27D7D', '#FFF5F5']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.billPillGradient}
                    >
                      <View style={styles.billPillLeft}>
                        <View style={styles.billLogoBox}>
                          {bill.image ? (
                            <Image source={bill.image} style={styles.billLogoImg} resizeMode="contain" />
                          ) : (
                            <Text style={[styles.billLogoInitial, { fontFamily: 'Inter_400Regular' }]}>{bill.name.slice(0, 1).toUpperCase()}</Text>
                          )}
                        </View>
                        <View>
                          <Text style={[styles.billPillName, { fontFamily: 'Inter_400Regular', color: '#1A1A1A' }]}>{bill.name}</Text>
                          <Text style={[styles.billPillDate, { fontFamily: 'Inter_400Regular', color: '#1A1A1A' }]}>{dueDateLabel}</Text>
                        </View>
                      </View>
                      <View style={styles.billPillRight}>
                        <Text style={[styles.billPillUrgentTag, { fontFamily: 'Inter_400Regular' }]}>{days === 0 ? 'Due Today' : `${days} Days Left`}</Text>
                        <Text style={[styles.billPillAmount, { fontFamily: 'Inter_400Regular', color: '#000000' }]}>₱ {new Intl.NumberFormat('en-PH').format(bill.amount)}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.billPillGradient, { backgroundColor: colors.surface }]}>
                      <View style={styles.billPillLeft}>
                        <View style={[styles.billLogoBox, { backgroundColor: colors.bgSecondary }]}>
                          {bill.image ? (
                            <Image source={bill.image} style={styles.billLogoImg} resizeMode="contain" />
                          ) : (
                            <Text style={[styles.billLogoInitial, { fontFamily: 'Inter_400Regular', color: colors.teal }]}>{bill.name.slice(0, 1).toUpperCase()}</Text>
                          )}
                        </View>
                        <View>
                          <Text style={[styles.billPillName, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>{bill.name}</Text>
                          <Text style={[styles.billPillDate, { fontFamily: 'Inter_400Regular', color: colors.textMuted }]}>{dueDateLabel}</Text>
                        </View>
                      </View>
                      <Text style={[styles.billPillAmount, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>₱ {new Intl.NumberFormat('en-PH').format(bill.amount)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Budget Button or Goals Summary */}
        {savedGoals.length > 0 ? (
          <View style={styles.goalSection}>
            <View style={[styles.goalSectionHead, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={[styles.goalSectionTitle, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>Goals</Text>
            </View>
            {savedGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/plan')}
              >
                <View style={styles.goalCardTop}>
                  <View style={styles.goalCardLeft}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={[styles.goalCardName, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>{goal.name}</Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleGoalVisibility(goal.id, goal.is_hidden === 1);
                          }}
                          style={{ padding: 4 }}
                          activeOpacity={0.6}
                        >
                          <Ionicons name={goal.is_hidden === 1 ? 'eye-off' : 'eye'} size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.goalCardSub, { fontFamily: 'Inter_400Regular', color: colors.textMuted }]}>
                        {goal.is_hidden === 1 ? '₱ *** to go' : `₱ ${new Intl.NumberFormat('en-PH').format(goal.remainingToGo)} to go`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.goalCardRight}>
                    <Text style={[styles.goalCardPct, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>
                      {Math.round(goal.progress * 100)}%
                    </Text>
                    <Text style={[styles.goalCardPctLabel, { fontFamily: 'Inter_400Regular', color: colors.textMuted }]}>of goal</Text>
                  </View>
                </View>
                <View style={[styles.goalProgressTrack, { backgroundColor: colors.bgSecondary }]}>
                  <View style={[styles.goalProgressBar, { width: `${Math.min(goal.progress * 100, 100)}%`, backgroundColor: colors.teal }]} />
                </View>
                <View style={styles.goalCardBottom}>
                  <Text style={[styles.goalCardBottomText, { fontFamily: 'Inter_400Regular', color: colors.teal }]}>
                    Saved: {goal.is_hidden === 1 ? '₱ ***' : `₱ ${new Intl.NumberFormat('en-PH').format(goal.savedTotal)}`}
                  </Text>
                  <Text style={[styles.goalCardBottomText, { fontFamily: 'Inter_400Regular', color: colors.teal }]}>
                    Target: {goal.is_hidden === 1 ? '₱ ***' : `₱ ${new Intl.NumberFormat('en-PH').format(goal.targetTotal)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: TEAL }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/plan')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="bookmark" size={18} color={TEXT_DARK} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.actionTitle, { fontFamily: font, color: '#FFFFFF' }]}>Set a personal goal</Text>
              <Text style={[styles.actionSubtitle, { fontFamily: font, color: 'rgba(255,255,255,0.8)' }]}>Track bigger plans like a house, car, or vacation so progress feels visible</Text>
            </View>
            <Text style={[styles.actionArrow, { color: '#FFFFFF', fontFamily: font }]}>&gt;</Text>
          </TouchableOpacity>
        )}

        {/* Recent Transactions or Ready to track */}
        {recentTransactions.length > 0 ? (
          <View style={styles.recentSection}>
            {sortedDateKeys.map((dateTitle) => (
              <View key={dateTitle} style={styles.dateGroup}>
                <Text style={[styles.dateHeader, { fontFamily: 'Inter_400Regular', color: colors.textPrimary }]}>{dateTitle}</Text>
                {groupedTransactions[dateTitle].map((item, idx) => (
                  <LinearGradient
                    key={`${item.type}-${item.id}-${idx}`}
                    colors={item.type === 'income' ? ['#4EAA93', '#F2F9F7'] : ['#F27D7D', '#FFF5F5']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.txPill, { borderColor: item.type === 'income' ? '#4EAA93' : '#F27D7D' }]}
                  >
                    <View style={styles.txLeft}>
                      <Text style={[styles.txName, { fontFamily: 'Inter_400Regular', color: '#1A1A1A' }]}>{item.name}</Text>
                      <Text style={[styles.txTime, { fontFamily: 'Inter_400Regular', color: '#1A1A1A' }]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.txAmount, { fontFamily: 'Inter_400Regular' }, item.type === 'income' ? styles.amountInText : styles.amountOutText]}>
                        ₱ {new Intl.NumberFormat('en-PH').format(item.amount)}
                      </Text>
                      {dateTitle === 'Today' && (
                        <TouchableOpacity
                          style={{ marginLeft: 16 }}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              if (window.confirm("Are you sure you wanna undo?")) {
                                if (item.type === 'expense') deleteExpenseEntry(item.id);
                                else deleteIncomeEntry(item.id);
                                setRecentTransactions(getRecentTransactions(5));
                                setMonthIncomeTotal(getMonthIncomeTotal());
                                setMonthExpenseTotal(getMonthExpenseTotal());
                                setCashflowMonths(getCashflowLast6Months());
                              }
                            } else {
                              Alert.alert(
                                "Undo Transaction",
                                "Are you sure you wanna undo?",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Undo",
                                    style: "destructive",
                                    onPress: () => {
                                      if (item.type === 'expense') deleteExpenseEntry(item.id);
                                      else deleteIncomeEntry(item.id);
                                      setRecentTransactions(getRecentTransactions(5));
                                      setMonthIncomeTotal(getMonthIncomeTotal());
                                      setMonthExpenseTotal(getMonthExpenseTotal());
                                      setCashflowMonths(getCashflowLast6Months());
                                    }
                                  }
                                ]
                              );
                            }
                          }}
                        >
                          <Ionicons name="reload-outline" size={20} color={item.type === 'income' ? '#1F6F5F' : '#B70D19'} style={{ transform: [{ scaleX: -1 }] }} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </LinearGradient>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.readyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={require('@/assets/images/squirl/readytotrack.png')}
              style={styles.readyMascot}
              resizeMode="contain"
            />
            <Text style={[styles.readyTitle, { fontFamily: font, color: colors.textPrimary }]}>Ready to track?</Text>
            <Text style={[styles.readyText, { fontFamily: font, color: colors.textMuted }]}>
              Hit the &quot;+&quot; button below to log you first expense and start your journey.
            </Text>
          </View>
        )}

      </ScrollView>

      <Modal visible={isSalaryModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { fontFamily: font, color: colors.textPrimary }]}>Salary Setup</Text>

            <Text style={[styles.modalLabel, { fontFamily: font, color: colors.textPrimary }]}>MONTHLY GROSS SALARY</Text>
            <View style={[styles.salaryInputWrapper, { borderColor: colors.inputBorder }]}>
              <Text style={[styles.pesoSign, { fontFamily: font, color: colors.textMuted }]}>₱</Text>
              <TextInput
                style={[styles.salaryInput, { fontFamily: font, color: colors.textPrimary }]}
                placeholder="e.g. 35,000"
                placeholderTextColor={colors.textMuted}
                value={modalSalary}
                onChangeText={setModalSalary}
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.modalLabel, { fontFamily: font, color: colors.textPrimary }]}>PAYDAY DATE</Text>
            {Platform.OS === 'web' ? (
              <View style={[styles.datePickerWrap, { paddingVertical: 0, borderColor: colors.inputBorder }]}>
                <View style={styles.webDateRow}>
                  <TextInput
                    style={[styles.salaryInput, { fontFamily: font, color: colors.textPrimary }]}
                    placeholder="MM-DD-YYYY"
                    placeholderTextColor={colors.textMuted}
                    value={webDateInput}
                    onChangeText={handleWebDateChange}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                  />
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: colors.inputBorder }]}
                  onPress={openDatePicker}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dateButtonText, { fontFamily: font, color: colors.textPrimary }, !modalPayday && { color: colors.textMuted }]}>
                    {modalPayday ? modalPayday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select payday date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {showDatePicker && (
                  <View style={[styles.datePickerWrap, { borderColor: colors.inputBorder }]}>
                    <DateTimePicker
                      value={modalPayday ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      minimumDate={new Date()}
                      onChange={onDateChange}
                    />
                  </View>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsSalaryModalVisible(false)}>
                <Text style={[styles.modalBtnTextCancel, { fontFamily: font, color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: colors.tealBg }]} onPress={handleSaveSalary}>
                <Text style={[styles.modalBtnTextSave, { fontFamily: font }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 14,
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
    backgroundColor: '#3e6645ff',
    borderRadius: 8,
  },
  cashflowBarExpense: {
    width: 8,
    backgroundColor: '#BFCFC2',
    borderRadius: 8,
  },
  cashflowMonthText: {
    fontSize: 10,
    color: '#1ed61eff',
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
  /* Recent Transactions Redesign */
  recentSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 16,
  },
  txPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
    width: '92%',
    alignSelf: 'center',
  },
  txLeft: {
    flex: 1,
  },
  txName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  txTime: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountInText: { color: '#1F6F5F' },
  amountOutText: { color: '#B70D19' },
  /* Goals Section */
  goalSection: {
    marginBottom: 16,
  },
  goalSectionHead: {
    marginBottom: 14,
  },
  goalSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E0E4E1',
  },
  goalCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  goalCardSub: {
    fontSize: 12,
    color: '#687068',
    marginTop: 2,
  },
  goalCardRight: {
    alignItems: 'flex-end',
  },
  goalCardPct: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  goalCardPctLabel: {
    fontSize: 12,
    color: '#687068',
  },
  goalProgressTrack: {
    height: 8,
    backgroundColor: '#D9D9D9',
    borderRadius: 999,
    marginBottom: 10,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: TEAL,
    borderRadius: 999,
  },
  goalCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalCardBottomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#687068',
  },
  /* Upcoming Bills */
  billSection: {
    marginBottom: 20,
  },
  billSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 14,
  },
  billPill: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
    width: '92%',
    alignSelf: 'center',
  },
  billPillUrgent: {
    borderColor: '#000000',
  },
  billPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  billPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  billLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#D8E4DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  billLogoInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2FA084',
  },
  billPillName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  billPillDate: {
    fontSize: 12,
    color: '#687068',
    marginTop: 2,
  },
  billPillRight: {
    alignItems: 'flex-end',
  },
  billPillUrgentTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B70D19',
    marginBottom: 2,
  },
  billPillAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: 1.1,
    marginTop: 16,
    marginBottom: 8,
  },
  salaryInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pesoSign: {
    fontSize: 16,
    color: '#888888',
    marginRight: 6,
  },
  salaryInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    padding: 0,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  datePlaceholder: {
    color: '#888888',
  },
  datePickerWrap: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  webDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 32,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnTextCancel: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBtnSave: {
    backgroundColor: TEAL_DARK,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnTextSave: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
