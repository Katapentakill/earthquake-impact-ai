import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AjustesProvider, useTema } from '@/lib/ajustes';
import { DatosProvider } from '@/lib/datos';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** La pila de pantallas, con los colores del tema elegido (crema u oscuro). */
function Pila() {
  const p = useTema();
  const tema = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      dark: p.nombre === 'oscuro',
      colors: { ...DefaultTheme.colors, primary: p.accent, background: p.bg, card: p.surface, text: p.text, border: p.border, notification: p.accent },
    }),
    [p],
  );
  return (
    <ThemeProvider value={tema}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: p.bg },
          headerTintColor: p.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: p.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="evento/[id]" options={{ title: 'Sismo', headerBackTitle: 'Atrás' }} />
      </Stack>
      <StatusBar style={p.nombre === 'oscuro' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AjustesProvider>
        <DatosProvider>
          <Pila />
        </DatosProvider>
      </AjustesProvider>
    </SafeAreaProvider>
  );
}
