'use client';

import { useEffect, useState } from 'react';
import Icono from './Icono';
import { eventsApi } from '@/lib/api';
import type { EventWithImpacts, ImpactData, SeismicEvent } from '@/types';
import { ETIQUETA_DESTRUCCION, ETIQUETA_PROFUNDIDAD, claseProfundidad, esRespaldo, indiceDestruccion, nivelMagnitud } from '@/lib/seismic';
import { fmtCoordenadas, fmtDinero, fmtEntero, fmtFecha, fmtMagnitud, fmtRelativo, instante } from '@/lib/format';

interface Props {
  evento: SeismicEvent | null;
  ahora: number;
}

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; datos: EventWithImpacts };

function Barras({ indice }: { indice: number }) {
  return (
    <>
      <div className="nivel" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i <= indice ? `on l${i + 1}` : ''} />
        ))}
      </div>
      <div className="nivel-t">
        <span>Nivel de destrucción</span>
        <b>{ETIQUETA_DESTRUCCION[indice]}</b>
      </div>
    </>
  );
}

function DetallePais({ i, abierto, unico }: { i: ImpactData; abierto: boolean; unico: boolean }) {
  const nivel = indiceDestruccion(i.nivel_destruccion);
  return (
    <details className="detalle" open={abierto}>
      <summary>
        <span>{unico ? 'Razonamiento y factores' : `${i.pais} · ${ETIQUETA_DESTRUCCION[nivel]}`}</span>
      </summary>
      <div className="cuerpo">
        {!unico && (
          <div className="sub-cifras">
            <span>Muertes <b className="num">{fmtEntero(i.muertes_estimadas)}</b></span>
            <span>Heridos <b className="num">{fmtEntero(i.heridos_estimados)}</b></span>
            <span>Pérdidas <b className="num">{fmtDinero(i.perdidas_monetarias_usd)}</b></span>
          </div>
        )}
        {i.ciudades_afectadas && i.ciudades_afectadas.length > 0 && <p>Ciudades: {i.ciudades_afectadas.join(', ')}.</p>}
        {i.codigo_construccion && <p>Código de construcción: {i.codigo_construccion}.</p>}
        {i.razonamiento_ia && <p>{i.razonamiento_ia}</p>}
        {i.factores_considerados && i.factores_considerados.length > 0 && (
          <ul>
            {i.factores_considerados.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export default function EventPanel({ evento, ahora }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [reintento, setReintento] = useState(0);
  const id = evento?.event_id;
  const estimandoAhora = Boolean(evento?.estimando);

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    eventsApi
      .getEventDetail(id)
      .then((datos) => vigente && setEstado({ tipo: 'listo', datos }))
      .catch(() => vigente && setEstado({ tipo: 'error' }));
    return () => {
      vigente = false;
    };
  }, [id, reintento, estimandoAhora]);

  if (!evento) {
    return (
      <div className="vacio">
        <h2 id="h-evento">Sismo seleccionado</h2>
        <p>Elige un sismo en el mapa, el gráfico o la tabla.</p>
      </div>
    );
  }

  const nivelM = nivelMagnitud(evento.magnitud);
  const clase = claseProfundidad(evento.profundidad);
  const impactos = estado.tipo === 'listo' ? estado.datos.impacts : [];
  const respaldo = esRespaldo(impactos);
  const total = impactos.reduce(
    (t, i) => ({ muertes: t.muertes + i.muertes_estimadas, heridos: t.heridos + i.heridos_estimados, perdidas: t.perdidas + i.perdidas_monetarias_usd }),
    { muertes: 0, heridos: 0, perdidas: 0 },
  );
  const indice = impactos.reduce((m, i) => Math.max(m, indiceDestruccion(i.nivel_destruccion)), 0);
  const t = instante(evento.fecha_utc);
  const estimando = estimandoAhora && impactos.length === 0;

  return (
    <>
      <div className="ev-cab">
        <span className={`mag xl l${nivelM}`} aria-label={`Magnitud ${fmtMagnitud(evento.magnitud)}`}>
          {fmtMagnitud(evento.magnitud)}
        </span>
        <div>
          <h2 id="h-evento">{evento.lugar}</h2>
          <small>
            {evento.event_id} · {evento.fuente_api}
          </small>
        </div>
      </div>

      <div className="hechos">
        <div className="hecho">
          <span>Hora (UTC)</span>
          <b className="num">{fmtFecha(t)}</b>
          <span>{fmtRelativo(t, ahora)}</span>
        </div>
        <div className="hecho">
          <span>Profundidad</span>
          <b className="num">{fmtEntero(evento.profundidad)} km</b>
          <span>{ETIQUETA_PROFUNDIDAD[clase]}</span>
        </div>
        <div className="hecho">
          <span>Coordenadas</span>
          <b className="num" style={{ fontSize: 14 }}>{fmtCoordenadas(evento.latitud, evento.longitud)}</b>
        </div>
        <div className="hecho">
          <span>Radio de afectación</span>
          <b className="num">{evento.radio_afectacion_km ? `${fmtEntero(evento.radio_afectacion_km)} km` : '—'}</b>
        </div>
      </div>

      {estimando && (
        <div className="estimando" role="status" aria-live="polite">
          <i className="rueda" aria-hidden="true" />
          <div>
            Estimando el impacto…
            <small>Con IA puede tardar unos segundos; este panel se completa solo.</small>
          </div>
        </div>
      )}

      {!estimando && estado.tipo === 'cargando' && (
        <div className="sec" aria-busy="true" aria-label="Cargando el impacto estimado">
          <div className="esqueleto" style={{ height: 70 }} />
          <div className="esqueleto" style={{ height: 14, marginTop: 14, width: '60%' }} />
        </div>
      )}

      {!estimando && estado.tipo === 'error' && (
        <div className="sec">
          <div className="error-banner" role="alert">
            No se pudo cargar el impacto de este sismo.
            <button type="button" className="link" onClick={() => setReintento((n) => n + 1)}>Reintentar</button>
          </div>
        </div>
      )}

      {!estimando && estado.tipo === 'listo' && impactos.length === 0 && (
        <div className="aviso">Este sismo todavía no tiene una estimación de impacto.</div>
      )}

      {estado.tipo === 'listo' && impactos.length > 0 && (
        <>
          <div className="sec">
            <div className="sec-h">
              <h3 className="etq">Impacto estimado</h3>
              <span className={`fuente ${respaldo ? '' : 'ia'}`}>
                {respaldo ? (
                  <>
                    <i className="dot neutro" aria-hidden="true" /> Cálculo por reglas · sin IA
                  </>
                ) : (
                  <>
                    <Icono nombre="chispa" tam={15} /> Análisis con IA
                  </>
                )}
              </span>
            </div>
            <div className="tres">
              <div className="cifra">
                <b className="num">{fmtEntero(total.muertes)}</b>
                <span>Muertes</span>
              </div>
              <div className="cifra">
                <b className="num">{fmtEntero(total.heridos)}</b>
                <span>Heridos</span>
              </div>
              <div className="cifra largo">
                <b className="num">{fmtDinero(total.perdidas)}</b>
                <span>Pérdidas</span>
              </div>
            </div>
            <Barras indice={indice} />
          </div>

          {respaldo && (
            <div className="aviso">
              Estimación calculada solo con magnitud y profundidad. Con un modelo de IA conectado, el panel suma contexto por país, ciudades y razonamiento.
            </div>
          )}

          {impactos.map((i, n) => (
            <DetallePais key={`${i.pais}-${n}`} i={i} abierto={n === 0} unico={impactos.length === 1} />
          ))}

          <p className="pie-panel">
            Región: {respaldo ? 'sin identificar' : [...new Set(impactos.map((i) => i.pais))].join(', ')}
            {impactos[0].nivel_preparacion_sismica ? ` · Preparación sísmica: ${impactos[0].nivel_preparacion_sismica}` : ''}. Las estimaciones no son información oficial.
          </p>
        </>
      )}
    </>
  );
}
