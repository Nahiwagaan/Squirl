import { DashboardHeader } from '@/components/dashboard-header';
import { SquirlBanner } from '@/components/squirl-banner';
import { clearFinancialData, getUserProfile, getWalletAccounts, resetAppData, saveBasicProfile, UserProfile } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Image, Linking, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const Inter_400Regular = require('../../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

const BG = '#FFFFFF';
const TEAL_DARK = '#1F7D69';
const TEXT_DARK = '#1A1A1A';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [accountCount, setAccountCount] = React.useState(1);
  const [budgetAlerts, setBudgetAlerts] = React.useState(false);
  const [billReminders, setBillReminders] = React.useState(true);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [isAboutVisible, setIsAboutVisible] = React.useState(false);

  const loadData = React.useCallback(() => {
    setProfile(getUserProfile());
    setAccountCount(getWalletAccounts().length || 1);
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

  const confirmDangerAction = (title: string, message: string, secondMessage: string, onConfirm: () => void) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (!window.confirm(message)) return;
      if (!window.confirm(secondMessage)) return;
      onConfirm();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Final confirmation', secondMessage, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', style: 'destructive', onPress: onConfirm },
          ]);
        },
      },
    ]);
  };

  const handleClearData = () => {
    confirmDangerAction(
      'Clear all data',
      'This will delete transactions, debts, and custom accounts. Your profile will stay.',
      'Are you sure? This cannot be undone.',
      () => {
        clearFinancialData();
        loadData();
      }
    );
  };

  const handleResetApp = () => {
    confirmDangerAction(
      'Reset app',
      'This will wipe your profile and all financial records.',
      'Final warning: reset Squirl and start fresh?',
      () => {
        resetAppData();
        router.dismissAll();
        router.replace('/');
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader userName={userName} fontFamily={font} settingsActive />

        <SquirlBanner
          fontFamily={font}
          userName={userName}
          message="Welcome to your settings! Here you can manage your profile, preferences, and notifications."
          mascot={require('@/assets/images/squirl/settings.png')}
          compact={true}
        />

        <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Preferences</Text>
        <ActionRow icon="person-outline" iconBg="#79C8B7" title="Change Name" fontFamily={font} onPress={() => { setNewName(userName); setIsEditingName(true); }} />
        <SettingsRow icon="calendar-outline" iconBg="#6DD3F6" title="Budget Period" value="Monthly" fontFamily={font} />
        <SwitchRow icon="sunny-outline" iconBg="#FFD08A" title="Dark Mode" subtitle="Switch between light and dark" value={isDark} onValueChange={toggleTheme} fontFamily={font} />
        <SettingsRow icon="language-outline" iconBg="#C779F2" title="Language" value="English" fontFamily={font} />

        <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Notifications</Text>
        <SwitchRow icon="alert-circle" iconBg="#FFB5B5" title="Budget Alerts" subtitle="Warn when nearing or over budget" value={budgetAlerts} onValueChange={setBudgetAlerts} fontFamily={font} />
        <SwitchRow icon="calendar-outline" iconBg="#6DD3F6" title="Bill Reminders" subtitle="Notify before a bill is due" value={billReminders} onValueChange={setBillReminders} fontFamily={font} />
        <SettingsRow icon="sunny-outline" iconBg="#FFD08A" title="Remind Me" subtitle="How early to notify before due dates" value="3 days before" fontFamily={font} />

        <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>About</Text>
        <ActionRow imageIcon={require('@/assets/images/logo.png')} title="About Squirl" subtitle="Version 1.0.0" fontFamily={font} onPress={() => setIsAboutVisible(true)} />

        <Text style={[styles.sectionTitle, { fontFamily: font, color: colors.textPrimary }]}>Danger Zone</Text>
        <ActionRow icon="trash" iconBg="#FF666D" title="Clear All Data" subtitle="Delete transactions, debts, and custom accounts" fontFamily={font} onPress={handleClearData} />
        <ActionRow icon="refresh" iconBg="#FF666D" title="Reset App" subtitle="Wipe everything and start fresh" fontFamily={font} onPress={handleResetApp} />
      </ScrollView>

      <Modal transparent visible={isEditingName} animationType="fade" onRequestClose={() => setIsEditingName(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: font, color: colors.textPrimary }]}>Edit Name</Text>
              <TouchableOpacity onPress={() => setIsEditingName(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabel, { fontFamily: font, color: colors.textMuted }]}>Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { fontFamily: font, color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              if (newName.trim()) {
                saveBasicProfile(newName.trim(), profile?.language || 'English', profile?.income_type || 'Salaried');
                loadData();
                setIsEditingName(false);
              }
            }}>
              <Text style={[styles.saveBtnText, { fontFamily: font }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={isAboutVisible} animationType="slide" onRequestClose={() => setIsAboutVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { paddingVertical: 16, maxHeight: '85%', backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: font, color: colors.textPrimary }]}>About Squirl</Text>
              <TouchableOpacity onPress={() => setIsAboutVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={{ width: 72, height: 72, alignSelf: 'center', marginTop: 10, marginBottom: 8, borderRadius: 16 }}
                resizeMode="contain"
              />

              <Text style={{ fontSize: 24, fontWeight: '900', color: colors.teal, textAlign: 'center', fontFamily: font }}>Squirl</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 14, fontFamily: font }}>Version 1.0.0</Text>

              <Text style={{ fontSize: 14, color: colors.textPrimary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 6, marginBottom: 16, fontFamily: font }}>
                Squirl helps you track bills, manage expenses, and plan smarter savings.
              </Text>

              <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 14 }} />

              {/* Created By Section */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 8, fontFamily: font }}>CREATED BY</Text>
              <View style={{ backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: font }}>Jet Padilla</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: font }}>Bachelor of Science in Computer Science (2026)</Text>

                <View style={{ flexDirection: 'row', backgroundColor: colors.border, height: 1, marginVertical: 8 }} />

                <TouchableOpacity onPress={() => Linking.openURL('mailto:jetpadilla07@gmail.com')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="mail-outline" size={13} color={colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline', fontFamily: font }}>jetpadilla07@gmail.com</Text>
                </TouchableOpacity>
              </View>

              {/* Public/Project Links Section */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 8, fontFamily: font }}>PROJECT INFO & LINKS</Text>
              <View style={{ backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 12 }}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: font }}>GitHub</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://github.com/Nahiwagaan')}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.teal, textDecorationLine: 'underline', fontFamily: font }}>https://github.com/Nahiwagaan</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: font }}>LinkedIn</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/jet-padilla/')}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.teal, textDecorationLine: 'underline', fontFamily: font }}>https://www.linkedin.com/in/jet-padilla/</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: colors.textPrimary, fontFamily: font }}>Website</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://squirlapp.dev')}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.teal, textDecorationLine: 'underline', fontFamily: font }}>squirlapp.dev</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, { marginTop: 12, backgroundColor: colors.tealBg }]} onPress={() => setIsAboutVisible(false)}>
              <Text style={[styles.saveBtnText, { fontFamily: font }]}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, iconBg, title, subtitle, value, fontFamily }: { icon: keyof typeof Ionicons.glyphMap; iconBg: string; title: string; subtitle?: string; value: string; fontFamily: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color="#121A16" />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { fontFamily, color: colors.textPrimary }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSubtitle, { fontFamily, color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Text style={[styles.rowValue, { fontFamily, color: colors.textMuted }]}>{value}</Text>
    </View>
  );
}

