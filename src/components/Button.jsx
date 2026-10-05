import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius, touch } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

const V = {
  primary: {
    bg: colors.primary,
    pressed: colors.primaryPressed,
    fg: colors.bg,
  },
  ink: { bg: colors.ink, pressed: colors.inkSoft, fg: colors.bg },
  secondary: {
    bg: 'transparent',
    pressed: colors.n200,
    fg: colors.ink,
    border: colors.ink,
  },
  destructive: {
    bg: 'transparent',
    pressed: colors.primaryTint,
    fg: colors.primaryDeep,
    border: colors.primaryDeep,
  },
  onAccent: { bg: colors.bg, pressed: colors.white, fg: colors.ink },
  outlineLight: {
    bg: 'transparent',
    pressed: colors.primaryPressed,
    fg: colors.white,
    border: colors.white,
  },
};

/** Square, flush-left button from the Modernist system. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  disabled,
  style,
  height = touch.button,
  accessibilityHint,
}) {
  const v = V[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: pressed ? v.pressed : v.bg,
          opacity: disabled ? 0.45 : 1,
        },
        v.border ? { borderWidth: 2, borderColor: v.border } : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} strokeWidth={2.5} color={v.fg} /> : null}
      <Text variant="headline" color={v.fg} style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {iconRight ? <Icon name={iconRight} size={22} strokeWidth={2.5} color={v.fg} /> : null}
      <View style={styles.spacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
  },
  label: {
    fontFamily: fonts.heavy,
    fontSize: 18,
    lineHeight: 22,
    flexShrink: 1,
  },
  spacer: { flex: 1 },
});
