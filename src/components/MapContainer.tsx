import React from 'react';
import maplibregl from 'maplibre-gl';
import { createPortal } from 'react-dom';
import { MapStyleId, Property } from '../types';
import ootyBoundary from '../ooty-boundary.json';
import CustomMarker from './CustomMarker';
import PropertyPreviewCard from './PropertyPreviewCard';

// Construct the Inverse Mask GeoJSON to shade the outside world
// Using a massive regional box rather than full world-spanning coordinates is extremely
// stable and prevents rendering or clipping glitches in MapLibre GL at very deep zoom levels.
const regionalRing = [
  [70.0, 5.0],
  [83.0, 5.0],
  [83.0, 18.0],
  [70.0, 18.0],
  [70.0, 5.0]
];
const ootyExteriorRing = ootyBoundary.features[0].geometry.coordinates[0];

const inverseMaskGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [regionalRing, ootyExteriorRing]
      }
    }
  ]
};

// Esri Satellite Imagery Style Object for MapLibre
const getSatelliteStyle = () => {
  return {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri © USGS © NASA',
        maxzoom: 17
      }
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  };
};

interface MapContainerProps {
  showBoundary: boolean;
  showSpotlight: boolean;
  activeStyle: MapStyleId;
  setMapInstance: (map: any) => void;
  onViewStateChange: (pannedAway: boolean) => void;
  properties: Property[];
  onPinClick: (property: Property) => void;
  selectedPropertyId: string | null;
  hoveredPropertyId: string | null;
  onViewFullDetails?: (property: Property) => void;
  savedPropertyIds: string[];
  onToggleSave: (propertyId: string) => void;
}

