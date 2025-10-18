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
}

export interface ImpactData {
  pais: string;
  ciudades_afectadas: string[];
  muertes_estimadas: number;
  heridos_estimados: number;
  perdidas_monetarias_usd: number;
  nivel_destruccion: 'BAJO' | 'MODERADO' | 'ALTO' | 'CATASTROFICO' | 'Bajo' | 'Moderado' | 'Alto' | 'Catastrofico';
  fuentes_inferidas: string[];
  razonamiento_ia?: string;  // NEW: AI reasoning explanation
  factores_considerados?: string[];  // NEW: Factors considered by AI
  codigo_construccion?: string;  // NEW: Building code information
  nivel_preparacion_sismica?: string;
  densidad_poblacional?: string;
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
