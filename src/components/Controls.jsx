import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export function Stepper({ value, onDecrement, onIncrement, canDecrement = true, canIncrement = true, size = 'compact', label }) {
  const large = size === 'large';
  const h = large ? 56 : 48;
  const btn = large ? 64 : 48;
  return (
    <View
      style={[styles.stepper, { height: h }, large && { alignSelf: 'stretch' }]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? onIncrement() : onDecrement())}
    >
      <Pressable
        accessibilityLabel={`Less ${label}`}
        disabled={!canDecrement}
        onPress={onDecrement}
        style={({ pressed }) => [
          styles.stepBtn,
          { width: btn, borderRightWidth: 2, opacity: canDecrement ? 1 : 0.4 },
          pressed && styles.stepPressed,
        ]}
      >
        <Icon name="minus" size={large ? 24 : 20} strokeWidth={2.75} />
      </Pressable>
      <View style={[styles.stepValue, large ? { flex: 1 } : { minWidth: 104 }]}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.heavy,
            fontSize: large ? 22 : 18,
            lineHeight: 26,
          }}
        >
          {value}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`More ${label}`}
        disabled={!canIncrement}
        onPress={onIncrement}
        style={({ pressed }) => [
          styles.stepBtn,
          { width: btn, borderLeftWidth: 2, opacity: canIncrement ? 1 : 0.4 },
          pressed && styles.stepPressed,
        ]}
      >
        <Icon name="plus" size={large ? 24 : 20} strokeWidth={2.75} />
      </Pressable>
    </View>
  );
}

/** Square switch: green when on. */
export function Toggle({ value, onChange, label }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.toggle, { backgroundColor: value ? colors.like : colors.n400 }]}
    >
      <View style={[styles.knob, value ? { right: 3 } : { left: 3 }]} />
    </Pressable>
  );
}

export function ToggleRow({ title, subtitle, ...toggle }) {
  return (
    <Pressable onPress={() => toggle.onChange(!toggle.value)} style={styles.toggleRow} accessible={false}>
      <View style={{ flex: 1 }}>
        <Text variant="headline">{title}</Text>
        {subtitle ? (
          <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Toggle {...toggle} />
    </Pressable>
  );
}

/** Segmented progress for onboarding: back chevron · 4 bars · "2/4". */
export function StepHeader({ step, total, onBack }) {
  return (
    <View style={styles.stepHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} disabled={!onBack} style={styles.back}>
        {onBack ? <Icon name="chev-l" size={28} strokeWidth={2.5} /> : null}
      </Pressable>
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < step ? colors.primary : colors.n300 }]} />
        ))}
      </View>
      <Text style={styles.stepCount} color={colors.inkMuted}>{`${step}/${total}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  stepBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.ink,
  },
  stepPressed: { backgroundColor: colors.n300 },
  stepValue: { justifyContent: 'center', paddingHorizontal: 12 },
  toggle: { width: 56, height: 32, borderRadius: radius.md },
  knob: {
    position: 'absolute',
    top: 3,
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
  },
  stepHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 16,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  stepCount: {
    width: 30,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
  },
});
