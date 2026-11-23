import { Text, View } from 'react-native';
import { useEstilos } from '@/lib/ajustes';
import type { Paleta } from '@/constants/paleta';
import { ESCALA_MAGNITUD, RADIO } from '@/constants/paleta';
import { fmtDecimal, fmtEntero, fmtMagnitud, fmtRelativo, instante } from '@/lib/format';
import { nivelMagnitud, type Resumen } from '@/lib/seismic';
import { Esqueleto } from './Estados';

const fabrica = (p: Paleta) => ({
  rejilla: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  tarjeta: { flexGrow: 1, flexBasis: '47%' as const, minWidth: 150, backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, padding: 14, gap: 4, ...p.sombra },
  etiqueta: { color: p.muted, fontSize: 11.5, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  valorFila: { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 6 },
  valor: { color: p.text, fontSize: 32, fontWeight: '800' as const, fontVariant: ['tabular-nums' as const], letterSpacing: -0.5 },
  unidad: { color: p.text2, fontSize: 13 },
  sub: { color: p.text2, fontSize: 12.5, lineHeight: 17 },
  viz: { marginTop: 6, height: 26, justifyContent: 'flex-end' as const },
  spark: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 3, height: 26 },
  pila: { flexDirection: 'row' as const, height: 8, borderRadius: 4, overflow: 'hidden' as const, gap: 2 },
  barra: { height: 8, borderRadius: 4, backgroundColor: p.surface3, overflow: 'hidden' as const },
  barraRelleno: { height: 8, borderRadius: 4, backgroundColor: p.accent },
});

interface Props {
  resumen: Resumen;
  ahora: number;
  horasPeriodo: number;
  etiquetaPeriodo: string;
  cargando: boolean;
}

/** «Uno cada 96 min» o «Uno cada 3 h», según qué tan seguido ocurran. */
function cadencia(horas: number, total: number): string {
  if (!total) return 'Sin sismos en el período';
  const min = (horas * 60) / total;
  return min >= 120 ? `Uno cada ${fmtEntero(min / 60)} h en promedio` : `Uno cada ${fmtEntero(min)} min en promedio`;
}

export function Kpis({ resumen: r, ahora, horasPeriodo, etiquetaPeriodo, cargando }: Props) {
  const s = useEstilos(fabrica);
  if (cargando) {
    return (
      <View style={s.rejilla} accessibilityLabel="Cargando el resumen">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={s.tarjeta}>
            <Esqueleto alto={12} ancho="55%" />
            <Esqueleto alto={34} ancho="40%" />
            <Esqueleto alto={12} ancho="75%" />
          </View>
        ))}
      </View>
    );
  }
  const maxActividad = Math.max(1, ...r.actividad);
  const nivelMax = r.mayor ? nivelMagnitud(r.mayor.magnitud) : 1;
  const pct = r.total ? (r.deCincoOMas / r.total) * 100 : 0;
  return (
    <View style={s.rejilla}>
      <View style={s.tarjeta} accessible accessibilityLabel={`${r.total} sismos registrados en las ${etiquetaPeriodo}`}>
        <Text style={s.etiqueta}>Sismos registrados</Text>
        <View style={s.valorFila}>
          <Text style={s.valor}>{r.total}</Text>
          <Text style={s.unidad}>{etiquetaPeriodo}</Text>
        </View>
        <Text style={s.sub}>{cadencia(horasPeriodo, r.total)}</Text>
        <View style={s.viz}>
          <View style={s.spark}>
            {r.actividad.map((c, i) => (
              <View key={i} style={{ flex: 1, height: `${c ? Math.max(14, (c / maxActividad) * 100) : 8}%`, borderRadius: 2, backgroundColor: c ? ESCALA_MAGNITUD[2].fondo : 'rgba(128,120,100,0.3)' }} />
            ))}
          </View>
        </View>
      </View>

      <View style={s.tarjeta}>
        <Text style={s.etiqueta}>Mayor magnitud</Text>
        <View style={s.valorFila}>
          <Text style={s.valor}>{r.mayor ? fmtMagnitud(r.mayor.magnitud) : '—'}</Text>
          {r.mayor ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: ESCALA_MAGNITUD[nivelMax].fondo }} /> : null}
        </View>
        <Text style={s.sub} numberOfLines={2}>
          {r.mayor ? `${r.mayor.lugar} · ${fmtEntero(r.mayor.profundidad)} km` : 'Sin sismos con estos filtros'}
        </Text>
        <View style={s.viz}>
          <Text style={s.sub}>{r.mayor ? fmtRelativo(instante(r.mayor.fecha_utc), ahora) : ''}</Text>
        </View>
      </View>

      <View style={s.tarjeta}>
        <Text style={s.etiqueta}>Magnitud media</Text>
        <View style={s.valorFila}>
          <Text style={s.valor}>{r.total ? fmtDecimal(r.media) : '—'}</Text>
        </View>
        <Text style={s.sub}>Reparto por escala</Text>
        <View style={s.viz}>
          <View style={s.pila} accessible accessibilityLabel={`Reparto por escala: ${r.porNivel.map((v, i) => `${v} de nivel ${i + 1}`).join(', ')}`}>
            {r.porNivel.map((v, i) => (v ? <View key={i} style={{ flex: v, backgroundColor: ESCALA_MAGNITUD[(i + 1) as 1 | 2 | 3 | 4].fondo }} /> : null))}
          </View>
        </View>
      </View>

      <View style={s.tarjeta}>
        <Text style={s.etiqueta}>De magnitud 5 o más</Text>
        <View style={s.valorFila}>
          <Text style={s.valor}>{r.deCincoOMas}</Text>
          <Text style={s.unidad}>de {r.total}</Text>
        </View>
        <Text style={s.sub}>{fmtEntero(pct)} % del total</Text>
        <View style={s.viz}>
          <View style={s.barra}>
            <View style={[s.barraRelleno, { width: `${pct}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}
