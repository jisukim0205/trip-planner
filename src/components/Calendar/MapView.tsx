import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useTripStore } from '../../store/useTripStore';
import type { Trip } from '../../types';
import { COLOR_HEX } from '../../utils/colors';
import { getDaysInRange } from '../../utils/dates';

interface MapViewProps {
  trip: Trip;
}

export default function MapView({ trip }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const { planBlocks, calendarEvents } = useTripStore();
  const [filterDate, setFilterDate] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps
  useEffect(() => {
    setOptions({
      key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      libraries: ['places', 'maps', 'marker'],
    });

    importLibrary('maps').then(() => {
      if (!mapRef.current) return;

      // Find center: average of all located events, or trip destination
      const locatedBlocks = planBlocks.filter(b => b.tripId === trip.id && b.location);
      const center = locatedBlocks.length > 0
        ? {
            lat: locatedBlocks.reduce((s, b) => s + b.location!.lat, 0) / locatedBlocks.length,
            lng: locatedBlocks.reduce((s, b) => s + b.location!.lng, 0) / locatedBlocks.length,
          }
        : { lat: 35.6762, lng: 139.6503 }; // Tokyo default

      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
        ],
      });

      setMapLoaded(true);
    }).catch(console.error);
  }, []);

  // Update markers whenever events/filter changes
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;

    // Clear existing markers and polylines
    markersRef.current.forEach(m => m.setMap(null));
    polylinesRef.current.forEach(p => p.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];

    // Get events for this trip filtered by date
    let events = calendarEvents.filter(e => e.tripId === trip.id);
    if (filterDate !== 'all') {
      events = events.filter(e => e.date === filterDate);
    }

    // Sort by date then startHour
    events.sort((a, b) => a.date === b.date ? a.startHour - b.startHour : a.date.localeCompare(b.date));

    // Group events by date for route lines
    const byDate = new Map<string, typeof events>();
    for (const ev of events) {
      const list = byDate.get(ev.date) ?? [];
      list.push(ev);
      byDate.set(ev.date, list);
    }

    const infoWindow = new google.maps.InfoWindow();

    // Add markers and route lines per day
    for (const [, dayEvents] of byDate) {
      const locatedEvents = dayEvents
        .map(ev => {
          const block = planBlocks.find(b => b.id === ev.planBlockId);
          return block?.location ? { ev, block } : null;
        })
        .filter(Boolean) as { ev: typeof events[0]; block: typeof planBlocks[0] }[];

      // Route polyline for this day
      if (locatedEvents.length > 1) {
        const path = locatedEvents.map(({ block }) => ({
          lat: block.location!.lat,
          lng: block.location!.lng,
        }));
        const polyline = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#6366f1',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          map: googleMapRef.current!,
          icons: [{
            icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3 },
            offset: '50%',
          }],
        });
        polylinesRef.current.push(polyline);
      }

      // Markers
      locatedEvents.forEach(({ ev, block }, idx) => {
        const color = COLOR_HEX[block.color] ?? '#6366f1';

        const marker = new google.maps.Marker({
          position: { lat: block.location!.lat, lng: block.location!.lng },
          map: googleMapRef.current!,
          title: block.title,
          label: {
            text: String(idx + 1),
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          },
        });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="font-family: Inter, sans-serif; padding: 4px;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${block.title}</div>
              ${block.description ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${block.description}</div>` : ''}
              <div style="font-size: 12px; color: #6b7280;">📍 ${block.location!.name}</div>
              <div style="font-size: 12px; color: #6b7280;">🕐 ${ev.startHour}:00 · ${ev.duration}h</div>
            </div>
          `);
          infoWindow.open(googleMapRef.current!, marker);
        });

        markersRef.current.push(marker);
      });
    }

    // Fit bounds to markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(m => bounds.extend(m.getPosition()!));
      googleMapRef.current!.fitBounds(bounds, 80);
      if (markersRef.current.length === 1) {
        googleMapRef.current!.setZoom(14);
      }
    }
  }, [mapLoaded, calendarEvents, planBlocks, filterDate, trip.id]);

  const tripDays = getDaysInRange(trip.startDate, trip.endDate);

  // Count located events per day for the filter chips
  function locatedCountForDay(date: string): number {
    return calendarEvents.filter(e =>
      e.tripId === trip.id && e.date === date &&
      planBlocks.find(b => b.id === e.planBlockId)?.location
    ).length;
  }

  const totalLocated = calendarEvents.filter(e =>
    e.tripId === trip.id &&
    planBlocks.find(b => b.id === e.planBlockId)?.location
  ).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Date filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0">
        <span className="text-xs text-gray-500 font-medium flex-shrink-0">Show:</span>
        <button
          onClick={() => setFilterDate('all')}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filterDate === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All days ({totalLocated})
        </button>
        {tripDays.map(day => {
          const count = locatedCountForDay(day);
          if (count === 0) return null;
          const label = new Date(day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <button
              key={day}
              onClick={() => setFilterDate(day)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterDate === day
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Empty state overlay */}
        {totalLocated === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-gray-600 font-semibold text-sm">No locations yet</p>
              <p className="text-gray-400 text-xs mt-1">Add locations to your plan blocks to see them on the map</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
