import React from 'react';
import { MapPin, Home, Leaf, Lock, Building2 } from 'lucide-react';
import { Property, PropertyType, PropertyStatus } from '../types';

interface CustomMarkerProps {
  property: Property;
  onClick: () => void;
  selectedPropertyId: string | null;
  hoveredPropertyId?: string | null;
  key?: React.Key;
}

export default function CustomMarker({
  property,
  onClick,
  selectedPropertyId,
  hoveredPropertyId = null
}: CustomMarkerProps) {
  // Individual Property Pin
  const isSelected = selectedPropertyId === property.id;
  const isHovered = hoveredPropertyId === property.id;
  const isSoldOrBooked = property.status === 'sold' || property.status === 'booked';

  // Get specific category styles for single pin
  const getPinConfig = (type: PropertyType) => {
    switch (type) {
      case 'flat':
        return {
          border: 'border-blue-700',
          color: '#1D4ED8',
          text: 'Flat'
        };
      case 'land':
        return {
          border: 'border-amber-800',
          color: '#8C6239',
          text: 'Land'
        };
      case 'resort':
        return {
          border: 'border-brand-terracotta',
          color: '#C97B4A',
          text: 'Resort'
        };
      case 'tea_estate':
        return {
          border: 'border-brand-green',
          color: '#2D5A3D',
          text: 'Tea'
        };
    }
  };

  const pin = getPinConfig(property.type);

  // Stagger index from property ID (e.g., "p5" -> index 5)
  const animDelay = parseInt(property.id.replace('p', '')) || 0;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        animationDelay: `${animDelay * 45}ms`,
        animationFillMode: 'both'
      }}
      className={`relative flex flex-col items-center justify-start h-[63px] w-12 animate-dropScaleIn pointer-events-auto cursor-pointer group ${
        isSoldOrBooked ? 'opacity-85' : ''
      } ${isHovered ? 'z-40' : ''}`}
      id={`property-marker-${property.id}`}
    >
      {/* Selection Glow Indicator */}
      {isSelected && (
        <div className="absolute top-1 w-12 h-12 rounded-full bg-brand-terracotta/20 border border-brand-terracotta/40 animate-ping pointer-events-none scale-125" />
      )}

      {/* Hover Pulsing Glow Ring around the pin */}
      {isHovered && (
        <div 
          className="absolute top-1 w-11 h-11 rounded-full border-2 animate-ping pointer-events-none scale-[1.35] z-0"
          style={{
            borderColor: pin.color,
            animationDuration: '1.8s'
          }}
        />
      )}

      {/* Teardrop Pin Shape (Rotated 45 degrees, pointed tip at bottom-center) */}
      <div 
        className={`w-11 h-11 rounded-full rounded-br-none rotate-45 overflow-hidden flex items-center justify-center bg-white shadow-lg transition-all duration-300 transform group-hover:scale-115 group-hover:-translate-y-1 ${
          isHovered
            ? 'scale-[1.2] -translate-y-2.5 border-[3px]'
            : isSelected 
              ? 'border-[3px] border-brand-terracotta scale-110 -translate-y-1 shadow-brand-terracotta/20 shadow-xl' 
              : `border-[2.5px] ${pin.border}`
        }`}
        style={isHovered ? { borderColor: pin.color, boxShadow: `0 10px 15px -3px ${pin.color}40, 0 4px 6px -4px ${pin.color}40` } : undefined}
      >
        {/* Inner Photo (Rotated -45 degrees to stand upright) */}
        <img
          src={property.images[0]}
          alt=""
          referrerPolicy="no-referrer"
          className="-rotate-45 w-[145%] h-[145%] max-w-none object-cover"
        />
      </div>

      {/* Sold/Booked Badge Overlay - placed absolute and upright (not rotated) */}
      {isSoldOrBooked && (
        <div 
          className="absolute -top-1 -right-2 bg-neutral-900 text-white border border-neutral-700 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-0.5 z-20"
          title={`${property.title} is ${property.status}`}
        >
          <Lock className="w-2.5 h-2.5 text-brand-terracotta shrink-0" />
          <span>{property.status === 'sold' ? 'Sold' : 'Book'}</span>
        </div>
      )}

    </div>
  );
}
