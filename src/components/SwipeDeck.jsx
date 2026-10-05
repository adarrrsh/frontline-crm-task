import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useT } from '@/hooks/useT';
import { colors, fonts, radius, shadows } from '@/theme';

import { JobCard, jobAccessibilityLabel } from './JobCard';
import { Text } from './Text';

const COMMIT_FRACTION = 0.3;
const COMMIT_VELOCITY = 800;
const MAX_TILT_DEG = 12;

/** Top card is interactive; the next card sits underneath and grows into place as you drag. */
export function SwipeDeck({ deck, employersById, onSwipe, drag, flingRef }) {
  const [top, next] = deck;
  return (
    <View style={styles.area}>
      {deck.length > 2 ? <View style={[styles.plate, styles.plate2]} /> : null}
      {next ? (
        <NextCard key={`next-${next.job.id}`} ranked={next} employer={employersById.get(next.job.employerId)} drag={drag} />
      ) : null}
      {top ? (
        <TopCard
          key={top.job.id}
          ranked={top}
          employer={employersById.get(top.job.employerId)}
          onSwipe={onSwipe}
          drag={drag}
          flingRef={flingRef}
        />
      ) : null}
    </View>
  );
}

function NextCard({ ranked, employer, drag }) {
  const { width } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(drag.get()), [0, width * COMMIT_FRACTION], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: 10 * (1 - p) }, { scale: 0.945 + 0.055 * p }],
      opacity: 0.9 + 0.1 * p,
    };
  });
  return (
    <Animated.View
      style={[styles.cardFrame, styles.nextFrame, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <JobCard ranked={ranked} employer={employer} />
    </Animated.View>
  );
}

function TopCard({ ranked, employer, onSwipe, drag, flingRef }) {
  const t = useT();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(false);

  useEffect(() => {
    drag.set(0);
  }, [drag]);

  const commit = (dir) => onSwipe(ranked, dir);

  const flyOut = (dir, vx = 0) => {
    'worklet';
    if (gone.get()) return;
    gone.set(true);
    const target = (dir === 'like' ? 1 : -1) * width * 1.5;
    const duration = Math.max(160, 260 - Math.abs(vx) / 20);
    x.set(
      withTiming(target, { duration }, (done) => {
        if (done) scheduleOnRN(commit, dir);
      }),
    );
    drag.set(withTiming(target, { duration }));
  };

  useEffect(() => {
    flingRef.current = (dir) => flyOut(dir);
    return () => {
      flingRef.current = null;
    };
  });

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      if (gone.get()) return;
      x.set(e.translationX);
      y.set(e.translationY * 0.25);
      drag.set(e.translationX);
    })
    .onEnd((e) => {
      // Project where the card is heading so a quick flick counts even with a short drag.
      const projected = x.get() + e.velocityX * 0.15;
      const passed = Math.abs(x.get()) > width * COMMIT_FRACTION || Math.abs(e.velocityX) > COMMIT_VELOCITY;
      if (passed && Math.sign(projected) === Math.sign(x.get())) {
        flyOut(projected > 0 ? 'like' : 'pass', e.velocityX);
      } else {
        x.set(withSpring(0, { damping: 18, stiffness: 220 }));
        y.set(withSpring(0, { damping: 18, stiffness: 220 }));
        drag.set(withSpring(0, { damping: 18, stiffness: 220 }));
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      {
        rotate: `${interpolate(x.get(), [-width / 2, 0, width / 2], [-MAX_TILT_DEG, 0, MAX_TILT_DEG])}deg`,
      },
    ],
    borderColor: interpolateColor(x.get(), [0, 60], [colors.ink, colors.like]),
  }));
  const likeTint = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, 100], [0, 1], Extrapolation.CLAMP),
  }));
  const passTint = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-100, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.cardFrame, styles.topFrame, cardStyle]}
        accessible
        accessibilityLabel={jobAccessibilityLabel(t, ranked, employer)}
        accessibilityHint={t('deck.hint')}
        accessibilityActions={[
          { name: 'like', label: t('actions.interested') },
          { name: 'pass', label: t('actions.pass') },
        ]}
        onAccessibilityAction={(e) => flyOut(e.nativeEvent.actionName === 'like' ? 'like' : 'pass')}
      >
        <JobCard ranked={ranked} employer={employer} />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: 'rgba(24,134,75,0.10)' }, likeTint]}
        >
          <View style={[styles.stamp, styles.stampLike]}>
            <Text style={[styles.stampText, { fontSize: 34, color: colors.like }]}>{t('deck.stampLike')}</Text>
          </View>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: 'rgba(32,30,29,0.08)' }, passTint]}
        >
          <View style={[styles.stamp, styles.stampPass]}>
            <Text style={[styles.stampText, { fontSize: 38, letterSpacing: 2.2 }]}>{t('deck.stampPass')}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1 },
  plate: {
    position: 'absolute',
    backgroundColor: colors.n200,
    borderWidth: 2,
    borderColor: colors.n500,
    borderRadius: radius.lg,
  },
  plate2: { top: 20, bottom: -20, left: 20, right: 20 },
  cardFrame: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  tint: { borderRadius: radius.lg - 2 },
  nextFrame: { borderColor: colors.n600, ...shadows.sm },
  topFrame: { ...shadows.lg },
  stamp: {
    position: 'absolute',
    top: 40,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 5,
    borderRadius: radius.md,
    backgroundColor: 'rgba(248,244,244,0.92)',
  },
  stampLike: {
    left: 18,
    borderColor: colors.like,
    transform: [{ rotate: '-14deg' }],
  },
  stampPass: {
    right: 18,
    borderColor: colors.ink,
    transform: [{ rotate: '14deg' }],
  },
  stampText: { fontFamily: fonts.heavy, lineHeight: 40, letterSpacing: 1.4 },
});
