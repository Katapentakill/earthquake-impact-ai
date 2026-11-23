// Ajustes de la app (tema y umbral de alertas), guardados en el teléfono. Con el tema en «sistema» sigue al del dispositivo.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { CLARO, OSCURO, type Paleta } from '@/constants/paleta';
import { AJUSTES_POR_DEFECTO, sanearAjustes, type Ajustes } from './ajustesBase';

export { UMBRALES } from './ajustesBase';
export type { Ajustes, PreferenciaTema } from './ajustesBase';

const CLAVE = 'ajustes-v1';

interface Valor extends Ajustes {
  paleta: Paleta;
  cambiar: (parcial: Partial<Ajustes>) => void;
}

const Contexto = createContext<Valor | null>(null);

export function AjustesProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_POR_DEFECTO);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((texto) => {
        if (texto) setAjustes(sanearAjustes(JSON.parse(texto)));
      })
      .catch(() => {})
      .finally(() => setListo(true));
  }, []);

  const cambiar = useCallback((parcial: Partial<Ajustes>) => {
    setAjustes((a) => {
      const nuevo = sanearAjustes({ ...a, ...parcial });
      AsyncStorage.setItem(CLAVE, JSON.stringify(nuevo)).catch(() => {});
      return nuevo;
    });
  }, []);

  const oscuro = ajustes.tema === 'oscuro' || (ajustes.tema === 'sistema' && sistema === 'dark');
  const paleta = oscuro ? OSCURO : CLARO;
  const valor = useMemo<Valor>(() => ({ ...ajustes, paleta, cambiar }), [ajustes, paleta, cambiar]);

  // Hasta leer lo guardado se pinta solo el fondo, para que no parpadee el otro tema.
  if (!listo) return <View style={[StyleSheet.absoluteFill, { backgroundColor: paleta.bg }]} />;
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAjustes(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAjustes debe usarse dentro de AjustesProvider');
  return v;
}

export const useTema = (): Paleta => useAjustes().paleta;

/** Estilos que dependen de la paleta: `fabrica` debe ser una función declarada fuera del componente. */
export function useEstilos<T extends StyleSheet.NamedStyles<T>>(fabrica: (p: Paleta) => T): T {
  const paleta = useTema();
  return useMemo(() => StyleSheet.create(fabrica(paleta)), [paleta, fabrica]);
}
