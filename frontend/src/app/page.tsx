'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { eventsApi } from '@/lib/api';
import WebSocketClient from '@/lib/websocket';
import { SeismicEvent, EventWithImpacts } from '@/types';
import EventList from '@/components/EventList';
import ImpactPanel from '@/components/ImpactPanel';
import FilterPanel, { FilterValues } from '@/components/FilterPanel';
import EventsTable from '@/components/EventsTable';

// Dynamically import map component (client-side only)
const SeismicMap = dynamic(() => import('@/components/SeismicMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>,
});

export default function Home() {
  const [events, setEvents] = useState<SeismicEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SeismicEvent | null>(null);
  const [eventDetails, setEventDetails] = useState<EventWithImpacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({});
  const [ws, setWs] = useState<WebSocketClient | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getEvents({
        limit: 100,  // Fetch all events for map and statistics
        ...filters,
      });
      setEvents(response.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing events (3 minute interval)...');
      fetchEvents();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  // Fetch event details
  const fetchEventDetails = useCallback(async (eventId: string) => {
    try {
      const details = await eventsApi.getEventDetail(eventId);
      setEventDetails(details);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';
    const wsClient = new WebSocketClient(`${wsUrl}/ws`);

    wsClient.onMessage((message) => {
      if (message.type === 'new_earthquake' && message.data) {
        // New earthquake detected, refresh events
        fetchEvents();
        // Show notification (you could add a toast here)
        console.log('New earthquake detected:', message.data);
      }
    });

    wsClient.connect();
    setWs(wsClient);

    return () => {
      wsClient.disconnect();
    };
  }, [fetchEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch details when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchEventDetails(selectedEvent.event_id);
    } else {
      setEventDetails(null);
    }
  }, [selectedEvent, fetchEventDetails]);

  const handleEventSelect = (event: SeismicEvent) => {
    setSelectedEvent(event);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-full px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-10 h-10 mr-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  Global Seismic Monitoring
                </h1>
                <p className="text-sm text-blue-100 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Real-time earthquake tracking with AI-powered impact assessment
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-white">{events.length}</div>
                  <div className="text-xs text-blue-100">Events</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-white">
                    {events.length > 0 ? Math.max(...events.map((e) => e.magnitud)).toFixed(1) : '-'}
                  </div>
                  <div className="text-xs text-blue-100">Max Mag</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Filters */}
          <div className="col-span-12 lg:col-span-2">
            <FilterPanel onFilterChange={handleFilterChange} />
          </div>

          {/* Center - Map */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-[600px]">
                <SeismicMap
                  events={events}
                  selectedEvent={selectedEvent}
                  onEventClick={handleEventSelect}
                />
              </div>
            </div>

            {/* Statistics summary */}
            {events.length > 0 && (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                    <div className="text-sm text-gray-600">Total Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.max(...events.map((e) => e.magnitud)).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Highest Magnitude</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {(events.reduce((sum, e) => sum + e.magnitud, 0) / events.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Average Magnitude</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar - Event list and details */}
          <div className="col-span-12 lg:col-span-4">
            <div className="space-y-4">
              {/* Recent Events - Top 3 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-md p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    Recent Events
                  </h3>
                  <span className="text-sm text-blue-700 font-medium bg-blue-100 px-2 py-1 rounded-full">
                    Last 3
                  </span>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center text-gray-500 py-8">Loading events...</div>
                  ) : (
                    <EventList
                      events={events.slice(0, 3)}
                      selectedEvent={selectedEvent}
                      onEventSelect={handleEventSelect}
                    />
                  )}
                </div>
                {events.length > 3 && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                    <span className="text-sm text-blue-700">
                      +{events.length - 3} more events (view on map)
                    </span>
                  </div>
                )}
              </div>

              {/* Impact details */}
              {eventDetails && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 shadow-md p-5">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                    </svg>
                    Impact Assessment
                  </h3>
                  <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    <ImpactPanel impacts={eventDetails.impacts} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Events Table - Below the grid */}
        <div className="mt-6">
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200 shadow-md p-5 mb-4">
            <h2 className="font-bold text-gray-900 text-xl flex items-center mb-2">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Complete Events Database
            </h2>
            <p className="text-sm text-gray-600">
              All seismic events from the database - synchronized with map and filters
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading events data...</p>
            </div>
          ) : (
            <EventsTable
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={handleEventSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
