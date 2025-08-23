'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

import { Icon } from 'leaflet';
import { Event, MapBounds } from '@/types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/constants';
import { formatDate, formatTime } from '@/utils/helpers';

import ClusteredFlameMap from '@/components/map/ClusteredFlameMap';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-icon-shadow.png',
});





export function EventMap({
  events,
  onEventClick,
  onBoundsChange,
  userLocation,
  className,
}: EventMapProps) {
  const mapRef = useRef<any>(null);

  const handleBoundsChange = () => {
    if (mapRef.current && onBoundsChange) {
      const bounds = mapRef.current.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
  };

  const getInitialCenter = (): [number, number] => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    return [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];
  };

  const getInitialZoom = (): number => {
    return userLocation ? 13 : DEFAULT_MAP_ZOOM;
  };

  return (
    <div className={className}>
      <style jsx>{`
        .flame-marker {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        .flame-marker:hover {
          filter: drop-shadow(0 4px 8px rgba(255, 87, 34, 0.5));
        }
        .user-location-marker {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      <MapContainer
        center={getInitialCenter()}
        zoom={getInitialZoom()}
        className="h-full w-full rounded-lg"
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.on('moveend', handleBoundsChange);
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ClusteredFlameMap
          events={events}
          onEventClick={onEventClick}
          userLocation={userLocation}
        />
      </MapContainer>
    </div>
  );
}
