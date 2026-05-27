import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { useTheme } from '@/context/ThemeContext';
import {
  BillEntry,
  deleteBill,
  deleteSavingsGoal,
  getBills,
  getSavingsGoals,
  getUserProfile,
  getWalletAccounts,
  saveBill,
  saveExpenseEntry,
  saveSavingsGoal,
  SavingsGoal,
  updateBill,
  updateSavingsGoalProgress,
  UserProfile,
  WalletAccount,
  updateSavingsGoalVisibility,
} from '@/lib/database';
import { pickBillLogo, DEFAULT_BILLS } from '@/constants/bills';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
  View,
} from 'react-native';

const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');
const Itim_400Regular = require('../../node_modules/@expo-google-fonts/itim/400Regular/Itim_400Regular.ttf');

const BG = '#FFFFFF';
const TEAL = '#2FA084';
const TEXT_DARK = '#1A1A1A';

// GoalItem is now derived from SavingsGoal DB type
type GoalItem = {
  id: number;
  name: string;
  targetTotal: number;
  remainingToGo: number;
  savedTotal: number;
  progress: number;
  icon?: string | null;
  fundingAccount?: string | null;
  is_hidden?: number;
};

// BillItem wraps BillEntry (adds runtime image)
type BillItem = {
  id: number;
  name: string;
  dueDay: number;
  frequency: string;
  amount: number;
  image: any;
};

const GOAL_ICONS = [
  'airplane', 'home', 'car', 'laptop', 'book', 'game-controller',
  'bicycle', 'fitness', 'gift', 'camera', 'musical-notes', 'cart',
  'headset', 'briefcase', 'wallet', 'cash', 'card', 'barbell', 'boat', 'build',
] as const;

function dbGoalToItem(g: SavingsGoal): GoalItem {
  return {
    id: g.id,
    name: g.name,
    targetTotal: g.target_total,
    savedTotal: g.saved_total,
    remainingToGo: g.remaining_to_go,
    progress: g.progress,
    icon: g.icon,
    fundingAccount: g.funding_account ?? undefined,
    is_hidden: g.is_hidden,
  };
}

function dbBillToItem(b: BillEntry): BillItem {
  return {
    id: b.id,
    name: b.name,
    amount: b.amount,
    dueDay: b.due_day,
    frequency: b.frequency,
    image: pickBillLogo(b.name),
  };
}

