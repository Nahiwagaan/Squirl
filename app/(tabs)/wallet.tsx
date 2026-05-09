import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { getUserProfile, UserProfile } from '@/lib/database';
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
const TEAL = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const TEXT_DARK = '#1A1A1A';

type WalletCard = {
  name: string;
  subtitle: string;
  balance: string;
  colors: [string, string];
};

const E_WALLETS: WalletCard[] = [
  { name: 'GCash', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#1D7DE5', '#10A4EE'] },
  { name: 'MariBank', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#F4AA3A', '#FF8A00'] },
];

const BANK_ACCOUNTS: WalletCard[] = [
  { name: 'BPI', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#CC0F23', '#A70611'] },
  { name: 'Wise', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#15B79E', '#0EA388'] },
];

const CREDIT_CARDS: WalletCard[] = [
  { name: 'Eastwest', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#F2C186', '#EC9A52'] },
  { name: 'BDO', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#184DAA', '#3A78E0'] },
];

const LOANS: WalletCard[] = [
  { name: 'Home Credit', subtitle: 'Debit · PHP', balance: '₱ 15,500', colors: ['#873BC3', '#B56BD3'] },
];

const ALL_ACCOUNTS: WalletCard[] = [...E_WALLETS, ...BANK_ACCOUNTS, ...CREDIT_CARDS, ...LOANS];

export default function WalletScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  React.useEffect(() => {
    setProfile(getUserProfile());
  }, []);
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
          mascot={require('@/assets/images/squirl/Wallets.png')}
          message="Let’s manage your wallets/e-wallets"
        />

        <View style={styles.accountsHead}>
          <Text style={[styles.accountsTitle, { fontFamily: font }]}>Wallet</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={[styles.addButtonText, { fontFamily: font }]}>+ Add Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topCardsRow}>
          <View style={styles.totalBalanceCardSingle}>
            <Text style={[styles.topCardLabel, { fontFamily: font }]}>Net Worth</Text>
            <Text style={[styles.topCardValue, { fontFamily: font }]}>₱ 15,500</Text>
            <Text style={[styles.topCardSub, { fontFamily: font }]}>4 Accounts</Text>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { fontFamily: font }]}>Accounts</Text>
            <Text style={[styles.sectionTotal, { fontFamily: 'Inter_400Regular' }]}>₱ 108,500</Text>
          </View>
          <View style={styles.grid}>
            {ALL_ACCOUNTS.map((item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={[styles.walletCard, { backgroundColor: item.colors[0], borderColor: item.colors[1] }]}
              >
                <Text style={[styles.walletName, { fontFamily: font }]}>{item.name}</Text>
                <Text style={[styles.walletSub, { fontFamily: font }]}>{item.subtitle}</Text>
                <Text style={[styles.walletBalanceLabel, { fontFamily: font }]}>BALANCE</Text>
                <Text style={[styles.walletBalance, { fontFamily: font }]}>{item.balance}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 30 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 16,
  },
  dateText: { fontSize: 13, color: TEXT_DARK, marginBottom: 4 },
  greetingText: { fontSize: 18, color: TEXT_DARK },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconButton: {
    backgroundColor: '#EAEAEA',
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContainer: { position: 'relative', height: 152, marginBottom: 12 },
  bannerBackground: {
    position: 'absolute',
    bottom: 0,
    left: -14,
    right: -14,
    height: 108,
    backgroundColor: TEAL_DARK,
  },
  bannerMascot: { position: 'absolute', left: 0, bottom: -10, width: 126, height: 136, zIndex: 2 },
  bannerBubbleWrap: {
    position: 'absolute',
    right: 6,
    top: 40,
    left: 122,
    flexDirection: 'row',
    alignItems: 'center',
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
  bannerBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bannerBubbleTitle: { fontSize: 18, fontWeight: '700', color: TEAL, marginBottom: 2 },
  bannerBubbleText: { fontSize: 13, color: TEXT_DARK, lineHeight: 18 },

  accountsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  accountsTitle: { fontSize: 24, fontWeight: '700', color: TEXT_DARK },
  addButton: { backgroundColor: '#8AD6AE', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  addButtonText: { fontSize: 12, color: '#155B3A', fontWeight: '700' },

  topCardsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  totalBalanceCardSingle: {
    backgroundColor: TEAL,
    borderRadius: 12,
    padding: 10,
    width: '100%',
  },
  topCardLabel: { fontSize: 11, color: '#DFF6EE' },
  topCardValue: { fontSize: 22, color: '#FFFFFF', fontWeight: '700', marginTop: 6 },
  topCardSub: { fontSize: 11, color: '#DFF6EE', marginTop: 10 },
  sectionWrap: { marginBottom: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, color: 'rgba(26, 26, 26, 0.5)', fontWeight: '700' },
  sectionTotal: { fontSize: 18, color: 'rgba(58, 58, 58, 0.5)', fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  walletCard: {
    width: '48.9%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 114,
  },
  walletName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  walletSub: { color: '#FFFFFF', fontSize: 10, marginTop: 2 },
  walletBalanceLabel: { color: '#FFFFFF', fontSize: 10, marginTop: 26 },
  walletBalance: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', marginTop: 2 },
});
