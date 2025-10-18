'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SeismicEvent } from '@/types';

interface SeismicMapProps {
  events: SeismicEvent[];
  selectedEvent?: SeismicEvent | null;
  onEventClick?: (event: SeismicEvent) => void;
}

export default function SeismicMap({ events, selectedEvent, onEventClick }: SeismicMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for events
    events.forEach((event) => {
      const color = getMagnitudeColor(event.magnitud);
      const radius = Math.max(5, event.magnitud * 2);

      const marker = L.circleMarker([event.latitud, event.longitud], {
        radius: radius,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6,
      });

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>${event.lugar || 'Unknown location'}</strong><br/>
          <strong>Magnitude:</strong> ${event.magnitud}<br/>
          <strong>Depth:</strong> ${event.profundidad} km<br/>
          <strong>Time:</strong> ${new Date(event.fecha_utc).toLocaleString()}<br/>
          ${event.radio_afectacion_km ? `<strong>Impact radius:</strong> ${event.radio_afectacion_km} km` : ''}
        </div>
      `);

      if (onEventClick) {
        marker.on('click', () => onEventClick(event));
      }

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);

      // Add impact radius circle if available
      if (event.radio_afectacion_km && event.radio_afectacion_km > 0) {
        const radiusCircle = L.circle([event.latitud, event.longitud], {
          radius: event.radio_afectacion_km * 1000, // Convert km to meters
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          interactive: false, // Make radius circle non-clickable to avoid interference
        });
        radiusCircle.addTo(mapRef.current!);
      }
    });

    // Focus on selected event
    if (selectedEvent && mapRef.current) {
      mapRef.current.setView([selectedEvent.latitud, selectedEvent.longitud], 6);
    }

    return () => {
      // Cleanup
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [events, selectedEvent, onEventClick]);

  return <div id="map" style={{ width: '100%', height: '100%', minHeight: '500px' }} />;
}

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 8) return '#dc2626'; // Catastrophic - red
  if (magnitude >= 7) return '#f97316'; // High - orange
  if (magnitude >= 6) return '#fbbf24'; // Moderate - yellow
  if (magnitude >= 5) return '#4ade80'; // Low - green
  return '#60a5fa'; // Very low - blue
}
