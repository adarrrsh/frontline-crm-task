import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { selectNewMatchCount, useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme';

export default function TabsLayout() {
  const newMatches = useAppStore(selectNewMatchCount);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
      tabBar={(props) => <TabBar {...props} badge={newMatches} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="liked" />
      <Tabs.Screen name="matches" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
