import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { BannerError, Esqueleto } from '@/components/Estados';
import { Icono } from '@/components/Icono';
import { BarrasNivel, Insignia } from '@/components/Insignia';
import type { Paleta } from '@/constants/paleta';
import { RADIO } from '@/constants/paleta';
import { eventsApi, mensajeDeError } from '@/lib/api';
import { useEstilos, useTema } from '@/lib/ajustes';
import { useDatos } from '@/lib/datos';
import { fmtCoordenadas, fmtDinero, fmtEntero, fmtFecha, fmtRelativo, instante } from '@/lib/format';
import { ETIQUETA_DESTRUCCION, ETIQUETA_PROFUNDIDAD, claseProfundidad, esRespaldo, indiceDestruccion } from '@/lib/seismic';
import type { EventWithImpacts, ImpactData } from '@/lib/types';

const fabrica = (p: Paleta) => ({
  contenido: { padding: 16, paddingBottom: 32, gap: 14 },
  cab: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14 },
  cabTexto: { flex: 1, gap: 2 },
  lugar: { color: p.text, fontSize: 19, fontWeight: '800' as const, lineHeight: 25 },
  id: { color: p.muted, fontSize: 12.5 },
  hechos: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  hecho: { flexGrow: 1, flexBasis: '47%' as const, minWidth: 140, backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.md, padding: 12, gap: 2 },
  etiqueta: { color: p.muted, fontSize: 11.5, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  hechoValor: { color: p.text, fontSize: 16, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] },
  hechoSub: { color: p.text2, fontSize: 12.5 },
  estimando: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, backgroundColor: p.accentSoft, borderColor: p.accent, borderWidth: 1, borderRadius: RADIO.lg, padding: 14 },
  estimandoTexto: { flex: 1, color: p.text, fontSize: 15, fontWeight: '700' as const },
  estimandoSub: { color: p.text2, fontSize: 13, fontWeight: '400' as const, marginTop: 2 },
  tarjeta: { backgroundColor: p.surface, borderColor: p.border, borderWidth: 1, borderRadius: RADIO.lg, padding: 14, gap: 12, ...p.sombra },
  secCab: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 8, flexWrap: 'wrap' as const },
  fuente: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, backgroundColor: p.surface2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  fuenteIa: { backgroundColor: p.accentSoft },
  fuenteTexto: { color: p.text, fontSize: 12.5, fontWeight: '700' as const },
  tres: { flexDirection: 'row' as const, gap: 10 },
  cifra: { flex: 1, backgroundColor: p.surface2, borderRadius: RADIO.md, padding: 10, gap: 2 },
  cifraGrande: { flex: 1.6 },
  cifraValor: { color: p.text, fontSize: 20, fontWeight: '800' as const, fontVariant: ['tabular-nums' as const] },
  cifraEtq: { color: p.text2, fontSize: 12.5 },
  nivel: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  nivelEtq: { color: p.text2, fontSize: 13.5 },
  nivelValor: { color: p.text, fontSize: 14.5, fontWeight: '800' as const },
  aviso: { backgroundColor: p.accentSoft, borderRadius: RADIO.md, padding: 12 },
  avisoTexto: { color: p.text, fontSize: 13.5, lineHeight: 19 },
  parrafo: { color: p.text2, fontSize: 14, lineHeight: 21 },
  lista: { gap: 4 },
  pie: { color: p.muted, fontSize: 12.5, lineHeight: 18 },
  boton: { minHeight: 48, borderRadius: RADIO.md, backgroundColor: p.accent, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8 },
  botonTexto: { color: p.onAccent, fontSize: 15, fontWeight: '700' as const },
  paisCab: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: 36 },
  paisTitulo: { color: p.text, fontSize: 14.5, fontWeight: '700' as const, flex: 1 },
});

type Estado = { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; datos: EventWithImpacts };

