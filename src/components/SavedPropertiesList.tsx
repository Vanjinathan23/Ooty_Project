import React from 'react';
import { X, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { Property } from '../types';
import mockProperties from '../ooty-mock-properties.json';

interface SavedPropertiesListProps {
  isOpen: boolean;
  onClose: () => void;
  savedPropertyIds: string[];
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onToggleSave: (propertyId: string) => void;
}

export default function SavedPropertiesList({
  isOpen,
  onClose,
  savedPropertyIds,
  properties,
  onSelectProperty,
  onToggleSave
}: SavedPropertiesListProps) {
  if (!isOpen) return null;

  // Filter properties based on saved IDs
  const savedProperties = properties.filter((p) =>
    savedPropertyIds.includes(p.id)
  );

  return (
    <div 
      className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs pointer-events-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slideLeft pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        id="saved-properties-panel"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer mr-1"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Heart className="w-5 h-5 text-brand-green fill-current" />
            <h3 className="text-base font-display font-black text-brand-charcoal">
              My Saved Properties
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
            id="close-saved-properties"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-neutral-100 px-2">
          {savedProperties.length > 0 ? (
            savedProperties.map((property) => {
              const isAvailable = property.status === 'available';
              const statusText = isAvailable ? 'Available now' : (property.status === 'sold' ? 'Sold' : 'Booked');
              
              let dotColor = 'bg-amber-600';
              let labelText = 'Land Plot';
              let statusTextClass = 'text-amber-700';
              
              if (property.type === 'tea_estate') {
                dotColor = 'bg-emerald-600';
                labelText = 'Tea Garden Estate';
                statusTextClass = 'text-emerald-700';
              } else if (property.type === 'resort') {
                dotColor = 'bg-brand-terracotta';
                labelText = 'Hospitality Resort';
                statusTextClass = 'text-brand-terracotta';
              }

              return (
                <div
                  key={property.id}
                  className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-neutral-50 rounded-2xl transition-all group cursor-pointer gap-2 sm:gap-0"
                  onClick={() => {
                    onSelectProperty(property);
                    onClose();
                  }}
                  id={`saved-row-${property.id}`}
                >
                  {/* Left Column: Color Dot + Content */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0 pr-0 sm:pr-3">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                    
                    <div className="flex flex-col space-y-0.5 min-w-0">
                      <h5 className="font-sans font-bold text-sm text-brand-charcoal leading-tight truncate group-hover:text-brand-green transition-colors">
                        {property.title}
                      </h5>
                      <span className="text-[11px] text-neutral-400 font-medium leading-none">
                        {labelText} • {property.locality}
                      </span>
                      <span className={`text-[10px] font-bold pt-0.5 ${statusTextClass}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Price & Unsave Button & Chevron */}
                  <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto pl-6 sm:pl-0 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0">
                    <span className="text-xs font-mono font-bold text-neutral-800 pr-1">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      }).format(property.price)}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(property.id);
                      }}
                      className="p-1.5 rounded-full bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-colors group/btn"
                      title="Remove from saved properties"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-400 select-none">
              <Heart className="w-12 h-12 text-neutral-200 mb-3" />
              <p className="text-sm font-semibold">No saved properties yet</p>
              <p className="text-xs text-neutral-400 mt-1">Properties you bookmark will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
