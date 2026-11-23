'use client';

import { useCallback, useEffect, useState } from 'react';

export type Tema = 'light' | 'dark';

/** Tema de color: respeta lo guardado y, si no hay nada, la preferencia del sistema. */
export function useTema(): { tema: Tema; elegir: (t: Tema) => void } {
  const [tema, setTema] = useState<Tema>('light');

  useEffect(() => {
    const actual = document.documentElement.dataset.theme;
    if (actual === 'light' || actual === 'dark') setTema(actual);
  }, []);

  const elegir = useCallback((t: Tema) => {
    setTema(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('tema', t);
    } catch {
      /* sin almacenamiento: el tema vale solo para esta visita */
    }
  }, []);

  return { tema, elegir };
}

/** La hora actual en milisegundos, refrescada cada `cadaMs` (para los "hace 5 min"). */
export function useAhora(cadaMs = 30_000): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);
  return ahora;
}

/** Falso en el servidor y en el primer dibujo del navegador, verdadero después: para lo que depende de la hora o del tamaño de la pantalla. */
export function useMontado(): boolean {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}
