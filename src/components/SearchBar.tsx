import React from 'react';
import { Menu, Search, X, Eye, Navigation, MapPin, Loader2 } from 'lucide-react';
import { Property } from '../types';

interface SearchBarProps {
  onOpenSidebar: () => void;
  onSearchFocus?: () => void;
  className?: string;
  properties: Property[];
  onSelectProperty: (property: Property | null) => void;
  onHoverProperty: (propertyId: string | null) => void;
  mapInstance: any;
}

export default function SearchBar({
  onOpenSidebar,
  onSearchFocus,
  className = '',
  properties,
  onSelectProperty,
  onHoverProperty,
  mapInstance
}: SearchBarProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState('');
  const [propertyResults, setPropertyResults] = React.useState<Property[]>([]);
  const [nominatimResults, setNominatimResults] = React.useState<any[]>([]);
  const [isLoadingNominatim, setIsLoadingNominatim] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounce input typing (~250ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(inputValue);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handle filtering and fetching
  React.useEffect(() => {
    const query = debouncedSearchValue.toLowerCase().trim();
    if (!query) {
      setPropertyResults([]);
      setNominatimResults([]);
      setIsDropdownOpen(false);
      return;
    }

    // Match properties by title, locality, and type/category
    const matchedProps = properties.filter((p) => {
      const matchesTitle = p.title.toLowerCase().includes(query);
      const matchesLocality = p.locality.toLowerCase().includes(query);
      
      // Match category terms generously
      const matchesCategory = p.type.toLowerCase().includes(query) || 
                            (p.type === 'tea_estate' && ('tea'.includes(query) || 'estate'.includes(query) || 'garden'.includes(query))) ||
                            (p.type === 'land' && ('plot'.includes(query) || 'open'.includes(query) || 'vacant'.includes(query))) ||
                            (p.type === 'resort' && ('hotel'.includes(query) || 'stay'.includes(query) || 'cottage'.includes(query) || 'resort'.includes(query)));
      return matchesTitle || matchesLocality || matchesCategory;
    });

    setPropertyResults(matchedProps);
    setIsDropdownOpen(true);

    if (matchedProps.length === 0) {
      // Trigger Nominatim search fallback restricted to Ooty region bounds
      setIsLoadingNominatim(true);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Ooty')}&format=json&limit=4&viewbox=75.90,10.95,77.50,11.95&bounded=1`;
      
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setNominatimResults(data || []);
          setIsLoadingNominatim(false);
        })
        .catch((err) => {
          console.error('Nominatim fetch failed:', err);
          setIsLoadingNominatim(false);
        });
    } else {
      setNominatimResults([]);
      setIsLoadingNominatim(false);
    }
  }, [debouncedSearchValue, properties]);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setInputValue('');
    setDebouncedSearchValue('');
    setPropertyResults([]);
    setNominatimResults([]);
    setIsDropdownOpen(false);
    onHoverProperty(null);
  };

  const handleFocus = () => {
    if (onSearchFocus) onSearchFocus();
    if (inputValue.trim()) {
      setIsDropdownOpen(true);
    }
  };

  const formatPlaceName = (displayName: string) => {
    const parts = displayName.split(',');
    if (parts.length <= 2) return displayName;
    return parts.slice(0, 3).join(',').trim();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-center w-full max-w-md bg-white rounded-full shadow-lg border border-gray-100 px-4 py-2.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green group ${className}`}
      id="search-bar-container"
    >
      {/* Menu / Hamburger Icon */}
      <button
        onClick={onOpenSidebar}
        className="p-1.5 rounded-full text-brand-charcoal hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer mr-2 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        title="Open menu"
        aria-label="Open menu"
        id="btn-menu-toggle"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Input Field */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        placeholder="Search in Ooty (e.g. 'tea', 'resort', 'land')..."
        className="flex-1 bg-transparent border-none text-brand-charcoal text-sm focus:outline-none placeholder-gray-400 font-sans"
        id="search-input"
      />

      {/* Action Icons */}
      <div className="flex items-center space-x-1.5 ml-2">
        {inputValue && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer focus:outline-none"
            title="Clear search"
            aria-label="Clear search"
            id="btn-search-clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="w-[1px] h-5 bg-gray-200 self-center mx-1" />
        <button
          className="p-1.5 rounded-full text-brand-green hover:bg-brand-green/5 active:bg-brand-green/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          title="Search"
          aria-label="Search"
          id="btn-search-submit"
        >
          <Search className="w-5 h-5 transition-transform duration-300 group-focus-within:scale-105" />
        </button>
      </div>

      {/* Results Dropdown Panel */}
      {isDropdownOpen && (
        <div 
          className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-40 flex flex-col font-sans pointer-events-auto max-h-[380px]"
          id="search-results-dropdown"
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 select-none">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Results</span>
            {propertyResults.length > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">
                {propertyResults.length} properties found
              </span>
            )}
          </div>

          <div className="overflow-y-auto no-scrollbar flex-1 divide-y divide-gray-100">
            {/* Local properties search results */}
            {propertyResults.map((property) => {
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
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-neutral-50 transition-colors group cursor-pointer gap-2 sm:gap-0"
                  onMouseEnter={() => onHoverProperty(property.id)}
                  onMouseLeave={() => onHoverProperty(null)}
                  onClick={() => {
                    onSelectProperty(property);
                    setIsDropdownOpen(false);
                  }}
                  id={`search-row-${property.id}`}
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

                  {/* Right Column: Price & Interactive Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto pl-5 sm:pl-0 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-xs font-mono font-bold text-neutral-800 pr-1">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      }).format(property.price)}
                    </span>

                    {/* View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProperty(property);
                        setIsDropdownOpen(false);
                      }}
                      className="w-8 h-8 rounded-full bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-black active:scale-95 transition-all flex items-center justify-center border border-gray-100 shadow-sm cursor-pointer"
                      title="View details"
                      id={`btn-search-row-view-${property.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Directions Button */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-emerald-50 text-brand-green border border-emerald-100/50 hover:bg-emerald-100 hover:text-emerald-900 active:scale-95 transition-all flex items-center justify-center shadow-sm cursor-pointer"
                      title="Directions"
                      id={`btn-search-row-dir-${property.id}`}
                    >
                      <Navigation className="w-3.5 h-3.5 fill-current rotate-45 translate-x-[0.5px] -translate-y-[0.5px]" />
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Nominatim Regional Places Searching Spinner */}
            {isLoadingNominatim && (
              <div className="p-6 flex flex-col items-center justify-center space-y-2 text-neutral-400 select-none">
                <Loader2 className="w-5 h-5 animate-spin text-brand-green" />
                <span className="text-xs font-semibold">Sourcing area locations...</span>
              </div>
            )}

            {/* Nominatim Fallback (Other places) */}
            {!isLoadingNominatim && nominatimResults.length > 0 && (
              <div className="bg-neutral-50/50 pb-2">
                <div className="px-5 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-y border-neutral-100 bg-neutral-100/30 select-none">
                  Other places
                </div>
                {nominatimResults.map((result, idx) => (
                  <div
                    key={`nominatim-${result.place_id || 'unassigned'}-${idx}`}
                    className="px-5 py-3 flex items-center justify-between hover:bg-neutral-100/70 transition-colors cursor-pointer"
                    onClick={() => {
                      if (mapInstance) {
                        mapInstance.flyTo({
                          center: [parseFloat(result.lon), parseFloat(result.lat)],
                          zoom: 13.8,
                          duration: 1200,
                          essential: true
                        });
                      }
                      setIsDropdownOpen(false);
                    }}
                    id={`search-row-nominatim-${idx}`}
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0 pr-3">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-1 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-sans font-bold text-xs text-neutral-700 leading-tight truncate">
                          {formatPlaceName(result.display_name)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium truncate">
                          {result.type ? result.type.replace('_', ' ') : 'Locality'} • Nilgiris District
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-brand-green font-mono font-bold shrink-0 bg-white border border-neutral-200/50 px-2 py-0.5 rounded shadow-xs select-none">
                      Locality
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results found at all */}
            {debouncedSearchValue && propertyResults.length === 0 && !isLoadingNominatim && nominatimResults.length === 0 && (
              <div className="p-8 text-center text-neutral-400 select-none animate-fadeIn" id="search-no-results">
                <Search className="w-6 h-6 mx-auto mb-2 text-neutral-300" />
                <p className="text-xs font-semibold">No properties or places found</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Try typing 'tea', 'resort', or 'land'</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
