import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CategoryChip, ShiftChip } from '@/components/Chips';
import { Stepper, Toggle, ToggleRow } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { LocationPickerSheet } from '@/components/LocationPickerSheet';
import { RadiusSlider } from '@/components/RadiusSlider';
import { Text } from '@/components/Text';
import { experienceLabel } from '@/domain/labels';
import { CATEGORIES, SHIFTS, type WorkerProfile } from '@/domain/types';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useLocationActions } from '@/hooks/useLocationActions';
import { useLocationChoices } from '@/hooks/useLocationChoices';
import { useAppStore } from '@/store/useAppStore';
import { useDeckStore } from '@/store/useDeckStore';
import { useUiStore } from '@/store/useUiStore';
import { colors, fonts } from '@/theme';

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

function SectionTitle({ children }: { children: string }) {
  return (
    <>
      <View style={styles.thickRule} />
      <Text variant="label" color={colors.primaryDeep} style={styles.sectionTitle} accessibilityRole="header">{children}</Text>
    </>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
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
  const patch = (p: Partial<WorkerProfile>) => saveProfile({ ...profile, ...p });

  const confirmReset = (all: boolean) =>
    Alert.alert(
      all ? 'Start over?' : 'Reset demo data?',
      all ? 'Clears your profile, likes and matches and returns to onboarding.' : 'Clears your swipes, likes and matches. Your profile stays.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: all ? 'Start over' : 'Reset',
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
  const deviceSub =
    !usingDevice ? 'Off — using a chosen area' : loc.status === 'granted' ? `On — near ${loc.placeName}` : loc.status === 'denied' ? 'Permission denied in Settings' : 'On — waiting for a location';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title1" accessibilityRole="header">Profile</Text>
        <View style={styles.identity}>
          <View style={styles.avatar}><Text style={styles.avatarText} color={colors.bg}>{(profile.name.trim()[0] ?? '?').toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.name || 'Your name'}</Text>
            <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular }}>
              {loc.placeName ? `Searching near ${loc.placeName}` : 'No location yet'}
            </Text>
          </View>
        </View>

        <Text variant="label" color={colors.primaryDeep} style={styles.sectionTitle} accessibilityRole="header">About you</Text>
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Text variant="callout" style={{ fontFamily: fonts.bold }}>First name</Text>
          <TextInput value={profile.name} onChangeText={(name) => patch({ name })} style={styles.input} autoCapitalize="words" accessibilityLabel="First name" />
        </View>
        <View style={styles.between}>
          <Text variant="headline">Experience</Text>
          <Stepper label="years of experience" value={experienceLabel(profile.experienceYears)}
            canDecrement={profile.experienceYears > 0} canIncrement={profile.experienceYears < 3}
            onDecrement={() => patch({ experienceYears: Math.max(0, profile.experienceYears - 1) })}
            onIncrement={() => patch({ experienceYears: Math.min(3, profile.experienceYears + 1) })} />
        </View>
        <View style={styles.hairTop}>
          <ToggleRow title="Own transport" subtitle="Car, bike or scooter" label="Own transport" value={profile.hasTransport} onChange={(hasTransport) => patch({ hasTransport })} />
        </View>

        <SectionTitle>Preferences</SectionTitle>
        <Text variant="callout" style={styles.fieldLabel}>Job types</Text>
        <View style={[styles.wrap, { marginBottom: 18 }]}>
          {CATEGORIES.map((c) => <CategoryChip key={c} category={c} selected={profile.categories.includes(c)} onPress={() => patch({ categories: toggle(profile.categories, c) })} />)}
        </View>
        <Text variant="callout" style={styles.fieldLabel}>Shifts</Text>
        <View style={[styles.wrap, { marginBottom: 18 }]}>
          {SHIFTS.map((s) => <ShiftChip key={s} shift={s} selected={profile.shifts.includes(s)} onPress={() => patch({ shifts: toggle(profile.shifts, s) })} />)}
        </View>
        <View style={styles.between}>
          <Text variant="headline">Minimum pay</Text>
          <Stepper label="minimum pay per hour" value={`$${profile.minPayPerHour}/hr`} canDecrement={profile.minPayPerHour > 10}
            onDecrement={() => patch({ minPayPerHour: Math.max(10, profile.minPayPerHour - 1) })}
            onIncrement={() => patch({ minPayPerHour: Math.min(60, profile.minPayPerHour + 1) })} />
        </View>

        <SectionTitle>Travel distance</SectionTitle>
        <Text style={styles.radius}>{`Up to ${profile.maxDistanceKm} km`}</Text>
        <RadiusSlider value={profile.maxDistanceKm} onChange={(maxDistanceKm) => patch({ maxDistanceKm })} />

        <SectionTitle>Location</SectionTitle>
        <View style={[styles.row, styles.hairBottom]}>
          <View style={{ flex: 1 }}>
            <Text variant="headline">Use device location</Text>
            <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular, fontSize: 14 }}>{deviceSub}</Text>
          </View>
          <Toggle label="Use device location" value={usingDevice} onChange={(on) => (on ? void switchToDevice() : setPickerOpen(true))} />
        </View>
        {!usingDevice ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Using manual location ${manual?.name ?? ''}. Change`} onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.row, styles.hairBottom, pressed && { backgroundColor: colors.n200 }]}>
            <View style={styles.pinTile}><Icon name="pin" size={20} strokeWidth={2.5} color={colors.white} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 18 }} color={colors.inkMuted}>Using manual location</Text>
              <Text style={{ fontFamily: fonts.heavy, fontSize: 17, lineHeight: 22 }}>{manual?.name ?? 'Choose an area'}</Text>
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 16 }} color={colors.primaryDeep}>Change</Text>
            <Icon name="chev-r" size={20} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        <View style={{ marginTop: 36, gap: 8 }}>
          <Button label="Reset demo data" variant="destructive" icon="trash" onPress={() => confirmReset(false)} />
          <Text variant="callout" color={colors.inkMuted} style={{ fontFamily: fonts.regular, fontSize: 14 }}>
            {"Clears your swipes, likes and matches. Your profile stays. Can't be undone."}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => confirmReset(true)} style={{ height: 44, justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, textDecorationLine: 'underline' }} color={colors.inkSoft}>Start over from onboarding</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LocationPickerSheet visible={pickerOpen} choices={choices} radiusKm={profile.maxDistanceKm}
        selectedId={choices.find((c) => c.name === manual?.name)?.id}
        onClose={() => setPickerOpen(false)}
        onPick={(c) => { setPickerOpen(false); pickManual(c); }}
        onUseDevice={() => { setPickerOpen(false); void switchToDevice(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: colors.ink },
  avatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  avatarText: { fontFamily: fonts.heavy, fontSize: 28, lineHeight: 32 },
  name: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 26 },
  sectionTitle: { marginTop: 24, marginBottom: 10 },
  thickRule: { height: 2, backgroundColor: colors.ink, marginTop: 24 },
  fieldLabel: { fontFamily: fonts.bold, marginBottom: 8 },
  input: { height: 52, paddingHorizontal: 14, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  hairTop: { borderTopWidth: 1, borderTopColor: colors.line },
  hairBottom: { borderBottomWidth: 1, borderBottomColor: colors.line },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  radius: { fontFamily: fonts.heavy, fontSize: 30, lineHeight: 34, letterSpacing: -0.9, marginBottom: 12 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinTile: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
});
