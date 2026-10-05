import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { MatchModalHost } from '@/components/MatchModalHost';
import { Text } from '@/components/Text';
import { useAppForeground } from '@/hooks/useAppForeground';
import { useMatchResolver } from '@/hooks/useMatchResolver';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/store/useAppStore';
import { useCatalogStore } from '@/store/useCatalogStore';
import { useLocationStore } from '@/store/useLocationStore';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const subscribeHydration = (cb) => useAppStore.persist.onFinishHydration(cb);
const getHydrated = () => useAppStore.persist.hasHydrated();

function useHydrated() {
  return useSyncExternalStore(subscribeHydration, getHydrated, getHydrated);
}

/** Root-level effects that must run on every tab: employer replies + location re-checks. */
function AppServices() {
  useMatchResolver();
  const refresh = useLocationStore((s) => s.refresh);
  useEffect(() => {
    // Re-check silently on launch: never prompts, but picks up a permission granted earlier.
    void refresh();
  }, [refresh]);
  useAppForeground(() => void refresh());
  return <MatchModalHost />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  const hydrated = useHydrated();
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const loadCatalog = useCatalogStore((s) => s.load);
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Protected guard={!hasOnboarded}>
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          </Stack.Protected>
          <Stack.Protected guard={hasOnboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="job/[id]" />
          </Stack.Protected>
        </Stack>
        {hasOnboarded ? <AppServices /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function ErrorBoundary({ error, retry }) {
  const t = useT();
  return (
    <SafeAreaView style={[styles.root, styles.error]}>
      <Text variant="label" color={colors.primaryDeep}>
        {t('error.kicker')}
      </Text>
      <Text variant="title2">{t('error.title')}</Text>
      <Text variant="body" color={colors.inkSoft}>
        {error.message}
      </Text>
      <View style={{ flex: 1 }} />
      <Button label={t('common.reload')} icon="refresh" onPress={() => void retry()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  error: { padding: 16, gap: 12 },
});
