import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { CATEGORY_ICON, CATEGORY_LABEL, REASON_ICON, SHIFT_LABEL } from '@/domain/labels';
import type { Category, InterestStatus, Reason, Shift } from '@/domain/types';
import { categoryColor, colors, fonts } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

/** Job-type chip: fills with its category color when selected. */
export function CategoryChip({ category, selected, onPress, grid }: { category: Category; selected: boolean; onPress: () => void; grid?: boolean }) {
  const c = categoryColor[category];
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={CATEGORY_LABEL[category]} onPress={onPress}
      style={[styles.selChip, grid && styles.gridChip, { backgroundColor: selected ? c : 'transparent', borderColor: selected ? c : colors.line }]}>
      <Icon name={CATEGORY_ICON[category]} size={20} strokeWidth={2.5} color={selected ? colors.white : c} />
      <Text style={styles.selChipText} color={selected ? colors.white : colors.ink}>{CATEGORY_LABEL[category]}</Text>
      {grid ? <View style={{ flex: 1 }} /> : null}
      {selected && grid ? <Icon name="check" size={18} strokeWidth={3} color={colors.white} /> : null}
    </Pressable>
  );
}

/** Availability chip: fills ink when selected. */
export function ShiftChip({ shift, selected, onPress }: { shift: Shift; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={SHIFT_LABEL[shift]} onPress={onPress}
      style={[styles.selChip, { paddingHorizontal: 14, backgroundColor: selected ? colors.ink : 'transparent', borderColor: selected ? colors.ink : colors.line }]}>
      <Text style={styles.selChipText} color={selected ? colors.bg : colors.ink}>{SHIFT_LABEL[shift]}</Text>
    </Pressable>
  );
}

/** Generic selectable preset chip (radius presets). */
export function PresetChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.selChip, styles.preset, { backgroundColor: selected ? colors.ink : 'transparent', borderColor: selected ? colors.ink : colors.line }]}>
      <Text style={styles.selChipText} color={selected ? colors.bg : colors.ink}>{label}</Text>
    </Pressable>
  );
}

export function ReasonChip({ reason }: { reason: Reason }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.likeTint }]}>
      <Icon name={REASON_ICON[reason.kind]} size={16} strokeWidth={2.5} color={colors.likeInk} />
      <Text variant="chip" color={colors.likeInk}>{reason.text}</Text>
    </View>
  );
}

export function WarningChip({ text }: { text: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.warningTint, borderWidth: 1.5, borderColor: colors.warning }]}>
      <Icon name="alert" size={16} strokeWidth={2.5} color={colors.warningInk} />
      <Text variant="chip" color={colors.warningInk}>{text}</Text>
    </View>
  );
}

export function ShiftTag({ label }: { label: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: colors.n200, height: 30 }]}>
      <Text variant="chip">{label}</Text>
    </View>
  );
}

export function RequirementTag({ label, large }: { label: string; large?: boolean }) {
  return (
    <View style={[styles.tag, { borderWidth: 1.5, borderColor: colors.ink, height: large ? 30 : 28, gap: 5 }]}>
      <Icon name="shield" size={large ? 15 : 14} strokeWidth={2.5} />
      <Text variant="chip" style={!large && { fontSize: 13 }}>{label}</Text>
    </View>
  );
}

/** Square dot with an expanding ring — "waiting for reply". */
export function Pulse({ color = colors.ink }: { color?: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: 1 + p.get() * 1.8 }], opacity: 0.55 * (1 - p.get()) }));
  return (
    <View style={styles.pulse}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color }, ring]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
    </View>
  );
}

export function StatusPill({ status }: { status: InterestStatus }) {
  if (status === 'pending')
    return (
      <View style={[styles.pill, { backgroundColor: colors.n200, gap: 8 }]} accessibilityLabel="Waiting for reply">
        <Pulse />
        <Text variant="chip" style={styles.pillText}>Waiting for reply</Text>
      </View>
    );
  if (status === 'matched')
    return (
      <View style={[styles.pill, { backgroundColor: colors.like }]}>
        <Icon name="check" size={14} strokeWidth={3} color={colors.white} />
        <Text style={[styles.pillText, { fontFamily: fonts.heavy }]} color={colors.white}>Matched</Text>
      </View>
    );
  return (
    <View style={[styles.pill, { borderWidth: 1.5, borderColor: colors.n400 }]}>
      <Text variant="chip" style={styles.pillText} color={colors.inkMuted}>Not this time</Text>
    </View>
  );
}

/** Small section label: "WHY THIS JOB". */
export function Kicker({ children, color = colors.inkMuted, style }: { children: string; color?: string; style?: object }) {
  return <Text variant="label" color={color} style={[{ fontSize: 12 }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  selChip: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 2 },
  gridChip: { height: 46, paddingHorizontal: 10 },
  selChipText: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20 },
  preset: { flex: 1 },
  chip: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  pill: { height: 28, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, alignSelf: 'flex-start' },
  pillText: { fontSize: 13, lineHeight: 16 },
  pulse: { width: 8, height: 8 },
});
