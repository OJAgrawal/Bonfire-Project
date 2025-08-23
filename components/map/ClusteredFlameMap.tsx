'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import supercluster from 'supercluster';
import { point as turfPoint } from '@turf/helpers';
import 'leaflet/dist/leaflet.css';
import type { Event } from '@/types';

type UserLocation = { latitude: number; longitude: number } | null;

/* ---------- Recenter helper ---------- */
function RecenterOnLocation({
  userLocation,
  behavior = 'once', // 'once' | 'follow'
  minZoom = 14,
}: {
  userLocation: UserLocation;
  behavior?: 'once' | 'follow';
  minZoom?: number;
}) {
  const map = useMap();
  const didCenterRef = useRef(false);
  const lastLatRef = useRef<number | null>(null);
  const lastLngRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userLocation) return;

    const { latitude, longitude } = userLocation;

    // avoid tiny jitter causing repeats
    if (
      lastLatRef.current !== null &&
      lastLngRef.current !== null &&
      Math.abs(lastLatRef.current - latitude) < 1e-5 &&
      Math.abs(lastLngRef.current - longitude) < 1e-5
    ) {
      return;
    }

    if (behavior === 'once' && didCenterRef.current) return;

    const targetZoom = Math.max(map.getZoom?.() ?? minZoom, minZoom);
    map.setView([latitude, longitude], targetZoom, { animate: true });

    lastLatRef.current = latitude;
    lastLngRef.current = longitude;
    didCenterRef.current = true;
  }, [userLocation, behavior, minZoom, map]);

  return null;
}

/* ---------- Flame icon (animated SVG) ---------- */
function flameDivIcon(size: number, count?: number) {
  const s = Math.round(size);
  const badge =
    typeof count === 'number'
      ? `<div style="\n          position:absolute;right:-4px;top:-6px;\n          min-width:22px;height:22px;border-radius:9999px;\n          background:#111;color:#fff;display:flex;align-items:center;justify-content:center;\n          font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.3)\n        ">${count}</div>`
      : '';

  return L.divIcon({
    className: 'flame-div-icon',
    iconSize: [s, s],
    iconAnchor: [s / 2, s - 6],
    html: `\n      <div class=\"flame-wrap\" style=\"position:relative;width:${s}px;height:${s}px\">\n        ${badge}\n        <svg viewBox=\"0 0 64 64\" width=\"${
      s
    }\" height=\"${s}\" aria-hidden=\"true\">\n          <defs>\n            <radialGradient id=\"g1\" cx=\"50%\" cy=\"20%\" r=\"60%\">\n              <stop offset=\"0%\" stop-color=\"#fff6d5\"/>\n              <stop offset=\"45%\" stop-color=\"#ffcf6e\"/>\n              <stop offset=\"80%\" stop-color=\"#ff8a3d\"/>\n              <stop offset=\"100%\" stop-color=\"#ff6a2a\"/>\n            </radialGradient>\n            <filter id=\"glow\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\">\n              <feGaussianBlur stdDeviation=\"2\" result=\"b\"/>\n              <feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge>\n            </filter>\n          </defs>\n          <path d=\"M32 60c12-6 18-14 18-24 0-10-6-16-8-24-2 4-8 8-10 14-2-4-6-8-10-12 0 10-8 14-8 22 0 10 6 18 18 24z\"\n                fill=\"url(#g1)\" filter=\"url(#glow)\">\n            <animate attributeName=\"d\" dur=\"1.5s\" repeatCount=\"indefinite\"\n              values=\"\n                M32 60c12-6 18-14 18-24 0-10-6-16-8-24-2 4-8 8-10 14-2-4-6-8-10-12 0 10-8 14-8 22 0 10 6 18 18 24z;\n                M32 60c12-7 18-13 18-25 0-9-6-16-8-24-2 5-8 8-10 14-2-4-6-9-10-12 0 11-8 14-8 22 0 10 6 18 18 25z;\n                M32 60c12-6 18-14 18-24 0-10-6-16-8-24-2 4-8 8-10 14-2-4-6-8-10-12 0 10-8 14-8 22 0 10 6 18 18 24z\" />\n          </path>\n          <circle cx=\"32\" cy=\"40\" r=\"8\" fill=\"#fff2c1\" opacity=\"0.9\">\n            <animate attributeName=\"r\" values=\"6;9;7;6\" dur=\"1.6s\" repeatCount=\"indefinite\" />\n          </circle>\n        </svg>\n      </div>\n    `,
  });
}

