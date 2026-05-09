import { initDatabase, saveBasicProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
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
const InclusiveSans_400Regular = require('../node_modules/@expo-google-fonts/inclusive-sans/400Regular/InclusiveSans_400Regular.ttf');

const TEAL = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#888888';
const BORDER = '#D0D0D0';

export default function FirstPage() {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'English' | 'Tagalog'>('English');
  const [incomeType, setIncomeType] = useState<'Compensation' | 'Self-employed'>('Compensation');

  const [fontsLoaded] = useFonts({ InclusiveSans_400Regular });

  useEffect(() => {
    initDatabase();
  }, []);

  if (!fontsLoaded) return null;

  const font = 'InclusiveSans_400Regular';

  const handleContinue = () => {
    if (!name.trim()) return;
    saveBasicProfile(name.trim(), language, incomeType);
    router.push('/setup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.heroContainer}>
          <Image
            source={require('@/assets/images/squirl/Hi.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
          <View style={styles.titleBadge}>
            <Text style={[styles.titleText, { fontFamily: font }]}>Squirl</Text>
          </View>
          <Text style={[styles.subtitle, { fontFamily: font }]}>
            Your personal budget tracker
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.formContainer}>

          {/* Name */}
          <Text style={[styles.label, { fontFamily: font }]}>YOUR NAME</Text>
          <TextInput
            style={[styles.input, { fontFamily: font }]}
            placeholder="e.g. Squirl, John, Paul"
            placeholderTextColor={TEXT_MUTED}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {/* Language */}
          <Text style={[styles.label, { fontFamily: font }]}>LANGUAGE</Text>

          {(['English', 'Tagalog'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.optionRow, language === lang && styles.optionRowSelected]}
              onPress={() => setLanguage(lang)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, { fontFamily: font }]}>{lang}</Text>
              {language === lang && (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={18} color="#000000" style={{ fontWeight: '900' }} />
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Income Type */}
          <Text style={[styles.label, { fontFamily: font }]}>INCOME TYPE</Text>

          <TouchableOpacity
            style={[styles.incomeCard, incomeType === 'Compensation' && styles.incomeCardSelected]}
            onPress={() => setIncomeType('Compensation')}
            activeOpacity={0.8}
          >
            <Text style={[styles.incomeTitle, { fontFamily: font }, incomeType === 'Compensation' && styles.incomeTitleSelected]}>
              Compensation
            </Text>
            <Text style={[styles.incomeDesc, { fontFamily: font }, incomeType === 'Compensation' && styles.incomeDescSelected]}>
              Monthly salary with payroll deductions.
            </Text>
          </TouchableOpacity>

          <View style={styles.incomeCard}>
            <View style={styles.incomeCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.incomeTitle, { fontFamily: font }]}>
                  Self-employed
                </Text>
                <Text style={[styles.incomeDesc, { fontFamily: font }]}>
                  Graduated rates on taxable net income.
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={[styles.comingSoonText, { fontFamily: font }]}>Coming Soon!</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Continue — pinned to bottom ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={[styles.continueText, { fontFamily: font }]}>Continue</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 16,
  },

  /* ── Hero ── */
  heroContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 18,
  },
  mascot: {
    width: 110,
    height: 110,
    marginBottom: -55,
    zIndex: 1,
  },
  titleBadge: {
    backgroundColor: TEAL,
    borderRadius: 14,
    marginTop: 50,
    paddingHorizontal: 44,
    paddingVertical: 8,
  },
  titleText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    color: TEXT_MUTED,
  },

  /* ── Form ── */
  formContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: 1.1,
    marginTop: 18,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: TEXT_DARK,
  },

  /* Language */
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 8,
  },
  optionRowSelected: {
    borderColor: TEAL,
  },
  optionText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  checkMark: {
    // This style is now handled by the icon props
  },

  /* Income Cards */
  incomeCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  incomeCardSelected: {
    backgroundColor: TEAL,
    borderWidth: 1,
    borderColor: '#000000',
  },
  incomeCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  incomeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  incomeTitleSelected: {
    color: '#FFFFFF',
  },
  incomeDesc: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  incomeDescSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  comingSoonBadge: {
    borderWidth: 1,
    borderColor: '#E87A30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    fontSize: 11,
    color: '#E87A30',
    fontWeight: '600',
  },

  /* ── Footer / Continue ── */
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: BG,
    borderTopWidth: 0,
  },
  continueButton: {
    backgroundColor: TEAL_DARK,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
