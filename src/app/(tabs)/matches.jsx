import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ContactSheet } from '@/components/ContactSheet';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatDistance } from '@/domain/geo';
import { useLikedJobs } from '@/hooks/useLikedJobs';
import { useT } from '@/hooks/useT';
import { payLabel, timeAgo } from '@/i18n/format';
import { useAppStore } from '@/store/useAppStore';
import { categoryColor, colors, fonts, radius, shadows } from '@/theme';

export default function Matches() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const rows = useLikedJobs()
    .filter((r) => r.liked.status === 'matched')
    .sort((a, b) => (b.liked.resolvedAt ?? 0) - (a.liked.resolvedAt ?? 0));
  const markMatchesSeen = useAppStore((s) => s.markMatchesSeen);
  // NEW tags use the "seen" mark from when you arrived; the tab badge clears right away.
  const [seenAt, setSeenAt] = useState(() => useAppStore.getState().matchesSeenAt);
  const [contact, setContact] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setSeenAt(useAppStore.getState().matchesSeenAt);
      setNow(Date.now());
      markMatchesSeen(Date.now());
      return () => markMatchesSeen(Date.now());
    }, [markMatchesSeen]),
  );

  const newCount = rows.filter((r) => (r.liked.resolvedAt ?? 0) > seenAt).length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">
          {t('matches.title')}
        </Text>
        {newCount > 0 ? (
          <Text style={styles.newCount} color={colors.primaryDeep}>
            {t('matches.new', { count: newCount })}
          </Text>
        ) : null}
      </View>
      {rows.length === 0 ? (
        <EmptyState
          style={styles.empty}
          icon="badge"
          tone="accent"
          title={t('matches.emptyTitle')}
          body={t('matches.emptyBody')}
          primary={{
            label: t('matches.backToDiscover'),
            icon: 'layers',
            onPress: () => router.navigate('/'),
          }}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.job.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MatchCard
              row={item}
              isNew={(item.liked.resolvedAt ?? 0) > seenAt}
              now={now}
              onContact={() => setContact(item.employer ?? null)}
            />
          )}
        />
      )}
      <ContactSheet employer={contact} onClose={() => setContact(null)} />
    </View>
  );
}

function MatchCard({ row: { job, employer, liked, distanceKm }, isNew, now, onContact }) {
  const t = useT();
  const c = categoryColor[job.category];
  const open = () =>
    router.push({
      pathname: '/job/[id]',
      params: { id: job.id, from: 'matches' },
    });
  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
        <View style={{ height: 6, backgroundColor: c }} />
        <View style={styles.cardBody}>
          <View style={styles.who}>
            <View style={[styles.mono, { backgroundColor: c }]}>
              <Text style={styles.monoText} color={colors.white}>
                {employer?.monogram ?? ''}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="callout" numberOfLines={1}>
                {employer?.name}
              </Text>
              <View style={styles.when}>
                <View style={styles.dot} />
                <Text style={styles.whenText} color={colors.likeInk}>{t('matches.matchedAgo', { ago: timeAgo(t, liked.resolvedAt ?? now, now) })}</Text>
              </View>
            </View>
            {isNew ? (
              <View style={styles.newTag}>
                <Text style={styles.newText} color={colors.white}>
                  {t('matches.newTag')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.facts}>
            <Text style={styles.fact}>{payLabel(t, job)}</Text>
            <View style={styles.inline}>
              <Icon name="pin" size={16} strokeWidth={2.5} />
              <Text style={styles.fact}>{distanceKm !== null ? `${formatDistance(distanceKm)} · ${job.area}` : job.area}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button label={t('matches.contact')} icon="phone" height={52} onPress={onContact} style={{ flex: 1 }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('matches.viewJob')}
              onPress={open}
              style={({ pressed }) => [styles.view, pressed && { backgroundColor: colors.n200 }]}
            >
              <Icon name="chev-r" size={22} strokeWidth={2.75} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  newCount: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 18 },
  empty: { marginHorizontal: 16, marginTop: 24, marginBottom: 16 },
  list: { padding: 16, paddingTop: 24, gap: 14 },
  cardShadow: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardBody: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mono: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  monoText: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 20 },
  when: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 2, backgroundColor: colors.like },
  whenText: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 16 },
  newTag: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  newText: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.heavy,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  fact: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  view: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
});
