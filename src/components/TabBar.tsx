import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Discover', icon: 'layers' },
  liked: { label: 'Liked', icon: 'heart' },
  matches: { label: 'Matches', icon: 'badge' },
  profile: { label: 'Profile', icon: 'user' },
};

/** Square tab bar: 2px ink rule, red top indicator on the active tab, badge on Matches. */
export function TabBar({ state, navigation, badge }: TabBarProps & { badge: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const active = state.index === i;
        const color = active ? colors.primary : colors.inkMuted;
        const showBadge = route.name === 'matches' && badge > 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={showBadge ? `${tab.label}, ${badge} new` : tab.label}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}>
            <View style={[styles.indicator, { backgroundColor: active ? colors.primary : 'transparent' }]} />
            <Icon name={tab.icon} size={26} strokeWidth={active ? 2.5 : 2} color={color} />
            <Text style={[styles.label, { fontFamily: active ? fonts.heavy : fonts.semibold }]} color={color}>{tab.label}</Text>
            {showBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} color={colors.white}>{String(badge)}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.bg, borderTopWidth: 2, borderTopColor: colors.ink },
  tab: { flex: 1, height: 49, alignItems: 'center', justifyContent: 'center', gap: 3 },
  indicator: { position: 'absolute', left: 0, right: 0, top: -2, height: 4 },
  label: { fontSize: 11, lineHeight: 12, letterSpacing: 0.1 },
  badge: { position: 'absolute', top: 2, left: '50%', marginLeft: 6, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.bg },
  badgeText: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 15 },
});
