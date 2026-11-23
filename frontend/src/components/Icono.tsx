import type { ReactElement } from 'react';

const FORMAS: Record<string, ReactElement> = {
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  luna: <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.8 6.8 0 0 0 9.7 9.7z" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  bajar: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  ajustar: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  chispa: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
};

/** Íconos de trazo, del tamaño del texto. Son decorativos: el botón o el texto vecino ya dice qué hace. */
export default function Icono({ nombre, tam }: { nombre: keyof typeof FORMAS; tam?: number }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={tam ? { width: tam, height: tam } : undefined}>
      {FORMAS[nombre]}
    </svg>
  );
}
