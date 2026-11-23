import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Cabecera } from '@/components/Cabecera';
import { BannerError, Esqueleto, Vacio } from '@/components/Estados';
import { FilaSismo } from '@/components/FilaSismo';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';
import { useAjustes, useEstilos, useTema } from '@/lib/ajustes';
import { useDatos } from '@/lib/datos';
import { fmtMagnitud } from '@/lib/format';
import { ordenarEventos } from '@/lib/seismic';
import type { SeismicEvent } from '@/lib/types';

const fabrica = (p: Paleta) => ({
  lista: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  bloque: { gap: 12, marginBottom: 6 },
  resumen: { backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, padding: 14, gap: 4, ...p.sombra },
  resumenTitulo: { color: p.text, fontSize: 16, fontWeight: '800' as const },
  resumenTexto: { color: p.text2, fontSize: 13.5, lineHeight: 19 },
  vivo: { backgroundColor: p.accentSoft, borderRadius: RADIO.md, padding: 12 },
  vivoTexto: { color: p.text, fontSize: 14, fontWeight: '600' as const },
});

export default function Alertas() {
  const s = useEstilos(fabrica);
  const p = useTema();
  const router = useRouter();
  const { umbral } = useAjustes();
  const { alertas, estado, error, recargar, ahora, nuevos } = useDatos();
  const [refrescando, setRefrescando] = useState(false);

  const filas = useMemo(() => ordenarEventos(alertas, 'fecha', -1), [alertas]);
  const recientes = filas.filter((e) => nuevos.includes(e.event_id));

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  }, [recargar]);
  const abrir = useCallback((id: string) => router.push({ pathname: '/evento/[id]', params: { id } }), [router]);
  const renderFila = useCallback(({ item }: { item: SeismicEvent }) => <FilaSismo evento={item} ahora={ahora} nuevo={nuevos.includes(item.event_id)} onPress={abrir} />, [ahora, nuevos, abrir]);

  const cabecera = (
    <View style={s.bloque}>
      {error ? <BannerError mensaje={error} onReintentar={recargar} /> : null}
      {recientes.length > 0 ? (
        <View style={s.vivo} accessibilityRole="alert">
          <Text style={s.vivoTexto}>
            {recientes.length === 1 ? `Llegó un sismo nuevo: M ${fmtMagnitud(recientes[0].magnitud)}, ${recientes[0].lugar}` : `Llegaron ${recientes.length} sismos nuevos desde que abriste la app`}
          </Text>
        </View>
      ) : null}
      <View style={s.resumen}>
        <Text style={s.resumenTitulo} accessibilityRole="header">Magnitud {fmtMagnitud(umbral)} o más</Text>
        <Text style={s.resumenTexto}>
          {estado === 'cargando' ? 'Cargando…' : `${filas.length} ${filas.length === 1 ? 'sismo' : 'sismos'} en los últimos 30 días. Si llega uno nuevo mientras la app está abierta, aparece arriba con la etiqueta NUEVO. El umbral se cambia en Ajustes.`}
        </Text>
      </View>
      {estado === 'cargando' ? [0, 1, 2].map((i) => <Esqueleto key={i} alto={74} />) : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Cabecera titulo="Alertas" />
      <FlatList
        data={estado === 'cargando' ? [] : filas}
        keyExtractor={(e) => e.event_id}
        renderItem={renderFila}
        ListHeaderComponent={cabecera}
        ListEmptyComponent={estado === 'cargando' ? null : <Vacio titulo="Sin alertas" texto={`No hubo sismos de magnitud ${fmtMagnitud(umbral)} o más en los últimos 30 días.`} />}
        contentContainerStyle={s.lista}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={p.accent} colors={[p.accent]} />}
      />
    </View>
  );
}