export default function MapContainer({
  showBoundary,
  showSpotlight,
  activeStyle,
  setMapInstance,
  onViewStateChange,
  properties,
  onPinClick,
  selectedPropertyId,
  hoveredPropertyId,
  onViewFullDetails,
  savedPropertyIds,
  onToggleSave
}: MapContainerProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const hasAnimatedRef = React.useRef(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  // Viewport checks for responsive layouts
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute currently selected property object
  const selectedProperty = React.useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, properties]);

  // Determine if the hovered search property's pin is visible in the current viewport bounds
  const [hoveredPinVisible, setHoveredPinVisible] = React.useState(false);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !hoveredPropertyId) {
      setHoveredPinVisible(false);
      return;
    }

    const checkHoverVisibility = () => {
      const prop = properties.find(p => p.id === hoveredPropertyId);
      if (!prop) {
        setHoveredPinVisible(false);
        return;
      }
      const bounds = map.getBounds();
      const isVisible = bounds.contains([prop.longitude, prop.latitude]);
      setHoveredPinVisible(isVisible);
    };

    // Evaluate visibility immediately
    checkHoverVisibility();

    map.on('move', checkHoverVisibility);
    map.on('zoom', checkHoverVisibility);

    return () => {
      map.off('move', checkHoverVisibility);
      map.off('zoom', checkHoverVisibility);
    };
  }, [hoveredPropertyId, properties, mapLoaded]);

  const [cardScreenPos, setCardScreenPos] = React.useState<{ x: number; y: number } | null>(null);
  const autoPanningRef = React.useRef(false);

  // Synchronized portal targets state for drawing React custom pins as MapLibre markers
  const [portalTargets, setPortalTargets] = React.useState<Map<string, { el: HTMLElement; property: Property }>>(new Map());
  const portalTargetsRef = React.useRef<Map<string, { el: HTMLElement; property: Property }>>(new Map());
  const markerInstancesRef = React.useRef<Map<string, maplibregl.Marker>>(new Map());


  // Ooty Center and Constraints
  const ootyCenter: [number, number] = [76.6907, 11.4111]; // [Lng, Lat]
  const defaultZoom = 11.2;
  // Relaxed maxBounds and minZoom allows exploring surrounding regions (Kotagiri, Coonoor, Gudalur)
  // while keeping the viewport anchored around the core Ooty Taluk.
  const ootyMaxBounds: maplibregl.LngLatBoundsLike = [
    [75.90, 10.95], // Southwest coordinates [Lng, Lat]
    [77.50, 11.95]  // Northeast coordinates [Lng, Lat]
  ];

  // Initialize Map
  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    // Determine initial style URL or object
    let initialStyle: string | any = 'https://tiles.openfreemap.org/styles/liberty';
    if (activeStyle === 'dark') {
      initialStyle = 'https://tiles.openfreemap.org/styles/darkliberty';
    } else if (activeStyle === 'satellite') {
      initialStyle = getSatelliteStyle();
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: ootyCenter,
      zoom: defaultZoom,
      minZoom: 8.5, // Relaxed minZoom to let users zoom out and see neighboring regions dimmed
      maxZoom: activeStyle === 'satellite' ? 17 : 18,
      maxBounds: ootyMaxBounds,
      dragPan: true,
      scrollZoom: true,
      cooperativeGestures: false, // Normal panning
      attributionControl: false // Custom attribution styled below
    });

    mapRef.current = map;
    setMapInstance(map);

    // Setup Custom Layers on Style Load (persists across map.setStyle calls!)
    const setupCustomLayers = () => {
      // 1. Dimming layer outside boundary (inverse mask)
      if (!map.getSource('ooty-spotlight-src')) {
        map.addSource('ooty-spotlight-src', {
          type: 'geojson',
          data: inverseMaskGeoJSON as any,
          maxzoom: 24, // Keep drawing tiles beyond max map zoom to avoid tile drop issues
          buffer: 512,  // Large buffer prevents tile-clipping bugs at high zoom levels
          tolerance: 0  // Keep geometry perfect
        });
      }

      if (!map.getLayer('spotlight-layer')) {
        map.addLayer({
          id: 'spotlight-layer',
          type: 'fill',
          source: 'ooty-spotlight-src',
          paint: {
            'fill-color': '#000000',
            'fill-opacity': showSpotlight ? 0.45 : 0.0
          }
        });
      }

      // 2. Ooty boundary source
      if (!map.getSource('ooty-boundary-src')) {
        map.addSource('ooty-boundary-src', {
          type: 'geojson',
          data: ootyBoundary as any
        });
      }

      // 3. Thick glow line (animated on first load)
      if (!map.getLayer('boundary-glow-layer')) {
        map.addLayer({
          id: 'boundary-glow-layer',
          type: 'line',
          source: 'ooty-boundary-src',
          paint: {
            'line-color': '#2D5A3D', // Forest Green
            'line-width': 10,
            'line-opacity': 0.0,
            'line-blur': 5
          }
        });
      }

      // 4. Alternating Red-White Dash Boundary Line:
      // Red solid base
      if (!map.getLayer('boundary-line-red')) {
        map.addLayer({
          id: 'boundary-line-red',
          type: 'line',
          source: 'ooty-boundary-src',
          paint: {
            'line-color': '#EF4444', // Classic Boundary Red
            'line-width': 3.5,
            'line-opacity': showBoundary ? 0.85 : 0.0
          }
        });
      }

      // White dash top overlay
      if (!map.getLayer('boundary-line-white-dash')) {
        map.addLayer({
          id: 'boundary-line-white-dash',
          type: 'line',
          source: 'ooty-boundary-src',
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 3.5,
            'line-opacity': showBoundary ? 0.85 : 0.0,
            'line-dasharray': [2, 2] // Red-white alternating
          }
        });
      }

      // First Load Animation Cascade (runs once per page load)
      if (!hasAnimatedRef.current && map.getLayer('boundary-glow-layer')) {
        const animationStartTime = performance.now();
        const duration = 2400; // 2.4 seconds of pulsing

        const pulse = (now: number) => {
          const elapsed = now - animationStartTime;
          if (elapsed < duration) {
            // Pulse using sine function
            const wave = Math.sin((elapsed * Math.PI) / 400); // 400ms cycle
            const opacity = 0.45 + 0.35 * wave;
            const width = 8 + 4 * wave;

            if (map.getLayer('boundary-glow-layer')) {
              map.setPaintProperty('boundary-glow-layer', 'line-opacity', opacity);
              map.setPaintProperty('boundary-glow-layer', 'line-width', width);
            }
            requestAnimationFrame(pulse);
          } else {
            // Settle down to extremely faint indicator glow
            if (map.getLayer('boundary-glow-layer')) {
              map.setPaintProperty('boundary-glow-layer', 'line-opacity', 0.15);
              map.setPaintProperty('boundary-glow-layer', 'line-width', 8);
            }
            hasAnimatedRef.current = true;
          }
        };
        requestAnimationFrame(pulse);
      } else {
        // Instant settle on style changes
        if (map.getLayer('boundary-glow-layer')) {
          map.setPaintProperty('boundary-glow-layer', 'line-opacity', 0.15);
          map.setPaintProperty('boundary-glow-layer', 'line-width', 8);
        }
      }
    };

    map.on('load', () => {
      setMapLoaded(true);
      setupCustomLayers();
    });

    map.on('style.load', () => {
      setupCustomLayers();
    });

    // Monitor Panning & Zoom changes to trigger "Return to Ooty" floating button
    const checkViewState = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      // Check distance from target Ooty center and zoom deviation
      const distance = Math.sqrt(
        Math.pow(center.lng - ootyCenter[0], 2) + 
        Math.pow(center.lat - ootyCenter[1], 2)
      );

      const zoomDiff = Math.abs(zoom - defaultZoom);
      const isPannedAway = distance > 0.008 || zoomDiff > 0.3;
      onViewStateChange(isPannedAway);
    };

    map.on('moveend', checkViewState);
    map.on('zoomend', checkViewState);

    return () => {
      map.remove();
    };
  }, []);

  // Update styles reactively when activeStyle prop changes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (activeStyle === 'satellite') {
      fetch('https://tiles.openfreemap.org/styles/liberty')
        .then(res => res.json())
        .then(style => {
          style.sources['esri-satellite'] = {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 17
          };
          
          const symbolLayers = style.layers.filter((l: any) => l.type === 'symbol');
          symbolLayers.forEach((l: any) => {
            if (!l.paint) l.paint = {};
            l.paint['text-color'] = '#FFFFFF';
            l.paint['text-halo-color'] = 'rgba(0, 0, 0, 0.85)';
            l.paint['text-halo-width'] = 1;
            l.paint['text-halo-blur'] = 1;
          });
          
          style.layers = [
            {
              id: 'esri-satellite-layer',
              type: 'raster',
              source: 'esri-satellite',
              minzoom: 0,
              maxzoom: 20
            },
            ...symbolLayers
          ];
          
          map.setStyle(style);
        })
        .catch(err => {
          console.error("Failed to load hybrid style", err);
          map.setStyle(getSatelliteStyle());
        });

      if (map.getZoom() > 17) {
        map.easeTo({ zoom: 17, duration: 800 });
        setTimeout(() => {
          if (mapRef.current) mapRef.current.setMaxZoom(17);
        }, 850);
      } else {
        map.setMaxZoom(17);
      }
    } else {
      map.setMaxZoom(18);
      if (activeStyle === 'dark') {
        map.setStyle('https://tiles.openfreemap.org/styles/darkliberty');
      } else {
        map.setStyle('https://tiles.openfreemap.org/styles/liberty');
      }
    }
  }, [activeStyle, mapLoaded]);

  // Update Boundary toggling reactively
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const opacity = showBoundary ? 0.85 : 0.0;
    if (map.getLayer('boundary-line-red')) {
      map.setPaintProperty('boundary-line-red', 'line-opacity', opacity);
    }
    if (map.getLayer('boundary-line-white-dash')) {
      map.setPaintProperty('boundary-line-white-dash', 'line-opacity', opacity);
    }
  }, [showBoundary, mapLoaded]);

  // Update Spotlight toggling reactively
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const opacity = showSpotlight ? 0.45 : 0.0;
    if (map.getLayer('spotlight-layer')) {
      map.setPaintProperty('spotlight-layer', 'fill-opacity', opacity);
    }
  }, [showSpotlight, mapLoaded]);

  // Zoom or fly to property
  const handlePinClickEvent = (property: Property) => {
    onPinClick(property);
  };

  // Synchronize MapLibre custom markers
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const syncMarkers = () => {
      const currentTargets = new Map<string, { el: HTMLElement; property: Property }>(portalTargetsRef.current);
      const nextTargets = new Map<string, { el: HTMLElement; property: Property }>();
      const activeIds = new Set(properties.map((p) => p.id));

      // Remove obsolete markers
      for (const [id, target] of currentTargets.entries()) {
        if (!activeIds.has(id)) {
          const marker = markerInstancesRef.current.get(id);
          if (marker) {
            marker.remove();
            markerInstancesRef.current.delete(id);
          }
        } else {
          nextTargets.set(id, target);
        }
      }

      // Add or update markers
      for (const property of properties) {
        if (!nextTargets.has(property.id)) {
          const el = document.createElement('div');
          el.className = 'maplibre-custom-marker-wrapper';

          const anchor = 'bottom';
          const marker = new maplibregl.Marker({ element: el, anchor })
            .setLngLat([property.longitude, property.latitude])
            .addTo(map);

          markerInstancesRef.current.set(property.id, marker);
          nextTargets.set(property.id, { el, property });
        } else {
          const target = nextTargets.get(property.id)!;
          target.property = property;
          const marker = markerInstancesRef.current.get(property.id);
          if (marker) {
            marker.setLngLat([property.longitude, property.latitude]);
          }
        }
      }

      portalTargetsRef.current = nextTargets;
      setPortalTargets(new Map(nextTargets));
    };

    syncMarkers();

    map.on('move', syncMarkers);
    map.on('zoom', syncMarkers);

    return () => {
      map.off('move', syncMarkers);
      map.off('zoom', syncMarkers);
    };
  }, [properties, mapLoaded]);

  // Handle map click for closing preview
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const handleMapClick = (e: any) => {
      const target = e.originalEvent?.target as HTMLElement;
      if (target && (target.closest('.maplibre-custom-marker-wrapper') || target.closest('.pointer-events-auto'))) {
        return;
      }
      onPinClick(null as any);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapLoaded, onPinClick]);

  // Handle desktop custom card screen coordinates tracking & auto-close out-of-bounds
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (selectedPropertyId && !isMobile) {
      const property = properties.find((p) => p.id === selectedPropertyId);
      if (property) {
        // Start automatic pan to center the property + vertical offset Lat
        autoPanningRef.current = true;
        const offsetLat = -0.0045; // offsets coordinates so map rolls southwards
        map.easeTo({
          center: [property.longitude, property.latitude + offsetLat],
          zoom: 12.8,
          duration: 800,
          essential: true
        });

        // Set initial screen position of the card based on projected coordinate
        const initialPos = map.project([property.longitude, property.latitude]);
        setCardScreenPos({ x: initialPos.x, y: initialPos.y });

        // Let the auto-pan animation run, updating coordinates smoothly
        const handleMove = () => {
          const prop = properties.find((p) => p.id === selectedPropertyId);
          if (!prop) return;

          const bounds = map.getBounds();
          const contains = bounds.contains([prop.longitude, prop.latitude]);

          if (autoPanningRef.current) {
            // Track pin screen position dynamically during the auto-pan
            const pos = map.project([prop.longitude, prop.latitude]);
            setCardScreenPos({ x: pos.x, y: pos.y });
          } else {
            // Once auto-pan completes, card coordinates are locked to screen-space.
            // If the user manually pans the pin completely off screen, auto-close the card!
            if (!contains) {
              onPinClick(null as any);
            }
          }
        };

        const timer = setTimeout(() => {
          autoPanningRef.current = false;
        }, 1000);

        map.on('move', handleMove);
        map.on('zoom', handleMove);

        return () => {
          clearTimeout(timer);
          map.off('move', handleMove);
          map.off('zoom', handleMove);
        };
      }
    } else {
      setCardScreenPos(null);
      autoPanningRef.current = false;
    }
  }, [selectedPropertyId, isMobile, properties, mapLoaded, onPinClick]);

  // Full clean up on unmount
  React.useEffect(() => {
    return () => {
      for (const [id, marker] of markerInstancesRef.current.entries()) {
        marker.remove();
      }
      markerInstancesRef.current.clear();
      portalTargetsRef.current.clear();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-neutral-100" id="map-root-container">
      {/* Map Element */}
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full map-container ${mapLoaded ? 'loaded' : ''}`}
        id="maplibre-canvas-viewport"
      />

      {/* Render portals for all active custom markers */}
      {Array.from(portalTargets.entries()).map(([id, target]) => {
        return createPortal(
          <CustomMarker
            key={`marker-${id}`}
            property={target.property}
            onClick={() => handlePinClickEvent(target.property)}
            selectedPropertyId={selectedPropertyId}
            hoveredPropertyId={hoveredPinVisible ? hoveredPropertyId : null}
          />,
          target.el,
          `portal-${id}`
        );
      })}

      {/* Render desktop overlay card at fixed pixel position */}
      {!isMobile && cardScreenPos && selectedProperty && (
        <div 
          className="absolute z-30 pointer-events-auto"
          style={{
            left: `${cardScreenPos.x}px`,
            top: `${cardScreenPos.y}px`,
            transform: 'translate(-50%, -105%)', // Center horizontally, place entirely above the pin
          }}
          id={`desktop-card-overlay-wrapper-${selectedProperty.id}`}
        >
          <PropertyPreviewCard
            property={selectedProperty}
            onClose={() => onPinClick(null as any)}
            onViewDetails={(id) => {
              if (onViewFullDetails) {
                onViewFullDetails(selectedProperty);
              }
            }}
            isMobile={false}
            savedPropertyIds={savedPropertyIds}
            onToggleSave={onToggleSave}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div 
          className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center font-sans z-50 transition-opacity duration-500"
          id="map-loading-screen"
        >
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute w-16 h-16 rounded-full border-4 border-brand-green/20 animate-ping" />
            <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-6 h-6 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-4 text-sm font-semibold text-brand-charcoal tracking-wide uppercase font-display animate-pulse">
            Sourcing Ooty Map Tiles
          </h2>
          <p className="text-xs text-gray-400 mt-1">OpenFreeMap GL Layer Initialization</p>
        </div>
      )}

      {/* Map Attribution Overlay (Small & unobtrusive) */}
      <div 
        className="absolute bottom-1 right-2 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] text-gray-500 font-mono pointer-events-auto shadow-xs border border-gray-100 z-10"
        id="map-attribution-watermark"
      >
        © OpenStreetMap © OpenFreeMap © Esri
      </div>
    </div>
  );
}
