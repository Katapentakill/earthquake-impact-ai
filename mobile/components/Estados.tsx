import { Pressable, Text, View, type DimensionValue } from 'react-native';
import { useEstilos } from '@/lib/ajustes';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';

const fabrica = (p: Paleta) => ({
  esqueleto: { backgroundColor: p.surface3, borderRadius: RADIO.sm },
  error: { backgroundColor: p.surface, borderColor: p.accent, borderWidth: 1, borderRadius: RADIO.md, padding: 14, gap: 10, flexDirection: 'row' as const, alignItems: 'center' as const },
  errorTexto: { flex: 1, color: p.text, fontSize: 14, lineHeight: 20 },
  boton: { minHeight: 40, paddingHorizontal: 14, borderRadius: RADIO.md, backgroundColor: p.accent, alignItems: 'center' as const, justifyContent: 'center' as const },
  botonTexto: { color: p.onAccent, fontSize: 14, fontWeight: '700' as const },
  vacio: { alignItems: 'center' as const, padding: 28, gap: 6 },
  vacioTitulo: { color: p.text, fontSize: 16, fontWeight: '700' as const },
  vacioTexto: { color: p.text2, fontSize: 14, textAlign: 'center' as const, lineHeight: 20 },
});

/** Un bloque gris para marcar dónde irá el contenido mientras carga. */
export function Esqueleto({ alto = 14, ancho = '100%' }: { alto?: number; ancho?: DimensionValue }) {
  const s = useEstilos(fabrica);
  return <View style={[s.esqueleto, { height: alto, width: ancho }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}

export function BannerError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  const s = useEstilos(fabrica);
  return (
    <View style={s.error} accessibilityRole="alert">
      <Text style={s.errorTexto}>{mensaje}</Text>
      {onReintentar && (
        <Pressable onPress={onReintentar} style={s.boton} accessibilityRole="button">
          <Text style={s.botonTexto}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Vacio({ titulo, texto }: { titulo: string; texto?: string }) {
  const s = useEstilos(fabrica);
  return (
    <View style={s.vacio}>
      <Text style={s.vacioTitulo}>{titulo}</Text>
      {texto ? <Text style={s.vacioTexto}>{texto}</Text> : null}
    </View>
  );
}
