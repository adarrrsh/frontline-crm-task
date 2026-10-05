import { useCallback } from 'react';

import { useAppStore } from '@/store/useAppStore';
import { useDeckStore } from '@/store/useDeckStore';
import { useLocationStore } from '@/store/useLocationStore';

import type { LocationChoice } from './useLocationChoices';

/** The two ways to set where you're searching from. Both reset the pinned cards (new place → new deck). */
export function useLocationActions() {
  const setManualLocation = useAppStore((s) => s.setManualLocation);
  const chooseDeviceLocation = useAppStore((s) => s.chooseDeviceLocation);

  const pickManual = useCallback(
    (choice: LocationChoice) => {
      useDeckStore.getState().setPins([]);
      setManualLocation({ name: choice.name, coords: choice.coords });
    },
    [setManualLocation],
  );

  /** Switch to GPS; if iOS won't show the prompt again, send the worker to Settings. */
  const switchToDevice = useCallback(async () => {
    useDeckStore.getState().setPins([]);
    chooseDeviceLocation();
    const loc = useLocationStore.getState();
    if (loc.status === 'denied' && !loc.canAskAgain) {
      loc.openSettings();
      return;
    }
    await loc.request();
  }, [chooseDeviceLocation]);

  return { pickManual, switchToDevice };
}
