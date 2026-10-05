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
import { useT } from '@/hooks/useT';
import { clockTime, placeLabel } from '@/i18n/format';
import { selectCanUndo, useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useDeckStore } from '@/store/useDeckStore';
import { useLocationStore } from '@/store/useLocationStore';
import { colors, fonts, radius } from '@/theme';

const RADIUS_STEPS = [5, 10, 15, 25, 50];

function locationBarProps(t, loc, radius) {
  const near = t('location.near', { place: placeLabel(t, loc.placeName), km: radius });
  if (loc.source === 'manual')
    return {
      title: near,
      subtitle: t('location.manual'),
      icon: 'pin',
      tone: 'off',
      showRadius: true,
    };
  switch (loc.status) {
    case 'granted':
      return {
        title: near,
        subtitle: t('location.device'),
        icon: 'pin',
        tone: 'ok',
        showRadius: true,
      };
    case 'requesting':
      return {
        title: t('location.finding'),
        subtitle: t('location.findingSub'),
        icon: 'locate',
        tone: 'loading',
        showRadius: true,
      };
    case 'unavailable':
      return {
        title: t('location.unavailable'),
        subtitle: loc.lastTriedAt ? t('location.lastTried', { time: clockTime(t, loc.lastTriedAt) }) : t('location.tapToChoose'),
        icon: 'alert',
        tone: 'warn',
        showRadius: false,
      };
    case 'denied':
      return {
        title: t('location.off'),
        subtitle: t('location.tapToChoose'),
        icon: 'pin-off',
        tone: 'off',
        showRadius: false,
      };
    default:
      return {
        title: t('location.notSet'),
        subtitle: t('location.tapToChoose'),
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
  const t = useT();
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

  const bar = locationBarProps(t, loc, radius);
  const deviceBlocked = loc.source === 'device' && loc.status !== 'granted' && loc.status !== 'requesting';
  const loading = feed.status === 'loading' || (loc.source === 'device' && loc.status === 'requesting');

  let body;
  if (feed.status === 'error') {
    body = (
      <EmptyState
        icon="alert"
        tone="warn"
        kicker={t('discover.loadErrorKicker')}
        title={t('discover.loadErrorTitle')}
        body={t('discover.loadErrorBody')}
        primary={{
          label: t('common.retry'),
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
        kicker={t('discover.deniedKicker')}
        title={t('discover.deniedTitle')}
        body={t('discover.deniedBody')}
        primary={{
          label: t('discover.openSettings'),
          icon: 'external',
          onPress: openSettings,
        }}
        secondary={{
          label: t('discover.chooseManually'),
          onPress: () => setPickerOpen(true),
        }}
      />
    );
  } else if (deviceBlocked && loc.status === 'unavailable') {
    body = (
      <EmptyState
        icon="locate"
        tone="warn"
        kicker={t('discover.lostKicker')}
        title={t('discover.lostTitle')}
        body={t('discover.lostBody')}
        primary={{
          label: t('common.retry'),
          icon: 'refresh',
          onPress: () => void requestLocation(),
        }}
        secondary={{
          label: t('discover.chooseManuallyShort'),
          onPress: () => setPickerOpen(true),
        }}
      />
    );
  } else if (deviceBlocked) {
    body = (
      <EmptyState
        icon="pin"
        tone="accent"
        kicker={t('discover.neededKicker')}
        title={t('discover.neededTitle')}
        body={t('discover.neededBody')}
        primary={{
          label: t('onboarding.enableLocation'),
          icon: 'nav',
          onPress: () => void requestLocation(),
        }}
        secondary={{
          label: t('discover.chooseManually'),
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
          kicker={t('discover.caughtUpKicker')}
          title={t('discover.caughtUpTitle')}
          body={t('discover.caughtUpBody', { liked: seen.liked, total: seen.total, km: radius })}
          primary={{
            label: t('discover.seeLiked'),
            icon: 'heart',
            onPress: () => router.navigate('/liked'),
          }}
          secondary={
            next
              ? {
                  label: t('discover.expand', { km: next }),
                  onPress: () => setRadius(next),
                }
              : {
                  label: t('discover.chooseAnother'),
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
          kicker={t('discover.noJobsKicker')}
          title={t('discover.noJobsWithin', { km: radius })}
          body={t('discover.jobsBetween', { count: extra, km: radius, next })}
          primary={{
            label: t('discover.expand', { km: next }),
            icon: 'sliders',
            onPress: () => setRadius(next),
          }}
          secondary={{
            label: t('discover.editPreferences'),
            onPress: () => router.navigate('/profile'),
          }}
        />
      );
    } else {
      body = (
        <EmptyState
          icon="search"
          tone="accent"
          kicker={t('discover.noJobsKicker')}
          title={t('discover.noJobsNear', { place: placeLabel(t, loc.placeName) })}
          body={t('discover.noJobsNearBody')}
          primary={{
            label: t('discover.chooseAnother'),
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
        radius={bar.showRadius ? t('common.km', { km: radius }) : undefined}
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
          <Text style={styles.statusText}>{t('discover.finding')}</Text>
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
