import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { getUserProfile, UserProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
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
const Itim_400Regular = require('../../node_modules/@expo-google-fonts/itim/400Regular/Itim_400Regular.ttf');

const BG = '#FFFFFF';
const TEAL = '#2FA084';
const TEXT_DARK = '#1A1A1A';

type BillItem = {
  name: string;
  dueDay: number;
  frequency: string;
  amount: number;
  category: string;
};

type GoalItem = {
  name: string;
  remainingToGo: number;
  savedTotal: number;
  progress: number;
};

const BILL_ITEMS: BillItem[] = [];

const GOAL_ITEMS: GoalItem[] = [];

export default function PlanScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Itim_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');

  React.useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  if (!fontsLoaded) return null;
  const font = 'Inter_400Regular';
  const userName = profile?.name || 'USER';
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
  const formatPeso = (amount: number) => `₱ ${new Intl.NumberFormat('en-PH').format(amount)}`;
  const totalDueThisMonth = BILL_ITEMS.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader userName={userName} fontFamily={font} />
        <SquirlBanner
          compact
          fontFamily={font}
          userName={userName}
          mascot={require('@/assets/images/squirl/Plan.png')}
          mascotScale={1.2}
          mascotBottomOffset={-14}
          message="Let’s plan your budget management."
        />

        <Text style={[styles.pageTitle, { fontFamily: font }]}>Plan</Text>

        <View style={styles.dueCard}>
          <View>
            <Text style={[styles.dueLabel, { fontFamily: font }]}>DUE THIS MONTH</Text>
            <Text style={[styles.dueAmount, { fontFamily: font }]}>{formatPeso(totalDueThisMonth)}</Text>
          </View>
          <View style={styles.dueActions}>
            <TouchableOpacity style={styles.dueActionItem} onPress={() => setViewMode('list')} activeOpacity={0.85}>
              <View style={[styles.iconCircle, viewMode === 'list' && styles.iconCircleActive]}>
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#FFFFFF' : TEXT_DARK} />
              </View>
              <Text style={[styles.dueActionText, { fontFamily: font }]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dueActionItem} onPress={() => setViewMode('calendar')} activeOpacity={0.85}>
              <View style={[styles.iconCircle, viewMode === 'calendar' && styles.iconCircleActive]}>
                <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? '#FFFFFF' : TEXT_DARK} />
              </View>
              <Text style={[styles.dueActionText, { fontFamily: font }]}>Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'list' ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font }]}>Upcoming bills</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listCard}>
              {BILL_ITEMS.length === 0 ? (
                <View style={styles.emptyStateWrap}>
                  <Text style={[styles.emptyStateTitle, { fontFamily: font }]}>No upcoming bills yet</Text>
                  <Text style={[styles.emptyStateText, { fontFamily: font }]}>Add your first bill to start tracking due dates.</Text>
                </View>
              ) : (
                BILL_ITEMS.map((item, index) => (
                  <View key={item.name} style={[styles.billRow, index !== BILL_ITEMS.length - 1 && styles.billDivider]}>
                    <View style={styles.billLeft}>
                      <View style={styles.billIcon} />
                      <View>
                        <Text style={[styles.billName, { fontFamily: font }]}>{item.name}</Text>
                        <Text style={[styles.billMeta, { fontFamily: font }]}>{`Due ${currentMonthName} ${item.dueDay} · ${item.frequency}`}</Text>
                      </View>
                    </View>
                    <View style={styles.billRight}>
                      <Text style={[styles.billAmount, { fontFamily: font }]}>{formatPeso(item.amount)}</Text>
                      <Text style={[styles.upcomingTag, { fontFamily: font }]}>Upcoming</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font }]}>Savings Goals</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {GOAL_ITEMS.length === 0 ? (
              <View style={styles.goalCard}>
                <View style={styles.emptyStateWrap}>
                  <Text style={[styles.emptyStateTitle, { fontFamily: font }]}>No savings goals yet</Text>
                  <Text style={[styles.emptyStateText, { fontFamily: font }]}>Add your first goal to track your progress.</Text>
                </View>
              </View>
            ) : (
              GOAL_ITEMS.map((goal) => (
                <View key={goal.name} style={styles.goalCard}>
                  <View style={styles.goalTop}>
                    <View style={styles.billLeft}>
                      <View style={styles.billIcon} />
                      <View>
                        <Text style={[styles.billName, { fontFamily: font }]}>{goal.name}</Text>
                        <Text style={[styles.billMeta, { fontFamily: font }]}>{`↑ ${formatPeso(goal.remainingToGo)} to go`}</Text>
                      </View>
                    </View>
                    <View style={styles.billRight}>
                      <Text style={[styles.goalPercent, { fontFamily: 'Itim_400Regular' }]}>{`${Math.round(goal.progress * 100)}%`}</Text>
                      <Text style={[styles.upcomingTag, { fontFamily: font }]}>of goal</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${goal.progress * 100}%` }]} />
                  </View>
                  <View style={styles.goalBottom}>
                    <Text style={[styles.billMeta, { fontFamily: font }]}>Saved: <Text style={{ color: TEAL, fontWeight: '700' }}>{`${formatPeso(goal.remainingToGo)} to go`}</Text></Text>
                    <Text style={[styles.billMeta, { fontFamily: font }]}>Saved: <Text style={{ color: TEAL, fontWeight: '700' }}>{formatPeso(goal.savedTotal)}</Text></Text>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <View style={styles.calendarWrap}>
            <View style={styles.calendarHeadRow}>
              <Text style={[styles.calendarMonth, { fontFamily: font }]}>{currentMonthYear}</Text>
              <View style={styles.legendRow}>
                <Text style={[styles.legendItemText, { color: '#B70D19', fontFamily: font }]}>● Bill</Text>
                <Text style={[styles.legendItemText, { color: '#1F7D69', fontFamily: font }]}>● Goal</Text>
                <Text style={[styles.legendItemText, { color: '#2FA084', fontFamily: font }]}>● Income</Text>
              </View>
            </View>
            <View style={styles.calendarCard}>
              <Text style={[styles.calendarPlaceholder, { fontFamily: font }]}>Calendar view coming next</Text>
              <Text style={[styles.billMeta, { fontFamily: font }]}>You can switch back to List anytime.</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  },
  billDivider: { borderBottomWidth: 1, borderBottomColor: '#D5D8D5' },
  billLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  billIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#D6D6D6' },
  billName: { fontSize: 16, color: TEXT_DARK },
  billMeta: { fontSize: 12, color: '#6D746E' },
  billRight: { alignItems: 'flex-end' },
  billAmount: { fontSize: 20, color: '#0E0E0E', fontWeight: '700' },
  upcomingTag: { fontSize: 11, color: '#1F7D69', fontWeight: '700' },
  goalCard: {
    borderWidth: 1,
    borderColor: '#C8CCC8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  goalBottom: { flexDirection: 'row', justifyContent: 'space-between' },
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
});
