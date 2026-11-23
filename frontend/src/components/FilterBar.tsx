import Icono from './Icono';
import { ETIQUETA_PROFUNDIDAD, FILTROS_INICIALES } from '@/lib/seismic';
import type { ClaseProfundidad, Filtros } from '@/lib/seismic';

export type Periodo = '24h' | '7d' | '30d';
export const PERIODOS: Record<Periodo, { horas: number; etiqueta: string; corta: string; titulo: string }> = {
  '24h': { horas: 24, etiqueta: 'últimas 24 h', corta: '24 horas', titulo: 'las últimas 24 horas' },
  '7d': { horas: 24 * 7, etiqueta: 'últimos 7 días', corta: '7 días', titulo: 'los últimos 7 días' },
  '30d': { horas: 24 * 30, etiqueta: 'últimos 30 días', corta: '30 días', titulo: 'los últimos 30 días' },
};

interface Props {
  periodo: Periodo;
  filtros: Filtros;
  mostrando: number;
  total: number;
  onPeriodo: (p: Periodo) => void;
  onFiltros: (f: Filtros) => void;
}

export default function FilterBar({ periodo, filtros, mostrando, total, onPeriodo, onFiltros }: Props) {
  const hayFiltros = filtros.magMin !== 0 || filtros.profundidad !== 'todas' || filtros.texto !== '';
  return (
    <section className="card filtros" aria-label="Filtros">
      <div className="grupo">
        <span className="etq" id="l-periodo">Período</span>
        <div className="chips" role="group" aria-labelledby="l-periodo">
          {(Object.keys(PERIODOS) as Periodo[]).map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={periodo === p} onClick={() => onPeriodo(p)}>
              {PERIODOS[p].corta}
            </button>
          ))}
        </div>
      </div>
      <div className="grupo">
        <span className="etq" id="l-mag">Magnitud</span>
        <div className="chips" role="group" aria-labelledby="l-mag">
          {[[0, 'Todas'], [5, '5,0 o más'], [6, '6,0 o más']].map(([v, t]) => (
            <button key={v} type="button" className="chip" aria-pressed={filtros.magMin === v} onClick={() => onFiltros({ ...filtros, magMin: v as number })}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grupo">
        <span className="etq" id="l-prof">Profundidad</span>
        <div className="chips" role="group" aria-labelledby="l-prof">
          <button type="button" className="chip" aria-pressed={filtros.profundidad === 'todas'} onClick={() => onFiltros({ ...filtros, profundidad: 'todas' })}>
            Todas
          </button>
          {(Object.keys(ETIQUETA_PROFUNDIDAD) as ClaseProfundidad[]).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={filtros.profundidad === c} onClick={() => onFiltros({ ...filtros, profundidad: c })}>
              {ETIQUETA_PROFUNDIDAD[c]}
            </button>
          ))}
        </div>
      </div>
      <div className="buscar">
        <Icono nombre="buscar" />
        <label className="sr-only" htmlFor="q">Buscar por lugar o ID</label>
        <input id="q" type="search" placeholder="Buscar lugar o ID" autoComplete="off" value={filtros.texto} onChange={(e) => onFiltros({ ...filtros, texto: e.target.value })} />
      </div>
      {hayFiltros && (
        <button type="button" className="link" onClick={() => onFiltros(FILTROS_INICIALES)}>
          Restablecer
        </button>
      )}
      <span className="sr-only" role="status" aria-live="polite">{`Mostrando ${mostrando} de ${total} sismos`}</span>
    </section>
  );
}
