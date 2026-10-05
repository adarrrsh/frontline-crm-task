import * as Location from 'expo-location';
import { Linking } from 'react-native';

import { LocationUnavailableError } from './types';

const toState = (r) => ({
  status:
    r.status === Location.PermissionStatus.GRANTED
      ? 'granted'
      : r.status === Location.PermissionStatus.DENIED
        ? 'denied'
        : 'undetermined',
  canAskAgain: r.canAskAgain,
});

const toCoords = (l) => ({
  latitude: l.coords.latitude,
  longitude: l.coords.longitude,
});

const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000;

export const expoLocationAdapter = {
  async getPermission() {
    return toState(await Location.getForegroundPermissionsAsync());
  },

  async requestPermission() {
    return toState(await Location.requestForegroundPermissionsAsync());
  },

  async getPosition(timeoutMs) {
    if (!(await Location.hasServicesEnabledAsync())) throw new LocationUnavailableError('services-off');

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
    }).catch(() => null);
    if (lastKnown) return toCoords(lastKnown);

    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new LocationUnavailableError('timeout')), timeoutMs);
    });
    try {
      const fix = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        timeout,
      ]);
      return toCoords(fix);
    } catch (e) {
      throw e instanceof LocationUnavailableError ? e : new LocationUnavailableError('error');
    } finally {
      clearTimeout(timer);
    }
  },

  openSettings() {
    void Linking.openSettings();
  },
};
