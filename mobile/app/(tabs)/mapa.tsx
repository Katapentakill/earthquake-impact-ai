import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Cabecera } from '@/components/Cabecera';
import { BannerError } from '@/components/Estados';
import { Icono } from '@/components/Icono';
import { Insignia } from '@/components/Insignia';
import { SeismicMap } from '@/components/SeismicMap';
import type { Paleta } from '@/constants/paleta';
import { ESCALA_MAGNITUD, RADIO } from '@/constants/paleta';
import { useEstilos, useTema } from '@/lib/ajustes';
import { useDatos } from '@/lib/datos';
import { fmtEntero, fmtRelativo, instante } from '@/lib/format';
import { ETIQUETA_PROFUNDIDAD, claseProfundidad } from '@/lib/seismic';

const fabrica = (p: Paleta) => ({
  mapa: { flex: 1, backgroundColor: p.ocean },
  aviso: { position: 'absolute' as const, top: 10, left: 12, right: 64 },
  hoja: { position: 'absolute' as const, left: 12, right: 12, bottom: 12, backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, padding: 14, gap: 12, ...p.sombra },
  fila: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  cuerpo: { flex: 1, gap: 2 },
  lugar: { color: p.text, fontSize: 15, fontWeight: '700' as const, lineHeight: 20 },
  meta: { color: p.text2, fontSize: 13 },
  cerrar: { width: 44, height: 44, alignItems: 'center' as const, justifyContent: 'center' as const },
  boton: { minHeight: 44, borderRadius: RADIO.md, backgroundColor: p.accent, alignItems: 'center' as const, justifyContent: 'center' as const },
  botonTexto: { color: p.onAccent, fontSize: 15, fontWeight: '700' as const },
  leyenda: { position: 'absolute' as const, left: 12, bottom: 12, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.md, paddingHorizontal: 12, paddingVertical: 8 },
  leyendaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
  leyendaTexto: { color: p.text2, fontSize: 12 },
});

const LEYENDA: { nivel: 1 | 2 | 3 | 4; texto: string }[] = [
  { nivel: 1, texto: '< 5' },
  { nivel: 2, texto: '5–6' },
  { nivel: 3, texto: '6–7' },
  { nivel: 4, texto: '7+' },
];

export default function Mapa() {
  const s = useEstilos(fabrica);
  const p = useTema();
  const router = useRouter();
  const { eventos, elegido, elegir, ahora, error, recargar } = useDatos();
  const sel = eventos.find((e) => e.event_id === elegido) ?? null;

  return (
    <View style={{ flex: 1 }}>
      <Cabecera titulo="Mapa" />
      <View style={s.mapa}>
        <SeismicMap eventos={eventos} elegido={sel ? sel.event_id : null} onElegir={elegir} />
        {error ? (
          <View style={s.aviso}>
            <BannerError mensaje={error} onReintentar={recargar} />
          </View>
        ) : null}
        {sel ? (
          <View style={s.hoja}>
            <View style={s.fila}>
              <Insignia magnitud={sel.magnitud} />
              <View style={s.cuerpo}>
                <Text style={s.lugar} numberOfLines={2}>{sel.lugar}</Text>
                <Text style={s.meta}>
                  {fmtRelativo(instante(sel.fecha_utc), ahora)} · {fmtEntero(sel.profundidad)} km · {ETIQUETA_PROFUNDIDAD[claseProfundidad(sel.profundidad)]}
                </Text>
              </View>
              <Pressable style={s.cerrar} onPress={() => elegir(null)} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Icono nombre="close" color={p.text2} />
              </Pressable>
            </View>
            <Pressable style={s.boton} accessibilityRole="button" onPress={() => router.push({ pathname: '/evento/[id]', params: { id: sel.event_id } })}>
              <Text style={s.botonTexto}>Ver impacto estimado</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.leyenda} accessibilityLabel="Escala de magnitud del mapa">
            {LEYENDA.map((l) => (
              <View key={l.nivel} style={s.leyendaItem}>
                <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: ESCALA_MAGNITUD[l.nivel].fondo }} />
                <Text style={s.leyendaTexto}>{l.texto}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
