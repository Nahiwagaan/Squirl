import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TEXT_DARK = '#1A1A1A';

type DashboardHeaderProps = {
  userName: string;
  fontFamily: string;
  topPadding?: number;
  peopleActive?: boolean;
};

export function DashboardHeader({ userName, fontFamily, topPadding = 50, peopleActive = false }: DashboardHeaderProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const dateText = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <View>
        <Text style={[styles.dateText, { fontFamily }]}>{dateText}</Text>
        <Text style={[styles.greetingText, { fontFamily }]}>
          {greetingText}, <Text style={{ fontWeight: '700' }}>{userName}</Text>
        </Text>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={[styles.iconButton, peopleActive && styles.iconButtonActive]} onPress={() => router.push('/debts')} activeOpacity={0.8}>
          <Ionicons name="people" size={20} color={peopleActive ? '#0E3F35' : TEXT_DARK} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="settings-sharp" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  dateText: {
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 20,
    color: TEXT_DARK,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: '#EAEAEA',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#5CC3AA',
  },
});
