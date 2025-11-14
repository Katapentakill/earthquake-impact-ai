// Seismic Event Type
export interface SeismicEvent {
  id: number;
  event_id: string;
  magnitud: number;
  profundidad_km: number;
  latitud: number;
  longitud: number;
  fecha_utc: string;
  lugar: string;
  radio_afectacion_km?: number;
  fuente_api: string;
  created_at: string;
}

// Impact Assessment Data
export interface ImpactData {
  pais: string;
  ciudades_afectadas: string[];
  muertes_estimadas: number;
  heridos_estimados: number;
  perdidas_monetarias_usd: number;
  nivel_destruccion: 'BAJO' | 'MODERADO' | 'ALTO' | 'CATASTROFICO';
  razonamiento_ia: string;
  factores_considerados: string[];
  codigo_construccion: string;
  nivel_preparacion_sismica: string;
}

// Event Detail with Impact
export interface EventDetail extends SeismicEvent {
  impactos?: ImpactData[];
}

// API Response Types
export interface EventsListResponse {
  events: SeismicEvent[];
  total: number;
  limit: number;
  offset: number;
}

// Filter Interface
export interface FilterValues {
  minMagnitude?: number;
  maxMagnitude?: number;
  minDepth?: number;
  maxDepth?: number;
  country?: string;
  startDate?: string;
  endDate?: string;
}
