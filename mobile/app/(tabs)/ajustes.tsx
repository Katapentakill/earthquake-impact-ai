import Constants from 'expo-constants';
import { Platform, ScrollView, Text, View } from 'react-native';

import { Cabecera } from '@/components/Cabecera';
import { GrupoChips } from '@/components/Chips';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';
import { UMBRALES, useAjustes, useEstilos, type PreferenciaTema } from '@/lib/ajustes';
import { API_URL, WS_URL } from '@/lib/config';
import { useDatos } from '@/lib/datos';
import { fmtEntero, fmtFecha, fmtMagnitud } from '@/lib/format';

const fabrica = (p: Paleta) => ({
  contenido: { paddingHorizontal: 16, paddingBottom: 28, gap: 14 },
  tarjeta: { backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, padding: 14, gap: 14, ...p.sombra },
  titulo: { color: p.text, fontSize: 16, fontWeight: '800' as const },
  texto: { color: p.text2, fontSize: 13.5, lineHeight: 19 },
  dato: { gap: 2 },
  etiqueta: { color: p.muted, fontSize: 11.5, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  valor: { color: p.text, fontSize: 14.5, fontWeight: '600' as const },
  mono: { color: p.text, fontSize: 13, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Consolas, monospace' }) },
});

const TEMAS: { valor: PreferenciaTema; texto: string }[] = [
  { valor: 'sistema', texto: 'Como el teléfono' },
  { valor: 'claro', texto: 'Crema' },
  { valor: 'oscuro', texto: 'Oscuro' },
];

function Dato({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  const s = useEstilos(fabrica);
  return (
    <View style={s.dato}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <Text style={mono ? s.mono : s.valor} selectable>{valor}</Text>
    </View>
  );
}

export default function Ajustes() {
  const s = useEstilos(fabrica);
  const { tema, umbral, cambiar } = useAjustes();
  const { enVivo, estado, error, eventos, alertas, ultimaActualizacion } = useDatos();
  const conexion = error ? 'Sin conexión con el servidor' : estado === 'cargando' ? 'Conectando…' : 'Conectado';
  return (
    <View style={{ flex: 1 }}>
      <Cabecera titulo="Ajustes" />
      <ScrollView contentContainerStyle={s.contenido}>
        <View style={s.tarjeta}>
          <Text style={s.titulo} accessibilityRole="header">Apariencia</Text>
          <GrupoChips etiqueta="Tema" opciones={TEMAS} valor={tema} onElegir={(v) => cambiar({ tema: v })} />
          <Text style={s.texto}>El crema atenúa el brillo para cansar menos la vista; el oscuro es un marrón cálido, sin negro puro.</Text>
        </View>

        <View style={s.tarjeta}>
          <Text style={s.titulo} accessibilityRole="header">Alertas</Text>
          <GrupoChips etiqueta="Magnitud mínima" opciones={UMBRALES.map((u) => ({ valor: u, texto: fmtMagnitud(u) }))} valor={umbral} onElegir={(v) => cambiar({ umbral: v })} />
          <Text style={s.texto}>La pestaña Alertas muestra los sismos de los últimos 30 días que alcanzan esta magnitud. No hay notificaciones push: solo se avisa con la app abierta.</Text>
        </View>

        <View style={s.tarjeta}>
          <Text style={s.titulo} accessibilityRole="header">Conexión</Text>
          <Dato etiqueta="Servidor" valor={conexion} />
          <Dato etiqueta="Tiempo real (WebSocket)" valor={enVivo ? 'Conectado' : 'Reconectando…'} />
          <Dato etiqueta="Última actualización" valor={ultimaActualizacion ? fmtFecha(ultimaActualizacion) + ' (UTC)' : '—'} />
          <Dato etiqueta="Sismos cargados" valor={`${fmtEntero(eventos.length)} del período · ${fmtEntero(alertas.length)} en alertas`} />
          <Dato etiqueta="Dirección de la API" valor={API_URL} mono />
          <Dato etiqueta="Dirección del WebSocket" valor={WS_URL} mono />
        </View>

        <View style={s.tarjeta}>
          <Text style={s.titulo} accessibilityRole="header">Acerca de</Text>
          <Dato etiqueta="Versión" valor={Constants.expoConfig?.version ?? '1.0.0'} />
          <Text style={s.texto}>Los sismos vienen del catálogo del USGS (magnitud 4,5 o más). Las muertes, heridos y pérdidas son estimaciones calculadas por reglas o por un modelo de lenguaje; no son información oficial.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
