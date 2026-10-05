import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/Chips';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatDistance } from '@/domain/geo';
import { useLikedJobs } from '@/hooks/useLikedJobs';
import { useT } from '@/hooks/useT';
import { payLabel } from '@/i18n/format';
import { categoryColor, colors, fonts, radius } from '@/theme';

export default function Liked() {
  const insets = useSafeAreaInsets();
  const rows = useLikedJobs();
  const t = useT();
  const [filter, setFilter] = useState('all');

  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.liked.status === 'pending').length,
    matched: rows.filter((r) => r.liked.status === 'matched').length,
  };
  const shown = filter === 'all' ? rows : rows.filter((r) => r.liked.status === filter);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">
          {t('liked.title')}
        </Text>
        {rows.length > 0 ? (
          <Text variant="callout" color={colors.inkMuted}>
            {t('common.jobs', { count: rows.length })}
          </Text>
        ) : null}
      </View>

      {rows.length === 0 ? (
        <EmptyState
          style={styles.empty}
          icon="heart"
          tone="like"
          title={t('liked.emptyTitle')}
          body={t('liked.emptyBody')}
          primary={{
            label: t('liked.startSwiping'),
            icon: 'layers',
            onPress: () => router.navigate('/'),
          }}
        />
      ) : (
        <>
          <View style={styles.segment} accessibilityRole="tablist">
            {[
              ['all', t('liked.all')],
              ['pending', t('liked.waiting')],
              ['matched', t('liked.matched')],
            ].map(([key, label], i) => {
              const on = filter === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setFilter(key)}
                  style={[styles.segOpt, i > 0 && styles.segDivider, on && { backgroundColor: colors.ink }]}
                >
                  <Text
                    style={[styles.segText, { fontFamily: on ? fonts.heavy : fonts.bold }]}
                    color={on ? colors.bg : colors.ink}
                  >{`${label} ${counts[key]}`}</Text>
                </Pressable>
              );
            })}
          </View>
          <FlatList
            data={shown}
            keyExtractor={(r) => r.job.id}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => <LikedRowView row={item} />}
            ListEmptyComponent={
              <Text variant="callout" color={colors.inkMuted} style={{ paddingVertical: 20 }}>
                {t('liked.nothing')}
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}

function LikedRowView({ row: { job, employer, liked, distanceKm } }) {
  const t = useT();
  const faded = liked.status === 'declined';
  const meta = [payLabel(t, job), distanceKm !== null ? formatDistance(distanceKm) : null].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${employer?.name}. ${meta}`}
      onPress={() =>
        router.push({
          pathname: '/job/[id]',
          params: { id: job.id, from: 'liked' },
        })
      }
      style={({ pressed }) => [styles.row, { opacity: faded ? 0.6 : 1 }, pressed && { backgroundColor: colors.n200 }]}
    >
      <View style={[styles.mono, { backgroundColor: categoryColor[job.category] }]}>
        <Text style={styles.monoText} color={colors.white}>
          {employer?.monogram ?? ''}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.title}>{job.title}</Text>
        <Text numberOfLines={1} style={styles.emp} color={colors.inkMuted}>
          {employer?.name}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
        <View style={{ marginTop: 6 }}>
          <StatusPill status={liked.status} />
        </View>
      </View>
      <Icon name="chev-r" size={22} strokeWidth={2.5} color={colors.n600} />
    </Pressable>
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
  empty: { marginHorizontal: 16, marginTop: 24, marginBottom: 16 },
  segment: {
    height: 44,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  segOpt: { flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  segDivider: { borderLeftWidth: 2, borderLeftColor: colors.ink },
  segText: { fontSize: 15, lineHeight: 18 },
  list: {
    marginTop: 16,
    marginHorizontal: 16,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderRadius: radius.sm,
  },
  mono: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.md,
  },
  monoText: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 20 },
  title: { fontFamily: fonts.heavy, fontSize: 18, lineHeight: 21 },
  emp: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 18 },
  meta: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, marginTop: 1 },
});
