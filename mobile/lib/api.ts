import axios, { AxiosInstance } from 'axios';
import { SeismicEvent, EventsListResponse, FilterValues } from './types';
import { apiConfig } from './config';

const API_BASE_URL = apiConfig.apiUrl;

class EventsAPI {
  private client: AxiosInstance;

  constructor() {
    console.log('📡 Initializing EventsAPI with baseURL:', API_BASE_URL);

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('📤 API Request:', {
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL}${config.url}`,
          params: config.params,
        });
        return config;
      },
      (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          dataLength: JSON.stringify(response.data).length,
        });
        return response;
      },
      (error) => {
        console.error('📥 Response Error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });
        return Promise.reject(error);
      }
    );
  }

  async getEvents(filters?: FilterValues & { limit?: number; offset?: number }): Promise<EventsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());
        if (filters.minMagnitude) params.append('min_magnitude', filters.minMagnitude.toString());
        if (filters.maxMagnitude) params.append('max_magnitude', filters.maxMagnitude.toString());
        if (filters.minDepth) params.append('min_depth', filters.minDepth.toString());
        if (filters.maxDepth) params.append('max_depth', filters.maxDepth.toString());
        if (filters.country) params.append('country', filters.country);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
      }

      console.log('🔍 Fetching events with filters:', Object.fromEntries(params));
      const response = await this.client.get<EventsListResponse>('/events/', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  async getEventDetail(eventId: string): Promise<SeismicEvent> {
    try {
      const response = await this.client.get<SeismicEvent>(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
  }
}

export const eventsApi = new EventsAPI();
