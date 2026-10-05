import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/hooks/useT';
import { colors, fonts } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

const TAB_ICON = {
  index: 'layers',
  liked: 'heart',
  matches: 'badge',
  profile: 'user',
};

/** Square tab bar: 2px ink rule, red top indicator on the active tab, badge on Matches. */
export function TabBar({ state, navigation, badge }) {
  const insets = useSafeAreaInsets();
  const t = useT();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const icon = TAB_ICON[route.name];
        if (!icon) return null;
        const label = t(`tab.${route.name}`);
        const active = state.index === i;
        const color = active ? colors.primary : colors.inkMuted;
        const showBadge = route.name === 'matches' && badge > 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={showBadge ? t('tab.badge', { label, count: badge }) : label}
            onPress={() => {
              const e = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <View style={[styles.indicator, { backgroundColor: active ? colors.primary : 'transparent' }]} />
            <Icon name={icon} size={26} strokeWidth={active ? 2.5 : 2} color={color} />
            <Text style={[styles.label, { fontFamily: active ? fonts.heavy : fonts.semibold }]} color={color}>
              {label}
            </Text>
            {showBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} color={colors.white}>
                  {String(badge)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  tab: {
    flex: 1,
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  indicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: -2,
    height: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  label: { fontSize: 11, lineHeight: 12, letterSpacing: 0.1 },
  badge: {
    position: 'absolute',
    top: 2,
    left: '50%',
    marginLeft: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
    borderRadius: 11,
  },
  badgeText: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 15 },
});
