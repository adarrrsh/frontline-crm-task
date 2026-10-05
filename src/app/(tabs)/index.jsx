import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/ActionBar';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard, Spinner } from '@/components/Loading';
import { LocationBar } from '@/components/LocationBar';
import { LocationPickerSheet } from '@/components/LocationPickerSheet';
import { RadiusSheet } from '@/components/RadiusSheet';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Text } from '@/components/Text';
import { useEffectiveLocation } from '@/hooks/useEffectiveLocation';
import { useJobFeed } from '@/hooks/useJobFeed';
import { useLocationActions } from '@/hooks/useLocationActions';
import { useLocationChoices } from '@/hooks/useLocationChoices';
import { useSwipeActions } from '@/hooks/useSwipeActions';
import { selectCanUndo, useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useDeckStore } from '@/store/useDeckStore';
import { useLocationStore } from '@/store/useLocationStore';
import { colors, fonts, radius } from '@/theme';

const RADIUS_STEPS = [5, 10, 15, 25, 50];

const clock = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function locationBarProps(loc, radius) {
  if (loc.source === 'manual')
    return {
      title: `Near ${loc.placeName} · within ${radius} km`,
      subtitle: 'Using manual location',
      icon: 'pin',
      tone: 'off',
      showRadius: true,
    };
  switch (loc.status) {
    case 'granted':
      return {
        title: `Near ${loc.placeName} · within ${radius} km`,
        subtitle: 'Using device location',
        icon: 'pin',
        tone: 'ok',
        showRadius: true,
      };
    case 'requesting':
      return {
        title: 'Finding your location…',
        subtitle: 'Usually takes a few seconds',
        icon: 'locate',
        tone: 'loading',
        showRadius: true,
      };
    case 'unavailable':
      return {
        title: 'Location unavailable',
        subtitle: loc.lastTriedAt ? `Last tried ${clock(loc.lastTriedAt)}` : 'Tap to choose an area',
        icon: 'alert',
        tone: 'warn',
        showRadius: false,
      };
    case 'denied':
      return {
        title: 'Location is off',
        subtitle: 'Tap to choose an area',
        icon: 'pin-off',
        tone: 'off',
        showRadius: false,
      };
    default:
      return {
        title: 'Location not set',
        subtitle: 'Tap to choose an area',
        icon: 'pin-off',
        tone: 'off',
        showRadius: false,
      };
  }
}

/** The smallest bigger radius that actually has jobs, for "Expand to N km". */
function nextRadiusWithJobs(feed, radius) {
  for (const r of RADIUS_STEPS) if (r > radius && feed.countWithin(r) > 0) return r;
  return null;
}

