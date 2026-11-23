import type { Resumen } from '@/lib/seismic';
import { nivelMagnitud } from '@/lib/seismic';
import { fmtDecimal, fmtEntero, fmtMagnitud, fmtRelativo, instante } from '@/lib/format';

interface Props {
  resumen: Resumen;
  ahora: number;
  horasPeriodo: number;
  etiquetaPeriodo: string;
  cargando: boolean;
}

/** "Uno cada 96 min" o "Uno cada 3 h", según qué tan seguido ocurran. */
function cadencia(horas: number, total: number): string {
  if (!total) return 'Sin sismos en el período';
  const min = (horas * 60) / total;
  return min >= 120 ? `Uno cada ${fmtEntero(min / 60)} h en promedio` : `Uno cada ${fmtEntero(min)} min en promedio`;
}

export default function KpiCards({ resumen: r, ahora, horasPeriodo, etiquetaPeriodo, cargando }: Props) {
  if (cargando) {
    return (
      <section className="kpis" aria-label="Resumen del período" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card kpi">
            <div className="esqueleto" style={{ height: 14, width: '55%' }} />
            <div className="esqueleto" style={{ height: 36, width: '40%' }} />
            <div className="esqueleto" style={{ height: 12, width: '70%' }} />
          </div>
        ))}
      </section>
    );
  }
  const maxActividad = Math.max(1, ...r.actividad);
  const nivelMax = r.mayor ? nivelMagnitud(r.mayor.magnitud) : 1;
  return (
    <section className="kpis" aria-label="Resumen del período">
      <article className="card kpi">
        <span className="etq">Sismos registrados</span>
        <div className="v num">
          {r.total}
          <small>{etiquetaPeriodo}</small>
        </div>
        <span className="s">{cadencia(horasPeriodo, r.total)}</span>
        <div className="viz">
          <div className="spark" aria-hidden="true">
            {r.actividad.map((c, i) => (
              <i key={i} className={c ? '' : 'cero'} style={{ height: `${c ? Math.max(14, (c / maxActividad) * 100) : 8}%` }} />
            ))}
          </div>
        </div>
      </article>

      <article className="card kpi">
        <span className="etq">Mayor magnitud</span>
        <div className="v num">
          {r.mayor ? fmtMagnitud(r.mayor.magnitud) : '—'}
          {r.mayor && <i className={`dot l${nivelMax}`} style={{ width: 16, height: 16 }} aria-hidden="true" />}
        </div>
        <span className="s">
          {r.mayor ? `${r.mayor.lugar} · ${fmtEntero(r.mayor.profundidad)} km de profundidad` : 'Sin sismos con estos filtros'}
        </span>
        <div className="viz">
          <span className="s" style={{ color: 'var(--muted)' }}>
            {r.mayor ? fmtRelativo(instante(r.mayor.fecha_utc), ahora) : ''}
          </span>
        </div>
      </article>

      <article className="card kpi">
        <span className="etq">Magnitud media</span>
        <div className="v num">{r.total ? fmtDecimal(r.media) : '—'}</div>
        <span className="s">Reparto por escala</span>
        <div className="viz">
          <div className="stack" role="img" aria-label={`Reparto por escala: ${r.porNivel.map((v, i) => `${v} de nivel ${i + 1}`).join(', ')}`}>
            {r.porNivel.map((v, i) => (v ? <i key={i} className={`l${i + 1}`} style={{ flex: v }} /> : null))}
          </div>
        </div>
      </article>

      <article className="card kpi">
        <span className="etq">De magnitud 5 o más</span>
        <div className="v num">
          {r.deCincoOMas}
          <small>de {r.total}</small>
        </div>
        <span className="s">{r.total ? fmtEntero((r.deCincoOMas / r.total) * 100) : 0} % del total</span>
        <div className="viz">
          <div className="bar">
            <i style={{ width: `${r.total ? (r.deCincoOMas / r.total) * 100 : 0}%` }} />
          </div>
        </div>
      </article>
    </section>
  );
}
