import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const TEAL = '#2FA084';

export default function TabLayout() {
  const { colors } = useTheme();
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);

  const quickAddOptions = [
    { key: 'quick-chat', title: 'Quick Chat', description: 'AI assistant',  icon: 'chatbubbles' as const, color: '#8B5CF6' },
    { key: 'transfer',   title: 'Transfer',   description: 'Move funds',    icon: 'swap-horizontal' as const, color: '#3B82F6' },
    { key: 'income',     title: 'Income',     description: 'Record money',  icon: 'arrow-down' as const, color: '#10B981' },
    { key: 'expense',    title: 'Expense',    description: 'Log spending',  icon: 'arrow-up' as const,   color: '#EF4444' },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderColor: colors.tabBorder,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
        }}
      >
        <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ color }) => <Ionicons name="home"          size={24} color={color} /> }} />
        <Tabs.Screen name="wallet"  options={{ title: 'Wallet',  tabBarIcon: ({ color }) => <Ionicons name="wallet"        size={24} color={color} /> }} />
        <Tabs.Screen
          name="add"
          listeners={{ tabPress: (e) => { e.preventDefault(); setIsQuickAddOpen(true); } }}
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={styles.addButton}>
                <Ionicons name="add" size={32} color="#000000" />
              </View>
            ),
          }}
        />
        <Tabs.Screen name="plan"    options={{ title: 'Plan',    tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="debts"   options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }) => <Ionicons name="time-outline"  size={24} color={color} /> }} />
      </Tabs>

      <Modal animationType="fade" transparent visible={isQuickAddOpen} onRequestClose={() => setIsQuickAddOpen(false)}>
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} onPress={() => setIsQuickAddOpen(false)}>
            <Pressable style={[styles.popupCard, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.popupHeaderContainer}>
                <Text style={[styles.popupHeader, { color: colors.textPrimary }]}>Quick Actions</Text>
                <TouchableOpacity onPress={() => setIsQuickAddOpen(false)} style={[styles.closeButton, { backgroundColor: colors.bgSecondary }]}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.gridContainer}>
                {quickAddOptions.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.gridItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsQuickAddOpen(false);
                      if      (item.key === 'income')     router.push('/income');
                      else if (item.key === 'transfer')   router.push('/transfer');
                      else if (item.key === 'expense')    router.push('/expense');
                      else if (item.key === 'quick-chat') router.push('/chat');
                    }}
                  >
                    <View style={[styles.gridIconWrap, { backgroundColor: item.color + '26' }]}>
                      <Ionicons name={item.icon} size={26} color={item.color} />
                    </View>
                    <Text style={[styles.gridTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: TEAL,
    width: 58, height: 58, borderRadius: 14,
    borderWidth: 1, borderColor: '#000000',
    alignItems: 'center', justifyContent: 'center',
    marginTop: -24,
  },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 110 : 90,
  },
  popupCard: {
    borderRadius: 32, paddingVertical: 24, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  popupHeaderContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24, paddingHorizontal: 4,
  },
  popupHeader:  { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  closeButton:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gridContainer:{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 4 },
  gridItem:     { alignItems: 'center', width: 64 },
  gridIconWrap: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridTitle:    { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
});
