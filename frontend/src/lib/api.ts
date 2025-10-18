import axios from 'axios';
import { EventsResponse, EventWithImpacts, Statistics } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const eventsApi = {
  getEvents: async (params?: {
    limit?: number;
    offset?: number;
    min_magnitude?: number;
    max_magnitude?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<EventsResponse> => {
    const response = await api.get('/api/events/', { params });
    return response.data;
  },

  getEventDetail: async (eventId: string): Promise<EventWithImpacts> => {
    const response = await api.get(`/api/events/${eventId}`);
    return response.data;
  },

  getEventsByCountry: async (
    countryName: string,
    params?: { limit?: number; offset?: number }
  ): Promise<any> => {
    const response = await api.get(`/api/events/country/${countryName}`, { params });
    return response.data;
  },

  getStatistics: async (days: number = 30): Promise<Statistics> => {
    const response = await api.get('/api/events/stats/summary', {
      params: { days },
    });
    return response.data;
  },

  triggerProcessing: async (): Promise<any> => {
    const response = await api.post('/api/events/process');
    return response.data;
  },
};

export default api;
