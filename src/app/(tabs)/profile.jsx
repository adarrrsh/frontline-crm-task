import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLanguagePicker } from '@/components/AppLanguagePicker';
import { Button } from '@/components/Button';
import { CategoryChip, LanguageChip, ShiftChip } from '@/components/Chips';
import { Stepper, Toggle, ToggleRow } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { LocationPickerSheet } from '@/components/LocationPickerSheet';
import { RadiusSlider } from '@/components/RadiusSlider';
import { Text } from '@/components/Text';
import { formatMoney } from '@/domain/money';
import { CATEGORIES, LANGUAGES, SHIFTS } from '@/domain/types';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useLocationActions } from '@/hooks/useLocationActions';
import { useLocationChoices } from '@/hooks/useLocationChoices';
import { useT } from '@/hooks/useT';
import { experienceLabel, placeLabel } from '@/i18n/format';
import { useAppStore } from '@/store/useAppStore';
import { useDeckStore } from '@/store/useDeckStore';
import { useUiStore } from '@/store/useUiStore';
import { colors, fonts, radius } from '@/theme';

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

function SectionTitle({ children }) {
  return (
    <>
      <View style={styles.thickRule} />
      <Text variant="label" color={colors.primaryDeep} style={styles.sectionTitle} accessibilityRole="header">
        {children}
      </Text>
    </>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const profile = useAppStore((s) => s.profile);
  const saveProfile = useAppStore((s) => s.saveProfile);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const locationMode = useAppStore((s) => s.locationMode);
  const manual = useAppStore((s) => s.manualLocation);
  const loc = useEffectiveLocation();
  const { pickManual, switchToDevice } = useLocationActions();
  const choices = useLocationChoices();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Edits apply immediately; the deck re-ranks behind the visible cards.
  const patch = (p) => saveProfile({ ...profile, ...p });

  const confirmReset = (all) =>
    Alert.alert(
      t(all ? 'profile.startOverTitle' : 'profile.resetTitle'),
      t(all ? 'profile.startOverBody' : 'profile.resetBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t(all ? 'profile.startOverConfirm' : 'profile.resetConfirm'),
          style: 'destructive',
          onPress: () => {
            useDeckStore.getState().setPins([]);
            useUiStore.setState({ matchQueue: [] });
            resetDemo({ profile: all });
          },
        },
      ],
    );

  const usingDevice = locationMode === 'device';
  const place = placeLabel(t, loc.placeName);
  const deviceSub = !usingDevice
    ? t('profile.deviceOff')
    : loc.status === 'granted'
      ? t('profile.deviceOn', { place })
      : loc.status === 'denied'
        ? t('profile.deviceDenied')
        : t('profile.deviceWaiting');

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title1" accessibilityRole="header">
          {t('profile.title')}
        </Text>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText} color={colors.bg}>
              {(profile.name.trim()[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.name || t('profile.yourName')}</Text>
            <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular }}>
              {loc.placeName ? t('profile.searchingNear', { place }) : t('profile.noLocation')}
            </Text>
          </View>
        </View>

        <Text variant="label" color={colors.primaryDeep} style={styles.sectionTitle} accessibilityRole="header">
          {t('profile.about')}
        </Text>
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Text variant="callout" style={{ fontFamily: fonts.bold }}>
            {t('onboarding.firstName')}
          </Text>
          <TextInput
            value={profile.name}
            onChangeText={(name) => patch({ name })}
            style={styles.input}
            autoCapitalize="words"
            accessibilityLabel={t('onboarding.firstName')}
          />
        </View>
        <View style={styles.between}>
          <Text variant="headline">{t('profile.experience')}</Text>
          <Stepper
            label={t('onboarding.experienceA11y')}
            value={experienceLabel(t, profile.experienceYears)}
            canDecrement={profile.experienceYears > 0}
            canIncrement={profile.experienceYears < 3}
            onDecrement={() =>
              patch({
                experienceYears: Math.max(0, profile.experienceYears - 1),
              })
            }
            onIncrement={() =>
              patch({
                experienceYears: Math.min(3, profile.experienceYears + 1),
              })
            }
          />
        </View>
        <View style={styles.hairTop}>
          <ToggleRow
            title={t('profile.transport')}
            subtitle={t('onboarding.transportSub')}
            label={t('profile.transport')}
            value={profile.hasTransport}
            onChange={(hasTransport) => patch({ hasTransport })}
          />
        </View>
        <Text variant="callout" style={[styles.fieldLabel, { marginTop: 16 }]}>
          {t('profile.languages')}
        </Text>
        <View style={styles.wrap}>
          {LANGUAGES.map((l) => (
            <LanguageChip
              key={l}
              language={l}
              selected={profile.languages.includes(l)}
              onPress={() => patch({ languages: toggle(profile.languages, l) })}
            />
          ))}
        </View>

        <SectionTitle>{t('profile.appLanguage')}</SectionTitle>
        <AppLanguagePicker />

        <SectionTitle>{t('profile.preferences')}</SectionTitle>
        <Text variant="callout" style={styles.fieldLabel}>
          {t('onboarding.jobTypes')}
        </Text>
        <View style={[styles.wrap, { marginBottom: 18 }]}>
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              category={c}
              selected={profile.categories.includes(c)}
              onPress={() => patch({ categories: toggle(profile.categories, c) })}
            />
          ))}
        </View>
        <Text variant="callout" style={styles.fieldLabel}>
          {t('profile.shifts')}
        </Text>
        <View style={[styles.wrap, { marginBottom: 18 }]}>
          {SHIFTS.map((s) => (
            <ShiftChip
              key={s}
              shift={s}
              selected={profile.shifts.includes(s)}
              onPress={() => patch({ shifts: toggle(profile.shifts, s) })}
            />
          ))}
        </View>
        <View style={styles.between}>
          <Text variant="headline">{t('onboarding.minPay')}</Text>
          <Stepper
            label={t('onboarding.minPayA11y')}
            value={t('pay.perHour', { amount: formatMoney(profile.minPayPerHour) })}
            canDecrement={profile.minPayPerHour > 10}
            onDecrement={() => patch({ minPayPerHour: Math.max(10, profile.minPayPerHour - 1) })}
            onIncrement={() => patch({ minPayPerHour: Math.min(60, profile.minPayPerHour + 1) })}
          />
        </View>

        <SectionTitle>{t('profile.travel')}</SectionTitle>
        <Text style={styles.radius}>{t('common.upToKm', { km: profile.maxDistanceKm })}</Text>
        <RadiusSlider value={profile.maxDistanceKm} onChange={(maxDistanceKm) => patch({ maxDistanceKm })} />

        <SectionTitle>{t('profile.location')}</SectionTitle>
        <View style={[styles.row, styles.hairBottom]}>
          <View style={{ flex: 1 }}>
            <Text variant="headline">{t('profile.useDevice')}</Text>
            <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular, fontSize: 14 }}>
              {deviceSub}
            </Text>
          </View>
          <Toggle
            label={t('profile.useDevice')}
            value={usingDevice}
            onChange={(on) => (on ? void switchToDevice() : setPickerOpen(true))}
          />
        </View>
        {!usingDevice ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.manualA11y', { place: manual?.name ?? '' })}
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.row, styles.hairBottom, pressed && { backgroundColor: colors.n200 }]}
          >
            <View style={styles.pinTile}>
              <Icon name="pin" size={20} strokeWidth={2.5} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  lineHeight: 18,
                }}
                color={colors.inkMuted}
              >
                {t('location.manual')}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.heavy,
                  fontSize: 17,
                  lineHeight: 22,
                }}
              >
                {manual?.name ?? t('profile.chooseArea')}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 16 }} color={colors.primaryDeep}>
              {t('profile.change')}
            </Text>
            <Icon name="chev-r" size={20} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        <View style={{ marginTop: 36, gap: 8 }}>
          <Button label={t('profile.reset')} variant="destructive" icon="trash" onPress={() => confirmReset(false)} />
          <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular, fontSize: 14 }}>
            {t('profile.resetNote')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => confirmReset(true)}
            style={{ height: 44, justifyContent: 'center' }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 15,
                textDecorationLine: 'underline',
              }}
              color={colors.inkSoft}
            >
              {t('profile.startOver')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <LocationPickerSheet
        visible={pickerOpen}
        choices={choices}
        radiusKm={profile.maxDistanceKm}
        selectedId={choices.find((c) => c.name === manual?.name)?.id}
        onClose={() => setPickerOpen(false)}
        onPick={(c) => {
          setPickerOpen(false);
          pickManual(c);
        }}
        onUseDevice={() => {
          setPickerOpen(false);
          void switchToDevice();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
  },
  avatarText: { fontFamily: fonts.heavy, fontSize: 28, lineHeight: 32 },
  name: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 26 },
  sectionTitle: { marginTop: 24, marginBottom: 10 },
  thickRule: { height: 2, backgroundColor: colors.ink, marginTop: 24 },
  fieldLabel: { fontFamily: fonts.bold, marginBottom: 8 },
  input: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.ink,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  hairTop: { borderTopWidth: 1, borderTopColor: colors.line },
  hairBottom: { borderBottomWidth: 1, borderBottomColor: colors.line },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  radius: {
    fontFamily: fonts.heavy,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.9,
    marginBottom: 12,
  },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinTile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
  },
});
