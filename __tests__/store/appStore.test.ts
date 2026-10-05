import { DEMO_PROFILE, EMPTY_PROFILE } from '@/data/demoProfile';
import { selectCanUndo, selectNewMatchCount, useAppStore } from '@/store/useAppStore';

const store = () => useAppStore.getState();

beforeEach(() => {
  useAppStore.setState({
    profile: DEMO_PROFILE,
    hasOnboarded: true,
    swipes: [],
    likedJobs: {},
    locationMode: 'device',
    manualLocation: null,
    matchesSeenAt: 0,
  });
});

describe('useAppStore', () => {
  it('records each job at most once', () => {
    store().recordSwipe('a', 'pass', 1);
    store().recordSwipe('a', 'like', 2);
    expect(store().swipes).toEqual([{ jobId: 'a', direction: 'pass', at: 1 }]);
  });

  it('resolves pending likes to their precomputed outcome and reports matches', () => {
    store().recordSwipe('m', 'like', 0);
    store().addPendingInterest('m', 0, 100, 'matched');
    store().recordSwipe('d', 'like', 0);
    store().addPendingInterest('d', 0, 100, 'declined');

    expect(store().resolveInterests(['m', 'd'], 150)).toEqual(['m']);
    expect(store().likedJobs.m).toMatchObject({ status: 'matched', resolvedAt: 150 });
    expect(store().likedJobs.d.status).toBe('declined');
    expect(selectNewMatchCount(store())).toBe(1);

    store().markMatchesSeen(200);
    expect(selectNewMatchCount(store())).toBe(0);
  });

  it('undoes a pass, or a like the employer has not answered yet', () => {
    store().recordSwipe('a', 'pass', 0);
    expect(selectCanUndo(store())).toBe(true);
    expect(store().undoLastSwipe()).toBe('a');
    expect(store().swipes).toEqual([]);

    store().recordSwipe('b', 'like', 0);
    store().addPendingInterest('b', 0, 100, 'matched');
    expect(store().undoLastSwipe()).toBe('b');
    expect(store().likedJobs).toEqual({});
  });

  it('refuses to undo a like that already has a reply', () => {
    store().recordSwipe('b', 'like', 0);
    store().addPendingInterest('b', 0, 100, 'matched');
    store().resolveInterests(['b'], 100);
    expect(selectCanUndo(store())).toBe(false);
    expect(store().undoLastSwipe()).toBeNull();
    expect(store().swipes).toHaveLength(1);
  });

  it('clamps the radius to 1–50 km', () => {
    store().setRadius(0);
    expect(store().profile.maxDistanceKm).toBe(1);
    store().setRadius(80);
    expect(store().profile.maxDistanceKm).toBe(50);
  });

  it('resetDemo keeps the profile; a full reset returns to onboarding', () => {
    store().recordSwipe('a', 'like', 0);
    store().addPendingInterest('a', 0, 100, 'matched');
    store().resetDemo();
    expect(store().swipes).toEqual([]);
    expect(store().likedJobs).toEqual({});
    expect(store().profile).toEqual(DEMO_PROFILE);
    expect(store().hasOnboarded).toBe(true);

    store().resetDemo({ profile: true });
    expect(store().profile).toEqual(EMPTY_PROFILE);
    expect(store().hasOnboarded).toBe(false);
  });

  it('switches between manual and device location', () => {
    store().setManualLocation({ name: 'San Jose', coords: { latitude: 37.3, longitude: -121.9 } });
    expect(store().locationMode).toBe('manual');
    store().chooseDeviceLocation();
    expect(store().locationMode).toBe('device');
    expect(store().manualLocation?.name).toBe('San Jose');
  });
});
