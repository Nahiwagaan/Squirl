import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TEAL = '#2FA084';
const TEAL_DARK = '#1F6F5F';
const TEXT_DARK = '#1A1A1A';

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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);
  const [visibleLineCount, setVisibleLineCount] = React.useState(0);
  const resolvedMessage = message.replace('{name}', userName);
  const maxLines = 3;

  return (
    <View style={[styles.bannerContainer, compact ? styles.bannerContainerCompact : styles.bannerContainerRegular]}>
      <View style={[styles.bannerBackground, compact ? styles.bannerBgCompact : styles.bannerBgRegular]} />
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
      <View
        style={[
          styles.bannerBubbleWrap,
          compact ? styles.wrapCompact : styles.wrapRegular,
          compact && visibleLineCount <= 1 && !isExpanded && styles.wrapCompactOneLine,
          compact && visibleLineCount === 2 && !isExpanded && styles.wrapCompactTwoLines,
        ]}
      >
        <View style={[styles.bannerBubbleTail, compact ? styles.tailCompact : styles.tailRegular]} />
        <View
          style={[
            styles.bannerBubble,
            compact ? styles.bubbleCompact : styles.bubbleRegular,
            visibleLineCount <= 1 && !isExpanded && styles.bubbleOneLine,
          ]}
        >
          <Text style={[styles.bannerBubbleTitle, { fontFamily }]}>Squirl</Text>
          <Text
            style={[styles.bannerBubbleText, { fontFamily }]}
            numberOfLines={isExpanded ? undefined : maxLines}
            onTextLayout={(e) => {
              setVisibleLineCount(e.nativeEvent.lines.length);
              if (!canExpand && e.nativeEvent.lines.length > maxLines) {
                setCanExpand(true);
              }
            }}
          >
            {resolvedMessage}
          </Text>
          {canExpand && (
            <TouchableOpacity onPress={() => setIsExpanded((prev) => !prev)} activeOpacity={0.85}>
              <Text style={[styles.readMoreText, { fontFamily }]}>{isExpanded ? 'Read less' : 'Read more'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: { position: 'relative', marginBottom: 20 },
  bannerContainerRegular: { height: 164, marginTop: -30 },
  bannerContainerCompact: { height: 164, marginTop: -30 },
  bannerBackground: {
    position: 'absolute',
    bottom: 0,
    left: -16,
    right: -16,
    backgroundColor: TEAL_DARK,
  },
  bannerBgRegular: { height: 118 },
  bannerBgCompact: { height: 118 },
  bannerMascot: {
    position: 'absolute',
    left: 0,
    zIndex: 2,
  },
  mascotRegular: { bottom: -8, width: 134, height: 144 },
  mascotCompact: { bottom: -8, width: 134, height: 144 },
  bannerBubbleWrap: {
    position: 'absolute',
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  wrapRegular: { top: 55, left: 130 },
  wrapCompact: { top: 55, left: 126 },
  wrapCompactOneLine: { top: 68 },
  wrapCompactTwoLines: { top: 61 },
  bannerBubbleTail: {
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFFFFF',
    marginRight: -4,
  },
  tailRegular: { borderTopWidth: 24, borderBottomWidth: 24, borderRightWidth: 30 },
  tailCompact: { borderTopWidth: 24, borderBottomWidth: 24, borderRightWidth: 30 },
  bannerBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bubbleRegular: { borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  bubbleCompact: { borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  bubbleOneLine: { minHeight: 64, justifyContent: 'center' },
  bannerBubbleTitle: { fontSize: 18, fontWeight: '700', color: TEAL, marginBottom: 2 },
  bannerBubbleText: { fontSize: 13, color: TEXT_DARK, lineHeight: 18 },
  readMoreText: {
    marginTop: 4,
    fontSize: 12,
    color: TEAL,
    fontWeight: '700',
  },
});
