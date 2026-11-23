import { Pressable, ScrollView, Text, View } from 'react-native';
import { useEstilos } from '@/lib/ajustes';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';

const fabrica = (p: Paleta) => ({
  grupo: { gap: 6 },
  etiqueta: { color: p.muted, fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  fila: { flexDirection: 'row' as const, gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: RADIO.md, borderWidth: 1, borderColor: p.border, backgroundColor: p.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  chipOn: { backgroundColor: p.accent, borderColor: p.accent },
  texto: { color: p.text2, fontSize: 14, fontWeight: '600' as const },
  textoOn: { color: p.onAccent },
});

interface Opcion<T> {
  valor: T;
  texto: string;
}

/** Una fila de opciones excluyentes con su etiqueta; se desliza de lado si no cabe. */
export function GrupoChips<T extends string | number>({ etiqueta, opciones, valor, onElegir }: { etiqueta: string; opciones: Opcion<T>[]; valor: T; onElegir: (v: T) => void }) {
  const s = useEstilos(fabrica);
  return (
    <View style={s.grupo} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fila}>
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Pressable key={String(o.valor)} accessibilityRole="radio" accessibilityState={{ selected: activo }} onPress={() => onElegir(o.valor)} style={[s.chip, activo && s.chipOn]}>
              <Text style={[s.texto, activo && s.textoOn]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
