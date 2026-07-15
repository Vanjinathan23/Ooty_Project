import React from 'react';
import maplibregl from 'maplibre-gl';

// Ooty bounding box (same as main map)
const OOTY_BOUNDS = {
  minLng: 75.90,
  maxLng: 77.50,
  minLat: 10.95,
  maxLat: 11.95,
};

const OOTY_CENTER: [number, number] = [76.6907, 11.4111];

interface PropertyFormMapProps {
  lat: number | null;
  lng: number | null;
  onCoordinateChange: (lat: number, lng: number) => void;
}

export function isOutsideOoty(lat: number, lng: number): boolean {
  return (
    lat < OOTY_BOUNDS.minLat || lat > OOTY_BOUNDS.maxLat ||
    lng < OOTY_BOUNDS.minLng || lng > OOTY_BOUNDS.maxLng
  );
}

export default function PropertyFormMap({ lat, lng, onCoordinateChange }: PropertyFormMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const labelRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingRef = React.useRef(false);
  const [mapReady, setMapReady] = React.useState(false);

  // Initialize map once
  React.useEffect(() => {
    if (!containerRef.current) return;

    const initialCenter: [number, number] =
      lat !== null && lng !== null ? [lng, lat] : OOTY_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: initialCenter,
      zoom: lat !== null && lng !== null ? 13 : 11,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: false,
    });

    mapRef.current = map;

    // Build label element
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      position: absolute;
      background: rgba(34,34,34,0.88);
      color: white;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      padding: 3px 7px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      margin-top: -52px;
      margin-left: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    `;
    labelRef.current = labelEl;

    const updateLabel = (latitude: number, longitude: number) => {
      if (labelEl) {
        labelEl.textContent = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
      }
    };

    map.on('load', () => {
      setMapReady(true);

      // If initial coords provided, drop a pin
      if (lat !== null && lng !== null) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width:32px; height:32px;
            background:#2D5A3D;
            border:3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(45,90,61,0.45);
            cursor:grab;
          "></div>
        `;
        el.style.cursor = 'grab';

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
          draggable: true,
        })
          .setLngLat([lng, lat])
          .addTo(map);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -38],
          className: 'admin-map-label-popup',
        });
        popup.setDOMContent(labelEl);
        marker.setPopup(popup);
        popup.addTo(map);

        updateLabel(lat, lng);

        marker.on('dragstart', () => { isDraggingRef.current = true; });
        marker.on('drag', () => {
          const lngLat = marker.getLngLat();
          updateLabel(lngLat.lat, lngLat.lng);
        });
        marker.on('dragend', () => {
          isDraggingRef.current = false;
          const lngLat = marker.getLngLat();
          onCoordinateChange(
            parseFloat(lngLat.lat.toFixed(6)),
            parseFloat(lngLat.lng.toFixed(6))
          );
        });

        markerRef.current = marker;
      }
    });

    // Click on map to place/move pin
    map.on('click', (e) => {
      if (isDraggingRef.current) return;

      const clickLat = parseFloat(e.lngLat.lat.toFixed(6));
      const clickLng = parseFloat(e.lngLat.lng.toFixed(6));

      if (!markerRef.current) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width:32px; height:32px;
            background:#2D5A3D;
            border:3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(45,90,61,0.45);
            cursor:grab;
          "></div>
        `;
        el.style.cursor = 'grab';

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
          draggable: true,
        })
          .setLngLat([clickLng, clickLat])
          .addTo(map);

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -38],
        });
        popup.setDOMContent(labelEl!);
        marker.setPopup(popup);
        popup.addTo(map);

        marker.on('dragstart', () => { isDraggingRef.current = true; });
        marker.on('drag', () => {
          const lngLat = marker.getLngLat();
          updateLabel(lngLat.lat, lngLat.lng);
        });
        marker.on('dragend', () => {
          isDraggingRef.current = false;
          const lngLat = marker.getLngLat();
          onCoordinateChange(
            parseFloat(lngLat.lat.toFixed(6)),
            parseFloat(lngLat.lng.toFixed(6))
          );
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([clickLng, clickLat]);
        const popup = markerRef.current.getPopup();
        if (!popup?.isOpen()) {
          markerRef.current.togglePopup();
        }
      }

      updateLabel(clickLat, clickLng);
      onCoordinateChange(clickLat, clickLng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync pin position when lat/lng props change externally (from text inputs)
  React.useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (lat === null || lng === null) return;
    if (isDraggingRef.current) return;

    const map = mapRef.current;
    const newLngLat: [number, number] = [lng, lat];

    if (markerRef.current) {
      markerRef.current.setLngLat(newLngLat);
      // Update the label
      if (labelRef.current) {
        labelRef.current.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        const popup = markerRef.current.getPopup();
        if (!popup?.isOpen()) {
          markerRef.current.togglePopup();
        }
      }
    }

    // Fly map to new pin location
    map.flyTo({ center: newLngLat, zoom: Math.max(map.getZoom(), 12.5), duration: 600 });
  }, [lat, lng, mapReady]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-neutral-200 shadow-inner" style={{ height: 340 }}>
      <div
        ref={containerRef}
        className="w-full h-full"
        id="admin-location-mini-map"
      />
      {/* Instruction overlay — fades after pin is set */}
      {(lat === null || lng === null) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-brand-charcoal/80 backdrop-blur-sm text-white text-[11px] font-sans px-4 py-2 rounded-full pointer-events-none shadow-lg">
          Click on the map to drop a pin
        </div>
      )}
      {/* Attribution */}
      <div className="absolute bottom-1 right-2 text-[9px] text-neutral-500 font-mono bg-white/70 px-1.5 py-0.5 rounded pointer-events-none">
        © OpenFreeMap © OSM
      </div>
    </div>
  );
}
