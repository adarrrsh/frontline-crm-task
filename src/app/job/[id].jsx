import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Kicker, LanguageTag, ReasonChip, RequirementTag, StatusPill, WarningChip } from '@/components/Chips';
import { ContactSheet } from '@/components/ContactSheet';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { formatDistance } from '@/domain/geo';
import { CATEGORY_ICON } from '@/domain/labels';
import { currencyOf, formatMoney } from '@/domain/money';
import { useJobDetails } from '@/hooks/useLikedJobs';
import { useT } from '@/hooks/useT';
import { hoursLabel, timeAgo } from '@/i18n/format';
import { useAppStore } from '@/store/useAppStore';
import { categoryColor, colors, fonts, radius } from '@/theme';

function Section({ title, children }) {
  return (
    <View>
      <Kicker style={{ marginBottom: 8 }}>{title}</Kicker>
      {children}
    </View>
  );
}

export default function JobDetail() {
  const { id, from } = useLocalSearchParams();
  const details = useJobDetails(id);
  const t = useT();
  const spoken = useAppStore((s) => s.profile.languages);
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!details) {
    return (
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + 16,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <EmptyState
          icon="search"
          tone="ink"
          title={t('job.gone')}
          primary={{ label: t('common.back'), icon: 'chev-l', onPress: goBack }}
        />
      </View>
    );
  }

  const { job, employer, liked, distanceKm, reasons, warnings } = details;
  const c = categoryColor[job.category];
  const matched = liked?.status === 'matched';
  const statusNote = !liked
    ? null
    : liked.status === 'matched'
      ? t('job.matchedNote', { ago: timeAgo(t, liked.resolvedAt ?? now, now) })
      : liked.status === 'pending'
        ? t('job.pendingNote', { ago: timeAgo(t, liked.likedAt, now) })
        : t('job.declinedNote');
  const fromLabel = from ? t(`tab.${from}`) : null;
  const languages = job.languages ?? [];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: matched ? 120 : insets.bottom + 24,
        }}
      >
        <View style={[styles.hero, { backgroundColor: c, paddingTop: insets.top + 4 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('job.backTo', { screen: fromLabel ?? t('job.previous') })}
            onPress={goBack}
            style={styles.back}
            hitSlop={6}
          >
            <Icon name="chev-l" size={26} strokeWidth={2.75} color={colors.white} />
            <Text style={styles.backText} color={colors.white}>
              {fromLabel ?? t('common.back')}
            </Text>
          </Pressable>
          <View style={styles.who}>
            <View style={styles.mono}>
              <Text style={styles.monoText} color={c}>
                {employer?.monogram ?? ''}
              </Text>
            </View>
            <View>
              <Text style={styles.emp} color={colors.white}>
                {employer?.name}
              </Text>
              <View style={styles.catRow}>
                <Icon name={CATEGORY_ICON[job.category]} size={14} strokeWidth={2.5} color={colors.white} />
                <Text style={styles.cat} color={colors.white}>
                  {t(`category.${job.category}`)}
                </Text>
              </View>
            </View>
          </View>
          <Text variant="title1" color={colors.white} style={{ marginTop: 16 }} accessibilityRole="header">
            {job.title}
          </Text>
        </View>

        <View style={styles.keyFacts}>
          <View style={styles.fact}>
            <Kicker>{t('job.pay')}</Kicker>
            <Text style={styles.factValue}>
              {t('pay.perHour', { amount: formatMoney(job.payPerHour, currencyOf(job)) })}
            </Text>
            {job.tips ? <Text style={styles.factSub}>{t('job.tips')}</Text> : null}
          </View>
          <View style={[styles.fact, styles.factDivider]}>
            <Kicker>{t('job.distance')}</Kicker>
            <Text style={styles.factValue}>{distanceKm !== null ? formatDistance(distanceKm) : '—'}</Text>
            <Text style={styles.factSub}>{job.area}</Text>
          </View>
        </View>

        {liked ? (
          <View style={[styles.status, { backgroundColor: matched ? colors.likeTint : 'transparent' }]}>
            <StatusPill status={liked.status} />
            <Text style={styles.statusNote} color={colors.inkSoft}>
              {statusNote}
            </Text>
          </View>
        ) : null}

        <View style={styles.body}>
          <Section title={t('job.shifts')}>
            {job.schedule.map((s) => (
              <View key={`${s.days}-${s.time}`} style={styles.slot}>
                <Text style={styles.slotDays}>{s.days}</Text>
                <Text style={styles.slotTime}>{s.time}</Text>
                <View style={styles.slotTag}>
                  <Text variant="chip" style={{ fontSize: 13 }}>
                    {t(`shift.${s.shift}`)}
                  </Text>
                </View>
              </View>
            ))}
          </Section>

          <View style={styles.triple}>
            {[
              [t('job.hours'), hoursLabel(t, job)],
              [t('job.type'), t(`employment.${job.employmentType}`)],
              [t('job.start'), t(`startShort.${job.startsAt}`)],
            ].map(([k, v], i) => (
              <View key={k} style={[styles.tripleCell, i > 0 && styles.tripleDivider]}>
                <Kicker>{k}</Kicker>
                <Text style={styles.tripleValue}>{v}</Text>
              </View>
            ))}
          </View>

          {reasons.length + warnings.length > 0 ? (
            <Section title={t('job.why')}>
              <View style={styles.wrap}>
                {reasons.map((r) => (
                  <ReasonChip key={r.kind} reason={r} />
                ))}
                {warnings.map((w) => (
                  <WarningChip key={w.kind} warning={w} />
                ))}
              </View>
            </Section>
          ) : null}

          {languages.length > 0 ? (
            <Section title={t('job.languages')}>
              <View style={styles.wrap}>
                {languages.map((l) => (
                  <LanguageTag key={l} language={l} spoken={spoken.includes(l)} large />
                ))}
              </View>
              {languages.length > 1 ? (
                <Text style={[styles.factSub, { marginTop: 8 }]} color={colors.inkMuted}>
                  {t('job.languagesHint')}
                </Text>
              ) : null}
            </Section>
          ) : null}

          {job.requirements.length > 0 ? (
            <Section title={t('job.requirements')}>
              <View style={styles.wrap}>
                {job.requirements.map((q) => (
                  <RequirementTag key={q} label={q} large />
                ))}
              </View>
            </Section>
          ) : null}

          <Section title={t('job.about')}>
            <Text variant="body">{job.description}</Text>
          </Section>
        </View>
      </ScrollView>

      {matched ? (
        <View style={[styles.sticky, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Button label={t('matches.contact')} icon="phone" onPress={() => setContactOpen(true)} />
        </View>
      ) : null}
      <ContactSheet employer={contactOpen ? (employer ?? null) : null} onClose={() => setContactOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  back: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    paddingRight: 8,
  },
  backText: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mono: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  monoText: { fontFamily: fonts.heavy, fontSize: 18, lineHeight: 22 },
  emp: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cat: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  keyFacts: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  fact: { flex: 1, paddingVertical: 14, paddingHorizontal: 16 },
  factDivider: { borderLeftWidth: 2, borderLeftColor: colors.ink },
  factValue: {
    fontFamily: fonts.heavy,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.9,
    marginTop: 4,
  },
  factSub: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
  },
  statusNote: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  body: { padding: 16, gap: 18 },
  slot: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  slotDays: {
    width: 104,
    fontFamily: fonts.heavy,
    fontSize: 15,
    lineHeight: 19,
  },
  slotTime: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 19,
  },
  slotTag: {
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: colors.n200,
    borderRadius: radius.sm,
  },
  triple: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.ink,
  },
  tripleCell: { flex: 1, paddingVertical: 10, paddingRight: 10 },
  tripleDivider: {
    borderLeftWidth: 2,
    borderLeftColor: colors.line,
    paddingLeft: 10,
  },
  tripleValue: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 2,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
  },
});