export default function PlanScreen() {
  const { colors } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Inter_400Regular, Itim_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');
  const [billItems, setBillItems] = React.useState<BillItem[]>([]);
  const [goalItems, setGoalItems] = React.useState<GoalItem[]>([]);

  const [showForm, setShowForm] = React.useState(false);
  const [formMode, setFormMode] = React.useState<'bill' | 'goal' | 'bill-selection'>('bill');
  const [editingBillId, setEditingBillId] = React.useState<number | null>(null);
  const [error, setError] = React.useState('');

  const [billName, setBillName] = React.useState('');
  const [billAmount, setBillAmount] = React.useState('');
  const [billDueDay, setBillDueDay] = React.useState('1');
  const [billFrequency, setBillFrequency] = React.useState('Monthly');

  const [goalName, setGoalName] = React.useState('');
  const [goalTarget, setGoalTarget] = React.useState('');
  const [goalSaved, setGoalSaved] = React.useState('');
  const [quickSaveInputs, setQuickSaveInputs] = React.useState<Record<number, string>>({});
  const [quickSaveAccounts, setQuickSaveAccounts] = React.useState<Record<number, string>>({});
  const [walletAccounts, setWalletAccounts] = React.useState<WalletAccount[]>([]);
  const [goalAccount, setGoalAccount] = React.useState('');

  // Goal detail sheet
  const [selectedGoal, setSelectedGoal] = React.useState<GoalItem | null>(null);
  const [goalDetailAddAmount, setGoalDetailAddAmount] = React.useState('');
  const [goalDetailAccount, setGoalDetailAccount] = React.useState('');

  const loadData = React.useCallback(() => {
    setProfile(getUserProfile());
    setBillItems(getBills().map(dbBillToItem));
    setGoalItems(getSavingsGoals().map(dbGoalToItem));
    const accs = getWalletAccounts();
    setWalletAccounts(accs);
    if (accs.length > 0) setGoalAccount(accs[0].name);
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
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
  const formatPeso = (amount: number) => `₱ ${new Intl.NumberFormat('en-PH').format(amount)}`;
  const totalDueThisMonth = billItems.reduce((sum, bill) => sum + bill.amount, 0);

  const openAddForm = (mode: 'bill' | 'goal') => {
    setFormMode(mode === 'bill' ? 'bill-selection' : 'goal');
    setError('');
    setBillName('');
    setBillAmount('');
    setBillDueDay('1');
    setBillFrequency('Monthly');
    setGoalName('');
    setGoalTarget('');
    setGoalSaved('');

    const accs = getWalletAccounts();
    setWalletAccounts(accs);
    setGoalAccount(accs[0]?.name || 'Cash');

    setEditingBillId(null);
    setShowForm(true);
  };

  const openEditBillForm = (bill: BillItem) => {
    setFormMode('bill');
    setError('');
    setBillName(bill.name);
    setBillAmount(String(bill.amount));
    setBillDueDay(String(bill.dueDay));
    setBillFrequency(bill.frequency);
    setEditingBillId(bill.id);
    setShowForm(true);
  };

  const handleDeleteBill = (billId: number, billNameValue: string) => {
    const doDelete = () => {
      deleteBill(billId);
      setBillItems((prev) => prev.filter((item) => item.id !== billId));
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${billNameValue} from upcoming bills?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete bill', `Remove ${billNameValue} from upcoming bills?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: doDelete,
        },
      ]);
    }
  };

  const handleSaveForm = () => {
    if (formMode === 'bill') {
      const amount = Number(billAmount.replace(/,/g, ''));
      const dueDay = Number(billDueDay);
      if (!billName.trim()) return setError('Please enter a bill name.');
      if (!Number.isFinite(amount) || amount <= 0) return setError('Please enter a valid bill amount.');
      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return setError('Due day must be from 1 to 31.');

      const trimmedName = billName.trim();
      if (editingBillId) {
        updateBill(editingBillId, trimmedName, amount, dueDay, billFrequency.trim() || 'Monthly');
      } else {
        const newId = saveBill(trimmedName, amount, dueDay, billFrequency.trim() || 'Monthly');
        const newBill: BillItem = {
          id: newId,
          name: trimmedName,
          amount,
          dueDay,
          frequency: billFrequency.trim() || 'Monthly',
          image: pickBillLogo(trimmedName),
        };
        setBillItems((prev) => [...prev, newBill]);
        setEditingBillId(null);
        setShowForm(false);
        return;
      }
      // Refresh from DB for edits
      setBillItems(getBills().map(dbBillToItem));
      setEditingBillId(null);
      setShowForm(false);
      return;
    }

    const targetTotal = Number(goalTarget.replace(/,/g, ''));
    const savedTotal = Number(goalSaved.replace(/,/g, ''));
    if (!goalName.trim()) return setError('Please enter a goal name.');
    if (!Number.isFinite(targetTotal) || targetTotal <= 0) return setError('Please enter a valid goal target amount.');
    if (!Number.isFinite(savedTotal) || savedTotal < 0) return setError('Please enter a valid saved amount.');

    const clampedSaved = Math.min(savedTotal, targetTotal);
    const icon = GOAL_ICONS[Math.floor(Math.random() * GOAL_ICONS.length)];
    const newId = saveSavingsGoal(goalName.trim(), targetTotal, clampedSaved, icon, goalAccount || 'Cash');

    if (clampedSaved > 0) {
      saveExpenseEntry(clampedSaved, `Initial funding for ${goalName.trim()}`, 'Savings', goalAccount || 'Cash');
    }

    // Reload from DB so state matches persisted data
    setGoalItems(getSavingsGoals().map(dbGoalToItem));
    setShowForm(false);
  };

  const handleDeleteGoal = (goalId: number, goalNameValue: string) => {
    const doDelete = () => {
      deleteSavingsGoal(goalId);
      setGoalItems((prev) => prev.filter((item) => item.id !== goalId));
      setSelectedGoal(null);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${goalNameValue} from savings goals?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete goal', `Remove ${goalNameValue} from savings goals?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const openGoalDetail = (goal: GoalItem) => {
    const accs = getWalletAccounts();
    setWalletAccounts(accs);
    setSelectedGoal(goal);
    setGoalDetailAddAmount('');
    setGoalDetailAccount(goal.fundingAccount || accs[0]?.name || 'Cash');
  };

  const handleGoalDetailAddSavings = () => {
    if (!selectedGoal) return;
    const amount = parseFloat(goalDetailAddAmount || '0');
    if (amount <= 0) return;
    const confirmMsg = `Add ${formatPeso(amount)} from ${goalDetailAccount} to ${selectedGoal.name}?`;
    const goalId = selectedGoal.id;
    const doAdd = () => {
      handleQuickSave(goalId, amount, goalDetailAccount);
      setGoalDetailAddAmount('');
    };
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) doAdd();
    } else {
      Alert.alert('Add Savings', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: doAdd },
      ]);
    }
  };

  const handleQuickSave = (goalId: number, amountToAdd: number, customAccount?: string) => {
    const goal = goalItems.find((g) => g.id === goalId);
    if (!goal) return;

    const newSaved = Math.min(goal.savedTotal + amountToAdd, goal.targetTotal);
    const actualAmountAdded = newSaved - goal.savedTotal;

    if (actualAmountAdded > 0) {
      const acc = customAccount || goal.fundingAccount || 'Cash';
      try {
        saveExpenseEntry(actualAmountAdded, `Added to savings: ${goal.name}`, 'Savings', acc);
        updateSavingsGoalProgress(goalId, newSaved, goal.targetTotal);
      } catch (e) {
        console.error('Savings update failed', e);
      }
      // Reload from DB
      const updated = getSavingsGoals().map(dbGoalToItem);
      setGoalItems(updated);
      const refreshed = updated.find((g) => g.id === goalId);
      if (refreshed) setSelectedGoal(refreshed);
    }
  };

  const handleToggleGoalVisibility = (goalId: number, isCurrentlyHidden: boolean) => {
    updateSavingsGoalVisibility(goalId, !isCurrentlyHidden);
    const updated = getSavingsGoals().map(dbGoalToItem);
    setGoalItems(updated);
    if (selectedGoal && selectedGoal.id === goalId) {
      const refreshed = updated.find((g) => g.id === goalId);
      if (refreshed) setSelectedGoal(refreshed);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader userName={userName} fontFamily={font} />
        <SquirlBanner
          compact
          fontFamily={font}
          userName={userName}
          mascot={require('@/assets/images/squirl/Plan.png')}
          message="Let’s plan your budget management."
        />

        <Text style={[styles.pageTitle, { fontFamily: font, color: colors.textPrimary }]}>Plan</Text>

        <View style={[styles.dueCard, { backgroundColor: colors.tealBg }]}>
          <View>
            <Text style={[styles.dueLabel, { fontFamily: font }]}>DUE THIS MONTH</Text>
            <Text style={[styles.dueAmount, { fontFamily: font }]}>{formatPeso(totalDueThisMonth)}</Text>
          </View>
          <View style={styles.dueActions}>
            <TouchableOpacity style={styles.dueActionItem} onPress={() => setViewMode('list')} activeOpacity={0.85}>
              <View style={[styles.iconCircle, viewMode === 'list' && styles.iconCircleActive, { backgroundColor: viewMode === 'list' ? colors.teal : colors.surface }]}>
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#FFFFFF' : colors.textPrimary} />
              </View>
              <Text style={[styles.dueActionText, { fontFamily: font }]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dueActionItem} onPress={() => setViewMode('calendar')} activeOpacity={0.85}>
              <View style={[styles.iconCircle, viewMode === 'calendar' && styles.iconCircleActive, { backgroundColor: viewMode === 'calendar' ? colors.teal : colors.surface }]}>
                <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? '#FFFFFF' : colors.textPrimary} />
              </View>
              <Text style={[styles.dueActionText, { fontFamily: font }]}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'list' ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textMuted }]}>Upcoming bills</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.tealBg }]} onPress={() => openAddForm('bill')}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {billItems.length === 0 ? (
                <View style={styles.emptyStateWrap}>
                  <Text style={[styles.emptyStateTitle, { fontFamily: font, color: colors.textPrimary }]}>No upcoming bills yet</Text>
                  <Text style={[styles.emptyStateText, { fontFamily: font, color: colors.textMuted }]}>Add your first bill to start tracking due dates.</Text>
                </View>
              ) : (
                billItems.map((item, index) => (
                  <View key={item.id} style={[styles.billRow, index !== billItems.length - 1 && styles.billDivider, { borderBottomColor: colors.border }]}>
                    <View style={styles.billLeft}>
                      {item.image ? (
                        <Image source={item.image} style={styles.billIcon} resizeMode="cover" />
                      ) : (
                        <View style={[styles.billIconFallback, { backgroundColor: colors.bgSecondary }]}>
                          <Text style={[styles.billIconFallbackText, { fontFamily: font, color: colors.teal }]}>{item.name.slice(0, 1).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.billName, { fontFamily: font, color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.billMeta, { fontFamily: font, color: colors.textMuted }]}>{`Due ${currentMonthName} ${item.dueDay} · ${item.frequency}`}</Text>
                      </View>
                    </View>
                    <View style={styles.billRight}>
                      <Text style={[styles.billAmount, { fontFamily: font, color: colors.textPrimary }]}>{formatPeso(item.amount)}</Text>
                      <Text style={[styles.upcomingTag, { fontFamily: font, color: colors.teal }]}>Upcoming</Text>
                      <View style={styles.billActionsRow}>
                        <TouchableOpacity style={[styles.billActionPill, { borderColor: colors.border }]} onPress={() => openEditBillForm(item)}>
                          <Text style={[styles.billActionText, { fontFamily: font, color: colors.textMuted }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.billActionPill, styles.billDeletePill]} onPress={() => handleDeleteBill(item.id, item.name)}>
                          <Text style={[styles.billActionText, styles.billDeleteText, { fontFamily: font }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textMuted }]}>Savings Goals</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.tealBg }]} onPress={() => openAddForm('goal')}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {goalItems.length === 0 ? (
              <View style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.emptyStateWrap}>
                  <Text style={[styles.emptyStateTitle, { fontFamily: font, color: colors.textPrimary }]}>No savings goals yet</Text>
                  <Text style={[styles.emptyStateText, { fontFamily: font, color: colors.textMuted }]}>Add your first goal to track your progress.</Text>
                </View>
              </View>
            ) : (
              goalItems.map((goal) => (
                <TouchableOpacity key={goal.id} activeOpacity={0.85} onPress={() => openGoalDetail(goal)}>
                <View style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.goalTop}>
                    <View style={styles.billLeft}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Text style={[styles.goalName, { fontFamily: font, color: colors.textPrimary }]}>{goal.name}</Text>
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
                        <Text style={[styles.goalMeta, { fontFamily: font, color: colors.textMuted }]}>
                          {goal.is_hidden === 1 ? '↑ ₱ *** to go' : `↑ ${formatPeso(goal.remainingToGo)} to go`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.billRight}>
                      <Text style={[styles.goalPercent, { fontFamily: 'Itim_400Regular', color: colors.textPrimary }]}>{`${Math.round(goal.progress * 100)}%`}</Text>
                    </View>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary }]}>
                    <View style={[styles.progressFill, { width: `${goal.progress * 100}%`, backgroundColor: colors.teal }]} />
                  </View>
                  <View style={{ paddingTop: 6 }}>
                    <Text style={[styles.billMeta, { fontFamily: font, color: colors.textMuted }]}>Target: <Text style={{ color: colors.teal, fontWeight: '700' }}>{goal.is_hidden === 1 ? '₱ ***' : formatPeso(goal.targetTotal)}</Text></Text>
                    <Text style={[styles.billMeta, { fontFamily: font, color: colors.textMuted }]}>Saved: <Text style={{ color: colors.teal, fontWeight: '700' }}>{goal.is_hidden === 1 ? '₱ ***' : formatPeso(goal.savedTotal)}</Text></Text>
                  </View>
                </View>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <View style={styles.calendarWrap}>
            <View style={styles.calendarHeadRow}>
              <Text style={[styles.calendarMonth, { fontFamily: font, color: colors.textMuted }]}>{currentMonthYear}</Text>
              <View style={styles.legendRow}>
                <Text style={[styles.legendItemText, { color: colors.textPrimary, fontFamily: font }]}>● Bill</Text>
                <Text style={[styles.legendItemText, { color: colors.teal, fontFamily: font }]}>● Goal</Text>
                <Text style={[styles.legendItemText, { color: colors.teal, fontFamily: font }]}>● Income</Text>
              </View>
            </View>
            <View style={[styles.calendarCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.calendarPlaceholder, { fontFamily: font, color: colors.textMuted }]}>Calendar view coming next</Text>
              <Text style={[styles.billMeta, { fontFamily: font, color: colors.textMuted }]}>You can switch back to List anytime.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { fontFamily: font, color: colors.textPrimary }]}>
                  {formMode === 'bill-selection' ? 'Add Upcoming Bill' : formMode === 'bill' ? (editingBillId ? 'Edit bill' : 'Add bill') : 'Add savings goal'}
                </Text>
                {formMode === 'bill-selection' && (
                  <Text style={[styles.sheetSubtitle, { fontFamily: font, color: colors.textMuted }]}>Choose a bill to add</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowForm(false)} style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {formMode === 'bill-selection' ? (
              <ScrollView style={styles.selectionScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TouchableOpacity style={[styles.selectionItem, { borderBottomColor: colors.border }]} onPress={() => { setFormMode('bill'); }}>
                  <View style={[styles.selectionItemLogoWrap, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="add" size={24} color={colors.textPrimary} />
                  </View>
                  <View style={styles.selectionItemText}>
                    <Text style={[styles.selectionItemTitle, { fontFamily: font, color: colors.textPrimary }]}>Add Custom Bill</Text>
                    <Text style={[styles.selectionItemSub, { fontFamily: font, color: colors.textMuted }]}>Create your own bill</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                {DEFAULT_BILLS.map((b) => (
                  <TouchableOpacity key={b.id} style={[styles.selectionItem, { borderBottomColor: colors.border }]} onPress={() => { setBillName(b.name); setFormMode('bill'); }}>
                    <View style={styles.selectionItemLogoWrap}>
                      <Image source={b.image} style={styles.selectionItemLogo} />
                    </View>
                    <View style={styles.selectionItemText}>
                      <Text style={[styles.selectionItemTitle, { fontFamily: font, color: colors.textPrimary }]}>{b.name}</Text>
                      <Text style={[styles.selectionItemSub, { fontFamily: font, color: colors.textMuted }]}>{b.type}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={colors.teal} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : formMode === 'bill' ? (
              <>
                <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Bill name</Text>
                <TextInput value={billName} onChangeText={setBillName} style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="e.g. Meralco Bill" placeholderTextColor={colors.textMuted} />

                <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Amount</Text>
                <TextInput value={billAmount} onChangeText={setBillAmount} keyboardType="numeric" style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="0" placeholderTextColor={colors.textMuted} />

                <View style={styles.inlineFields}>
                  <View style={styles.inlineFieldItem}>
                    <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Due day</Text>
                    <TextInput value={billDueDay} onChangeText={setBillDueDay} keyboardType="numeric" style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="1-31" placeholderTextColor={colors.textMuted} />
                  </View>
                  <View style={styles.inlineFieldItem}>
                    <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Frequency</Text>
                    <TextInput value={billFrequency} onChangeText={setBillFrequency} style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="Monthly" placeholderTextColor={colors.textMuted} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Goal name</Text>
                <TextInput value={goalName} onChangeText={setGoalName} style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="e.g. Emergency Fund" placeholderTextColor={colors.textMuted} />

                <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Target amount</Text>
                <TextInput value={goalTarget} onChangeText={setGoalTarget} keyboardType="numeric" style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="0" placeholderTextColor={colors.textMuted} />

                <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Saved amount</Text>
                <TextInput value={goalSaved} onChangeText={setGoalSaved} keyboardType="numeric" style={[styles.fieldInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]} placeholder="0" placeholderTextColor={colors.textMuted} />

                <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary }]}>Funding account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll} contentContainerStyle={styles.accountScrollContent}>
                  {walletAccounts.map((acc) => {
                    const isActive = goalAccount === acc.name;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountPill, { backgroundColor: colors.bgSecondary }, isActive && { backgroundColor: colors.tealLight, borderColor: colors.teal }]}
                        onPress={() => setGoalAccount(acc.name)}
                      >
                        <Text style={[styles.accountPillText, { fontFamily: font, color: colors.textMuted }, isActive && { color: colors.teal, fontWeight: '700' }]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {!!error && <Text style={[styles.errorText, { fontFamily: font }]}>{error}</Text>}

            {formMode !== 'bill-selection' && (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.tealBg }]} onPress={handleSaveForm}>
                <Text style={[styles.saveBtnText, { fontFamily: font }]}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Goal Detail Sheet */}
      <Modal transparent visible={!!selectedGoal} animationType="slide" onRequestClose={() => setSelectedGoal(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              <View style={styles.sheetHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.sheetTitle, { fontFamily: font, color: colors.textPrimary }]}>{selectedGoal?.name}</Text>
                    {selectedGoal && (
                      <TouchableOpacity
                        onPress={() => handleToggleGoalVisibility(selectedGoal.id, selectedGoal.is_hidden === 1)}
                        style={{ padding: 4 }}
                        activeOpacity={0.6}
                      >
                        <Ionicons name={selectedGoal.is_hidden === 1 ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.sheetSubtitle, { fontFamily: font, color: colors.textMuted }]}>
                    {`${Math.round((selectedGoal?.progress ?? 0) * 100)}% saved`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedGoal(null)} style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary, marginBottom: 14 }]}>
                <View style={[styles.progressFill, { width: `${(selectedGoal?.progress ?? 0) * 100}%`, backgroundColor: colors.teal }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={[styles.billMeta, { fontFamily: font, color: colors.textMuted }]}>
                  Target: <Text style={{ color: colors.teal, fontWeight: '700' }}>{selectedGoal?.is_hidden === 1 ? '₱ ***' : formatPeso(selectedGoal?.targetTotal ?? 0)}</Text>
                </Text>
                <Text style={[styles.billMeta, { fontFamily: font, color: colors.textMuted }]}>
                  Saved: <Text style={{ color: colors.teal, fontWeight: '700' }}>{selectedGoal?.is_hidden === 1 ? '₱ ***' : formatPeso(selectedGoal?.savedTotal ?? 0)}</Text>
                </Text>
              </View>

              {/* Account pills */}
              <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary, marginBottom: 8 }]}>From account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll} contentContainerStyle={styles.accountScrollContent}>
                {walletAccounts.map((acc) => {
                  const isActive = goalDetailAccount === acc.name;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.accountPill, { backgroundColor: colors.bgSecondary }, isActive && { backgroundColor: colors.tealLight, borderColor: colors.teal }]}
                      onPress={() => setGoalDetailAccount(acc.name)}
                    >
                      <Text style={[styles.accountPillText, { fontFamily: font, color: colors.textMuted }, isActive && { color: colors.teal, fontWeight: '700' }]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Add amount */}
              <Text style={[styles.fieldLabel, { fontFamily: font, color: colors.textPrimary, marginTop: 14, marginBottom: 8 }]}>Add savings</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1, fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={goalDetailAddAmount}
                  onChangeText={setGoalDetailAddAmount}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { flex: 0, paddingHorizontal: 20, marginTop: 0, opacity: parseFloat(goalDetailAddAmount || '0') > 0 ? 1 : 0.5 }]}
                  onPress={handleGoalDetailAddSavings}
                  disabled={parseFloat(goalDetailAddAmount || '0') <= 0}
                >
                  <Text style={[styles.saveBtnText, { fontFamily: font }]}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Delete */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#B20D18', marginTop: 0 }]}
                onPress={() => selectedGoal && handleDeleteGoal(selectedGoal.id, selectedGoal.name)}
              >
                <Text style={[styles.saveBtnText, { fontFamily: font }]}>Delete Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 30 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: TEXT_DARK, marginBottom: 12 },
  dueCard: {
    backgroundColor: TEAL,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dueLabel: { color: '#E8FFFA', fontSize: 14, letterSpacing: 1.1 },
  dueAmount: { color: '#FFFFFF', fontSize: 30, fontWeight: '700', marginTop: 6 },
  dueActions: { flexDirection: 'row', gap: 10 },
  dueActionItem: { alignItems: 'center' },
  dueActionText: { color: '#DFF6EE', fontSize: 11, marginTop: 4 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: { backgroundColor: '#0F5F4D' },
  addSavingsLeft: { flex: 1 },
  addSavingsDesc: { fontSize: 13, color: '#6F7771', marginTop: 4, lineHeight: 18 },
  addSavingsRight: { width: 44, height: 44, borderRadius: 12, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },

  selectionScroll: { maxHeight: 400 },
  selectionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  selectionItemLogoWrap: { width: 46, height: 46, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  selectionItemLogo: { width: '100%', height: '100%' },
  selectionItemText: { flex: 1 },
  selectionItemTitle: { fontSize: 15, color: TEXT_DARK, fontWeight: '700' },
  selectionItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 20, color: 'rgba(26, 26, 26, 0.5)', fontWeight: '700' },
  addBtn: { backgroundColor: '#1F7D69', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 14 },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  listCard: {
    borderWidth: 1,
    borderColor: '#C8CCC8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginLeft: 10,
  },
  billDivider: { borderBottomWidth: 1, borderBottomColor: '#D5D8D5' },
  billLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  billIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#D6D6D6', flexShrink: 0 },
  billIconFallback: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCE7E3',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  billIconFallbackText: { color: '#2C4B43', fontSize: 14, fontWeight: '700' },
  billName: { fontSize: 15, color: TEXT_DARK, fontWeight: '600' },
  billMeta: { fontSize: 12, color: '#6D746E' },
  billRight: { alignItems: 'flex-end', marginLeft: 8 },
  billAmount: { fontSize: 18, color: '#0E0E0E', fontWeight: '700' },
  upcomingTag: { fontSize: 11, color: '#1F7D69', fontWeight: '700' },
  billActionsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  billActionPill: { borderRadius: 999, borderWidth: 1, borderColor: '#A7B1AB', paddingHorizontal: 8, paddingVertical: 2 },
  billActionText: { fontSize: 11, color: '#3C4640', fontWeight: '700' },
  billDeletePill: { borderColor: '#D1A6AA' },
  billDeleteText: { color: '#A3353D' },
  goalCard: {
    borderWidth: 1,
    borderColor: '#C8CCC8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 2 },
  goalName: { fontSize: 22, color: TEXT_DARK, fontWeight: '700', marginLeft: 2 },
  goalMeta: { fontSize: 15, color: '#6D746E', marginTop: 2 },
  goalPercent: { fontSize: 32, color: TEXT_DARK, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D0D3D0',
    marginTop: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: TEAL,
  },
  goalBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  calendarWrap: { marginTop: 8 },
  calendarHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarMonth: { fontSize: 16, color: 'rgba(26, 26, 26, 0.5)', fontWeight: '700' },
  legendRow: { flexDirection: 'row', gap: 10 },
  legendItemText: { fontSize: 12, fontWeight: '700' },
  calendarCard: {
    borderWidth: 1,
    borderColor: '#C8CCC8',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarPlaceholder: { fontSize: 22, color: '#5E6861', marginBottom: 8 },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: TEXT_DARK,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6D746E',
    textAlign: 'center',
  },
  fieldLabel: { fontSize: 13, color: '#5F6660', marginBottom: 5 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#C5CAC6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: TEXT_DARK },
  sheetSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  closeBtn: { backgroundColor: '#F0F0F0', borderRadius: 999, padding: 6 },
  inlineFields: { flexDirection: 'row', gap: 8 },
  inlineFieldItem: { flex: 1 },
  accountScroll: {
    maxHeight: 40,
    marginBottom: 14,
  },
  accountScrollContent: {
    gap: 8,
  },
  accountPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F0F2F1',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountPillActive: {
    backgroundColor: '#E8FFFA',
    borderColor: TEAL,
  },
  accountPillText: {
    fontSize: 14,
    color: '#5F6660',
  },
  accountPillTextActive: {
    color: TEAL,
    fontWeight: '700',
  },
  quickSaveContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  miniAccountScroll: {
    maxHeight: 28,
  },
  miniAccountScrollContent: {
    gap: 4,
  },
  miniAccountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F0F2F1',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  miniAccountPillActive: {
    backgroundColor: '#E8FFFA',
    borderColor: TEAL,
  },
  miniAccountPillText: {
    fontSize: 10,
    color: '#5F6660',
  },
  miniAccountPillTextActive: {
    color: TEAL,
    fontWeight: '700',
  },
  quickSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickSaveInput: {
    borderWidth: 1,
    borderColor: '#C7CCC8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: TEXT_DARK,
    width: 70,
    textAlign: 'center',
  },
  quickSaveBtn: {
    backgroundColor: '#E8FFFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TEAL,
    justifyContent: 'center',
  },
  quickSaveBtnText: {
    color: TEAL,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: { color: '#B20D18', fontSize: 13, marginBottom: 8 },
  saveBtn: {
    backgroundColor: '#1F7D69',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 2,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
