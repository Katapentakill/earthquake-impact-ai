import Icono from './Icono';
import type { Tema } from '@/lib/hooks';
import { fmtRelativo } from '@/lib/format';

interface Props {
  tema: Tema;
  onTema: (t: Tema) => void;
  conectado: boolean;
  ultimaCarga: number | null;
  ahora: number;
}

export default function TopBar({ tema, onTema, conectado, ultimaCarga, ahora }: Props) {
  return (
    <header className="topbar">
      <div className="wrap">
        <div className="brand">
          <div className="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M2.5 12.5h4l2.2-6.5 3.6 12 2.4-7 1.6 1.5h5.2" />
            </svg>
          </div>
          <div>
            <h1>Monitor sísmico global</h1>
            <small>USGS en tiempo real · M 4,5 o más · estimación de impacto</small>
          </div>
        </div>
        <div className="spacer" />
        <div className="estado">
          <span className={`live ${conectado ? '' : 'off'}`} role="status">
            <i aria-hidden="true" /> {conectado ? 'En vivo' : 'Reconectando…'}
          </span>
          <span className="hora num">{ultimaCarga ? `Actualizado ${fmtRelativo(ultimaCarga, ahora)}` : 'Cargando…'}</span>
        </div>
        <div className="seg" role="group" aria-label="Tema de color">
          <button type="button" aria-pressed={tema === 'light'} onClick={() => onTema('light')}>
            <Icono nombre="sol" />
            <span>Crema</span>
          </button>
          <button type="button" aria-pressed={tema === 'dark'} onClick={() => onTema('dark')}>
            <Icono nombre="luna" />
            <span>Oscuro</span>
          </button>
        </div>
      </div>
    </header>
  );
}
