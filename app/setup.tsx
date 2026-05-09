import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
import { initDatabase, saveSalaryProfile } from '@/lib/database';

const InclusiveSans_400Regular = require('../node_modules/@expo-google-fonts/inclusive-sans/400Regular/InclusiveSans_400Regular.ttf');

const TEAL      = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const BG        = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#888888';
const BORDER    = '#D0D0D0';

type PayFrequency = 'Monthly' | 'Semi-mo' | 'Weekly';
type Deduction    = 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'Withholding tax';

const PAY_FREQUENCIES: PayFrequency[] = ['Monthly', 'Semi-mo', 'Weekly'];
const DEDUCTIONS: Deduction[]         = ['SSS', 'PhilHealth', 'Pag-IBIG', 'Withholding tax'];

export default function SetupPage() {
  const [salary, setSalary]           = useState('');
  const [frequency, setFrequency]     = useState<PayFrequency>('Monthly');
  const [deductions, setDeductions]   = useState<Deduction[]>([]);
  const [nextPayday, setNextPayday]   = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateInput, setWebDateInput] = useState('');

  const [fontsLoaded] = useFonts({ InclusiveSans_400Regular });

  useEffect(() => {
    initDatabase();
  }, []);

  if (!fontsLoaded) return null;

  const font = 'InclusiveSans_400Regular';

  const toggleDeduction = (d: Deduction) => {
    setDeductions((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleContinue = () => {
    const cleanedSalary = salary.replace(/,/g, '').trim();
    const amount = parseFloat(cleanedSalary);

    if (cleanedSalary === '') {
      saveSalaryProfile(null, frequency, deductions, null);
    } else if (!Number.isNaN(amount) && amount > 0) {
      saveSalaryProfile(
        amount,
        frequency,
        deductions,
        nextPayday ? nextPayday.toISOString() : null
      );
    }

    router.replace('/(tabs)');
  };

  const hasSalaryInput = salary.replace(/,/g, '').trim().length > 0;

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setNextPayday(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setWebDateInput(`${yyyy}-${mm}-${dd}`);
    }
  };

  const formatDateLabel = (date: Date | null) => {
    if (!date) return 'Select payday date';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: nextPayday ?? new Date(),
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
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    }

    setWebDateInput(formatted);

    const parts = formatted.split('-');
    if (parts.length !== 3 || parts[2].length !== 4) return;

    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
    if (!month || !day || !year) return;

    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) {
      setNextPayday(parsed);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

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

          {/* Gross Salary */}
          <Text style={[styles.label, { fontFamily: font }]}>MONTHLY GROSS SALARY</Text>
          <View style={styles.salaryInputWrapper}>
            <Text style={[styles.pesoSign, { fontFamily: font }]}>₱</Text>
            <TextInput
              style={[styles.salaryInput, { fontFamily: font }]}
              placeholder="e.g. 35,000"
              placeholderTextColor={TEXT_MUTED}
              value={salary}
              onChangeText={setSalary}
              keyboardType="numeric"
            />
          </View>

          {hasSalaryInput && (
            <>
              <Text style={[styles.label, { fontFamily: font }]}>PAYDAY DATE <Text style={[styles.labelOptional, { fontFamily: font }]}>(for reminder)</Text></Text>
              {Platform.OS === 'web' ? (
                <View style={styles.datePickerWrap}>
                  <View style={styles.webDateRow}>
                    <TextInput
                      style={[styles.salaryInput, { fontFamily: font }]}
                      placeholder="MM-DD-YYYY"
                      placeholderTextColor={TEXT_MUTED}
                      value={webDateInput}
                      onChangeText={handleWebDateChange}
                      autoCapitalize="none"
                      keyboardType="number-pad"
                    />
                    <Ionicons name="calendar-outline" size={18} color={TEXT_MUTED} />
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={openDatePicker}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dateButtonText, { fontFamily: font }, !nextPayday && styles.datePlaceholder]}>
                      {formatDateLabel(nextPayday)}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={TEXT_MUTED} />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <View style={styles.datePickerWrap}>
                      <DateTimePicker
                        value={nextPayday ?? new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        minimumDate={new Date()}
                        onChange={onDateChange}
                      />
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {/* Pay Frequency */}
          <Text style={[styles.label, { fontFamily: font }]}>PAY FREQUENCY</Text>
          <View style={styles.chipRow}>
            {PAY_FREQUENCIES.map((f) => {
              const selected = frequency === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqChip, selected && styles.freqChipSelected]}
                  onPress={() => setFrequency(f)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.freqChipText,
                      { fontFamily: font },
                      selected && styles.freqChipTextSelected,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Deductions */}
          <Text style={[styles.label, { fontFamily: font }]}>
            DEDUCTIONS{' '}
            <Text style={[styles.labelOptional, { fontFamily: font }]}>(optional)</Text>
          </Text>
          <View style={styles.deductionWrap}>
            {DEDUCTIONS.map((d) => {
              const selected = deductions.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.deductionChip, selected && styles.deductionChipSelected]}
                  onPress={() => toggleDeduction(d)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.deductionChipText,
                      { fontFamily: font },
                      selected && styles.deductionChipTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* ── Continue ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  /* Hero */
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

  /* Form */
  formContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: 1.1,
    marginTop: 20,
    marginBottom: 10,
  },
  labelOptional: {
    fontWeight: '400',
    letterSpacing: 0.5,
    color: TEXT_MUTED,
  },

  /* Salary Input */
  salaryInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pesoSign: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginRight: 6,
  },
  salaryInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    padding: 0,
  },
  dateButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  datePlaceholder: {
    color: TEXT_MUTED,
  },
  datePickerWrap: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: Platform.OS === 'ios' ? 6 : 0,
    paddingHorizontal: Platform.OS === 'ios' ? 6 : 0,
  },
  webDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* Pay Frequency Chips */
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  freqChipSelected: {
    backgroundColor: TEAL,
    borderColor: '#000000',
  },
  freqChipText: {
    fontSize: 14,
    color: TEXT_DARK,
  },
  freqChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Deduction Chips */
  deductionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deductionChip: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  deductionChipSelected: {
    backgroundColor: TEAL,
    borderColor: '#000000',
  },
  deductionChipText: {
    fontSize: 14,
    color: TEXT_DARK,
  },
  deductionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: BG,
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
