import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

export function Spinner({ size = 24, color = colors.primary }: { size?: number; color?: string }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.set(withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false));
  }, [r]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.get()}deg` }] }));
  return (
    <Animated.View style={[{ width: size, height: size }, spin]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="square">
        <Path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </Svg>
    </Animated.View>
  );
}

function useShimmer() {
  const o = useSharedValue(1);
  useEffect(() => {
    o.set(withRepeat(withTiming(0.55, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [o]);
  return useAnimatedStyle(() => ({ opacity: o.get() }));
}

/** Skeleton that mirrors the real card's blocks so nothing jumps when data lands. */
export function SkeletonCard() {
  const shimmer = useShimmer();
  const bar = (w: DimensionValue, h: number) => <Animated.View style={[{ width: w, height: h, backgroundColor: colors.n300 }, shimmer]} />;
  const rule = <View style={{ height: 2, backgroundColor: colors.n300 }} />;
  return (
    <View style={styles.card} accessibilityLabel="Loading jobs">
      <View style={styles.row}>
        {bar(48, 48)}
        <View style={{ gap: 6 }}>
          {bar(150, 14)}
          {bar(90, 12)}
        </View>
      </View>
      {bar('75%', 30)}
      {bar(150, 50)}
      {bar(170, 18)}
      {rule}
      <View style={styles.row}>
        {bar(80, 30)}
        {bar(86, 30)}
        {bar(110, 30)}
      </View>
      {bar(160, 18)}
      {rule}
      <View style={styles.row}>
        {bar(130, 32)}
        {bar(140, 32)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.n400, paddingVertical: 24, paddingHorizontal: 18, gap: 14 },
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
});
