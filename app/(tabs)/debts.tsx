import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { DebtEntry, getDebtEntries, getDebtTotal, getUserProfile, saveDebtEntry, settleDebtEntry, updateDebtEntry, UserProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Alert, Image, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const BG = '#FFFFFF';
const TEAL = '#2FA084';
const RED = '#B20D18';
const TEXT_DARK = '#1A1A1A';

type TabType = 'all' | 'iowe' | 'owed';

export default function DebtsScreen() {
  const { colors } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [tab, setTab] = React.useState<TabType>('all');
  const [iOweTotal, setIOweTotal] = React.useState(0);
  const [owedTotal, setOwedTotal] = React.useState(0);
  const [iOweItems, setIOweItems] = React.useState(getDebtEntries('iowe'));
  const [owedItems, setOwedItems] = React.useState(getDebtEntries('owed'));
  const [settledItems, setSettledItems] = React.useState(getDebtEntries(undefined, true).filter((item) => !!item.settled_at));
  const [showSettled, setShowSettled] = React.useState(false);

  const [showForm, setShowForm] = React.useState(false);
  const [formType, setFormType] = React.useState<'iowe' | 'owed'>('iowe');
  const [editingDebtId, setEditingDebtId] = React.useState<number | null>(null);
  const [person, setPerson] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState('');

  const loadData = React.useCallback(() => {
    setProfile(getUserProfile());
    setIOweTotal(getDebtTotal('iowe'));
    setOwedTotal(getDebtTotal('owed'));
    setIOweItems(getDebtEntries('iowe'));
    setOwedItems(getDebtEntries('owed'));
    setSettledItems(getDebtEntries(undefined, true).filter((item) => !!item.settled_at));
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

  const openAddForm = (type: 'iowe' | 'owed') => {
    setFormType(type);
    setEditingDebtId(null);
    setPerson('');
    setAmount('');
    setNote('');
    setError('');
    setShowForm(true);
  };

  const openEditForm = (entry: DebtEntry) => {
    setFormType(entry.type);
    setEditingDebtId(entry.id);
    setPerson(entry.person);
    setAmount(String(entry.amount));
    setNote(entry.note || '');
    setError('');
    setShowForm(true);
  };

  const handleSaveDebt = () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!person.trim()) {
      setError('Please enter a name.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (editingDebtId) {
      updateDebtEntry(editingDebtId, person, numericAmount, note);
    } else {
      saveDebtEntry(formType, person, numericAmount, note);
    }
    setEditingDebtId(null);
    setShowForm(false);
    loadData();
  };

  const formatPeso = (value: number) => `₱ ${new Intl.NumberFormat('en-PH').format(value)}`;

  const runSettle = (id: number) => {
    settleDebtEntry(id);
    loadData();
  };

  const handleSettle = (id: number, type: 'iowe' | 'owed', personName: string, amountValue: number) => {
    const actionWord = type === 'iowe' ? 'mark as paid' : 'mark as collected';
    const impactText = type === 'iowe' ? `This will deduct ${formatPeso(amountValue)} from Cash.` : `This will add ${formatPeso(amountValue)} to Cash.`;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const firstOk = window.confirm(`Confirm ${actionWord} for ${personName}?`);
      if (!firstOk) return;
      const secondOk = window.confirm(`${impactText} Continue?`);
      if (!secondOk) return;
      runSettle(id);
      return;
    }

    Alert.alert(
      'Confirm settlement',
      `Do you want to ${actionWord} for ${personName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.alert(
              'Cash impact',
              impactText,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => runSettle(id) },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader userName={userName} fontFamily={font} peopleActive />

        <SquirlBanner
          compact
          fontFamily={font}
          userName={userName}
          mascot={require('@/assets/images/squirl/History.png')}
          mascotScale={1}
          mascotBottomOffset={-8}
          message="Let's track what you owe and what's owed to you."
        />

        <Text style={[styles.pageTitle, { fontFamily: font, color: colors.textPrimary }]}>Debts</Text>

        <View style={[styles.segmentedWrap, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.segmentedBtn, tab === 'all' && { backgroundColor: colors.teal }]} onPress={() => setTab('all')}>
            <Text style={[styles.segmentedText, { fontFamily: font, color: colors.textPrimary }, tab === 'all' && { color: '#FFFFFF' }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentedBtn, tab === 'iowe' && { backgroundColor: colors.teal }]} onPress={() => setTab('iowe')}>
            <Text style={[styles.segmentedText, { fontFamily: font, color: colors.textPrimary }, tab === 'iowe' && { color: '#FFFFFF' }]}>I Owe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentedBtn, tab === 'owed' && { backgroundColor: colors.teal }]} onPress={() => setTab('owed')}>
            <Text style={[styles.segmentedText, { fontFamily: font, color: colors.textPrimary }, tab === 'owed' && { color: '#FFFFFF' }]}>Owed to Me</Text>
          </TouchableOpacity>
        </View>

        {(tab === 'all' || tab === 'iowe') && (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>I Owe</Text>
              <Text style={[styles.sectionAmount, { fontFamily: font, color: colors.textPrimary }]}>{formatPeso(iOweTotal)}</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.expense }]} onPress={() => openAddForm('iowe')}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {iOweItems.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: colors.border }]}>
                <Image source={require('@/assets/images/squirl/Happy.png')} style={styles.emptyMascotLeft} resizeMode="contain" />
                <Text style={[styles.emptyMessage, { fontFamily: font, color: colors.textPrimary }]}>You owe nobody!{`\n`}Stay debt-free, keep it up.</Text>
              </View>
            ) : (
              <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                {iOweItems.map((item, index) => (
                  <View key={item.id} style={[styles.debtRow, index !== iOweItems.length - 1 && styles.debtDivider, { borderBottomColor: colors.border }]}>
                    <View style={styles.debtLeft}>
                      <Text style={[styles.debtName, { fontFamily: font, color: colors.textPrimary }]}>{item.person}</Text>
                      {!!item.note && <Text style={[styles.debtNote, { fontFamily: font, color: colors.textMuted }]}>{item.note}</Text>}
                    </View>
                    <View style={styles.debtRight}>
                      <Text style={[styles.debtAmountOut, { fontFamily: font, color: colors.expense }]}>- {formatPeso(item.amount)}</Text>
                      <View style={styles.debtActionsRow}>
                        <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]} onPress={() => openEditForm(item)}>
                          <Text style={[styles.editBtnText, { fontFamily: font, color: colors.textPrimary }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.paidBtn, { backgroundColor: colors.expense }]} onPress={() => handleSettle(item.id, 'iowe', item.person, item.amount)}>
                          <Text style={[styles.paidBtnText, { fontFamily: font }]}>Paid ✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {(tab === 'all' || tab === 'owed') && (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Owed to Me</Text>
              <Text style={[styles.sectionAmount, { fontFamily: font, color: colors.textPrimary }]}>{formatPeso(owedTotal)}</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.teal }]} onPress={() => openAddForm('owed')}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {owedItems.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: colors.border }]}>
                <Text style={[styles.emptyMessageLeft, { fontFamily: font, color: colors.textPrimary }]}>Nobody owes you.</Text>
                <Image source={require('@/assets/images/squirl/owedtome.png')} style={styles.emptyMascotCenter} resizeMode="contain" />
                <Text style={[styles.emptyMessageRight, { fontFamily: font, color: colors.textPrimary }]}>Add a record when{`\n`}you lend money.</Text>
              </View>
            ) : (
              <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                {owedItems.map((item, index) => (
                  <View key={item.id} style={[styles.debtRow, index !== owedItems.length - 1 && styles.debtDivider, { borderBottomColor: colors.border }]}>
                    <View style={styles.debtLeft}>
                      <Text style={[styles.debtName, { fontFamily: font, color: colors.textPrimary }]}>{item.person}</Text>
                      {!!item.note && <Text style={[styles.debtNote, { fontFamily: font, color: colors.textMuted }]}>{item.note}</Text>}
                    </View>
                    <View style={styles.debtRight}>
                      <Text style={[styles.debtAmountIn, { fontFamily: font, color: colors.teal }]}>+ {formatPeso(item.amount)}</Text>
                      <View style={styles.debtActionsRow}>
                        <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]} onPress={() => openEditForm(item)}>
                          <Text style={[styles.editBtnText, { fontFamily: font, color: colors.textPrimary }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.collectedBtn, { backgroundColor: colors.teal }]} onPress={() => handleSettle(item.id, 'owed', item.person, item.amount)}>
                          <Text style={[styles.collectedBtnText, { fontFamily: font }]}>Collected ✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.settledSectionHead}>
          <Text style={[styles.settledTitle, { fontFamily: font, color: colors.textPrimary }]}>Settled</Text>
          <TouchableOpacity style={[styles.settledToggleBtn, { borderColor: colors.border }]} onPress={() => setShowSettled((prev) => !prev)}>
            <Text style={[styles.settledToggleText, { fontFamily: font, color: colors.textPrimary }]}>{showSettled ? 'Hide' : 'Show'}</Text>
            <Ionicons name={showSettled ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {showSettled && (
          settledItems.length === 0 ? (
            <View style={[styles.settledEmptyCard, { borderColor: colors.border }]}>
              <Text style={[styles.settledEmptyText, { fontFamily: font, color: colors.textMuted }]}>No settled records yet.</Text>
            </View>
          ) : (
            <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {settledItems.map((item, index) => (
                <View key={`settled-${item.id}`} style={[styles.debtRow, index !== settledItems.length - 1 && styles.debtDivider, { borderBottomColor: colors.border }]}>
                  <View style={styles.debtLeft}>
                    <Text style={[styles.debtName, { fontFamily: font, color: colors.textPrimary }]}>{item.person}</Text>
                    <Text style={[styles.debtNote, { fontFamily: font, color: colors.textMuted }]}>
                      {item.type === 'iowe' ? 'Paid' : 'Collected'}{item.note ? ` · ${item.note}` : ''}
                    </Text>
                  </View>
                  <Text style={[item.type === 'iowe' ? styles.debtAmountOut : styles.debtAmountIn, styles.settledAmount, { fontFamily: font }, item.type === 'iowe' ? { color: colors.expense } : { color: colors.teal }]}>
                    {item.type === 'iowe' ? '-' : '+'} {formatPeso(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      <Modal transparent visible={showForm} animationType="fade" onRequestClose={() => setShowForm(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: font, color: colors.textPrimary }]}>{editingDebtId ? 'Edit debt' : formType === 'iowe' ? 'Add I Owe' : 'Add Owed to Me'}</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setEditingDebtId(null); }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { fontFamily: font, color: colors.textPrimary }]}>Person</Text>
            <TextInput
              value={person}
              onChangeText={setPerson}
              placeholder="Enter name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            />

            <Text style={[styles.inputLabel, { fontFamily: font, color: colors.textPrimary }]}>Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={[styles.input, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]}
            />

            <Text style={[styles.inputLabel, { fontFamily: font, color: colors.textPrimary }]}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Grocery share"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.noteInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]}
              multiline
            />

            {!!error && <Text style={[styles.errorText, { fontFamily: font, color: colors.expense }]}>{error}</Text>}

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: formType === 'iowe' ? colors.expense : colors.teal }]} onPress={handleSaveDebt}>
              <Text style={[styles.saveBtnText, { fontFamily: font }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 30 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: TEXT_DARK, marginBottom: 12 },

  segmentedWrap: {
    borderWidth: 1,
    borderColor: '#AEB3AE',
    borderRadius: 14,
    padding: 8,
    flexDirection: 'row',
    marginBottom: 14,
    gap: 6,
  },
  segmentedBtn: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  segmentedBtnActive: { backgroundColor: '#207A67' },
  segmentedText: { fontSize: 16, color: TEXT_DARK, fontWeight: '700' },
  segmentedTextActive: { color: '#FFFFFF' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 20, color: TEXT_DARK, fontWeight: '700', flex: 1, opacity: 0.5 },
  sectionAmount: { fontSize: 18, color: '#434343', fontWeight: '700' },
  addBtn: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  emptyCard: {
    borderWidth: 1,
    borderColor: '#BFC3BF',
    borderRadius: 14,
    minHeight: 156,
    padding: 12,
    paddingBottom: 0,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  emptyMascotLeft: { width: 142, height: 122, marginBottom: -4, zIndex: 1 },
  emptyMascotCenter: { width: 140, height: 118, marginHorizontal: 8, marginBottom: -3 },
  emptyMessage: { fontSize: 16, color: TEXT_DARK, lineHeight: 24, flex: 1, paddingLeft: 30, paddingBottom: 50 },
  emptyMessageLeft: { fontSize: 16, color: TEXT_DARK, lineHeight: 22, flex: 1, paddingBottom: 50 },
  emptyMessageRight: { fontSize: 16, color: TEXT_DARK, lineHeight: 22, flex: 1, textAlign: 'left', paddingBottom: 40 },

  listCard: {
    borderWidth: 1,
    borderColor: '#BFC3BF',
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  debtRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  debtLeft: { flex: 1 },
  debtDivider: { borderBottomWidth: 1, borderBottomColor: '#E3E6E3' },
  debtName: { fontSize: 16, color: TEXT_DARK, fontWeight: '700' },
  debtNote: { fontSize: 13, color: '#656565', marginTop: 2 },
  debtAmountOut: { fontSize: 16, color: RED, fontWeight: '700' },
  debtAmountIn: { fontSize: 16, color: TEAL, fontWeight: '700' },
  debtRight: { alignItems: 'flex-end', gap: 6 },
  debtActionsRow: { flexDirection: 'row', gap: 6 },
  editBtn: { borderWidth: 1, borderColor: '#A7B1AB', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  editBtnText: { color: '#3C4640', fontSize: 12, fontWeight: '700' },
  paidBtn: { backgroundColor: '#F36A6F', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999 },
  paidBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  collectedBtn: { backgroundColor: '#2FA084', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999 },
  collectedBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  settledSectionHead: {
    marginTop: 2,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settledTitle: { fontSize: 18, color: TEXT_DARK, fontWeight: '700' },
  settledToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#CBD0CC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  settledToggleText: { fontSize: 13, color: TEXT_DARK, fontWeight: '700' },
  settledEmptyCard: {
    borderWidth: 1,
    borderColor: '#BFC3BF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  settledEmptyText: { fontSize: 14, color: '#5C645E' },
  settledAmount: { opacity: 0.85 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CDD3CE',
    padding: 14,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: TEXT_DARK },
  inputLabel: { fontSize: 14, color: '#555C56', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#C5CAC6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 16,
    color: TEXT_DARK,
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  errorText: { color: RED, marginBottom: 10, fontSize: 13 },
  saveBtn: { borderRadius: 10, alignItems: 'center', paddingVertical: 11, marginTop: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