/* ---------- Clustering ---------- */
function useClusters(events: Event[], zoom: number, bounds: L.LatLngBounds) {
  const index = useMemo(() => {
    const pts = events
      .filter(
        (e) =>
          typeof e.latitude === 'number' && typeof e.longitude === 'number'
      )
      .map((e) => turfPoint([e.longitude, e.latitude], { id: e.id, title: e.title }));

    return new supercluster({
      radius: 60,
      maxZoom: 18,
      minPoints: 2,
    }).load(pts as any);
  }, [events]);

  const bbox: [number, number, number, number] = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];

  const clusters = useMemo(
    () => index.getClusters(bbox as any, Math.round(zoom)),
    [index, bbox, zoom]
  );

  return { index, clusters };
}

function MapContent({
  events,
  onEventClick,
  userLocation,
}: {
  events: Event[];
  onEventClick: (e: Event) => void;
  userLocation: UserLocation;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(map.getZoom());
  const [bounds, setBounds] = useState<L.LatLngBounds>(map.getBounds());

  useEffect(() => {
    const onMove = () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    };
    map.on('moveend', onMove);
    return () => {
      map.off('moveend', onMove);
    };
  }, [map]);

  const { index, clusters } = useClusters(events, zoom, bounds);

  return (
    <>
      {clusters.map((c: any) => {
        const [lng, lat] = c.geometry.coordinates;

        if (c.properties.cluster) {
          const count = c.properties.point_count as number;
          const size = Math.min(84, 36 + Math.log2(count + 1) * 12);
          const icon = flameDivIcon(size, count);

          const handleClick = () => {
            const expansionZoom = Math.min(
              index.getClusterExpansionZoom(c.properties.cluster_id),
              18
            );
            map.setView([lat, lng], expansionZoom, { animate: true });
          };

          return (
            <Marker
              key={`cluster-${c.properties.cluster_id}`}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{ click: handleClick }}
            />
          );
        }

        const ev = events.find((e) => e.id === c.properties.id);
        if (!ev) return null;

        const icon = flameDivIcon(48);
        return (
          <Marker
            key={ev.id}
            position={[ev.latitude as number, ev.longitude as number]}
            icon={icon}
            eventHandlers={{ click: () => onEventClick(ev) }}
          >
            <Popup>
              <div class=\"p-2\">\n                <div class=\"font-semibold\">{ev.title}</div>\n                <button\n                  class=\"mt-2 px-3 py-1 rounded bg-orange-500 text-white\"\n                  onClick={() => onEventClick(ev)}\n                >\n                  View details\n                </button>\n              </div>\n            </Popup>\n          </Marker>
        );
      })}

      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={L.divIcon({
            className: 'user-loc',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            html: `<div style=\"width:22px;height:22px;border-radius:9999px;background:#007aff;box-shadow:0 0 0 6px rgba(0,122,255,.15)\"></div>`,
          })}
        />
      )}
    </>
  );
}

/* ---------- Exported clustered map ---------- */
export default function ClusteredFlameMap({
  events,
  onEventClick,
  userLocation,
  height = 600,
  initialCenter = [12.9716, 77.5946] as [number, number], // fallback only
  initialZoom = 12,
  recenterBehavior = 'once', // 'once' | 'follow'
}: {
  events: Event[];
  onEventClick: (e: Event) => void;
  userLocation: UserLocation;
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
  recenterBehavior?: 'once' | 'follow';
}) {
  return (
    <div style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        preferCanvas
        className=\"h-full w-full\"
      >
        <TileLayer
          url=\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\"\n          attribution=\"&copy; OpenStreetMap contributors\"
        />

        {/* ⬇️ THIS does the centering as soon as userLocation arrives */}
        <RecenterOnLocation userLocation={userLocation} behavior={recenterBehavior} minZoom={14} />

        <MapContent
          events={events}
          onEventClick={onEventClick}
          userLocation={userLocation}
        />
      </MapContainer>
    </div>
  );
}
