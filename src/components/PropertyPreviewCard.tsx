import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Bookmark,
  Maximize2
} from 'lucide-react';
import { Property } from '../types';

interface PropertyPreviewCardProps {
  property: Property | null;
  onClose: () => void;
  onViewDetails?: (id: string) => void;
  isMobile?: boolean;
  savedPropertyIds: string[];
  onToggleSave: (propertyId: string) => void;
}

export default function PropertyPreviewCard({
  property,
  onClose,
  onViewDetails,
  isMobile = false,
  savedPropertyIds,
  onToggleSave
}: PropertyPreviewCardProps) {
  const isSaved = property ? savedPropertyIds.includes(property.id) : false;

  if (!property) return null;

  // Format currency with Indian styling (e.g., ₹85,00,000)
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get category specifics
  const getCategoryDetails = (type: string) => {
    switch (type) {
      case 'land':
        return {
          label: 'Land Plot',
          accentColor: '#8C6239',
          statusAvailableClass: 'text-amber-700',
          bulletColorClass: 'bg-amber-600',
        };
      case 'resort':
        return {
          label: 'Hospitality Resort',
          accentColor: '#C97B4A',
          statusAvailableClass: 'text-brand-terracotta',
          bulletColorClass: 'bg-brand-terracotta',
        };
      case 'tea_estate':
        return {
          label: 'Tea Garden Estate',
          accentColor: '#2D5A3D',
          statusAvailableClass: 'text-emerald-700',
          bulletColorClass: 'bg-emerald-600',
        };
      default:
        return {
          label: 'Property',
          accentColor: '#222222',
          statusAvailableClass: 'text-neutral-700',
          bulletColorClass: 'bg-neutral-600',
        };
    }
  };

  const cat = getCategoryDetails(property.type);

  // Area label based on type
  const areaLabel = property.type === 'land' || property.type === 'tea_estate'
    ? `${property.plotAreaSqft?.toLocaleString('en-IN')} sq.ft. Plot`
    : `${property.builtUpAreaSqft?.toLocaleString('en-IN')} sq.ft. Built`;

  // Status configuration
  const isAvailable = property.status === 'available';
  const statusBulletColor = isAvailable ? cat.bulletColorClass : 'bg-neutral-400';
  const statusTextClass = isAvailable ? cat.statusAvailableClass : 'text-neutral-500';
  const statusText = isAvailable ? 'Available now' : (property.status === 'sold' ? 'Sold' : 'Booked');

  // Handle wishlist toggle
  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property) {
      onToggleSave(property.id);
    }
  };

  // Gallery list construction (Ensure there's a second image to peek and scroll to)
  const imagesList = [...property.images];
  if (imagesList.length === 1) {
    const secondImage = property.images[0].includes('random=')
      ? property.images[0].replace(/random=(\d+)/, (_, num) => `random=${parseInt(num) + 50}`)
      : `${property.images[0]}&random=2`;
    imagesList.push(secondImage);
  }

  // Animation variants
  const variants = {
    hidden: { 
      opacity: 0, 
      y: isMobile ? 80 : 15,
      scale: isMobile ? 1 : 0.96 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', damping: 28, stiffness: 220 }
    },
    exit: { 
      opacity: 0, 
      y: isMobile ? 80 : 15, 
      scale: isMobile ? 1 : 0.96,
      transition: { duration: 0.18, ease: 'easeIn' }
    }
  };

  const cardContent = (
    <div className="flex flex-col h-full bg-white text-brand-charcoal overflow-hidden" id={`detail-card-inner-${property.id}`}>
      {/* 1. TOP: Swipeable Photo Header Section - Fully Flush to edges */}
      <div className="relative w-full h-[140px] overflow-hidden shrink-0" id="photo-header-section">
        {/* Close Button floating over photo */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-white/90 text-neutral-800 hover:bg-white hover:text-black border border-gray-100 shadow-md active:scale-90 transition-all cursor-pointer focus:outline-none"
          aria-label="Close details"
          id={`btn-close-detail-${property.id}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Swipeable Carousel */}
        <div 
          className="flex space-x-2 overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full" 
          id="detail-card-gallery"
        >
          {imagesList.map((imgUrl, idx) => (
            <div 
              key={`preview-image-${property.id}-${idx}`}
              className="w-[88%] shrink-0 snap-center h-full relative group/img bg-gray-50 border-r border-white/20 last:border-0"
            >
              <img
                src={imgUrl}
                alt={`${property.title} - View ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover aspect-[16/9] select-none"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Carousel indicator tooltip */}
        <div className="absolute bottom-1.5 left-2 bg-black/60 text-white text-[8px] font-medium px-1.5 py-0.5 rounded backdrop-blur-[2px] pointer-events-none select-none">
          Swipe photos
        </div>
      </div>

      {/* 2. Content Panel - Tight Padding */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 sm:space-x-2">
          {/* Left content column */}
          <div className="space-y-1 flex-1 min-w-0">
            {/* Title */}
            <h4 className="font-display font-extrabold text-[14px] text-brand-charcoal tracking-tight leading-tight truncate">
              {property.title}
            </h4>
            
            {/* Category Subtitle */}
            <div className="text-[10px] text-neutral-400 font-semibold leading-none">
              {cat.label} • {areaLabel}
            </div>

            {/* Price row */}
            <div className="text-[14px] font-display font-black text-brand-green tracking-tight pt-0.5">
              {formatINR(property.price)}
            </div>

            {/* Status Line */}
            <div className="text-[10px] font-bold flex items-center space-x-1.5 pt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusBulletColor}`} />
              <span className={statusTextClass}>{statusText}</span>
            </div>

            {/* Locality & Distance */}
            <div className="text-[10px] text-neutral-500 flex items-center space-x-1 pt-0.5">
              <MapPin className="w-3 h-3 text-brand-terracotta shrink-0" />
              <span className="truncate">{property.locality} • {property.distanceFromTownKm} km</span>
            </div>
          </div>

          {/* Right Actions column */}
          <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0.5">
            {/* Directions Button */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none h-8 rounded-full sm:w-8 bg-emerald-50 text-brand-green border border-emerald-100/50 hover:bg-emerald-100 hover:text-emerald-900 active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer pointer-events-auto px-3 sm:px-0 gap-1.5"
              title="Directions"
              id={`btn-directions-${property.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation className="w-3.5 h-3.5 fill-current rotate-45 translate-x-[0.5px] -translate-y-[0.5px]" />
              <span className="text-[10px] font-bold sm:hidden">Directions</span>
            </a>

            {/* Save / Bookmark Button */}
            <button
              onClick={handleToggleSave}
              className={`flex-1 sm:flex-none h-8 rounded-full sm:w-8 border active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer pointer-events-auto px-3 sm:px-0 gap-1.5 ${
                isSaved 
                  ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100' 
                  : 'bg-neutral-50 text-neutral-400 border-neutral-200/60 hover:bg-neutral-100'
              }`}
              title={isSaved ? 'Saved' : 'Save'}
              id={`btn-bookmark-${property.id}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold sm:hidden">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* 3. Primary Full-width CTA Button */}
        <button
          onClick={() => onViewDetails && onViewDetails(property.id)}
          className="w-full mt-3 py-2 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl text-[11px] font-display font-extrabold active:scale-[0.98] transition-all flex items-center justify-center space-x-1 shadow-md shadow-brand-green/10 cursor-pointer focus:outline-none pointer-events-auto"
          id={`btn-full-details-${property.id}`}
        >
          <span>View Full Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // If in mobile mode, render as a clean bottom drawer
  if (isMobile) {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed bottom-4 left-2 right-2 mx-auto w-[calc(100%-16px)] max-w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-40 pointer-events-auto flex flex-col font-sans isolate"
        id={`preview-card-mobile-${property.id}`}
      >
        {cardContent}
      </motion.div>
    );
  }

  // Desktop Card is rendered as popup content (MapContainer handles placing it inside the MapLibre Portal)
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col font-sans isolate"
      id={`preview-card-desktop-${property.id}`}
    >
      {cardContent}
    </motion.div>
  );
}
