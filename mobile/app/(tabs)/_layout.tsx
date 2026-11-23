import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Icono, type NombreIcono } from '@/components/Icono';
import { useTema } from '@/lib/ajustes';

const PESTANAS: { name: string; title: string; icono: NombreIcono }[] = [
  { name: 'index', title: 'Resumen', icono: 'bar-chart' },
  { name: 'mapa', title: 'Mapa', icono: 'public' },
  { name: 'alertas', title: 'Alertas', icono: 'notifications' },
  { name: 'ajustes', title: 'Ajustes', icono: 'tune' },
];

export default function TabLayout() {
  const p = useTema();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.muted,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border, height: 66 + insets.bottom },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: p.bg },
      }}>
      {PESTANAS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icono nombre={t.icono} color={color} tam={24} /> }} />
      ))}
    </Tabs>
  );
}
