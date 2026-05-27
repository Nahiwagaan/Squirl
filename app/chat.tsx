import { addWalletAccount, initDatabase, saveExpenseEntry, saveIncomeEntry } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const Inter_400Regular = require('../node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');
const Inter_600SemiBold = require('../node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf');
const Inter_700Bold = require('../node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf');

const BG = '#F9FBF9';
const TEXT_DARK = '#1A1A1A';

type ParsedTransaction = {
  amount: number;
  note: string;
  type: 'Expense' | 'Income';
  category: string;
  account: string;
};

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  parsedTransactions?: ParsedTransaction[];
};

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.stagger(150, [
          Animated.timing(dot1, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        Animated.stagger(150, [
          Animated.timing(dot1, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]),
      ]).start((result) => {
        if (result.finished) animate();
      });
    };
    animate();
  }, []);

  const getStyle = (animValue: Animated.Value) => ({
    opacity: animValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{
      translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })
    }]
  });

  return (
    <View style={styles.typingWrap}>
      <Animated.View style={[styles.typingDot, getStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, getStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, getStyle(dot3)]} />
    </View>
  );
};

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    sender: 'ai',
    text: "Hi! I'm your Squirl assistant.\n\nYou can log your money simply by typing it out in plain text. For example:\n\n• 500 mcdo\n• 20 jeep\n• earned 5000 in BDO\n• 2000 foods in Gcash\n\nYou can even log multiple transactions at once by putting them on new lines!"
  }]);
  const flatListRef = useRef<FlatList>(null);

  if (!fontsLoaded) return null;

  const font = 'Inter_400Regular';
  const fontSemiBold = 'Inter_600SemiBold';
  const fontBold = 'Inter_700Bold';

  const parseInput = (input: string): ParsedTransaction[] => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const transactions: ParsedTransaction[] = [];

    for (const line of lines) {
      let isIncome = false;
      let textToParse = line;

      if (/\b(earned|income|salary|got|received)\b/i.test(line)) {
        isIncome = true;
        textToParse = line.replace(/\b(earned|income|salary|got|received)\b/ig, '').trim();
      }

      const match = textToParse.match(/(\d+(?:\.\d+)?)\s*(.*)/);
      if (match) {
        const amount = parseFloat(match[1]);
        const note = match[2].trim() || (isIncome ? 'Income' : 'Expense');

        let category = isIncome ? 'Salary' : 'General';
        const noteLower = note.toLowerCase();
        if (noteLower.includes('mcdo') || noteLower.includes('starbucks') || noteLower.includes('food') || noteLower.includes('coffee') || noteLower.includes('burger')) {
          category = 'Food';
        } else if (noteLower.includes('jeep') || noteLower.includes('bus') || noteLower.includes('grab') || noteLower.includes('transport') || noteLower.includes('taxi')) {
          category = 'Transport';
        } else if (noteLower.includes('rent') || noteLower.includes('bill')) {
          category = 'Bills';
        } else if (noteLower.includes('grocery') || noteLower.includes('market')) {
          category = 'Groceries';
        }

        let account = 'Cash';
        const knownBanks = ['gcash', 'maya', 'paymaya', 'bpi', 'bdo', 'maribank', 'mari', 'wise', 'unionbank', 'metrobank', 'rcbc', 'security bank'];
        let foundBank = knownBanks.find(b => noteLower.includes(b));

        if (foundBank) {
          if (foundBank === 'mari') account = 'MariBank';
          else if (foundBank === 'paymaya') account = 'Maya';
          else if (foundBank === 'gcash') account = 'GCash';
          else if (foundBank === 'bpi') account = 'BPI';
          else if (foundBank === 'bdo') account = 'BDO';
          else if (foundBank === 'wise') account = 'Wise';
          else account = foundBank.charAt(0).toUpperCase() + foundBank.slice(1);
        } else {
          const accMatch = noteLower.match(/\b(?:in|from|to|via|using)\s+([a-z0-9]+)\b/i);
          if (accMatch) {
            const potentialBank = accMatch[1].trim();
            const ignoreList = ['food', 'cash', 'mcdo', 'starbucks', 'jeep', 'bus', 'grab', 'rent', 'bill', 'grocery', 'market', 'freelance', 'work'];
            if (!ignoreList.includes(potentialBank.toLowerCase())) {
              account = potentialBank.charAt(0).toUpperCase() + potentialBank.slice(1);
            }
          }
        }

        transactions.push({
          amount,
          note,
          type: isIncome ? 'Income' : 'Expense',
          category,
          account
        });
      }
    }

    return transactions;
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const parsed = parseInput(userMsg.text!);
    if (parsed.length > 0) {
      initDatabase();
      parsed.forEach(t => {
        addWalletAccount(t.account);
        if (t.type === 'Expense') {
          t.dbId = saveExpenseEntry(t.amount, t.note, t.category, t.account);
        } else {
          t.dbId = saveIncomeEntry(t.amount, t.note, t.category, t.account);
        }
      });

      setTimeout(() => {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', parsedTransactions: parsed };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1500);
    } else {
      setTimeout(() => {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "I couldn't quite catch that. Try typing an amount followed by a note, like '500 mcdo'." };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleCancel = (msgId: string) => {
    const aiMsg = messages.find(m => m.id === msgId);
    if (!aiMsg || !aiMsg.parsedTransactions) return;

    aiMsg.parsedTransactions.forEach(t => {
      if (t.dbId !== undefined) {
        import('@/lib/database').then(db => {
          if (t.type === 'Expense') db.deleteExpenseEntry(t.dbId!);
          else db.deleteIncomeEntry(t.dbId!);
        });
      }
    });

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, parsedTransactions: undefined, text: "Transactions undone." } : m));
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require('@/assets/images/squirl/chatheader.png')} style={styles.headerAvatar} />
        <View style={styles.headerTextWrap}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.textPrimary }]}>Chat</Text>
          </View>
          <Text style={[styles.headerSub, { fontFamily: font, color: colors.textMuted }]}>Ask questions or log money in plain language.</Text>
        </View>
      </View>



      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        keyExtractor={item => item.id}
        inverted={true}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={isTyping ? (
          <View style={styles.aiMessageWrap}>
            <Image source={require('@/assets/images/squirl/chat.png')} style={styles.aiAvatar} />
            <View style={[styles.aiBubble, { backgroundColor: isDark ? '#2C3A2E' : '#c0e0c5ff', paddingVertical: 14, paddingHorizontal: 16, alignSelf: 'flex-start', flex: 0 }]}>
              <TypingIndicator />
            </View>
          </View>
        ) : null}
        renderItem={({ item: msg }) => {
          if (msg.sender === 'user') {
            return (
              <View style={styles.userMessageWrap}>
                <View style={[styles.userBubble, { backgroundColor: '#5C8C56' }]}>
                  {msg.text?.split('\n').map((line, idx) => (
                    <Text key={idx} style={[styles.userText, { fontFamily: font, color: '#FFFFFF' }]}>{line}</Text>
                  ))}
                </View>
              </View>
            );
          } else {
            return (
              <View style={styles.aiMessageWrap}>
                <Image source={require('@/assets/images/squirl/chat.png')} style={styles.aiAvatar} />
                <View style={[styles.aiBubble, { backgroundColor: isDark ? '#2C3A2E' : '#c0e0c5ff' }]}>
                  {msg.parsedTransactions ? (
                    <>
                      <View style={[styles.loggedBadge, { backgroundColor: isDark ? '#3A4E3A' : '#D6EAD6' }]}>
                        <View style={[styles.checkCircle, { backgroundColor: '#4E9656' }]}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.loggedText, { fontFamily: fontBold, color: '#4E9656' }]}>LOGGED</Text>
                      </View>
                      <Text style={[styles.aiTitle, { fontFamily: fontSemiBold, color: colors.textPrimary }]}>Logged {msg.parsedTransactions.length} transaction{msg.parsedTransactions.length > 1 ? 's' : ''}</Text>
                      <View style={styles.bulletList}>
                        {msg.parsedTransactions.map((t, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <Text style={[styles.bulletPoint, { color: colors.textPrimary }]}>•</Text>
                            <Text style={[styles.bulletText, { fontFamily: font, color: colors.textPrimary }]}>
                              <Text style={{ fontFamily: fontSemiBold }}>{t.type}: </Text>
                              ₱{t.amount} in <Text style={{ fontFamily: fontSemiBold }}>{t.category}</Text> from <Text style={{ fontFamily: fontSemiBold }}>{t.account}</Text> for <Text style={{ fontStyle: 'italic' }}>{t.note}</Text>
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.aiFooter}>
                        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? '#3A4E3A' : '#E8EDE9' }]} onPress={() => handleCancel(msg.id)}>
                          <Ionicons name="close-circle-outline" size={16} color={colors.textPrimary} />
                          <Text style={[styles.cancelText, { fontFamily: fontSemiBold, color: colors.textPrimary }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.bulletText, { fontFamily: font, color: colors.textPrimary }]}>{msg.text}</Text>
                  )}
                </View>
              </View>
            );
          }
        }}
      />

      {/* Input Area */}
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { fontFamily: font, backgroundColor: isDark ? '#2C2C2E' : '#F4F5F4', color: colors.textPrimary }]}
          placeholder="Log an expense or ask..."
          placeholderTextColor={colors.textMuted}
          multiline
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: '#5C8C56', opacity: inputText.trim() ? 1 : 0.5 }]}
          activeOpacity={0.8}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  safeArea: { 
    flex: 1, 
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginRight: 12,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    color: TEXT_DARK,
    marginRight: 8,
  },
  headerSub: {
    fontSize: 13,
    color: '#707070',
  },
  samplesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F9FBF9',
  },
  samplesContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  sampleChip: {
    backgroundColor: '#F3F9F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D6EAD6',
  },
  sampleText: {
    color: '#3B7A3B',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userMessageWrap: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  userBubble: {
    backgroundColor: '#5C8C56',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 160,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  aiMessageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
    marginRight: 12,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: '#c0e0c5ff',
    borderRadius: 24,
    borderBottomLeftRadius: 4,
    padding: 20,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D6EAD6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4E9656',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedText: {
    color: '#4E9656',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  aiTitle: {
    fontSize: 17,
    color: TEXT_DARK,
    marginBottom: 14,
  },
  bulletList: {
    gap: 12,
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 18,
    color: TEXT_DARK,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    flex: 1,
  },
  aiFooter: {
    flexDirection: 'row',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EDE9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  cancelText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputField: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F4F5F4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#1A1A1A',
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5C8C56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 20,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888888',
  },
});
