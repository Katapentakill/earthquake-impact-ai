import axios from 'axios';
import { API_URL } from './config';
import type { EventsResponse, EventWithImpacts } from './types';

const cliente = axios.create({ baseURL: API_URL, timeout: 20000 });

export interface ParametrosEventos {
  limit?: number;
  offset?: number;
  min_magnitude?: number;
  max_magnitude?: number;
  /** ISO sin zona, en UTC (lo que acepta el backend). */
  start_date?: string;
  end_date?: string;
}

export const eventsApi = {
  getEvents: async (params?: ParametrosEventos): Promise<EventsResponse> => (await cliente.get('/events/', { params })).data,
  getEventDetail: async (eventId: string): Promise<EventWithImpacts> => (await cliente.get(`/events/${encodeURIComponent(eventId)}`)).data,
};

/** Mensaje corto y legible para mostrar cuando una llamada falla. */
export function mensajeDeError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (e.response) return `El servidor respondió ${e.response.status}.`;
    return `No se pudo conectar con el servidor (${API_URL}).`;
  }
  return 'Ocurrió un error inesperado.';
}
