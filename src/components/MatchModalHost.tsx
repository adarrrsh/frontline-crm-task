import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { distanceKm, formatDistance } from '@/domain/geo';
import { CATEGORY_ICON, CATEGORY_LABEL, payLabel } from '@/domain/labels';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useUiStore } from '@/store/useUiStore';
import { categoryColor, colors, fonts, shadows } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

const CONFETTI_COLORS = [...Object.values(categoryColor), colors.white, colors.ink];

function ConfettiPiece({ i }: { i: number }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const size = 8 + (i % 3) * 5;
  const duration = 3200 + (i % 5) * 600;
  useEffect(() => {
    t.set(withDelay((i * 370) % duration, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)));
  }, [t, i, duration]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -60 + t.get() * (height + 120) }, { rotate: `${t.get() * 520}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute', top: 0, left: (i * 53) % width, width: size, height: size, backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }, style]} />;
}

/** "It's a match!" — the one moment red runs full-bleed. Shows queued matches one at a time. */
export function MatchModalHost() {
  const jobId = useUiStore((s) => s.matchQueue[0]);
  const dismiss = useUiStore((s) => s.dismissMatch);
  const job = useCatalogStore((s) => (jobId ? s.jobsById.get(jobId) : undefined));
  const employer = useCatalogStore((s) => (job ? s.employersById.get(job.employerId) : undefined));
  const { coords } = useEffectiveLocation();
  const insets = useSafeAreaInsets();

  if (!job || !employer) return null;
  const c = categoryColor[job.category];
  const dist = coords ? `${formatDistance(distanceKm(coords, job.location))} · ` : '';

  return (
    <Modal visible animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <StatusBar style="light" />
      <View style={[styles.screen, { paddingTop: insets.top + 42, paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: 22 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
        </View>
        <Animated.View entering={FadeIn.duration(250)} style={styles.headline}>
          <Text variant="label" color={colors.white} style={{ fontSize: 14, letterSpacing: 1.7 }}>New match</Text>
          <Text style={styles.big} color={colors.white} accessibilityRole="header">{"It's a match!"}</Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(150).duration(300)} style={styles.card}>
          <View style={[styles.mono, { backgroundColor: c }]}>
            <Text style={styles.monoText} color={colors.white}>{employer.monogram}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.catRow}>
              <Icon name={CATEGORY_ICON[job.category]} size={14} strokeWidth={2.5} color={c} />
              <Text style={styles.cat} color={c}>{CATEGORY_LABEL[job.category]}</Text>
            </View>
            <Text style={styles.title}>{job.title}</Text>
            <Text variant="callout">{`${payLabel(job)} · ${dist}${job.area}`}</Text>
          </View>
        </Animated.View>

        <Text style={styles.wants} color={colors.white}>{`${employer.name} wants to hear from you!`}</Text>

        <View style={{ flex: 1 }} />
        <View style={styles.actions}>
          <Button label="View match" variant="onAccent" iconRight="arrow"
            onPress={() => {
              dismiss();
              router.push({ pathname: '/job/[id]', params: { id: job.id, from: 'Matches' } });
            }} />
          <Button label="Keep swiping" variant="outlineLight" onPress={dismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.match, paddingHorizontal: 24 },
  headline: { gap: 14 },
  big: { fontFamily: fonts.heavy, fontSize: 84, lineHeight: 74, letterSpacing: -4, paddingTop: 8 },
  card: { flexDirection: 'row', backgroundColor: colors.bg, marginTop: 56, ...shadows.lg },
  mono: { width: 96, alignItems: 'center', justifyContent: 'center' },
  monoText: { fontFamily: fonts.heavy, fontSize: 30, lineHeight: 34 },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cat: { fontFamily: fonts.heavy, fontSize: 12, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontFamily: fonts.heavy, fontSize: 24, lineHeight: 26, letterSpacing: -0.5 },
  wants: { fontFamily: fonts.heavy, fontSize: 28, lineHeight: 31, letterSpacing: -0.5, marginTop: 28 },
  actions: { gap: 8, marginHorizontal: -8 },
});
