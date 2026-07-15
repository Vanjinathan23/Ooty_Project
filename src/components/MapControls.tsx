import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Compass, 
  Map, 
  AlertCircle,
  X,
  Target,
  Navigation
} from 'lucide-react';
import { MapStyleId } from '../types';

interface MapControlsProps {
  map: any | null; // MapLibre GL Map instance
  activeStyle: MapStyleId;
  setActiveStyle: (style: MapStyleId) => void;
  showReturnToOoty: boolean;
  onReturnToOoty: () => void;
}

export default function MapControls({
  map,
  activeStyle,
  setActiveStyle,
  showReturnToOoty,
  onReturnToOoty
}: MapControlsProps) {
  const [bearing, setBearing] = React.useState(0);
  const [pitch, setPitch] = React.useState(0);
  const [currentZoom, setCurrentZoom] = React.useState(11.2);
  const [isLocating, setIsLocating] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [showStyleMenu, setShowStyleMenu] = React.useState(false);

  // Monitor map rotation and tilt to toggle compass control
  React.useEffect(() => {
    if (!map) return;

    setCurrentZoom(map.getZoom());

    const handleMapMovement = () => {
      setBearing(map.getBearing());
      setPitch(map.getPitch());
    };

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('rotate', handleMapMovement);
    map.on('pitch', handleMapMovement);
    map.on('zoom', handleZoom);

    return () => {
      map.off('rotate', handleMapMovement);
      map.off('pitch', handleMapMovement);
      map.off('zoom', handleZoom);
    };
  }, [map]);

  const handleZoomIn = () => {
    if (!map) return;
    map.easeTo({
      zoom: map.getZoom() + 1,
      duration: 300
    });
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.easeTo({
      zoom: map.getZoom() - 1,
      duration: 300
    });
  };

  const handleResetCompass = () => {
    if (!map) return;
    map.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 800
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  };

  const handleMyLocation = () => {
    if (!map) return;
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { longitude, latitude } = position.coords;

        // Ooty Taluk administrative boundary bounds check:
        // Lat: 11.3259709 to 11.6177871
        // Lon: 76.4776977 to 76.8705225
        const inOoty = 
          latitude >= 11.325 && 
          latitude <= 11.618 && 
          longitude >= 76.477 && 
          longitude <= 76.871;

        if (inOoty) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1200,
            essential: true
          });
          showToast("Zoomed to your location");
        } else {
          showToast("You're outside our coverage area");
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "Could not retrieve your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied — please allow access in your browser";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out";
        }
        showToast(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Check if compass is active (rotated or tilted)
  const isCompassActive = Math.abs(bearing) > 0.5 || pitch > 0.5;
  
  const currentMaxZoom = activeStyle === 'satellite' ? 17 : 18;
  const isAtMaxZoom = currentZoom >= currentMaxZoom - 0.01;

  return (
    <div className="absolute inset-0 pointer-events-none font-sans z-30" id="map-controls-overlay">
      
      {/* 1. Compass Button (Top Right) */}
      <div className="absolute top-24 right-4 pointer-events-auto" id="compass-control-container">
        <AnimatePresence>
          {isCompassActive && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleResetCompass}
              className="p-3 bg-white rounded-xl shadow-lg border border-gray-100 text-brand-charcoal hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer focus:outline-none flex items-center justify-center min-w-[44px] min-h-[44px]"
              title="Reset Compass (Point North)"
              aria-label="Reset Compass"
              id="btn-reset-compass"
            >
              <Compass 
                className="w-5 h-5 text-brand-green transition-transform duration-75" 
                style={{ transform: `rotate(${-bearing}deg)` }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Toast System (Top Center) */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto" id="toast-container">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="flex items-center space-x-2 bg-brand-charcoal text-white text-sm px-4 py-3 rounded-xl shadow-2xl border border-white/10"
              id="coverage-toast"
            >
              <AlertCircle className="w-5 h-5 text-brand-terracotta shrink-0" />
              <span>{toastMessage}</span>
              <button 
                onClick={() => setToastMessage(null)}
                className="p-0.5 hover:bg-white/10 rounded-full transition-colors ml-2"
                aria-label="Close toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. "Return to Ooty" Floating Button (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-40" id="return-to-ooty-container">
        <AnimatePresence>
          {showReturnToOoty && (
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 180 }}
              onClick={onReturnToOoty}
              className="px-5 py-3 bg-brand-terracotta text-white rounded-full font-display font-semibold text-sm shadow-xl flex items-center space-x-2 border border-brand-terracotta/20 hover:bg-brand-terracotta/90 active:scale-95 transition-all cursor-pointer min-w-[44px] min-h-[44px]"
              id="btn-return-to-ooty"
            >
              <Target className="w-4 h-4 animate-spin-slow" />
              <span>Return to Ooty view</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Style Type Selector (Bottom Left) */}
      <div className="absolute bottom-6 left-4 pointer-events-auto z-40" id="map-style-toggle-container">
        <div 
          className="relative"
          onMouseEnter={() => setShowStyleMenu(true)}
          onMouseLeave={() => setShowStyleMenu(false)}
        >
          {/* Main Toggle Toggle Button */}
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="flex items-center space-x-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer focus:outline-none min-w-[44px] min-h-[44px]"
            aria-label="Toggle map styles"
            id="btn-style-selector-trigger"
          >
            {/* Visual preview of active style */}
            <div className={`w-10 h-10 rounded-lg border border-gray-200 overflow-hidden relative flex items-center justify-center shrink-0`}>
              {activeStyle === 'standard' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-200 to-emerald-100 flex items-center justify-center">
                  <Map className="w-5 h-5 text-brand-green" />
                </div>
              )}
              {activeStyle === 'dark' && (
                <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                  <Map className="w-5 h-5 text-neutral-400" />
                </div>
              )}
              {activeStyle === 'satellite' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-800 to-green-950 flex items-center justify-center">
                  <Map className="w-5 h-5 text-emerald-400" />
                </div>
              )}
            </div>
            <div className="pr-1 text-left hidden sm:block">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Map View</p>
              <p className="text-xs font-bold text-brand-charcoal capitalize">{activeStyle}</p>
            </div>
          </button>

          {/* Expanded Horizontal Styles Bar */}
          <AnimatePresence>
            {showStyleMenu && (
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                className="absolute bottom-0 left-0 bg-white p-2 rounded-xl shadow-2xl border border-gray-100 flex space-x-2 ml-16"
                id="style-selector-expanded"
              >
                {/* 1. Standard (Liberty) */}
                <button
                  onClick={() => {
                    setActiveStyle('standard');
                    setShowStyleMenu(false);
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer focus:outline-none min-w-[44px] min-h-[44px] ${
                    activeStyle === 'standard' 
                      ? 'border-brand-green bg-brand-green/5' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  id="style-opt-standard"
                >
                  <div className="w-12 h-10 rounded-md bg-gradient-to-tr from-sky-100 via-emerald-50 to-gray-100 border border-gray-200 flex items-center justify-center" />
                  <span className="text-[10px] font-bold mt-1 text-gray-600">Standard</span>
                </button>

                {/* 2. Satellite (Esri) */}
                <button
                  onClick={() => {
                    setActiveStyle('satellite');
                    setShowStyleMenu(false);
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer focus:outline-none min-w-[44px] min-h-[44px] ${
                    activeStyle === 'satellite' 
                      ? 'border-brand-green bg-brand-green/5' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  id="style-opt-satellite"
                >
                  <div className="w-12 h-10 rounded-md bg-gradient-to-tr from-teal-800 to-green-950 border border-gray-300 flex items-center justify-center" />
                  <span className="text-[10px] font-bold mt-1 text-gray-600">Satellite</span>
                </button>

                {/* 3. Dark Mode (Dark Liberty) */}
                <button
                  onClick={() => {
                    setActiveStyle('dark');
                    setShowStyleMenu(false);
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer focus:outline-none min-w-[44px] min-h-[44px] ${
                    activeStyle === 'dark' 
                      ? 'border-brand-green bg-brand-green/5' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  id="style-opt-dark"
                >
                  <div className="w-12 h-10 rounded-md bg-neutral-900 border border-neutral-700 flex items-center justify-center" />
                  <span className="text-[10px] font-bold mt-1 text-gray-600">Dark Mode</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Navigation Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-4 flex flex-col space-y-3 pointer-events-auto z-40" id="navigation-controls-group">
        {/* My Location Circle Button */}
        <button
          onClick={handleMyLocation}
          className={`p-3 bg-white rounded-full shadow-lg border border-gray-100 text-brand-charcoal hover:bg-gray-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-green/40 min-w-[44px] min-h-[44px] ${
            isLocating ? 'animate-pulse text-brand-green' : ''
          }`}
          title="Zoom to my location"
          aria-label="My Location"
          id="btn-my-location"
        >
          <Navigation className={`w-5 h-5 ${isLocating ? 'text-brand-green' : 'text-gray-600'}`} />
        </button>

        {/* Zoom Controls + / - (Vertical Rectangle) */}
        <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden" id="zoom-controls-box">
          <button
            onClick={handleZoomIn}
            className={`p-3 transition-colors flex items-center justify-center border-b border-gray-100 focus:outline-none focus:bg-gray-50 min-w-[44px] min-h-[44px] ${isAtMaxZoom ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'}`}
            title="Zoom In"
            aria-label="Zoom In"
            id="btn-zoom-in"
            disabled={isAtMaxZoom}
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center focus:outline-none focus:bg-gray-50 min-w-[44px] min-h-[44px]"
            title="Zoom Out"
            aria-label="Zoom Out"
            id="btn-zoom-out"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
