'use client';

import { useMemo, useState } from 'react';
import Icono from './Icono';
import type { SeismicEvent } from '@/types';
import { ETIQUETA_DESTRUCCION, ETIQUETA_PROFUNDIDAD, aCsv, claseProfundidad, indiceDestruccion, nivelMagnitud, ordenarEventos } from '@/lib/seismic';
import type { ClaveOrden } from '@/lib/seismic';
import { fmtCoordenadas, fmtEntero, fmtFecha, fmtMagnitud, fmtRelativo, instante } from '@/lib/format';

interface Props {
  eventos: SeismicEvent[];
  total: number;
  seleccionado: string | null;
  ahora: number;
  onElegir: (id: string) => void;
}

const COLUMNAS: { clave: ClaveOrden | null; titulo: string; derecha?: boolean }[] = [
  { clave: 'magnitud', titulo: 'Magnitud' },
  { clave: 'lugar', titulo: 'Lugar' },
  { clave: 'fecha', titulo: 'Hora (UTC)' },
  { clave: 'profundidad', titulo: 'Prof. (km)', derecha: true },
  { clave: 'radio', titulo: 'Radio (km)', derecha: true },
  { clave: 'impacto', titulo: 'Impacto' },
  { clave: null, titulo: 'Coordenadas' },
];

export default function EventsTable({ eventos, total, seleccionado, ahora, onElegir }: Props) {
  const [orden, setOrden] = useState<{ clave: ClaveOrden; dir: 1 | -1 }>({ clave: 'fecha', dir: -1 });
  const filas = useMemo(() => ordenarEventos(eventos, orden.clave, orden.dir), [eventos, orden]);

  const ordenarPor = (clave: ClaveOrden) =>
    setOrden((o) => (o.clave === clave ? { clave, dir: (-o.dir) as 1 | -1 } : { clave, dir: clave === 'lugar' ? 1 : -1 }));

  const exportar = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + aCsv(filas)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sismos.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="card" style={{ marginTop: 14 }} aria-labelledby="h-tabla">
      <div className="card-h">
        <div>
          <h2 id="h-tabla">Todos los sismos</h2>
          <p>
            <span className="num">Mostrando {filas.length} de {total}</span> · ordena con los encabezados · clic en una fila para verla en el mapa
          </p>
        </div>
        <button className="btn" type="button" onClick={exportar} disabled={!filas.length}>
          <Icono nombre="bajar" /> Exportar CSV
        </button>
      </div>
      <div className="tabla-wrap" tabIndex={0} role="region" aria-label="Tabla de sismos, con desplazamiento">
        <table>
          <thead>
            <tr>
              {COLUMNAS.map((c) =>
                c.clave ? (
                  <th key={c.titulo} scope="col" className={c.derecha ? 'r' : ''} aria-sort={orden.clave === c.clave ? (orden.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => ordenarPor(c.clave as ClaveOrden)}>
                      {c.titulo} <span className="fl" aria-hidden="true">{orden.clave === c.clave && orden.dir < 0 ? '▼' : '▲'}</span>
                    </button>
                  </th>
                ) : (
                  <th key={c.titulo} scope="col" className="fijo">{c.titulo}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={COLUMNAS.length} className="vacio">Ningún sismo cumple los filtros.</td>
              </tr>
            )}
            {filas.map((e) => {
              const t = instante(e.fecha_utc);
              const nivel = e.nivel_destruccion ? indiceDestruccion(e.nivel_destruccion) : null;
              const elegido = e.event_id === seleccionado;
              return (
                <tr
                  key={e.event_id}
                  tabIndex={0}
                  className={elegido ? 'sel' : ''}
                  aria-selected={elegido}
                  onClick={() => onElegir(e.event_id)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      onElegir(e.event_id);
                    }
                  }}
                >
                  <td><span className={`mag l${nivelMagnitud(e.magnitud)}`}>{fmtMagnitud(e.magnitud)}</span></td>
                  <td>
                    <div className="lugar">
                      <b>{e.lugar}</b>
                      <small>{e.event_id}</small>
                    </div>
                  </td>
                  <td className="num">{fmtFecha(t)}<span className="sub">{fmtRelativo(t, ahora)}</span></td>
                  <td className="r num">{fmtEntero(e.profundidad)}<span className="sub">{ETIQUETA_PROFUNDIDAD[claseProfundidad(e.profundidad)]}</span></td>
                  <td className="r num">{e.radio_afectacion_km ? fmtEntero(e.radio_afectacion_km) : '—'}</td>
                  <td>
                    {nivel === null ? (
                      <span className="nivel-chip"><i className="dot neutro" aria-hidden="true" />Pendiente</span>
                    ) : (
                      <span className="nivel-chip"><i className={`dot l${nivel + 1}`} aria-hidden="true" />{ETIQUETA_DESTRUCCION[nivel]}</span>
                    )}
                  </td>
                  <td className="num" style={{ color: 'var(--text-2)' }}>{fmtCoordenadas(e.latitud, e.longitud)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
