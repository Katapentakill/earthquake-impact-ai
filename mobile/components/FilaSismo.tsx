import { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useEstilos, useTema } from '@/lib/ajustes';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';
import { fmtEntero, fmtRelativo, instante } from '@/lib/format';
import { ETIQUETA_DESTRUCCION, ETIQUETA_PROFUNDIDAD, claseProfundidad, indiceDestruccion } from '@/lib/seismic';
import type { SeismicEvent } from '@/lib/types';
import { Icono } from './Icono';
import { BarrasNivel, Insignia } from './Insignia';

const fabrica = (p: Paleta) => ({
  fila: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, paddingVertical: 12, paddingHorizontal: 12, ...p.sombra },
  filaElegida: { borderColor: p.accent, backgroundColor: p.surface2 },
  cuerpo: { flex: 1, gap: 3 },
  lugar: { color: p.text, fontSize: 15, fontWeight: '700' as const, lineHeight: 20 },
  meta: { color: p.text2, fontSize: 13 },
  impacto: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 3 },
  impactoTexto: { color: p.muted, fontSize: 12.5 },
  nuevo: { alignSelf: 'flex-start' as const, backgroundColor: p.accentSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 2 },
  nuevoTexto: { color: p.accent, fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },
});

interface Props {
  evento: SeismicEvent;
  ahora: number;
  nuevo?: boolean;
  elegida?: boolean;
  onPress: (id: string) => void;
}

function FilaSismoBase({ evento: e, ahora, nuevo, elegida, onPress }: Props) {
  const s = useEstilos(fabrica);
  const p = useTema();
  const idx = e.nivel_destruccion ? indiceDestruccion(e.nivel_destruccion) : null;
  const hace = fmtRelativo(instante(e.fecha_utc), ahora);
  const prof = `${fmtEntero(e.profundidad)} km · ${ETIQUETA_PROFUNDIDAD[claseProfundidad(e.profundidad)]}`;
  return (
    <Pressable
      onPress={() => onPress(e.event_id)}
      accessibilityRole="button"
      accessibilityLabel={`Magnitud ${e.magnitud}, ${e.lugar}, ${hace}, profundidad ${fmtEntero(e.profundidad)} kilómetros`}
      style={({ pressed }) => [s.fila, elegida && s.filaElegida, pressed && { opacity: 0.85 }]}>
      <Insignia magnitud={e.magnitud} />
      <View style={s.cuerpo}>
        {nuevo ? (
          <View style={s.nuevo}>
            <Text style={s.nuevoTexto}>NUEVO</Text>
          </View>
        ) : null}
        <Text style={s.lugar} numberOfLines={2}>{e.lugar}</Text>
        <Text style={s.meta}>{hace} · {prof}</Text>
        {e.estimando ? (
          <View style={s.impacto} accessibilityRole="progressbar" accessibilityLabel="Estimando el impacto">
            <ActivityIndicator size="small" color={p.accent} />
            <Text style={s.impactoTexto}>Estimando el impacto…</Text>
          </View>
        ) : idx !== null ? (
          <View style={s.impacto}>
            <BarrasNivel indice={idx} />
            <Text style={s.impactoTexto}>Impacto {ETIQUETA_DESTRUCCION[idx].toLowerCase()}</Text>
          </View>
        ) : null}
      </View>
      <Icono nombre="chevron-right" color={p.muted} />
    </Pressable>
  );
}

/** Una fila de la lista de sismos. `memo` evita redibujar las 500 filas cuando solo cambia el reloj. */
export const FilaSismo = memo(FilaSismoBase);
