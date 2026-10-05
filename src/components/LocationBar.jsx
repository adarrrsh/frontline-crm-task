import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

const TILE = {
  ok: colors.primary,
  warn: colors.warningSolid,
  off: colors.ink,
  loading: colors.n500,
};

/** Discover header: where you're searching from (tap to change) + the radius chip. */
export function LocationBar({ title, subtitle, icon = 'pin', tone = 'ok', radius, onPressLocation, onPressRadius }) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityHint="Change location"
        onPress={onPressLocation}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={[styles.tile, { backgroundColor: TILE[tone] }]}>
          <Icon name={icon} size={20} strokeWidth={2.5} color={colors.white} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text numberOfLines={1} style={styles.sub} color={colors.inkMuted}>
            {subtitle}
          </Text>
        </View>
        <Icon name="chev-d" size={20} strokeWidth={2.5} />
      </Pressable>
      {radius && onPressRadius ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Travel distance ${radius}`}
          accessibilityHint="Change how far you'll travel"
          onPress={onPressRadius}
          style={({ pressed }) => [styles.radius, pressed && styles.pressed]}
        >
          <Icon name="sliders" size={18} strokeWidth={2.5} />
          <Text style={styles.radiusText}>{radius}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 52, flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.n300 },
  tile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  title: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 18 },
  sub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15 },
  radius: {
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    borderRadius: radius.md,
  },
  radiusText: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 18 },
});
