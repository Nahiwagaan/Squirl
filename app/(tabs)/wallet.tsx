import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { getUserProfile, UserProfile, getAccountBalances, getWalletAccounts, addWalletAccount, updateWalletAccount, deleteWalletAccount } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
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
  Image,
  Modal,
  FlatList,
  Alert,
  TextInput,
  Platform,
} from 'react-native';

const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const BG = '#FFFFFF';
const TEAL = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const TEXT_DARK = '#1A1A1A';

type WalletCard = {
  name: string;
  subtitle: string;
  balance: string;
  colors: [string, string];
  image?: any;
};

const CASH_ON_HAND: WalletCard = {
  name: 'Cash',
  subtitle: 'Cash · PHP',
  balance: '₱ 0.00',
  colors: ['#5E6861', '#414943'],
};

const ALL_BANK_OPTIONS: WalletCard[] = [
  { name: 'BDO',           subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#0033A0', '#1565C0'], image: require('@/assets/images/banks/BDO.jpg') },
  { name: 'BPI',           subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#B22222', '#C0392B'], image: require('@/assets/images/banks/bpi.png') },
  { name: 'GCash',         subtitle: 'E-Wallet · PHP',     balance: '₱ 0.00', colors: ['#007DFE', '#0057D9'], image: require('@/assets/images/banks/gcash.jpg') },
  { name: 'Maya',          subtitle: 'E-Wallet · PHP',     balance: '₱ 0.00', colors: ['#2B2B2B', '#111111'], image: require('@/assets/images/banks/maya.jpg') },
  { name: 'GoTyme',        subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#00C2E0', '#0099BB'], image: require('@/assets/images/banks/gotyme.jpg') },
  { name: 'Metrobank',     subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#003366', '#001F44'], image: require('@/assets/images/banks/metrobank.jpg') },
  { name: 'UnionBank',     subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#003087', '#001B55'], image: require('@/assets/images/banks/unionbank.webp') },
  { name: 'Security Bank', subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#CC0000', '#990000'], image: require('@/assets/images/banks/securitybank.webp') },
  { name: 'Landbank',      subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#006633', '#004422'], image: require('@/assets/images/banks/landbank.webp') },
  { name: 'PNB',           subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#8B0000', '#600000'], image: require('@/assets/images/banks/PNB.png') },
  { name: 'RCBC',          subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#006B3C', '#004827'], image: require('@/assets/images/banks/RCBC.webp') },
  { name: 'EastWest',      subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#E87722', '#C05A10'], image: require('@/assets/images/banks/eastwest.png') },
  { name: 'Chinabank',     subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#C8102E', '#950B20'], image: require('@/assets/images/banks/chinabank.jpg') },
  { name: 'AUB',           subtitle: 'Bank Account · PHP', balance: '₱ 0.00', colors: ['#1A237E', '#0D1560'], image: require('@/assets/images/banks/AUB.png') },
  { name: 'Coins.ph',      subtitle: 'E-Wallet · PHP',     balance: '₱ 0.00', colors: ['#00B14F', '#007A35'], image: require('@/assets/images/banks/coinsph.jpg') },
  { name: 'SeaBank',       subtitle: 'E-Wallet · PHP',     balance: '₱ 0.00', colors: ['#EE3224', '#C0200F'], image: require('@/assets/images/banks/seabank.jpg') },
  { name: 'MariBank',      subtitle: 'E-Wallet · PHP',     balance: '₱ 0.00', colors: ['#7B2FBE', '#5A1E8E'], image: require('@/assets/images/banks/maribank.png') },
  { name: 'Wise',          subtitle: 'E-Wallet · PHP',     balance: '₱ 0.00', colors: ['#163300', '#0A1C00'], image: require('@/assets/images/banks/wise.png') },
];

export default function WalletScreen() {
  const { colors } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [balances, setBalances] = React.useState<Record<string, number>>({});
  const [addedAccounts, setAddedAccounts] = React.useState<WalletCard[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<WalletCard | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  
  // Custom Account State
  const [isAddingCustom, setIsAddingCustom] = React.useState(false);
  const [customAccountName, setCustomAccountName] = React.useState('');

  const loadData = React.useCallback(() => {
    setProfile(getUserProfile());
    setBalances(getAccountBalances());

    const storedAccounts = getWalletAccounts();
    const mapped = storedAccounts.map((acc) => {
      const existing = ALL_BANK_OPTIONS.find((opt) => opt.name.toLowerCase() === acc.name.toLowerCase());
      if (existing) return existing;
      return {
        name: acc.name,
        subtitle: `${acc.currency} Account · ${acc.currency}`,
        balance: '₱ 0.00',
        colors: ['#5E6861', '#414943'] as [string, string],
      };
    });
    mapped.sort((a, b) => {
      if (a.name === 'Cash') return -1;
      if (b.name === 'Cash') return 1;
      return a.name.localeCompare(b.name);
    });
    setAddedAccounts(mapped.length ? mapped : [CASH_ON_HAND]);
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(
    React.useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      loadData();
    }, [loadData])
  );

  if (!fontsLoaded) return null;
  const font = 'Inter_400Regular';
  const userName = profile?.name || 'USER';

  const totalBalance = addedAccounts.reduce((sum, item) => sum + (balances[item.name] || 0), 0);
  const formattedTotal = `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBalance)}`;

  const availableBanks = ALL_BANK_OPTIONS.filter(
    (bank) => !addedAccounts.some((a) => a.name.toLowerCase() === bank.name.toLowerCase())
  );

  const handleAddAccount = (bankName: string) => {
    addWalletAccount(bankName, 'PHP');
    loadData();
    setShowAddModal(false);
    setIsAddingCustom(false);
    setCustomAccountName('');
  };

  const handleCardPress = (item: WalletCard) => {
    setSelectedAccount(item);
    setEditName(item.name);
    setShowEditModal(true);
  };

  const handleDeleteAccount = () => {
    if (!selectedAccount) return;
    if (selectedAccount.name === 'Cash') {
      Alert.alert('Cannot Delete', 'Cash is your default account and cannot be removed.');
      return;
    }
    
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove ${selectedAccount.name}?`)) {
        deleteWalletAccount(selectedAccount.name);
        loadData();
        setShowEditModal(false);
      }
    } else {
      Alert.alert(
        'Remove Account',
        `Are you sure you want to remove ${selectedAccount.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => {
              deleteWalletAccount(selectedAccount.name);
              loadData();
              setShowEditModal(false);
            }
          }
        ]
      );
    }
  };

  const handleSaveEdit = () => {
    if (!selectedAccount || !editName.trim()) return;
    if (editName.trim() !== selectedAccount.name) {
      updateWalletAccount(selectedAccount.name, editName.trim());
      loadData();
    }
    setShowEditModal(false);
  };
  
  const closeAddModal = () => {
    setShowAddModal(false);
    setIsAddingCustom(false);
    setCustomAccountName('');
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
          mascot={require('@/assets/images/squirl/Wallets.png')}
          message="Let's manage your wallets/e-wallets"
        />

        <View style={styles.accountsHead}>
          <Text style={[styles.accountsTitle, { fontFamily: font, color: colors.textPrimary }]}>Wallet</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tealLight }]} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={14} color={colors.teal} />
            <Text style={[styles.addButtonText, { fontFamily: font, color: colors.teal }]}> Add Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topCardsRow}>
          <View style={[styles.totalBalanceCardSingle, { backgroundColor: colors.teal }]}>
            <Text style={[styles.topCardLabel, { fontFamily: font }]}>Net Worth</Text>
            <Text style={[styles.topCardValue, { fontFamily: font }]}>{formattedTotal}</Text>
            <Text style={[styles.topCardSub, { fontFamily: font }]}>{addedAccounts.length} Account{addedAccounts.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textMuted }]}>Accounts</Text>
            <Text style={[styles.sectionTotal, { fontFamily: font, color: colors.textMuted }]}>{formattedTotal}</Text>
          </View>
          <View style={styles.grid}>
            {addedAccounts.map((item, index) => {
              const acctBalance = balances[item.name] || 0;
              const formattedBal = `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(acctBalance)}`;
              return (
                <TouchableOpacity
                  key={`${item.name}-${index}`}
                  onPress={() => {
                    if (item.name !== 'Cash') {
                      handleCardPress(item);
                    }
                  }}
                  activeOpacity={0.85}
                  disabled={item.name === 'Cash'}
                  style={{ width: '48.9%' }}
                >
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.walletCard, { borderColor: item.colors[1], width: '100%' }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.walletName, { fontFamily: font }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.walletSub, { fontFamily: font }]}>{item.subtitle}</Text>
                      </View>
                      {item.image ? (
                        <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFF' }}>
                          <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </View>
                      ) : (
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end', marginTop: 16 }}>
                      <Text style={[styles.walletBalanceLabel, { fontFamily: font }]}>BALANCE</Text>
                      <Text style={[styles.walletBalance, { fontFamily: font }]}>{formattedBal}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Edit Account Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, marginRight: 12 }}>
                {selectedAccount?.image ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden' }}>
                      <Image source={selectedAccount.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                    <Text style={[styles.sheetTitle, { fontFamily: font, color: colors.textPrimary }]}>{selectedAccount?.name}</Text>
                  </View>
                ) : (
                  <Text style={[styles.sheetTitle, { fontFamily: font, color: colors.textPrimary }]}>{selectedAccount?.name}</Text>
                )}
                <Text style={[styles.sheetSubtitle, { fontFamily: font, color: colors.textMuted }]}>{selectedAccount?.subtitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedAccount && selectedAccount.name !== 'Cash' && !ALL_BANK_OPTIONS.some(b => b.name === selectedAccount.name) && (
              <>
                <Text style={[styles.editLabel, { fontFamily: font, color: colors.textPrimary }]}>ACCOUNT NICKNAME</Text>
                <TextInput
                  style={[styles.editInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter account name"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />

                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.tealBg }]} onPress={handleSaveEdit} activeOpacity={0.85}>
                  <Text style={[styles.saveBtnText, { fontFamily: font }]}>Save Changes</Text>
                </TouchableOpacity>
              </>
            )}

            {selectedAccount?.name !== 'Cash' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
                <Ionicons name="trash-outline" size={16} color="#C0392B" />
                <Text style={[styles.deleteBtnText, { fontFamily: font }]}>Remove Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Account Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Handle bar */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {isAddingCustom ? (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={[styles.sheetTitle, { fontFamily: font, color: colors.textPrimary }]}>Add Custom Account</Text>
                    <Text style={[styles.sheetSubtitle, { fontFamily: font, color: colors.textMuted }]}>Enter the name of your account</Text>
                  </View>
                  <TouchableOpacity onPress={closeAddModal} style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.editLabel, { fontFamily: font, color: colors.textPrimary }]}>ACCOUNT NAME</Text>
                <TextInput
                  style={[styles.editInput, { fontFamily: font, color: colors.textPrimary, borderColor: colors.inputBorder }]}
                  value={customAccountName}
                  onChangeText={setCustomAccountName}
                  placeholder="e.g. My Savings"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />

                <TouchableOpacity 
                  style={[styles.saveBtn, { marginBottom: 10, backgroundColor: colors.tealBg }]} 
                  onPress={() => {
                    if (customAccountName.trim()) {
                      handleAddAccount(customAccountName);
                    }
                  }} 
                  activeOpacity={0.85}
                >
                  <Text style={[styles.saveBtnText, { fontFamily: font }]}>Add Account</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setIsAddingCustom(false)} activeOpacity={0.85}>
                  <Text style={[styles.deleteBtnText, { fontFamily: font, color: colors.textMuted }]}>Back to List</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={[styles.sheetTitle, { fontFamily: font, color: colors.textPrimary }]}>Add Account</Text>
                    <Text style={[styles.sheetSubtitle, { fontFamily: font, color: colors.textMuted }]}>Choose a bank or e-wallet to add</Text>
                  </View>
                  <TouchableOpacity onPress={closeAddModal} style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={availableBanks}
                  keyExtractor={(item) => item.name}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  ListHeaderComponent={() => (
                    <TouchableOpacity style={styles.bankRow} onPress={() => setIsAddingCustom(true)} activeOpacity={0.7}>
                      <View style={[styles.bankLogoWrap, { backgroundColor: colors.bgSecondary }]}>
                        <Ionicons name="add" size={24} color={colors.textPrimary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.bankName, { fontFamily: font, color: colors.textPrimary }]}>Add Custom Account</Text>
                        <Text style={[styles.bankSub, { fontFamily: font, color: colors.textMuted }]}>Create your own account</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.bankRow} onPress={() => handleAddAccount(item.name)} activeOpacity={0.7}>
                      <LinearGradient
                        colors={item.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bankLogoWrap}
                      >
                        {item.image ? (
                          <Image source={item.image} style={styles.bankLogo} resizeMode="cover" />
                        ) : (
                          <Ionicons name="card-outline" size={18} color="#FFF" />
                        )}
                      </LinearGradient>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.bankName, { fontFamily: font, color: colors.textPrimary }]}>{item.name}</Text>
                        <Text style={[styles.bankSub, { fontFamily: font, color: colors.textMuted }]}>{item.subtitle}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color={colors.teal} />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                />
              </>
            )}
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

  accountsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  accountsTitle: { fontSize: 24, fontWeight: '700', color: TEXT_DARK },
  addButton: { backgroundColor: '#8AD6AE', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  addButtonText: { fontSize: 12, color: '#155B3A', fontWeight: '700' },

  topCardsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  totalBalanceCardSingle: { backgroundColor: TEAL, borderRadius: 12, padding: 10, width: '100%' },
  topCardLabel: { fontSize: 11, color: '#DFF6EE' },
  topCardValue: { fontSize: 22, color: '#FFFFFF', fontWeight: '700', marginTop: 6 },
  topCardSub: { fontSize: 11, color: '#DFF6EE', marginTop: 10 },

  sectionWrap: { marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, color: 'rgba(26, 26, 26, 0.5)', fontWeight: '700' },
  sectionTotal: { fontSize: 18, color: 'rgba(58, 58, 58, 0.5)', fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  walletCard: { width: '48.9%', borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 10, minHeight: 114 },
  walletName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  walletSub: { color: '#FFFFFF', fontSize: 10, marginTop: 2, opacity: 0.8 },
  walletBalanceLabel: { color: '#FFFFFF', fontSize: 10, opacity: 0.8 },
  walletBalance: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', marginTop: 2 },

  /* Edit modal */
  editLabel: { fontSize: 11, fontWeight: '700', color: TEXT_DARK, letterSpacing: 1.1, marginBottom: 8 },
  editInput: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: TEAL_DARK,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  deleteBtnText: { color: '#C0392B', fontSize: 15, fontWeight: '700' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: TEXT_DARK },
  sheetSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  closeBtn: { backgroundColor: '#EFEFEF', borderRadius: 999, padding: 6 },

  bankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  bankLogoWrap: { width: 46, height: 46, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  bankLogo: { width: '100%', height: '100%' },
  bankName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  bankSub: { fontSize: 12, color: '#888', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#F0F0F0' },
});
