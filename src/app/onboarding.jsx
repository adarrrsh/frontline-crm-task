import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLanguagePicker } from '@/components/AppLanguagePicker';
import { Button } from '@/components/Button';
import { CategoryChip, LanguageChip, ShiftChip } from '@/components/Chips';
import { StepHeader, Stepper, ToggleRow } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { LocationPickerSheet } from '@/components/LocationPickerSheet';
import { RadiusSlider } from '@/components/RadiusSlider';
import { Text } from '@/components/Text';
import { DEMO_PROFILE } from '@/data/demoProfile';
import { CATEGORY_ICON } from '@/domain/labels';
import { formatMoney } from '@/domain/money';
import { CATEGORIES, LANGUAGES, SHIFTS } from '@/domain/types';
import { useLocationActions } from '@/hooks/useLocationActions';
import { useLocationChoices } from '@/hooks/useLocationChoices';
import { useT } from '@/hooks/useT';
import { experienceLabel } from '@/i18n/format';
import { useAppStore } from '@/store/useAppStore';
import { categoryColor, colors, fonts, radius } from '@/theme';

const TOTAL = 4;

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function Onboarding() {
  const t = useT();
  const saved = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const { pickManual, switchToDevice } = useLocationActions();
  const choices = useLocationChoices();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(saved);
  const [picker, setPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const back = () => setStep((s) => (s > 1 ? s - 1 : s));

  const finishWithDevice = () => {
    saveProfile(draft);
    completeOnboarding();
    void switchToDevice();
  };
  const finishWithManual = (choice) => {
    setPicker(false);
    saveProfile(draft);
    pickManual(choice);
    completeOnboarding();
  };

  if (step === 1) {
    return (
      <Welcome
        onStart={() => setStep(2)}
        onDemo={() => {
          setDraft(DEMO_PROFILE);
          setStep(4);
        }}
      />
    );
  }

  const footerPad = { paddingBottom: Math.max(insets.bottom, 16) + 8 };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <StepHeader step={step} total={TOTAL} onBack={back} />

      {step === 2 ? (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View>
              <Text variant="title1" accessibilityRole="header">
                {t('onboarding.aboutTitle')}
              </Text>
              <Text variant="body" color={colors.inkSoft} style={{ marginTop: 10 }}>
                {t('onboarding.aboutBody')}
              </Text>
            </View>
            <View style={styles.field}>
              <Text variant="callout" style={styles.fieldLabel}>
                {t('onboarding.firstName')}
              </Text>
              <TextInput
                value={draft.name}
                onChangeText={(name) => patch({ name })}
                placeholder={t('onboarding.namePlaceholder')}
                placeholderTextColor={colors.n500}
                style={styles.input}
                autoCapitalize="words"
                autoComplete="given-name"
                returnKeyType="done"
                accessibilityLabel={t('onboarding.firstName')}
              />
            </View>
            <View style={styles.field}>
              <Text variant="callout" style={styles.fieldLabel}>
                {t('onboarding.experience')}
              </Text>
              <Stepper
                size="large"
                label={t('onboarding.experienceA11y')}
                value={experienceLabel(t, draft.experienceYears)}
                canDecrement={draft.experienceYears > 0}
                canIncrement={draft.experienceYears < 3}
                onDecrement={() =>
                  patch({
                    experienceYears: Math.max(0, draft.experienceYears - 1),
                  })
                }
                onIncrement={() =>
                  patch({
                    experienceYears: Math.min(3, draft.experienceYears + 1),
                  })
                }
              />
              <View style={styles.ticks}>
                {['0', '1', '2', '3+'].map((t, i) => (
                  <Text key={t} style={styles.tick} color={i === draft.experienceYears ? colors.ink : colors.inkMuted}>
                    {t}
                  </Text>
                ))}
              </View>
            </View>
            <View style={styles.ruled}>
              <ToggleRow
                title={t('onboarding.transport')}
                subtitle={t('onboarding.transportSub')}
                label={t('onboarding.transport')}
                value={draft.hasTransport}
                onChange={(hasTransport) => patch({ hasTransport })}
              />
            </View>
            <View style={styles.field}>
              <Text variant="callout" style={styles.fieldLabel}>
                {t('onboarding.languages')}
              </Text>
              <View style={styles.wrap}>
                {LANGUAGES.map((l) => (
                  <LanguageChip
                    key={l}
                    language={l}
                    selected={draft.languages.includes(l)}
                    onPress={() => patch({ languages: toggle(draft.languages, l) })}
                  />
                ))}
              </View>
              <Text style={styles.small} color={colors.inkMuted}>
                {t('onboarding.languagesHint')}
              </Text>
            </View>
          </ScrollView>
          <View style={[styles.footer, footerPad]}>
            <Button label={t('common.continue')} iconRight="arrow" disabled={!draft.name.trim()} onPress={() => setStep(3)} />
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <ScrollView contentContainerStyle={[styles.content, { gap: 18, paddingTop: 10 }]}>
            <Text variant="title2" accessibilityRole="header">
              {t('onboarding.lookingTitle')}
            </Text>
            <View style={styles.field}>
              <View style={styles.between}>
                <Text variant="callout" style={styles.fieldLabel}>
                  {t('onboarding.jobTypes')}
                </Text>
                <Text variant="callout" color={colors.inkMuted}>
                  {t('onboarding.pickAny')}
                </Text>
              </View>
              <View style={styles.grid}>
                {CATEGORIES.map((c) => (
                  <View key={c} style={styles.gridCell}>
                    <CategoryChip
                      grid
                      category={c}
                      selected={draft.categories.includes(c)}
                      onPress={() => patch({ categories: toggle(draft.categories, c) })}
                    />
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text variant="callout" style={styles.fieldLabel}>
                {t('onboarding.when')}
              </Text>
              <View style={styles.wrap}>
                {SHIFTS.map((s) => (
                  <ShiftChip
                    key={s}
                    shift={s}
                    selected={draft.shifts.includes(s)}
                    onPress={() => patch({ shifts: toggle(draft.shifts, s) })}
                  />
                ))}
              </View>
            </View>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text variant="callout" style={styles.fieldLabel}>
                  {t('onboarding.minPay')}
                </Text>
                <Text style={styles.small} color={colors.inkMuted}>
                  {t('onboarding.perHour')}
                </Text>
              </View>
              <Stepper
                label={t('onboarding.minPayA11y')}
                value={formatMoney(draft.minPayPerHour)}
                canDecrement={draft.minPayPerHour > 10}
                onDecrement={() =>
                  patch({
                    minPayPerHour: Math.max(10, draft.minPayPerHour - 1),
                  })
                }
                onIncrement={() =>
                  patch({
                    minPayPerHour: Math.min(60, draft.minPayPerHour + 1),
                  })
                }
              />
            </View>
            <View style={{ gap: 10 }}>
              <View style={styles.between}>
                <Text variant="callout" style={styles.fieldLabel}>
                  {t('onboarding.travel')}
                </Text>
                <Text style={styles.radiusValue}>{t('common.upToKm', { km: draft.maxDistanceKm })}</Text>
              </View>
              <RadiusSlider value={draft.maxDistanceKm} onChange={(maxDistanceKm) => patch({ maxDistanceKm })} />
            </View>
          </ScrollView>
          <View style={[styles.footer, footerPad]}>
            <Button label={t('common.continue')} iconRight="arrow" onPress={() => setStep(4)} />
          </View>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <View style={[styles.content, { flex: 1 }]}>
            <RadiusArt />
            <View style={{ gap: 12 }}>
              <Text style={styles.primerTitle} accessibilityRole="header">
                {t('onboarding.primerTitle')}
              </Text>
              <Text variant="body" color={colors.inkSoft} style={{ fontSize: 18, lineHeight: 26 }}>
                {t('onboarding.primerBody')}
              </Text>
            </View>
          </View>
          <View style={[styles.footer, footerPad, { gap: 8 }]}>
            <Button label={t('onboarding.enableLocation')} icon="nav" onPress={finishWithDevice} />
            <Button label={t('onboarding.chooseLocation')} variant="secondary" onPress={() => setPicker(true)} />
          </View>
        </>
      ) : null}

      <LocationPickerSheet
        visible={picker}
        choices={choices}
        radiusKm={draft.maxDistanceKm}
        onClose={() => setPicker(false)}
        onPick={finishWithManual}
        onUseDevice={() => {
          setPicker(false);
          finishWithDevice();
        }}
      />
    </View>
  );
}

function Welcome({ onStart, onDemo }) {
  const insets = useSafeAreaInsets();
  const t = useT();
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.poster, { paddingTop: insets.top + 18 }]}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <View style={styles.logoCut} />
          </View>
          <Text style={styles.brandText} color={colors.white}>
            Shiftmatch
          </Text>
        </View>
        <View style={{ marginTop: 18 }}>
          <AppLanguagePicker compact onAccent />
        </View>
        <View style={{ flex: 1 }} />
        <Text variant="display" color={colors.white} accessibilityRole="header">
          {t('welcome.title')}
        </Text>
        <Text style={styles.tagline} color={colors.white}>
          {t('welcome.tagline')}
        </Text>
        <View style={{ flex: 0.5 }} />
      </View>
      <View style={styles.strip}>
        {CATEGORIES.map((c) => (
          <View key={c} style={[styles.stripCell, { backgroundColor: categoryColor[c] }]}>
            <Icon name={CATEGORY_ICON[c]} size={28} strokeWidth={2.25} color={colors.white} />
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 6 }]}>
        <Button label={t('welcome.start')} variant="ink" iconRight="arrow" onPress={onStart} />
        <Pressable accessibilityRole="button" onPress={onDemo} style={styles.demoLink} hitSlop={8}>
          <Text style={styles.demoText} color={colors.primaryDeep}>
            {t('welcome.demo')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Concentric travel-radius squares on the grid, with a few job pins. */
function RadiusArt() {
  const ring = (size, label, fill, dashed) => (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          backgroundColor: fill,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderColor: dashed ? colors.n600 : colors.ink,
        },
      ]}
    >
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
  const pin = (left, top, c, faded) => (
    <View
      style={[
        styles.pinTile,
        {
          left: left,
          top: top,
          backgroundColor: categoryColor[c],
          opacity: faded ? 0.5 : 1,
        },
      ]}
    >
      <Icon name={CATEGORY_ICON[c]} size={16} strokeWidth={2.5} color={colors.white} />
    </View>
  );
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.artGrid}>
        {Array.from({ length: 60 }, (_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: i * 30 }]} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: i * 30 }]} />
        ))}
      </View>
      {ring(280, '20 km', 'transparent', true)}
      {ring(190, '10 km', 'rgba(236,48,19,0.06)')}
      {ring(100, '5 km', 'rgba(236,48,19,0.10)')}
      <View style={styles.centerPin}>
        <Icon name="pin" size={28} strokeWidth={2.5} color={colors.white} />
      </View>
      {pin('69%', '23%', 'hospitality')}
      {pin('27%', '70%', 'delivery')}
      {pin('83%', '80%', 'warehouse', true)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 28,
  },
  footer: { paddingHorizontal: 16, paddingTop: 12 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: fonts.bold },
  input: {
    height: 56,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.ink,
  },
  ticks: { flexDirection: 'row' },
  tick: { flex: 1, fontFamily: fonts.bold, fontSize: 13, lineHeight: 16 },
  ruled: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.line,
    paddingVertical: 4,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  gridCell: { width: '50%', padding: 3 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16 },
  radiusValue: { fontFamily: fonts.heavy, fontSize: 20, lineHeight: 24 },
  primerTitle: {
    fontFamily: fonts.heavy,
    fontSize: 32,
    lineHeight: 33,
    letterSpacing: -1,
  },
  poster: { flex: 2.2, backgroundColor: colors.primary, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 28,
    height: 28,
    backgroundColor: colors.white,
    borderRadius: 6,
    overflow: 'hidden',
  },
  logoCut: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    backgroundColor: colors.ink,
  },
  brandText: {
    fontFamily: fonts.heavy,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 18,
    maxWidth: 300,
  },
  strip: { height: 72, flexDirection: 'row' },
  stripCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  demoLink: { height: 48, justifyContent: 'center', paddingHorizontal: 4 },
  demoText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  art: {
    height: 300,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    borderRadius: radius.lg,
  },
  artGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.n300,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.n300,
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: 2,
    borderRadius: radius.lg,
  },
  ringLabel: {
    position: 'absolute',
    left: 6,
    top: 4,
    fontFamily: fonts.heavy,
    fontSize: 12,
    lineHeight: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  centerPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 52,
    height: 52,
    marginLeft: -26,
    marginTop: -26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  pinTile: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
});
