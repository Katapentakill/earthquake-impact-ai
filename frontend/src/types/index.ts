export type NivelDestruccion = 'BAJO' | 'MODERADO' | 'ALTO' | 'CATASTROFICO';

/** De dónde salió la estimación de impacto: reglas simples (respaldo) o el modelo de IA. */
export type FuenteEstimacion = 'reglas' | 'ia';

export interface SeismicEvent {
  event_id: string;
  magnitud: number;
  profundidad: number;
  latitud: number;
  longitud: number;
  fecha_utc: string;
  lugar: string;
  radio_afectacion_km: number | null;
  fuente_api: string;
  // Resumen del impacto: lo calcula el backend para la lista (nulo si el evento aún no tiene impactos)
  nivel_destruccion?: NivelDestruccion | null;
  muertes_estimadas?: number | null;
  heridos_estimados?: number | null;
  perdidas_monetarias_usd?: number | null;
  estimacion?: FuenteEstimacion | null;
}

export interface ImpactData {
  pais: string;
  ciudades_afectadas: string[] | null;
  muertes_estimadas: number;
  heridos_estimados: number;
  perdidas_monetarias_usd: number;
  nivel_destruccion: string;
  fuentes_inferidas: string[] | null;
  razonamiento_ia?: string | null;
  factores_considerados?: string[] | null;
  codigo_construccion?: string | null;
  nivel_preparacion_sismica?: string | null;
  densidad_poblacional?: string | null;
}

export interface EventWithImpacts {
  event: SeismicEvent;
  impacts: ImpactData[];
}

export interface EventsResponse {
  total: number;
  limit: number;
  offset: number;
  events: SeismicEvent[];
}

export interface Statistics {
  period_days: number;
  total_events: number;
  average_magnitude: number;
  highest_magnitude_event: SeismicEvent | null;
  estimated_casualties: {
    deaths: number;
    injuries: number;
    economic_losses_usd: number;
  };
  most_affected_countries: {
    country: string;
    event_count: number;
    total_deaths: number;
  }[];
}
