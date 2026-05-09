import { router, Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { View, StyleSheet, Platform, Modal, Pressable, Text, TouchableOpacity } from 'react-native';

const TEAL = '#2FA084';
const BG = '#FFFFFF';
const TEXT_DARK = '#1A1A1A';

export default function TabLayout() {
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);

  const quickAddOptions = [
    {
      key: 'quick-chat',
      title: 'Quick chat',
      description: 'Enter a quick transaction.',
      icon: 'chatbubble-outline' as const,
      color: '#E56D1F',
    },
    {
      key: 'transfer',
      title: 'Transfer',
      description: 'Move money between debit accounts.',
      icon: 'swap-horizontal-outline' as const,
      color: '#4D8A61',
    },
    {
      key: 'income',
      title: 'Income',
      description: 'Record new money coming in.',
      icon: 'arrow-down-outline' as const,
      color: '#2D8A54',
    },
    {
      key: 'expense',
      title: 'Expense',
      description: 'Log spending from a wallet or card.',
      icon: 'arrow-up-outline' as const,
      color: '#D25A42',
    },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: TEXT_DARK,
          tabBarInactiveTintColor: '#888888',
          tabBarStyle: {
            backgroundColor: BG,
            borderTopWidth: 1,
            borderColor: '#D0D0D0',
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsQuickAddOpen(true);
            },
          }}
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={styles.addButton}>
                <Ionicons name="add" size={32} color="#000000" />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plan',
            tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} />,
          }}
        />
      </Tabs>

      <Modal
        animationType="fade"
        transparent
        visible={isQuickAddOpen}
        onRequestClose={() => setIsQuickAddOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsQuickAddOpen(false)}>
          <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />
          <Pressable style={styles.popupCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.popupHeader}>Quick Actions</Text>
            {quickAddOptions.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.popupRow, index !== quickAddOptions.length - 1 && styles.popupDivider]}
                activeOpacity={0.8}
                onPress={() => {
                  setIsQuickAddOpen(false);
                  if (item.key === 'income') {
                    router.push('/income');
                  } else if (item.key === 'transfer') {
                    router.push('/transfer');
                  } else if (item.key === 'expense') {
                    router.push('/expense');
                  }
                }}
              >
                <View style={[styles.popupAccent, { backgroundColor: item.color }]} />
                <View style={styles.popupIconWrap}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.popupTextWrap}>
                  <Text style={styles.popupTitle}>{item.title}</Text>
                  <Text style={styles.popupDesc}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9AA09B" />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: TEAL,
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24, // Elevates the button slightly above the tab bar
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 6,
    paddingBottom: 90,
    backgroundColor: 'rgba(20, 20, 20, 0.2)',
  },
  popupCard: {
    backgroundColor: '#FBFCFB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D6D8D7',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  popupHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6D746E',
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  popupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  popupAccent: {
    width: 4,
    height: 34,
    borderRadius: 999,
    marginRight: 10,
    opacity: 0.9,
  },
  popupDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E3E5E4',
  },
  popupIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2EF',
    marginRight: 12,
  },
  popupTextWrap: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#232A24',
    lineHeight: 22,
  },
  popupDesc: {
    fontSize: 14,
    color: '#6D746E',
    marginTop: 1,
  },
});
