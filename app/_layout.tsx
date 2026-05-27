import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as expoRouter from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as reactNative from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { consumePendingToast } from '@/lib/toast';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="income" options={{ headerShown: false }} />
          <Stack.Screen name="expense" options={{ headerShown: false }} />
          <Stack.Screen name="transfer" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
          <Stack.Screen name="setup"  options={{ headerShown: false }} />
          <Stack.Screen name="modal"  options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        <GlobalToast />
      </ThemeProvider>
    </AppThemeProvider>
  );
}

function GlobalToast() {
  const pathname = expoRouter.usePathname();
  const [toastData, setToastData] = React.useState<any>(null);
  const toastAnim = React.useRef(new reactNative.Animated.Value(-150)).current;
  const textWidthAnim = React.useRef(new reactNative.Animated.Value(0)).current;

  React.useEffect(() => {
    const msg = consumePendingToast();
    if (msg) {
      try {
        const parsed = JSON.parse(msg);
        setToastData(parsed);
        toastAnim.setValue(-150);
        textWidthAnim.setValue(0);
        
        reactNative.Animated.sequence([
          // 1. Drop down as a circle
          reactNative.Animated.timing(toastAnim, { toValue: reactNative.Platform.OS === 'ios' ? 60 : 40, duration: 400, useNativeDriver: true }),
          // 2. Expand width to reveal text
          reactNative.Animated.timing(textWidthAnim, { toValue: 1, duration: 350, useNativeDriver: false }),
          // 3. Hold
          reactNative.Animated.delay(2200),
          // 4. Shrink text back to circle
          reactNative.Animated.timing(textWidthAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
          // 5. Slide back up
          reactNative.Animated.timing(toastAnim, { toValue: -150, duration: 300, useNativeDriver: true })
        ]).start(() => setToastData(null));
      } catch(e) {}
    }
  }, [pathname]);

  if (!toastData) return null;

  return (
    <reactNative.Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
      <reactNative.View style={styles.toastCard}>
        <reactNative.View style={styles.toastIconWrap}>
          <Ionicons name="checkmark" size={18} color="#3AE259" />
        </reactNative.View>
        <reactNative.Animated.View style={[styles.toastTextWrap, { 
          maxWidth: textWidthAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }),
          opacity: textWidthAnim,
          overflow: 'hidden'
        }]}>
          <reactNative.View style={{ paddingLeft: 12, paddingRight: 10, minWidth: 150 }}>
            <reactNative.Text style={styles.toastTitle} numberOfLines={1}>{toastData.type} Logged</reactNative.Text>
            <reactNative.Text style={styles.toastMessage} numberOfLines={1}>
              {toastData.type === 'Transfer'
                ? `${toastData.amount} from ${toastData.from} to ${toastData.to}`
                : `${toastData.amount} ${toastData.type === 'Income' ? 'to' : 'from'} ${toastData.account}`}
            </reactNative.Text>
          </reactNative.View>
        </reactNative.Animated.View>
      </reactNative.View>
    </reactNative.Animated.View>
  );
}

const styles = reactNative.StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: reactNative.Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toastCard: {
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#174A25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  toastTitle: {
    color: '#3AE259',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastMessage: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
