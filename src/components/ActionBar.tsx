import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { colors, fonts, touch } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface Props {
  drag: SharedValue<number>;
  onPass: () => void;
  onLike: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
}

const ACTIVE_AT = 40;

interface Look {
  bg: string;
  border: string;
  fg: string;
}

function Face({ icon, label, look, fill, style }: { icon: IconName; label: string; look: Look; fill?: boolean; style?: ViewStyle }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.face, { backgroundColor: look.bg, borderColor: look.border }, style]}>
      <Icon name={icon} size={fill ? 26 : 28} strokeWidth={fill ? 2.5 : 3} color={look.fg} fill={fill} />
      <Text style={styles.label} color={look.fg}>{label}</Text>
    </View>
  );
}

/**
 * Undo · Pass · Interested. Each big button has three stacked faces (default / active / dimmed)
 * cross-faded from the card's drag, so the button mirrors the gesture.
 */
export function ActionBar({ drag, onPass, onLike, onUndo, canUndo, disabled }: Props) {
  const right = useAnimatedStyle(() => ({ opacity: interpolate(drag.get(), [0, ACTIVE_AT], [0, 1], Extrapolation.CLAMP) }));
  const left = useAnimatedStyle(() => ({ opacity: interpolate(drag.get(), [-ACTIVE_AT, 0], [1, 0], Extrapolation.CLAMP) }));
  const passScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(drag.get(), [-ACTIVE_AT, 0], [1.04, 1], Extrapolation.CLAMP) }],
  }));
  const likeScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(drag.get(), [0, ACTIVE_AT], [1, 1.04], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[styles.row, disabled && { opacity: 0.45 }]} pointerEvents={disabled ? 'none' : 'auto'}>
      <Pressable accessibilityRole="button" accessibilityLabel="Undo last swipe" disabled={!canUndo} onPress={onUndo}
        style={({ pressed }) => [styles.undo, { opacity: canUndo ? 1 : 0.4 }, pressed && { backgroundColor: colors.n300 }]}>
        <Icon name="undo" size={22} strokeWidth={2.5} />
        <Text style={styles.undoText}>Undo</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Pass" onPress={onPass} style={{ flex: 1 }}>
        {({ pressed }) => (
          <Animated.View style={[styles.big, passScale]}>
            <Face icon="x" label="Pass" look={{ bg: pressed ? colors.n200 : colors.bg, border: colors.ink, fg: colors.ink }} />
            <Animated.View style={[StyleSheet.absoluteFill, right]}>
              <Face icon="x" label="Pass" look={{ bg: colors.bg, border: colors.n400, fg: colors.n600 }} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, left]}>
              <Face icon="x" label="Pass" look={{ bg: colors.ink, border: colors.ink, fg: colors.bg }} />
            </Animated.View>
          </Animated.View>
        )}
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Interested" onPress={onLike} style={{ flex: 1.25 }}>
        {({ pressed }) => (
          <Animated.View style={[styles.big, likeScale]}>
            <Face icon="heart" fill label="Interested" look={{ bg: pressed ? colors.likePressed : colors.like, border: colors.like, fg: colors.white }} />
            <Animated.View style={[StyleSheet.absoluteFill, left]}>
              <Face icon="heart" fill label="Interested" look={{ bg: colors.likeTint, border: colors.likeTint, fg: colors.likeInk }} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, right]}>
              <Face icon="heart" fill label="Interested" look={{ bg: colors.likePressed, border: colors.likePressed, fg: colors.white }} />
            </Animated.View>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: touch.action, flexDirection: 'row', gap: 8 },
  undo: { width: 60, height: touch.action, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: colors.surface },
  undoText: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 13 },
  big: { flex: 1 },
  face: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderWidth: 2 },
  label: { fontFamily: fonts.heavy, fontSize: 19, lineHeight: 23 },
});
