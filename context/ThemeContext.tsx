import React from 'react';
import { Platform } from 'react-native';

// ─── Color Palettes ─────────────────────────────────────────────────────────

export const LIGHT_COLORS = {
  // Backgrounds
  bg:          '#FFFFFF',
  bgSecondary: '#F5F7F6',
  surface:     '#FFFFFF',
  // Borders
  border:      '#D0D0D0',
  cardBorder:  '#C8CCC8',
  // Text
  textPrimary: '#1A1A1A',
  textMuted:   '#888888',
  // Brand
  teal:        '#2FA084',
  tealDark:    '#1F6F5F',
  tealBg:      '#1F7D69',
  tealLight:   '#E8F5F0',
  // Input
  inputBg:     '#FFFFFF',
  inputBorder: '#D0D0D0',
  // Tab bar
  tabBar:      '#FFFFFF',
  tabBorder:   '#D0D0D0',
  tabActive:   '#1A1A1A',
  tabInactive: '#888888',
  // Status bar
  statusBar:   'dark-content' as 'dark-content' | 'light-content',
  // Modal
  modalOverlay: 'rgba(0,0,0,0.4)',
  // Income / Expense indicators
  income:  '#10B981',
  expense: '#EF4444',
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  bg:          '#0F0F0F',
  bgSecondary: '#1A1A1A',
  surface:     '#1C1C1E',
  border:      '#2C2C2E',
  cardBorder:  '#2C2C2E',
  textPrimary: '#F0F0F0',
  textMuted:   '#8E8E93',
  teal:        '#3DB891',
  tealDark:    '#2FA084',
  tealBg:      '#1A5C4E',
  tealLight:   '#0D2E24',
  inputBg:     '#1C1C1E',
  inputBorder: '#3A3A3C',
  tabBar:      '#1C1C1E',
  tabBorder:   '#2C2C2E',
  tabActive:   '#F0F0F0',
  tabInactive: '#636366',
  statusBar:   'light-content' as 'dark-content' | 'light-content',
  modalOverlay: 'rgba(0,0,0,0.7)',
  income:  '#34D399',
  expense: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
};

export type ThemeColors = typeof LIGHT_COLORS;

// ─── Storage helpers (cross-platform) ────────────────────────────────────────

const THEME_KEY = 'squirl_theme';

function readTheme(): 'light' | 'dark' {
  try {
    if (Platform.OS === 'web') {
      return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') ?? 'light';
    }
    // Native: use global __SQUIRL_THEME__ set by ThemeProvider init
    return (global as any).__squirl_theme__ ?? 'light';
  } catch {
    return 'light';
  }
}

function writeTheme(theme: 'light' | 'dark') {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(THEME_KEY, theme);
    }
    (global as any).__squirl_theme__ = theme;
  } catch {}
}

// ─── Context ─────────────────────────────────────────────────────────────────

type ThemeContextValue = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue>({
  isDark: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = React.useState<boolean>(() => readTheme() === 'dark');

  const toggleTheme = React.useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      writeTheme(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value = React.useMemo(() => ({ isDark, colors, toggleTheme }), [isDark, colors, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme() {
  return React.useContext(ThemeContext);
}
