'use client';

import { SeismicEvent } from '@/types';
import { format } from 'date-fns';

interface EventListProps {
  events: SeismicEvent[];
  selectedEvent?: SeismicEvent | null;
  onEventSelect?: (event: SeismicEvent) => void;
}

export default function EventList({ events, selectedEvent, onEventSelect }: EventListProps) {
  return (
    <div className="space-y-2">
      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No events found
        </div>
      ) : (
        events.map((event) => (
          <div
            key={event.event_id}
            onClick={() => onEventSelect?.(event)}
            className={`p-3 border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              selectedEvent?.event_id === event.event_id
                ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {event.lugar || 'Unknown location'}
                </h3>
                <div className="mt-1 text-xs text-gray-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                  {format(new Date(event.fecha_utc), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-white shadow-lg ${getMagnitudeClass(
                    event.magnitud
                  )}`}
                >
                  {event.magnitud.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-xs text-gray-600">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span className="font-medium">{event.profundidad.toFixed(0)} km</span>
              </div>
              {event.radio_afectacion_km && (
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium">{event.radio_afectacion_km.toFixed(0)} km</span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function getMagnitudeClass(magnitude: number): string {
  if (magnitude >= 8) return 'bg-gradient-to-br from-red-600 to-red-800';  // Catastrophic
  if (magnitude >= 7) return 'bg-gradient-to-br from-orange-500 to-red-600';  // High
  if (magnitude >= 6) return 'bg-gradient-to-br from-yellow-500 to-orange-500';  // Moderate
  if (magnitude >= 5) return 'bg-gradient-to-br from-green-500 to-yellow-500';  // Low
  return 'bg-gradient-to-br from-blue-500 to-green-500';  // Minor
}
