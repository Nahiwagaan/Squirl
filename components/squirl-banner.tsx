import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type SquirlBannerProps = {
  fontFamily: string;
  userName: string;
  message: string;
  mascot: ImageSourcePropType;
  compact?: boolean;
  mascotScale?: number;
  mascotBottomOffset?: number;
};

export function SquirlBanner({
  fontFamily,
  userName,
  message,
  mascot,
  compact = false,
  mascotScale = 1,
  mascotBottomOffset,
}: SquirlBannerProps) {
  const { colors } = useTheme();
  const resolvedMessage = message.replace('{name}', userName);
  const [displayedTextLength, setDisplayedTextLength] = React.useState(0);

  React.useEffect(() => {
    let currentIndex = 0;
    setDisplayedTextLength(0);
    const intervalId = setInterval(() => {
      currentIndex += 1;
      setDisplayedTextLength(currentIndex);
      if (currentIndex >= resolvedMessage.length) clearInterval(intervalId);
    }, 25);
    return () => clearInterval(intervalId);
  }, [resolvedMessage]);

  return (
    <View style={[styles.bannerContainer, compact ? styles.bannerContainerCompact : styles.bannerContainerRegular]}>
      {/* Green background — covers from top:46 down, grows with container */}
      <View style={[styles.bannerBackground, { backgroundColor: colors.tealDark }]} />

      {/* Mascot — absolute at bottom-left, positioned same as original design */}
      <Image
        source={mascot}
        style={[
          styles.bannerMascot,
          compact ? styles.mascotCompact : styles.mascotRegular,
          mascotBottomOffset !== undefined && { bottom: mascotBottomOffset },
          { transform: [{ scale: mascotScale }] },
        ]}
        resizeMode="contain"
      />

      {/* 46px spacer — white area above the green band */}
      <View style={styles.topSpacer} />

      {/* Bubble row — fills the green band, centers content vertically */}
      <View style={[styles.bannerRow, compact ? styles.bannerRowCompact : styles.bannerRowRegular]}>
        <View style={compact ? styles.mascotSpaceCompact : styles.mascotSpaceRegular} />
        <View style={[styles.bannerBubbleTail, compact ? styles.tailCompact : styles.tailRegular, { borderRightColor: colors.surface }]} />
        <View style={[styles.bannerBubble, compact ? styles.bubbleCompact : styles.bubbleRegular, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bannerBubbleTitle, { fontFamily, color: colors.teal }]}>Squirl</Text>
          <Text style={[styles.bannerBubbleText, { fontFamily, color: colors.textPrimary }]}>
            {resolvedMessage.substring(0, displayedTextLength)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: { position: 'relative', marginBottom: 20, overflow: 'visible' },
  // minHeight adjusted so mascot clears the header comfortably
  bannerContainerRegular: { minHeight: 140, marginTop: -16 },
  bannerContainerCompact: { minHeight: 140, marginTop: -16 },

  // Covers from 20px down — tighter gap below the header
  bannerBackground: {
    position: 'absolute',
    top: 20,
    bottom: 0,
    left: -16,
    right: -16,
  },

  bannerMascot: { position: 'absolute', left: 0, bottom: -8, zIndex: 2 },
  mascotRegular: { width: 134, height: 144 },
  mascotCompact: { width: 134, height: 144 },

  // White area above the green band — reduced to tighten the gap
  topSpacer: { height: 20 },

  // Row spans the green band — minHeight:118 + alignItems centers bubble vertically
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    zIndex: 1,
  },
  bannerRowRegular: { minHeight: 118, paddingVertical: 12 },
  bannerRowCompact: { minHeight: 118, paddingVertical: 10 },

  mascotSpaceRegular: { width: 130 },
  mascotSpaceCompact: { width: 126 },

  bannerBubbleTail: {
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginRight: -4,
  },
  tailRegular: { borderTopWidth: 14, borderBottomWidth: 14, borderRightWidth: 18 },
  tailCompact: { borderTopWidth: 14, borderBottomWidth: 14, borderRightWidth: 18 },

  bannerBubble: { flex: 1 },
  bubbleRegular: { borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  bubbleCompact: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14 },

  bannerBubbleTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  bannerBubbleText: { fontSize: 13, lineHeight: 18 },
});
