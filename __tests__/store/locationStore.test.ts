import { repositories } from '@/repositories';
import { LocationUnavailableError, type LocationAdapter, type PermissionState } from '@/repositories/types';
import { useLocationStore } from '@/store/useLocationStore';

const HERE = { latitude: 37.3349, longitude: -122.009 };

function fakeAdapter(over: Partial<LocationAdapter> = {}): LocationAdapter {
  const granted: PermissionState = { status: 'granted', canAskAgain: true };
  return {
    getPermission: jest.fn(async () => granted),
    requestPermission: jest.fn(async () => granted),
    getPosition: jest.fn(async () => HERE),
    openSettings: jest.fn(),
    ...over,
  };
}

beforeEach(() => {
  useLocationStore.setState({ status: 'idle', coords: null, canAskAgain: true, lastTriedAt: null });
});

describe('useLocationStore', () => {
  it('granted → stores the fix', async () => {
    repositories.location = fakeAdapter();
    await useLocationStore.getState().request();
    expect(useLocationStore.getState()).toMatchObject({ status: 'granted', coords: HERE });
  });

  it('denied → status denied, no position request', async () => {
    const adapter = fakeAdapter({ requestPermission: jest.fn(async () => ({ status: 'denied' as const, canAskAgain: false })) });
    repositories.location = adapter;
    await useLocationStore.getState().request();
    expect(useLocationStore.getState()).toMatchObject({ status: 'denied', canAskAgain: false });
    expect(adapter.getPosition).not.toHaveBeenCalled();
  });

  it('timeout → unavailable, with the time it last tried', async () => {
    repositories.location = fakeAdapter({ getPosition: jest.fn(async () => { throw new LocationUnavailableError('timeout'); }) });
    await useLocationStore.getState().request();
    const s = useLocationStore.getState();
    expect(s.status).toBe('unavailable');
    expect(s.lastTriedAt).not.toBeNull();
  });

  it('refresh never prompts; undetermined stays idle', async () => {
    const adapter = fakeAdapter({ getPermission: jest.fn(async () => ({ status: 'undetermined' as const, canAskAgain: true })) });
    repositories.location = adapter;
    await useLocationStore.getState().refresh();
    expect(adapter.requestPermission).not.toHaveBeenCalled();
    expect(useLocationStore.getState().status).toBe('idle');
  });

  it('collapses concurrent requests into one', async () => {
    const adapter = fakeAdapter();
    repositories.location = adapter;
    await Promise.all([useLocationStore.getState().request(), useLocationStore.getState().refresh()]);
    expect(adapter.getPosition).toHaveBeenCalledTimes(1);
  });
});
