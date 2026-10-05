import { useEffect } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { RADIUS_MAX, RADIUS_MIN } from '@/store/useAppStore';
import { colors, fonts, shadows } from '@/theme';

import { Text } from './Text';

interface Props {
  value: number;
  onChange: (km: number) => void;
  min?: number;
  max?: number;
  /** Thumb size: 28 inline, 32 in the sheet. */
  thumb?: number;
}

const toFrac = (v: number, min: number, max: number) => (v - min) / (max - min);

/** Square-thumb slider. Drag or tap anywhere on the track; values are whole km. */
export function RadiusSlider({ value, onChange, min = RADIUS_MIN, max = RADIUS_MAX, thumb = 28 }: Props) {
  const width = useSharedValue(0);
  const frac = useSharedValue(toFrac(value, min, max));
  const last = useSharedValue(value);

  useEffect(() => {
    frac.set(toFrac(value, min, max));
    last.set(value);
  }, [value, min, max, frac, last]);

  const update = (x: number) => {
    'worklet';
    if (width.get() <= 0) return;
    const f = Math.min(1, Math.max(0, x / width.get()));
    frac.set(f);
    const v = Math.round(min + f * (max - min));
    if (v !== last.get()) {
      last.set(v);
      scheduleOnRN(onChange, v);
    }
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .hitSlop({ vertical: 16 })
    .onBegin((e) => update(e.x))
    .onUpdate((e) => update(e.x))
    .onFinalize(() => {
      frac.set(toFrac(last.get(), min, max));
    });

  const fill = useAnimatedStyle(() => ({ width: frac.get() * width.get() }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: frac.get() * width.get() - thumb / 2 }] }));

  const onLayout = (e: LayoutChangeEvent) => {
    width.set(e.nativeEvent.layout.width);
  };

  return (
    <View>
      <GestureDetector gesture={gesture}>
        <View
          style={{ height: thumb, justifyContent: 'center' }}
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Travel distance"
          accessibilityValue={{ min, max, now: value, text: `${value} kilometres` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            onChange(Math.min(max, Math.max(min, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))
          }>
          <View style={styles.track} />
          <Animated.View style={[styles.fill, fill]} />
          <Animated.View style={[styles.thumb, { width: thumb, height: thumb }, knob]} />
        </View>
      </GestureDetector>
      <View style={styles.ends}>
        <Text style={styles.end} color={colors.inkMuted}>{`${min} km`}</Text>
        <Text style={styles.end} color={colors.inkMuted}>{`${max} km`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: colors.n300 },
  fill: { position: 'absolute', left: 0, height: 6, backgroundColor: colors.primary },
  thumb: { position: 'absolute', left: 0, backgroundColor: colors.bg, borderWidth: 3, borderColor: colors.ink, ...shadows.md },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  end: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16 },
});
