import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { CATEGORY_ICON, REASON_ICON } from '@/domain/labels';
import { useT } from '@/hooks/useT';
import { reasonText, warningText } from '@/i18n/format';
import { categoryColor, colors, fonts, radius } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

/** Job-type chip: fills with its category color when selected. */
export function CategoryChip({ category, selected, onPress, grid }) {
  const t = useT();
  const c = categoryColor[category];
  const label = t(`category.${category}`);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.selChip,
        grid && styles.gridChip,
        {
          backgroundColor: selected ? c : 'transparent',
          borderColor: selected ? c : colors.line,
        },
      ]}
    >
      <Icon name={CATEGORY_ICON[category]} size={20} strokeWidth={2.5} color={selected ? colors.white : c} />
      <Text style={styles.selChipText} color={selected ? colors.white : colors.ink}>
        {label}
      </Text>
      {grid ? <View style={{ flex: 1 }} /> : null}
      {selected && grid ? <Icon name="check" size={18} strokeWidth={3} color={colors.white} /> : null}
    </Pressable>
  );
}

/** Availability chip: fills ink when selected. */
export function ShiftChip({ shift, selected, onPress }) {
  const t = useT();
  return <ToggleChip label={t(`shift.${shift}`)} selected={selected} onPress={onPress} />;
}

/** Spoken-language chip: "DE German". */
export function LanguageChip({ language, selected, onPress }) {
  const t = useT();
  return <ToggleChip code={language.toUpperCase()} label={t(`lang.${language}`)} selected={selected} onPress={onPress} />;
}

/** Multi-select chip that fills ink when selected. */
function ToggleChip({ label, code, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.selChip,
        {
          paddingHorizontal: 14,
          backgroundColor: selected ? colors.ink : 'transparent',
          borderColor: selected ? colors.ink : colors.line,
        },
      ]}
    >
      {code ? (
        <Text style={styles.code} color={selected ? colors.bg : colors.inkMuted}>
          {code}
        </Text>
      ) : null}
      <Text style={styles.selChipText} color={selected ? colors.bg : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Generic selectable preset chip (radius presets). */
export function PresetChip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.selChip,
        styles.preset,
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          borderColor: selected ? colors.ink : colors.line,
        },
      ]}
    >
      <Text style={styles.selChipText} color={selected ? colors.bg : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ReasonChip({ reason }) {
  const t = useT();
  return (
    <View style={[styles.chip, { backgroundColor: colors.likeTint }]}>
      <Icon name={REASON_ICON[reason.kind]} size={16} strokeWidth={2.5} color={colors.likeInk} />
      <Text variant="chip" color={colors.likeInk}>
        {reasonText(t, reason)}
      </Text>
    </View>
  );
}

export function WarningChip({ warning }) {
  const t = useT();
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.warningTint,
          borderWidth: 1.5,
          borderColor: colors.warning,
        },
      ]}
    >
      <Icon name="alert" size={16} strokeWidth={2.5} color={colors.warningInk} />
      <Text variant="chip" color={colors.warningInk}>
        {warningText(t, warning)}
      </Text>
    </View>
  );
}

export function ShiftTag({ label }) {
  return (
    <View style={[styles.tag, { backgroundColor: colors.n200, height: 30 }]}>
      <Text variant="chip">{label}</Text>
    </View>
  );
}

export function RequirementTag({ label, large }) {
  return (
    <View
      style={[
        styles.tag,
        {
          borderWidth: 1.5,
          borderColor: colors.ink,
          height: large ? 30 : 28,
          gap: 5,
        },
      ]}
    >
      <Icon name="shield" size={large ? 15 : 14} strokeWidth={2.5} />
      <Text variant="chip" style={!large && { fontSize: 13 }}>
        {label}
      </Text>
    </View>
  );
}

/** A job language: filled green when the worker speaks it. */
export function LanguageTag({ language, spoken, large }) {
  const t = useT();
  return (
    <View
      accessibilityLabel={t(`lang.${language}`)}
      style={[
        styles.tag,
        {
          height: large ? 30 : 28,
          backgroundColor: spoken ? colors.likeTint : 'transparent',
          borderWidth: 1.5,
          borderColor: spoken ? colors.likeTint : colors.n400,
          gap: 5,
        },
      ]}
    >
      {spoken ? <Icon name="check" size={large ? 15 : 14} strokeWidth={3} color={colors.likeInk} /> : null}
      <Text variant="chip" style={!large && { fontSize: 13 }} color={spoken ? colors.likeInk : colors.ink}>
        {large ? t(`lang.${language}`) : language.toUpperCase()}
      </Text>
    </View>
  );
}

/** Square dot with an expanding ring — "waiting for reply". */
export function Pulse({ color = colors.ink }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p]);
  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.get() * 1.8 }],
    opacity: 0.55 * (1 - p.get()),
  }));
  return (
    <View style={styles.pulse}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color }, ring]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
    </View>
  );
}

export function StatusPill({ status }) {
  const t = useT();
  if (status === 'pending')
    return (
      <View style={[styles.pill, { backgroundColor: colors.n200, gap: 8 }]} accessibilityLabel={t('status.pending')}>
        <Pulse />
        <Text variant="chip" style={styles.pillText}>
          {t('status.pending')}
        </Text>
      </View>
    );
  if (status === 'matched')
    return (
      <View style={[styles.pill, { backgroundColor: colors.like }]}>
        <Icon name="check" size={14} strokeWidth={3} color={colors.white} />
        <Text style={[styles.pillText, { fontFamily: fonts.heavy }]} color={colors.white}>
          {t('status.matched')}
        </Text>
      </View>
    );
  return (
    <View style={[styles.pill, { borderWidth: 1.5, borderColor: colors.n400 }]}>
      <Text variant="chip" style={styles.pillText} color={colors.inkMuted}>
        {t('status.declined')}
      </Text>
    </View>
  );
}

/** Small section label: "WHY THIS JOB". */
export function Kicker({ children, color = colors.inkMuted, style }) {
  return (
    <Text variant="label" color={color} style={[{ fontSize: 12 }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  selChip: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  gridChip: { height: 46, paddingHorizontal: 10 },
  selChipText: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20 },
  code: { fontFamily: fonts.heavy, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  preset: { flex: 1 },
  chip: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  pill: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
  },
  pillText: { fontSize: 13, lineHeight: 16 },
  pulse: { width: 8, height: 8, borderRadius: 2, overflow: 'hidden' },
});
