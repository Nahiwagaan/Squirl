import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type DashboardHeaderProps = {
  userName: string;
  fontFamily: string;
  topPadding?: number;
  peopleActive?: boolean;
  settingsActive?: boolean;
};

export function DashboardHeader({ userName, fontFamily, topPadding = 50, peopleActive = false, settingsActive = false }: DashboardHeaderProps) {
  const { colors } = useTheme();
  const now = new Date();
  const currentHour = now.getHours();
  const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const dateText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <View>
        <Text style={[styles.dateText, { fontFamily, color: colors.textPrimary }]}>{dateText}</Text>
        <Text style={[styles.greetingText, { fontFamily, color: colors.textPrimary }]}>
          {greetingText}, <Text style={{ fontWeight: '700' }}>{userName}</Text>
        </Text>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: peopleActive ? '#5CC3AA' : colors.bgSecondary }]}
          onPress={() => router.push('/debts')}
          activeOpacity={0.8}
        >
          <Ionicons name="people" size={20} color={peopleActive ? '#0E3F35' : colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: settingsActive ? '#5CC3AA' : colors.bgSecondary }]}
          onPress={() => router.push('/settings')}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-sharp" size={20} color={settingsActive ? '#0E3F35' : colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingBottom: 20,
  },
  dateText:     { fontSize: 15, marginBottom: 4 },
  greetingText: { fontSize: 20 },
  headerIcons:  { flexDirection: 'row', gap: 8, marginRight: 16 },
  iconButton:   { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
