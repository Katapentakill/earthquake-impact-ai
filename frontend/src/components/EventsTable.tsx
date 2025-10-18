'use client';

import { SeismicEvent } from '@/types';
import { format } from 'date-fns';

interface EventsTableProps {
  events: SeismicEvent[];
  selectedEvent?: SeismicEvent | null;
  onEventSelect?: (event: SeismicEvent) => void;
}

export default function EventsTable({ events, selectedEvent, onEventSelect }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 bg-white rounded-lg border border-gray-200">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">No events found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Event ID
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Date & Time (UTC)
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Magnitude
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Depth (km)
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Impact Radius (km)
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Coordinates
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr
                key={event.event_id}
                onClick={() => onEventSelect?.(event)}
                className={`cursor-pointer transition-all duration-150 ${
                  selectedEvent?.event_id === event.event_id
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {event.event_id}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 font-medium max-w-xs truncate" title={event.lugar}>
                    {event.lugar || 'Unknown location'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(event.fecha_utc), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(event.fecha_utc), 'HH:mm:ss')}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm ${getMagnitudeClass(
                      event.magnitud
                    )}`}
                  >
                    {event.magnitud.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900 font-medium">
                    {event.profundidad.toFixed(1)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900 font-medium">
                    {event.radio_afectacion_km ? event.radio_afectacion_km.toFixed(1) : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="text-xs text-gray-600">
                    <div>{event.latitud.toFixed(4)}°</div>
                    <div>{event.longitud.toFixed(4)}°</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventSelect?.(event);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table footer with summary */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing <span className="font-medium text-gray-900">{events.length}</span> event{events.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-4">
            <div>
              Avg Magnitude: <span className="font-medium text-gray-900">
                {(events.reduce((sum, e) => sum + e.magnitud, 0) / events.length).toFixed(2)}
              </span>
            </div>
            <div>
              Max Magnitude: <span className="font-medium text-gray-900">
                {Math.max(...events.map((e) => e.magnitud)).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
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
