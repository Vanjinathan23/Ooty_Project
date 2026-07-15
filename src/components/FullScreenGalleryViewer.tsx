import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  MapPin,
  Maximize2
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { Property } from '../types';

interface FullScreenGalleryViewerProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void; // Closes both gallery and detail panel
  onBack: () => void;  // Returns to detail panel
  isMobile?: boolean;
  openToVideo?: boolean;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
}

export default function FullScreenGalleryViewer({
  property,
  isOpen,
  onClose,
  onBack,
  isMobile = false,
  openToVideo = false
}: FullScreenGalleryViewerProps) {
  const [activeCategory, setActiveCategory] = React.useState<'all' | 'videos'>('all');
  const [selectedItemId, setSelectedItemId] = React.useState<string>('image-0');
  const [shareCopied, setShareCopied] = React.useState(false);

  const miniMapContainerRef = React.useRef<HTMLDivElement>(null);
  const miniMapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!isOpen || !miniMapContainerRef.current) return;

    // Wait a brief tick for the container to render and get its size
    const timer = setTimeout(() => {
      if (!miniMapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: miniMapContainerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [property.longitude, property.latitude],
        zoom: 13,
        minZoom: 10,
        maxZoom: 18,
        dragPan: true,
        scrollZoom: false,
        cooperativeGestures: false,
        attributionControl: false
      });

      // Disable box zoom, double click zoom
      map.boxZoom.disable();
      map.doubleClickZoom.disable();

      // Add a simple pin marker at the property's location
      const el = document.createElement('div');
      el.className = 'w-5 h-5 rounded-full rounded-br-none rotate-45 flex items-center justify-center bg-white border border-emerald-600 shadow-md z-10';
      el.innerHTML = `<svg class="-rotate-45 w-2.5 h-2.5 text-emerald-700 fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([property.longitude, property.latitude])
        .addTo(map);

      miniMapRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, [isOpen, property.longitude, property.latitude]);

  // Synchronize state when openToVideo changes or gallery is opened
  React.useEffect(() => {
    if (isOpen) {
      if (openToVideo) {
        setActiveCategory('videos');
        setSelectedItemId('video-0');
      } else {
        setActiveCategory('all');
        setSelectedItemId('image-0');
      }
    }
  }, [isOpen, openToVideo]);

  // Generate padded images list (minimum 3 images for rich carousel browsing)
  const imagesList = React.useMemo(() => {
    const list = [...property.images];
    while (list.length < 3) {
      const nextIdx = list.length + 1;
      list.push(`https://picsum.photos/800/600?random=${property.id}_${nextIdx}`);
    }
    return list;
  }, [property]);

  // Construct unified media list (images + optional video)
  const mediaItems = React.useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = imagesList.map((img, idx) => ({
      id: `image-${idx}`,
      type: 'image',
      url: img,
      thumbnailUrl: img
    }));

    // Always include a video tour item so that the "Videos" tab is fully functional and interactive.
    // If the property doesn't have a videoUrl, we use a gorgeous nature drone tour video of the Ooty mountain region.
    const finalVideoUrl = property.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-aerial-view-of-a-mountain-landscape-43184-large.mp4';
    items.push({
      id: 'video-0',
      type: 'video',
      url: finalVideoUrl,
      thumbnailUrl: property.images[0] || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80'
    });

    return items;
  }, [imagesList, property.videoUrl, property.images]);

  // Filter media items based on selected tab/category
  const filteredItems = React.useMemo(() => {
    if (activeCategory === 'videos') {
      return mediaItems.filter(item => item.type === 'video');
    }
    return mediaItems;
  }, [mediaItems, activeCategory]);

  const currentItemIndex = mediaItems.findIndex(item => item.id === selectedItemId);
  const activeItem = mediaItems[currentItemIndex] || mediaItems[0];

  // Navigate forward/backward
  const navigateNext = React.useCallback(() => {
    const nextIdx = (currentItemIndex + 1) % mediaItems.length;
    setSelectedItemId(mediaItems[nextIdx].id);
    if (activeCategory === 'videos' && mediaItems[nextIdx].type !== 'video') {
      setActiveCategory('all');
    }
  }, [currentItemIndex, mediaItems, activeCategory]);

  const navigatePrev = React.useCallback(() => {
    const prevIdx = (currentItemIndex - 1 + mediaItems.length) % mediaItems.length;
    setSelectedItemId(mediaItems[prevIdx].id);
    if (activeCategory === 'videos' && mediaItems[prevIdx].type !== 'video') {
      setActiveCategory('all');
    }
  }, [currentItemIndex, mediaItems, activeCategory]);

  // Handle Share link copy
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?property=${property.id}&media=${selectedItemId}`;
    if (navigator.share && isMobile) {
      navigator.share({
        title: property.title,
        text: `Take a look at this media for ${property.title} in Ooty`,
        url: shareUrl
      }).catch((err) => console.log('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch((err) => console.error('Copy failed:', err));
    }
  };

  // Keyboard navigation listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigateNext, navigatePrev, onBack]);

  // Touch/swipe gesture trackers
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        navigateNext();
      } else {
        navigatePrev();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-neutral-950 z-[100] flex flex-col md:flex-row font-sans text-white select-none overflow-hidden"
      id="fullscreen-media-gallery-overlay"
    >
      {/* 1. LEFT PANEL: Large focused view + Mobile adaptation */}
      <div 
        className="flex-1 flex flex-col justify-between relative bg-neutral-950 h-full overflow-hidden"
        id="focused-media-panel"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Header (Only visible on screens under md size) */}
        <div 
          className="flex md:hidden items-center justify-between px-4 py-3.5 bg-neutral-900 border-b border-neutral-800 z-30 shrink-0"
          id="mobile-gallery-header"
        >
          <div className="flex items-center space-x-3.5 truncate">
            <button
              onClick={onBack}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer focus:outline-none"
              title="Back"
              id="btn-mobile-gallery-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-display font-bold text-sm tracking-tight text-white truncate max-w-[200px]" id="mobile-gallery-title">
              {property.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer focus:outline-none"
            title="Close"
            id="btn-mobile-gallery-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Central Media Viewport */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-16 py-6 relative" id="media-viewport-container">
          
          {/* Top-Right Info Overlay (Counter & Share) */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center space-x-3 z-30" id="gallery-overlays-top">
            <div className="px-3.5 py-1.5 rounded-full bg-black/65 text-[11px] font-mono font-bold tracking-wider text-neutral-200 border border-neutral-800/80 backdrop-blur-md shadow-lg select-none">
              {currentItemIndex + 1} / {mediaItems.length}
            </div>
            
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/65 hover:bg-neutral-800 text-white flex items-center justify-center transition-all border border-neutral-800/80 backdrop-blur-md shadow-lg cursor-pointer focus:outline-none"
              title="Copy share link"
              id="btn-gallery-share"
            >
              {shareCopied ? (
                <span className="text-[10px] font-bold text-emerald-400">Copied!</span>
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Stepper Navigation Arrows (Desktop overlay only) */}
          <button
            onClick={navigatePrev}
            className="absolute left-4 md:left-6 w-12 h-12 rounded-full bg-black/50 hover:bg-black/75 text-neutral-300 hover:text-white flex items-center justify-center transition-all border border-neutral-800/80 shadow-2xl backdrop-blur-xs cursor-pointer z-35 focus:outline-none focus:ring-2 focus:ring-brand-green/50 active:scale-95"
            title="Previous"
            id="btn-gallery-stepper-prev"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={navigateNext}
            className="absolute right-4 md:right-6 w-12 h-12 rounded-full bg-black/50 hover:bg-black/75 text-neutral-300 hover:text-white flex items-center justify-center transition-all border border-neutral-800/80 shadow-2xl backdrop-blur-xs cursor-pointer z-35 focus:outline-none focus:ring-2 focus:ring-brand-green/50 active:scale-95"
            title="Next"
            id="btn-gallery-stepper-next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Large Image/Video Display with smooth Crossfade */}
          <div className="w-full h-full flex items-center justify-center" id="active-media-renderer">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full h-full flex items-center justify-center"
              >
                {activeItem.type === 'video' ? (
                  <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-black">
                    <video
                      src={activeItem.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain focus:outline-none"
                      id="gallery-inline-video"
                    />
                  </div>
                ) : (
                  <motion.img
                    layoutId={activeItem.id === 'image-0' ? 'property-hero-image' : undefined}
                    src={activeItem.url}
                    alt={property.title}
                    className="max-w-full max-h-[62vh] md:max-h-[82vh] object-contain rounded-2xl shadow-2xl bg-neutral-950"
                    referrerPolicy="no-referrer"
                    id="gallery-active-image"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mini-map Thumbnail overlay (Desktop/Tablet only, bottom-left) */}
          <div 
            className="absolute bottom-6 left-6 z-20 hidden md:block w-[180px] h-[110px] rounded-2xl border border-neutral-800/60 overflow-hidden select-none shadow-2xl bg-neutral-900 group/map"
            id="gallery-minimap-overlay"
          >
            {/* Real MapLibre GL Interactive Map Container */}
            <div 
              ref={miniMapContainerRef}
              className="w-full h-full"
            />

            {/* Hover overlay with Fullscreen / Maximize button */}
            <div 
              className="absolute inset-0 bg-black/0 hover:bg-black/35 transition-colors duration-300 flex items-center justify-center cursor-pointer"
              onClick={onClose}
              title="Go to full screen map"
            >
              <div className="opacity-0 group-hover/map:opacity-100 transform translate-y-2 group-hover/map:translate-y-0 transition-all duration-300 w-10 h-10 rounded-full bg-neutral-900/90 text-white flex items-center justify-center border border-neutral-700 shadow-xl backdrop-blur-md hover:scale-110 active:scale-95">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
              
              {/* Coordinates overlay always visible in bottom left */}
              <div className="absolute bottom-1.5 left-2 bg-neutral-950/85 border border-neutral-800/80 backdrop-blur-xs px-2 py-0.5 rounded-lg text-[7.5px] font-mono text-neutral-400 flex flex-col z-10 leading-none group-hover/map:opacity-0 transition-opacity duration-300">
                <span className="font-semibold text-neutral-200">LAT: {property.latitude.toFixed(4)}</span>
                <span className="mt-0.5">LNG: {property.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom thumbnail strip adaptation */}
        <div 
          className="flex md:hidden w-full bg-neutral-900 border-t border-neutral-800/80 py-3 px-4 overflow-x-auto no-scrollbar shrink-0 space-x-3.5 z-30"
          id="mobile-thumbnails-row"
        >
          {mediaItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`relative w-20 h-15 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer focus:outline-none ${
                  isSelected
                    ? 'border-brand-green ring-2 ring-brand-green/30 scale-95'
                    : 'border-transparent active:scale-95'
                }`}
                id={`mobile-thumbnail-${item.id}`}
              >
                <img
                  src={item.thumbnailUrl}
                  alt="Property Thumbnail"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-brand-green text-white flex items-center justify-center border border-white/5 shadow-md">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RIGHT PANEL: Sidebar with list of thumbnails (Desktop only) */}
      <div 
        className="hidden md:flex md:w-[320px] lg:w-[480px] shrink-0 bg-white border-l border-neutral-200 flex-col h-full overflow-hidden text-neutral-800"
        id="desktop-gallery-sidebar"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200" id="desktop-gallery-header">
          <div className="flex items-center space-x-3 truncate">
            <button
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-all cursor-pointer focus:outline-none"
              title="Back to property details"
              id="btn-desktop-gallery-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-sm tracking-tight text-neutral-900 truncate max-w-[280px]" id="desktop-gallery-title">
              {property.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-all cursor-pointer focus:outline-none"
            title="Close viewer"
            id="btn-desktop-gallery-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-neutral-200 px-5 bg-white shrink-0" id="desktop-gallery-tabs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-1 py-3 text-sm font-semibold tracking-wide text-center border-b-2 transition-all relative cursor-pointer focus:outline-none ${
              activeCategory === 'all'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
            id="btn-desktop-tab-all"
          >
            All
          </button>
          <button
            onClick={() => {
              setActiveCategory('videos');
              const firstVideo = mediaItems.find(item => item.type === 'video');
              if (firstVideo) setSelectedItemId(firstVideo.id);
            }}
            className={`flex-1 py-3 text-sm font-semibold tracking-wide text-center border-b-2 transition-all relative cursor-pointer focus:outline-none ${
              activeCategory === 'videos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
            id="btn-desktop-tab-videos"
          >
            Videos
          </button>
        </div>

        {/* Scrollable vertical list of thumbnails (one-by-one list) */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-neutral-50" id="desktop-thumbnail-container">
          <div className="flex flex-col space-y-4">
            {filteredItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`relative w-full aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group focus:outline-none ${
                    isSelected
                      ? 'border-emerald-600 ring-4 ring-emerald-600/15 scale-[0.98]'
                      : 'border-transparent hover:border-neutral-300 hover:scale-[1.01]'
                  }`}
                  id={`thumbnail-${item.id}`}
                >
                  <img
                    src={item.thumbnailUrl}
                    alt="Property Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {item.type === 'video' ? (
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border border-white/10 transition-transform group-hover:scale-110">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-0.5 rounded-md text-[9px] font-mono tracking-wider backdrop-blur-xs border border-white/10 text-neutral-200">
                      PHOTO {mediaItems.indexOf(item) + 1}
                    </div>
                  )}
                  {/* Selected Indicator Checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border border-white/20 shadow-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-400">
              No media items in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
