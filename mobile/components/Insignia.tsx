import { Text, View } from 'react-native';
import { ESCALA_MAGNITUD } from '@/constants/paleta';
import { fmtMagnitud } from '@/lib/format';
import { nivelMagnitud } from '@/lib/seismic';

/** Círculo con la magnitud, coloreado con la escala de la web (verde azulado, ámbar, naranja, rojo). */
export function Insignia({ magnitud, tam = 46 }: { magnitud: number; tam?: number }) {
  const c = ESCALA_MAGNITUD[nivelMagnitud(magnitud)];
  return (
    <View
      accessible
      accessibilityLabel={`Magnitud ${fmtMagnitud(magnitud)}`}
      style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: c.fondo, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.texto, fontWeight: '800', fontSize: Math.round(tam * 0.38), fontVariant: ['tabular-nums'] }}>{fmtMagnitud(magnitud)}</Text>
    </View>
  );
}

/** Las cuatro barras del nivel de destrucción (0 a 3), pintadas con la misma escala. */
export function BarrasNivel({ indice, ancho = 52, alto = 6 }: { indice: number; ancho?: number; alto?: number }) {
  const colores = [ESCALA_MAGNITUD[1].fondo, ESCALA_MAGNITUD[2].fondo, ESCALA_MAGNITUD[3].fondo, ESCALA_MAGNITUD[4].fondo];
  return (
    <View style={{ flexDirection: 'row', gap: 3, width: ancho }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {colores.map((c, i) => (
        <View key={c} style={{ flex: 1, height: alto, borderRadius: alto / 2, backgroundColor: i <= indice ? c : 'rgba(128,120,100,0.28)' }} />
      ))}
    </View>
  );
}
