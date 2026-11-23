import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';

import { Cabecera } from '@/components/Cabecera';
import { GrupoChips } from '@/components/Chips';
import { BannerError, Esqueleto, Vacio } from '@/components/Estados';
import { FilaSismo } from '@/components/FilaSismo';
import { Kpis } from '@/components/Kpis';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';
import { useEstilos, useTema } from '@/lib/ajustes';
import { PERIODOS, useDatos, type Periodo } from '@/lib/datos';
import { ETIQUETA_PROFUNDIDAD, FILTROS_INICIALES, filtrarEventos, ordenarEventos, resumir, type ClaseProfundidad, type Filtros } from '@/lib/seismic';
import type { SeismicEvent } from '@/lib/types';

const fabrica = (p: Paleta) => ({
  lista: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  bloque: { gap: 14, marginBottom: 6 },
  filtros: { backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, padding: 14, gap: 14, ...p.sombra },
  buscar: { minHeight: 44, borderRadius: RADIO.md, borderWidth: 1, borderColor: p.border, backgroundColor: p.surface2, paddingHorizontal: 12, color: p.text, fontSize: 15 },
  restablecer: { color: p.accent, fontSize: 14, fontWeight: '700' as const, paddingVertical: 4 },
  titulo: { color: p.text, fontSize: 17, fontWeight: '800' as const },
  conteo: { color: p.text2, fontSize: 13 },
  tituloFila: { flexDirection: 'row' as const, alignItems: 'baseline' as const, justifyContent: 'space-between' as const, marginTop: 4 },
});

const MAGNITUDES = [{ valor: 0, texto: 'Todas' }, { valor: 5, texto: '5,0 o más' }, { valor: 6, texto: '6,0 o más' }];
const PROFUNDIDADES: { valor: ClaseProfundidad | 'todas'; texto: string }[] = [
  { valor: 'todas', texto: 'Todas' },
  ...(Object.keys(ETIQUETA_PROFUNDIDAD) as ClaseProfundidad[]).map((c) => ({ valor: c, texto: ETIQUETA_PROFUNDIDAD[c] })),
];
const OPCIONES_PERIODO = (Object.keys(PERIODOS) as Periodo[]).map((k) => ({ valor: k, texto: PERIODOS[k].corta }));

export default function Resumen() {
  const s = useEstilos(fabrica);
  const p = useTema();
  const router = useRouter();
  const { eventos, estado, error, recargar, periodo, setPeriodo, ahora, nuevos } = useDatos();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [refrescando, setRefrescando] = useState(false);

  const visibles = useMemo(() => ordenarEventos(filtrarEventos(eventos, filtros), 'fecha', -1), [eventos, filtros]);
  const resumen = useMemo(() => resumir(visibles, ahora, PERIODOS[periodo].horas), [visibles, ahora, periodo]);
  const hayFiltros = filtros.magMin !== 0 || filtros.profundidad !== 'todas' || filtros.texto !== '';

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
      <Kpis resumen={resumen} ahora={ahora} horasPeriodo={PERIODOS[periodo].horas} etiquetaPeriodo={PERIODOS[periodo].etiqueta} cargando={estado === 'cargando'} />
      <View style={s.filtros}>
        <GrupoChips etiqueta="Período" opciones={OPCIONES_PERIODO} valor={periodo} onElegir={setPeriodo} />
        <GrupoChips etiqueta="Magnitud" opciones={MAGNITUDES} valor={filtros.magMin} onElegir={(v) => setFiltros({ ...filtros, magMin: v })} />
        <GrupoChips etiqueta="Profundidad" opciones={PROFUNDIDADES} valor={filtros.profundidad} onElegir={(v) => setFiltros({ ...filtros, profundidad: v })} />
        <TextInput
          style={s.buscar}
          placeholder="Buscar lugar o ID"
          placeholderTextColor={p.muted}
          value={filtros.texto}
          onChangeText={(texto) => setFiltros({ ...filtros, texto })}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Buscar por lugar o ID"
        />
        {hayFiltros ? (
          <Text style={s.restablecer} accessibilityRole="button" onPress={() => setFiltros(FILTROS_INICIALES)}>
            Restablecer filtros
          </Text>
        ) : null}
      </View>
      <View style={s.tituloFila}>
        <Text style={s.titulo} accessibilityRole="header">Sismos</Text>
        <Text style={s.conteo} accessibilityLiveRegion="polite">{estado === 'cargando' ? 'Cargando…' : `Mostrando ${visibles.length} de ${eventos.length}`}</Text>
      </View>
      {estado === 'cargando' ? [0, 1, 2].map((i) => <Esqueleto key={i} alto={74} />) : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Cabecera titulo="Monitor sísmico" />
      <FlatList
        data={estado === 'cargando' ? [] : visibles}
        keyExtractor={(e) => e.event_id}
        renderItem={renderFila}
        ListHeaderComponent={cabecera}
        ListEmptyComponent={estado === 'cargando' ? null : <Vacio titulo={error && estado === 'error' ? 'No hay datos para mostrar' : 'Ningún sismo coincide con los filtros'} texto={hayFiltros ? 'Prueba con otro período o quita algún filtro.' : undefined} />}
        contentContainerStyle={s.lista}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={p.accent} colors={[p.accent]} />}
        initialNumToRender={10}
        windowSize={9}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
