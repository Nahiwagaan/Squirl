import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { getUserProfile, UserProfile } from '@/lib/database';
import { useFonts } from 'expo-font';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Inter_400Regular = require('../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const BG = '#FFFFFF';
const TEAL = '#2FA084';
const RED = '#B20D18';
const TEXT_DARK = '#1A1A1A';

export default function DebtsScreen() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [tab, setTab] = React.useState<'all' | 'iowe' | 'owed'>('all');

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
        <DashboardHeader userName={userName} fontFamily={font} peopleActive />

        <SquirlBanner
          compact
          fontFamily={font}
          userName={userName}
          mascot={require('@/assets/images/squirl/History.png')}
          mascotScale={1.15}
          mascotBottomOffset={-8}
          message="Let’s track what you owe and what&apos;s owed to you."
        />

        <Text style={[styles.pageTitle, { fontFamily: font }]}>Debts</Text>

        <View style={styles.segmentedWrap}>
          <TouchableOpacity style={[styles.segmentedBtn, tab === 'all' && styles.segmentedBtnActive]} onPress={() => setTab('all')}>
            <Text style={[styles.segmentedText, { fontFamily: font }, tab === 'all' && styles.segmentedTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentedBtn, tab === 'iowe' && styles.segmentedBtnActive]} onPress={() => setTab('iowe')}>
            <Text style={[styles.segmentedText, { fontFamily: font }, tab === 'iowe' && styles.segmentedTextActive]}>I Owe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentedBtn, tab === 'owed' && styles.segmentedBtnActive]} onPress={() => setTab('owed')}>
            <Text style={[styles.segmentedText, { fontFamily: font }, tab === 'owed' && styles.segmentedTextActive]}>Owed to Me</Text>
          </TouchableOpacity>
        </View>

        {(tab === 'all' || tab === 'iowe') && (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font }]}>I Owe</Text>
              <Text style={[styles.sectionAmount, { fontFamily: font }]}>₱ 0</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: RED }]}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyCard}>
              <Image source={require('@/assets/images/squirl/Happy.png')} style={styles.emptyMascotLeft} resizeMode="contain" />
              <Text style={[styles.emptyMessage, { fontFamily: font }]}>You owe nobody!{'\n'}Stay debt-free, keep it up.</Text>
            </View>
          </>
        )}

        {(tab === 'all' || tab === 'owed') && (
          <>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { fontFamily: font }]}>Owed to Me</Text>
              <Text style={[styles.sectionAmount, { fontFamily: font }]}>₱ 0</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: TEAL }]}>
                <Text style={[styles.addBtnText, { fontFamily: font }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyMessageLeft, { fontFamily: font }]}>Nobody owes you.</Text>
              <Image source={require('@/assets/images/squirl/owedtome.png')} style={styles.emptyMascotCenter} resizeMode="contain" />
              <Text style={[styles.emptyMessageRight, { fontFamily: font }]}>Add a record when{'\n'}you lend money.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 30 },
  pageTitle: { fontSize: 40, fontWeight: '700', color: TEXT_DARK, marginBottom: 10 },

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
  sectionTitle: { fontSize: 20, color: TEXT_DARK, fontWeight: '700', flex: 1 },
  sectionAmount: { fontSize: 18, color: '#434343', fontWeight: '700' },
  addBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 4, marginLeft: 12 },
  addBtnText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },

  emptyCard: {
    borderWidth: 1,
    borderColor: '#BFC3BF',
    borderRadius: 14,
    minHeight: 156,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyMascotLeft: { width: 142, height: 122, marginRight: 10 },
  emptyMascotCenter: { width: 140, height: 118, marginHorizontal: 8 },
  emptyMessage: { fontSize: 16, color: TEXT_DARK, lineHeight: 24, flex: 1 },
  emptyMessageLeft: { fontSize: 16, color: TEXT_DARK, lineHeight: 22, flex: 1 },
  emptyMessageRight: { fontSize: 16, color: TEXT_DARK, lineHeight: 22, flex: 1, textAlign: 'left' },
});