function SeccionPais({ i, abierto: abiertoInicial, unico }: { i: ImpactData; abierto: boolean; unico: boolean }) {
  const s = useEstilos(fabrica);
  const p = useTema();
  const [abierto, setAbierto] = useState(abiertoInicial);
  const nivel = indiceDestruccion(i.nivel_destruccion);
  const titulo = unico ? 'Razonamiento y factores' : `${i.pais} · ${ETIQUETA_DESTRUCCION[nivel]}`;
  return (
    <View style={s.tarjeta}>
      <Pressable style={s.paisCab} onPress={() => setAbierto(!abierto)} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <Text style={s.paisTitulo}>{titulo}</Text>
        <Icono nombre={abierto ? 'expand-less' : 'expand-more'} color={p.text2} />
      </Pressable>
      {abierto ? (
        <View style={{ gap: 10 }}>
          {!unico ? (
            <Text style={s.parrafo}>
              Muertes {fmtEntero(i.muertes_estimadas)} · Heridos {fmtEntero(i.heridos_estimados)} · Pérdidas {fmtDinero(i.perdidas_monetarias_usd)}
            </Text>
          ) : null}
          {i.ciudades_afectadas && i.ciudades_afectadas.length > 0 ? <Text style={s.parrafo}>Ciudades: {i.ciudades_afectadas.join(', ')}.</Text> : null}
          {i.codigo_construccion ? <Text style={s.parrafo}>Código de construcción: {i.codigo_construccion}.</Text> : null}
          {i.razonamiento_ia ? <Text style={s.parrafo}>{i.razonamiento_ia}</Text> : null}
          {i.factores_considerados && i.factores_considerados.length > 0 ? (
            <View style={s.lista}>
              {i.factores_considerados.map((f) => (
                <Text key={f} style={s.parrafo}>• {f}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function DetalleSismo() {
  const s = useEstilos(fabrica);
  const p = useTema();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { eventos, alertas, ahora, elegir } = useDatos();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  // La lista (que se actualiza con el WebSocket) sabe antes que el detalle si el sismo se está estimando.
  const enLista = eventos.find((e) => e.event_id === id) ?? alertas.find((e) => e.event_id === id) ?? null;
  const listaEstima = Boolean(enLista?.estimando);
  const estimandoAhora = listaEstima || (estado.tipo === 'listo' && Boolean(estado.datos.event.estimando));

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    eventsApi
      .getEventDetail(id)
      .then((datos) => vigente && setEstado({ tipo: 'listo', datos }))
      .catch((e) => vigente && setEstado({ tipo: 'error', mensaje: mensajeDeError(e) }));
    return () => {
      vigente = false;
    };
  }, [id, intento, listaEstima]);

  // Mientras el sismo se está estimando (la IA puede tardar), el detalle se vuelve a pedir cada pocos segundos, sin parpadeo.
  useEffect(() => {
    if (!estimandoAhora || !id) return;
    let vigente = true;
    const t = setInterval(() => {
      eventsApi.getEventDetail(id).then((datos) => vigente && setEstado({ tipo: 'listo', datos })).catch(() => {});
    }, 4000);
    return () => {
      vigente = false;
      clearInterval(t);
    };
  }, [estimandoAhora, id]);

  // El evento se muestra de inmediato si ya está en la lista; si no, espera a la respuesta de la API.
  const evento = (estado.tipo === 'listo' ? estado.datos.event : null) ?? eventos.find((e) => e.event_id === id) ?? alertas.find((e) => e.event_id === id) ?? null;
  const impactos = estado.tipo === 'listo' ? estado.datos.impacts : [];
  const respaldo = esRespaldo(impactos);
  const estimando = estimandoAhora && impactos.length === 0;
  const total = impactos.reduce(
    (t, i) => ({ muertes: t.muertes + i.muertes_estimadas, heridos: t.heridos + i.heridos_estimados, perdidas: t.perdidas + i.perdidas_monetarias_usd }),
    { muertes: 0, heridos: 0, perdidas: 0 },
  );
  const indice = impactos.reduce((m, i) => Math.max(m, indiceDestruccion(i.nivel_destruccion)), 0);

  if (!evento) {
    return (
      <ScrollView contentContainerStyle={s.contenido}>
        {!estimando && estado.tipo === 'error' ? <BannerError mensaje={estado.mensaje} onReintentar={() => setIntento((n) => n + 1)} /> : <Esqueleto alto={80} />}
      </ScrollView>
    );
  }
  const t = instante(evento.fecha_utc);
  return (
    <ScrollView contentContainerStyle={s.contenido}>
      <View style={s.cab}>
        <Insignia magnitud={evento.magnitud} tam={64} />
        <View style={s.cabTexto}>
          <Text style={s.lugar} accessibilityRole="header">{evento.lugar}</Text>
          <Text style={s.id}>{evento.event_id} · {evento.fuente_api}</Text>
        </View>
      </View>

      <View style={s.hechos}>
        <View style={s.hecho}>
          <Text style={s.etiqueta}>Hora (UTC)</Text>
          <Text style={s.hechoValor}>{fmtFecha(t)}</Text>
          <Text style={s.hechoSub}>{fmtRelativo(t, ahora)}</Text>
        </View>
        <View style={s.hecho}>
          <Text style={s.etiqueta}>Profundidad</Text>
          <Text style={s.hechoValor}>{fmtEntero(evento.profundidad)} km</Text>
          <Text style={s.hechoSub}>{ETIQUETA_PROFUNDIDAD[claseProfundidad(evento.profundidad)]}</Text>
        </View>
        <View style={s.hecho}>
          <Text style={s.etiqueta}>Coordenadas</Text>
          <Text style={[s.hechoValor, { fontSize: 14 }]}>{fmtCoordenadas(evento.latitud, evento.longitud)}</Text>
        </View>
        <View style={s.hecho}>
          <Text style={s.etiqueta}>Radio de afectación</Text>
          <Text style={s.hechoValor}>{evento.radio_afectacion_km ? `${fmtEntero(evento.radio_afectacion_km)} km` : '—'}</Text>
        </View>
      </View>

      {estimando ? (
        <View style={s.estimando} accessibilityRole="progressbar" accessibilityLabel="Estimando el impacto">
          <ActivityIndicator size="large" color={p.accent} />
          <Text style={s.estimandoTexto}>
            Estimando el impacto…
            <Text style={s.estimandoSub}>{'\n'}Con IA puede tardar unos segundos; esta pantalla se completa sola.</Text>
          </Text>
        </View>
      ) : null}
      {!estimando && estado.tipo === 'cargando' ? (
        <View style={s.tarjeta} accessibilityLabel="Cargando el impacto estimado">
          <Esqueleto alto={64} />
          <Esqueleto alto={14} ancho="60%" />
        </View>
      ) : null}
      {estado.tipo === 'error' ? <BannerError mensaje={`No se pudo cargar el impacto de este sismo. ${estado.mensaje}`} onReintentar={() => setIntento((n) => n + 1)} /> : null}
      {!estimando && estado.tipo === 'listo' && impactos.length === 0 ? (
        <View style={s.aviso}>
          <Text style={s.avisoTexto}>Este sismo todavía no tiene una estimación de impacto.</Text>
        </View>
      ) : null}

      {estado.tipo === 'listo' && impactos.length > 0 ? (
        <>
          <View style={s.tarjeta}>
            <View style={s.secCab}>
              <Text style={s.etiqueta} accessibilityRole="header">Impacto estimado</Text>
              <View style={[s.fuente, !respaldo && s.fuenteIa]}>
                <Icono nombre={respaldo ? 'calculate' : 'auto-awesome'} tam={16} color={respaldo ? p.text2 : p.accent} />
                <Text style={s.fuenteTexto}>{respaldo ? 'Cálculo por reglas · sin IA' : 'Análisis con IA'}</Text>
              </View>
            </View>
            <View style={s.tres}>
              <View style={s.cifra}>
                <Text style={s.cifraValor}>{fmtEntero(total.muertes)}</Text>
                <Text style={s.cifraEtq}>Muertes</Text>
              </View>
              <View style={s.cifra}>
                <Text style={s.cifraValor}>{fmtEntero(total.heridos)}</Text>
                <Text style={s.cifraEtq}>Heridos</Text>
              </View>
              <View style={[s.cifra, s.cifraGrande]}>
                <Text style={[s.cifraValor, { fontSize: 16 }]} numberOfLines={2}>{fmtDinero(total.perdidas)}</Text>
                <Text style={s.cifraEtq}>Pérdidas</Text>
              </View>
            </View>
            <View style={s.nivel}>
              <Text style={s.nivelEtq}>Nivel de destrucción</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <BarrasNivel indice={indice} />
                <Text style={s.nivelValor}>{ETIQUETA_DESTRUCCION[indice]}</Text>
              </View>
            </View>
          </View>

          {respaldo ? (
            <View style={s.aviso}>
              <Text style={s.avisoTexto}>Estimación calculada solo con magnitud y profundidad. Con un modelo de IA conectado, el detalle suma contexto por país, ciudades y razonamiento.</Text>
            </View>
          ) : null}

          {impactos.map((i, n) => (
            <SeccionPais key={`${i.pais}-${n}`} i={i} abierto={n === 0} unico={impactos.length === 1} />
          ))}

          <Text style={s.pie}>
            Región: {respaldo ? 'sin identificar' : [...new Set(impactos.map((i) => i.pais))].join(', ')}
            {impactos[0].nivel_preparacion_sismica ? ` · Preparación sísmica: ${impactos[0].nivel_preparacion_sismica}` : ''}. Las estimaciones no son información oficial.
          </Text>
        </>
      ) : null}

      <Pressable
        style={s.boton}
        accessibilityRole="button"
        onPress={() => {
          elegir(evento.event_id);
          router.dismissTo('/mapa');
        }}>
        <Icono nombre="public" color={p.onAccent} tam={20} />
        <Text style={s.botonTexto}>Ver en el mapa</Text>
      </Pressable>
    </ScrollView>
  );
}
