import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Calls `onForeground` whenever the app returns to the foreground (e.g. back from Settings). */
export function useAppForeground(onForeground: () => void) {
  const cb = useRef(onForeground);
  useEffect(() => {
    cb.current = onForeground;
  });
  useEffect(() => {
    let prev = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (prev.match(/inactive|background/) && next === 'active') cb.current();
      prev = next;
    });
    return () => sub.remove();
  }, []);
}