function SwitchRow({ icon, iconBg, title, subtitle, value, onValueChange, fontFamily }: { icon: keyof typeof Ionicons.glyphMap; iconBg: string; title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void; fontFamily: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color="#121A16" />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitleSmall, { fontFamily, color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { fontFamily, color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#D2D2D2', true: '#79C8B7' }} thumbColor={value ? '#1F7D69' : '#FFFFFF'} />
    </View>
  );
}

function ActionRow({ icon, iconBg, imageIcon, title, subtitle, fontFamily, onPress }: { icon?: keyof typeof Ionicons.glyphMap; iconBg?: string; imageIcon?: any; title: string; subtitle?: string; fontFamily: string; onPress?: () => void; }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} activeOpacity={0.82} onPress={onPress} disabled={!onPress}>
      {imageIcon ? (
        <Image source={imageIcon} style={styles.rowImage} resizeMode="contain" />
      ) : (
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          {icon && <Ionicons name={icon} size={17} color="#121A16" />}
        </View>
      )}
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitleSmall, { fontFamily, color: colors.textPrimary }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.rowSubtitle, { fontFamily, color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 30 },
  sectionTitle: { color: TEXT_DARK, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  rowCard: {
    borderWidth: 1,
    borderColor: '#C8CCC8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  rowIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: TEXT_DARK, fontSize: 18 },
  rowTitleSmall: { color: TEXT_DARK, fontSize: 14, fontWeight: '700' },
  rowSubtitle: { color: '#6F7771', fontSize: 10, marginTop: 1 },
  rowValue: { color: '#858585', fontSize: 16 },
  rowImage: { width: 28, height: 28, borderRadius: 7, marginRight: 12 },
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
  saveBtn: { borderRadius: 10, alignItems: 'center', paddingVertical: 11, marginTop: 4, backgroundColor: TEAL_DARK },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
