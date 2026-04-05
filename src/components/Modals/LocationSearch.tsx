import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { PlanLocation } from '../../types';

interface LocationSearchProps {
  value?: PlanLocation;
  onChange: (location: PlanLocation | undefined) => void;
}

export default function LocationSearch({ value, onChange }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.name ?? '');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOptions({
      key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      libraries: ['places'],
    });

    importLibrary('places').then(() => {
      setLoaded(true);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'geometry', 'place_id', 'formatted_address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.geometry?.location) {
        onChange({
          name: place.name ?? place.formatted_address ?? '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        });
        setInputValue(place.name ?? place.formatted_address ?? '');
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [loaded]);

  function handleClear() {
    setInputValue('');
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search for a place..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      )}
      {!loaded && (
        <p className="text-xs text-gray-400 mt-1">Loading maps...</p>
      )}
    </div>
  );
}