export default function Discover() {
  const insets = useSafeAreaInsets();
  const feed = useJobFeed();
  const loc = useEffectiveLocation();
  const radius = useAppStore((s) => s.profile.maxDistanceKm);
  const setRadius = useAppStore((s) => s.setRadius);
  const canUndo = useAppStore(selectCanUndo);
  const employersById = useCatalogStore((s) => s.employersById);
  const reloadCatalog = useCatalogStore((s) => s.load);
  const requestLocation = useLocationStore((s) => s.request);
  const openSettings = useLocationStore((s) => s.openSettings);
  const pins = useDeckStore((s) => s.pins);
  const setPins = useDeckStore((s) => s.setPins);
  const { like, pass, undo } = useSwipeActions();
  const { pickManual, switchToDevice } = useLocationActions();
  const choices = useLocationChoices();

  const [radiusOpen, setRadiusOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const drag = useSharedValue(0);
  const flingRef = useRef(null);

  const { deck } = feed;
  // Pin the visible cards once a deck first appears, so later re-ranks never move them.
  useEffect(() => {
    if (pins.length === 0 && deck.length > 0) setPins(deck.slice(0, 2).map((r) => r.job.id));
  }, [pins.length, deck, setPins]);

  const onSwipe = (ranked, dir) => {
    setPins(
      deck
        .filter((r) => r.job.id !== ranked.job.id)
        .slice(0, 2)
        .map((r) => r.job.id),
    );
    if (dir === 'like') void like(ranked.job);
    else pass(ranked.job);
  };

  const onUndo = () => {
    const id = undo();
    if (id) setPins([id, ...deck.slice(0, 1).map((r) => r.job.id)]);
  };

  const applyRadius = (km) => {
    setRadiusOpen(false);
    setRadius(km);
  };

  const bar = locationBarProps(loc, radius);
  const deviceBlocked = loc.source === 'device' && loc.status !== 'granted' && loc.status !== 'requesting';
  const loading = feed.status === 'loading' || (loc.source === 'device' && loc.status === 'requesting');

  let body;
  if (feed.status === 'error') {
    body = (
      <EmptyState
        icon="alert"
        tone="warn"
        kicker="Couldn't load jobs"
        title="Something went wrong"
        body="We couldn't load jobs just now. Check your connection and try again."
        primary={{
          label: 'Retry',
          icon: 'refresh',
          onPress: () => void reloadCatalog(),
        }}
      />
    );
  } else if (deviceBlocked && loc.status === 'denied') {
    body = (
      <EmptyState
        icon="pin-off"
        tone="ink"
        kicker="Location access off"
        title="We can't see where you are"
        body="Turn on location in Settings so we can show jobs you can get to — or pick an area yourself."
        primary={{
          label: 'Open Settings',
          icon: 'external',
          onPress: openSettings,
        }}
        secondary={{
          label: 'Choose a location manually',
          onPress: () => setPickerOpen(true),
        }}
      />
    );
  } else if (deviceBlocked && loc.status === 'unavailable') {
    body = (
      <EmptyState
        icon="locate"
        tone="warn"
        kicker="Signal lost"
        title="Couldn't find your location"
        body="This happens indoors or with weak signal. Try again, or choose an area to keep swiping."
        primary={{
          label: 'Retry',
          icon: 'refresh',
          onPress: () => void requestLocation(),
        }}
        secondary={{
          label: 'Choose manually',
          onPress: () => setPickerOpen(true),
        }}
      />
    );
  } else if (deviceBlocked) {
    body = (
      <EmptyState
        icon="pin"
        tone="accent"
        kicker="Location needed"
        title="Where should we look?"
        body="Share your location to see jobs you can actually get to, or pick an area yourself."
        primary={{
          label: 'Enable location',
          icon: 'nav',
          onPress: () => void requestLocation(),
        }}
        secondary={{
          label: 'Choose a location manually',
          onPress: () => setPickerOpen(true),
        }}
      />
    );
  } else if (loading) {
    body = null;
  } else if (deck.length === 0) {
    const seen = feed.seenWithin(radius);
    const next = nextRadiusWithJobs(feed, radius);
    if (seen.total > 0) {
      body = (
        <EmptyState
          icon="check"
          tone="like"
          kicker="All caught up"
          title="You've seen every job nearby"
          body={`You liked ${seen.liked} of ${seen.total} jobs within ${radius} km. New ones usually appear in the morning.`}
          primary={{
            label: 'See your liked jobs',
            icon: 'heart',
            onPress: () => router.navigate('/liked'),
          }}
          secondary={
            next
              ? {
                  label: `Expand to ${next} km`,
                  onPress: () => setRadius(next),
                }
              : {
                  label: 'Choose another area',
                  onPress: () => setPickerOpen(true),
                }
          }
        />
      );
    } else if (next) {
      const extra = feed.countWithin(next);
      body = (
        <EmptyState
          icon="search"
          tone="accent"
          kicker="0 jobs"
          title={`No jobs within ${radius} km`}
          body={`There ${extra === 1 ? 'is 1 job' : `are ${extra} jobs`} between ${radius} and ${next} km of you.`}
          primary={{
            label: `Expand to ${next} km`,
            icon: 'sliders',
            onPress: () => setRadius(next),
          }}
          secondary={{
            label: 'Edit preferences',
            onPress: () => router.navigate('/profile'),
          }}
        />
      );
    } else {
      body = (
        <EmptyState
          icon="search"
          tone="accent"
          kicker="0 jobs"
          title={`No jobs near ${loc.placeName}`}
          body="This prototype has jobs around the South Bay and San Francisco. Try another area."
          primary={{
            label: 'Choose another area',
            icon: 'pin',
            onPress: () => setPickerOpen(true),
          }}
        />
      );
    }
  } else {
    body = <SwipeDeck deck={deck} employersById={employersById} onSwipe={onSwipe} drag={drag} flingRef={flingRef} />;
  }

  const showActions = !loading && deck.length > 0 && !deviceBlocked && feed.status === 'ready';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 2 }]}>
      <LocationBar
        title={bar.title}
        subtitle={bar.subtitle}
        icon={bar.icon}
        tone={bar.tone}
        radius={bar.showRadius ? `${radius} km` : undefined}
        onPressLocation={() => setPickerOpen(true)}
        onPressRadius={() => setRadiusOpen(true)}
      />

      <View style={styles.main}>
        {loading ? (
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.ghost,
                {
                  top: 20,
                  left: 20,
                  right: 20,
                  bottom: -20,
                  backgroundColor: colors.n200,
                },
              ]}
            />
            <View
              style={[
                styles.ghost,
                {
                  top: 10,
                  left: 10,
                  right: 10,
                  bottom: -10,
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: colors.n300,
                },
              ]}
            />
            <SkeletonCard />
          </View>
        ) : (
          body
        )}
      </View>

      {loading ? (
        <View style={[styles.bottom, styles.status]} accessibilityLiveRegion="polite">
          <Spinner />
          <Text style={styles.statusText}>Finding jobs near you…</Text>
        </View>
      ) : showActions ? (
        <View style={styles.bottom}>
          <ActionBar
            drag={drag}
            canUndo={canUndo}
            onUndo={onUndo}
            onPass={() => flingRef.current?.('pass')}
            onLike={() => flingRef.current?.('like')}
          />
        </View>
      ) : null}

      <RadiusSheet
        visible={radiusOpen}
        value={radius}
        onApply={applyRadius}
        onClose={() => setRadiusOpen(false)}
        countWithin={feed.countWithin}
      />
      <LocationPickerSheet
        visible={pickerOpen}
        choices={choices}
        radiusKm={radius}
        selectedId={choices.find((c) => c.name === loc.placeName)?.id}
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
  main: { flex: 1, marginTop: 14, marginHorizontal: 16, marginBottom: 38 },
  ghost: { position: 'absolute', borderRadius: radius.lg },
  bottom: { height: 64, marginHorizontal: 16, marginBottom: 16 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusText: { fontFamily: fonts.heavy, fontSize: 19, lineHeight: 23 },
});
