import type { SeismicEvent } from '@/types';
import { ETIQUETA_PROFUNDIDAD, histograma, marcasDeTiempo, nivelMagnitud, repartoProfundidad } from '@/lib/seismic';
import type { ClaseProfundidad } from '@/lib/seismic';
import { fmtDia, fmtEntero, fmtHora, fmtMagnitud, fmtRelativo, instante } from '@/lib/format';

/* ───────── Magnitud a lo largo del tiempo ───────── */

interface TiempoProps {
  eventos: SeismicEvent[];
  seleccionado: string | null;
  ahora: number;
  horasPeriodo: number;
  onElegir: (id: string) => void;
}

export function GraficoTiempo({ eventos, seleccionado, ahora, horasPeriodo, onElegir }: TiempoProps) {
  const W = 640, H = 214, m = { l: 46, r: 14, t: 12, b: 32 };
  const t0 = ahora - horasPeriodo * 3600e3;
  const yMax = Math.max(7.2, Math.ceil(Math.max(0, ...eventos.map((e) => e.magnitud)) * 2) / 2 + 0.2);
  const x = (t: number) => m.l + ((t - t0) / (ahora - t0)) * (W - m.l - m.r);
  const y = (v: number) => m.t + ((yMax - v) / (yMax - 4.2)) * (H - m.t - m.b);
  const ticksY: number[] = [];
  for (let v = 4.5; v <= yMax - 0.2; v += 0.5) ticksY.push(v);
  const etiquetaX = (t: number) => (horasPeriodo <= 24 ? fmtHora(t) : fmtDia(t));
  const sel = eventos.find((e) => e.event_id === seleccionado);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Magnitud de cada sismo según su hora">
      {ticksY.map((v) => (
        <g key={v}>
          <line className="rej" x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} />
          <text className="y num" x={m.l - 9} y={y(v) + 4}>{fmtMagnitud(v)}</text>
        </g>
      ))}
      {marcasDeTiempo(t0, ahora, horasPeriodo).map((t) => (
        <g key={t}>
          <line className="rej" x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} />
          <text className="x num" x={x(t)} y={H - 12}>{etiquetaX(t)}</text>
        </g>
      ))}
      <line className="eje" x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
      <text x={W - m.r} y={H - 1} textAnchor="end">{horasPeriodo <= 24 ? 'hora UTC' : 'día (UTC)'}</text>
      {sel && <circle className="halo" cx={x(instante(sel.fecha_utc))} cy={y(sel.magnitud)} r={13} />}
      {eventos.map((e) => {
        const t = instante(e.fecha_utc);
        return (
          <circle
            key={e.event_id}
            className={`p l${nivelMagnitud(e.magnitud)}`}
            cx={x(t)}
            cy={y(e.magnitud)}
            r={5 + Math.max(0, e.magnitud - 4.5) * 2.2}
            tabIndex={0}
            role="button"
            aria-label={`Magnitud ${fmtMagnitud(e.magnitud)}, ${e.lugar}, ${fmtRelativo(t, ahora)}`}
            onClick={() => onElegir(e.event_id)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                onElegir(e.event_id);
              }
            }}
          >
            <title>{`M ${fmtMagnitud(e.magnitud)} · ${e.lugar} · ${fmtRelativo(t, ahora)}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

/* ───────── Sismos por magnitud ───────── */

export function Histograma({ eventos }: { eventos: SeismicEvent[] }) {
  const tramos = histograma(eventos);
  const W = 520, H = 230, m = { l: 12, r: 12, t: 26, b: 40 };
  const max = Math.max(3, ...tramos.map((t) => t.cantidad));
  const ancho = (W - m.l - m.r) / tramos.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Sismos por tramo de magnitud: ${tramos.map((t) => `${t.cantidad} de ${t.hasta === 99 ? '7,0 o más' : `${fmtMagnitud(t.desde)} a ${fmtMagnitud(t.hasta - 0.1)}`}`).join(', ')}`}>
      {tramos.map((t, i) => {
        const alto = (t.cantidad / max) * (H - m.t - m.b);
        const bx = m.l + i * ancho + 8, bw = ancho - 16, by = H - m.b - alto;
        return (
          <g key={t.desde}>
            <rect className={`b l${t.nivel}`} x={bx} y={t.cantidad ? by : H - m.b - 2} width={bw} height={t.cantidad ? alto : 2} rx={6} />
            <text className="val num" x={bx + bw / 2} y={(t.cantidad ? by : H - m.b) - 7}>{t.cantidad}</text>
            <text className="x num" x={bx + bw / 2} y={H - 16}>{t.hasta === 99 ? '7,0 o más' : `${fmtMagnitud(t.desde)}–${fmtMagnitud(t.hasta - 0.1)}`}</text>
          </g>
        );
      })}
      <line className="eje" x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} />
    </svg>
  );
}

/* ───────── Sismos por profundidad ───────── */

const RANGOS: Record<ClaseProfundidad, string> = { superficial: 'menos de 70 km', intermedia: '70 a 300 km', profunda: 'más de 300 km' };

export function BarrasProfundidad({ eventos }: { eventos: SeismicEvent[] }) {
  const reparto = repartoProfundidad(eventos);
  const n = Math.max(1, eventos.length);
  return (
    <>
      {(Object.keys(RANGOS) as ClaseProfundidad[]).map((c) => (
        <div className="prof-fila" key={c}>
          <div>
            <b>{ETIQUETA_PROFUNDIDAD[c]}</b>
            <small>{RANGOS[c]}</small>
          </div>
          <div className="bar" role="img" aria-label={`${reparto[c]} de ${eventos.length}`}>
            <i style={{ width: `${(reparto[c] / n) * 100}%` }} />
          </div>
          <div className="n num">
            {reparto[c]} <small style={{ color: 'var(--muted)', fontWeight: 400 }}>· {fmtEntero((reparto[c] / n) * 100)} %</small>
          </div>
        </div>
      ))}
      <p className="nota-graf">Un sismo profundo libera su energía lejos de la superficie, por eso la profundidad pesa tanto como la magnitud en el impacto.</p>
    </>
  );
}
