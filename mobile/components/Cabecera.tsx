import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEstilos, useTema } from '@/lib/ajustes';
import { useDatos } from '@/lib/datos';
import { fmtRelativo } from '@/lib/format';
import type { Paleta } from '@/constants/paleta';

const fabrica = (p: Paleta) => ({
  caja: { backgroundColor: p.bg, paddingHorizontal: 16, paddingBottom: 10, gap: 4 },
  titulo: { color: p.text, fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  estado: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  punto: { width: 8, height: 8, borderRadius: 4 },
  texto: { color: p.text2, fontSize: 13 },
});

/** Título de la pantalla con el estado de los datos: «En vivo» y cuándo se actualizó por última vez. */
export function Cabecera({ titulo }: { titulo: string }) {
  const s = useEstilos(fabrica);
  const { enVivo, ultimaActualizacion, ahora, error } = useDatos();
  const p = useTema();
  const insets = useSafeAreaInsets();
  const color = error ? p.accent : enVivo ? p.vivo : p.muted;
  const texto = error ? 'Sin conexión con el servidor' : enVivo ? 'En vivo' : 'Reconectando…';
  return (
    <View style={[s.caja, { paddingTop: insets.top + 10 }]}>
      <Text style={s.titulo} accessibilityRole="header">{titulo}</Text>
      <View style={s.estado} accessibilityLiveRegion="polite">
        <View style={[s.punto, { backgroundColor: color }]} />
        <Text style={s.texto}>
          {texto}
          {ultimaActualizacion ? ` · actualizado ${fmtRelativo(ultimaActualizacion, ahora)}` : ''}
        </Text>
      </View>
    </View>
  );
}
