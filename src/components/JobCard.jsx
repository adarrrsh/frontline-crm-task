import { StyleSheet, View } from 'react-native';

import { formatDistance } from '@/domain/geo';
import { CATEGORY_ICON, CATEGORY_LABEL, EMPLOYMENT_LABEL, hoursLabel, SHIFT_LABEL, START_LABEL } from '@/domain/labels';
import { categoryColor, colors, fonts, radius } from '@/theme';

import { ReasonChip, RequirementTag, ShiftTag, WarningChip } from './Chips';
import { Icon } from './Icon';
import { Text } from './Text';

export function jobAccessibilityLabel({ job, distanceKm, reasons, warnings }, employer) {
  return [
    `${job.title} at ${employer?.name ?? 'employer'}`,
    `$${job.payPerHour} an hour${job.tips ? ' plus tips' : ''}`,
    `${formatDistance(distanceKm)} away in ${job.area}`,
    job.shifts.map((s) => SHIFT_LABEL[s]).join(', '),
    START_LABEL[job.startsAt],
    ...reasons.map((r) => r.text),
    ...warnings.map((w) => w.text),
  ].join('. ');
}

/** Card body. Reads top-down: who, what, how much, how far, when, why. */
export function JobCard({ ranked, employer }) {
  const { job, distanceKm, reasons, warnings } = ranked;
  const c = categoryColor[job.category];
  return (
    <View style={styles.card}>
      <View style={{ height: 8, backgroundColor: c }} />
      <View style={styles.body}>
        <View style={styles.who}>
          <View style={[styles.mono, { backgroundColor: c }]}>
            <Text style={styles.monoText} color={colors.white}>
              {employer?.monogram ?? '··'}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text numberOfLines={1} style={styles.employer}>
              {employer?.name ?? ''}
            </Text>
            <View style={styles.catRow}>
              <Icon name={CATEGORY_ICON[job.category]} size={16} strokeWidth={2.5} color={c} />
              <Text style={styles.cat} color={c}>
                {CATEGORY_LABEL[job.category]}
              </Text>
            </View>
          </View>
        </View>

        <Text variant="title2" numberOfLines={2}>
          {job.title}
        </Text>

        <View style={styles.payRow}>
          <Text variant="pay">{`$${job.payPerHour}`}</Text>
          <Text style={styles.unit}>{job.tips ? '/hr + tips' : '/hr'}</Text>
        </View>

        <View style={styles.inline}>
          <Icon name="pin" size={20} strokeWidth={2.5} />
          <Text style={styles.distance} numberOfLines={1}>{`${formatDistance(distanceKm)} · ${job.area}`}</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.wrap}>
          {job.shifts.map((s) => (
            <ShiftTag key={s} label={SHIFT_LABEL[s]} />
          ))}
          <Text
            style={styles.hours}
            color={colors.inkSoft}
          >{`${hoursLabel(job)} · ${EMPLOYMENT_LABEL[job.employmentType]}`}</Text>
        </View>

        <View style={styles.inline}>
          <Icon name="calendar" size={18} strokeWidth={2.5} />
          <Text style={styles.start}>{START_LABEL[job.startsAt]}</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.wrap}>
          {reasons.map((r) => (
            <ReasonChip key={r.kind} reason={r} />
          ))}
          {warnings.map((w) => (
            <WarningChip key={w.kind} text={w.text} />
          ))}
        </View>

        {job.requirements.length > 0 ? (
          <View style={[styles.wrap, styles.needs]}>
            <Text variant="label" color={colors.inkMuted} style={{ fontSize: 12, marginRight: 2 }}>
              Needs
            </Text>
            {job.requirements.slice(0, 2).map((q) => (
              <RequirementTag key={q} label={q} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderRadius: radius.lg - 2,
  },
  body: {
    flex: 1,
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mono: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  monoText: {
    fontFamily: fonts.heavy,
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  employer: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 19 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cat: {
    fontFamily: fonts.heavy,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  payRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  unit: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 24 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distance: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    flexShrink: 1,
  },
  rule: { height: 2, backgroundColor: colors.line },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  hours: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  start: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  needs: { marginTop: 'auto' },
});
