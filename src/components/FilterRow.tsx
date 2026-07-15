import React from 'react';
import { Leaf, MapPin, Home, Layers, Building2 } from 'lucide-react';
import { PropertyType } from '../types';

interface FilterRowProps {
  selectedCategory: 'all' | PropertyType;
  onSelectCategory: (category: 'all' | PropertyType) => void;
  className?: string;
}

export default function FilterRow({
  selectedCategory,
  onSelectCategory,
  className = ''
}: FilterRowProps) {
  const filters: { id: 'all' | PropertyType; label: string; icon: any; colorClass: string; activeBg: string }[] = [
    {
      id: 'all',
      label: 'All Listings',
      icon: Layers,
      colorClass: 'text-brand-green',
      activeBg: 'bg-brand-green text-white shadow-brand-green/20'
    },
    {
      id: 'flat',
      label: 'Flats',
      icon: Building2,
      colorClass: 'text-blue-700',
      activeBg: 'bg-blue-700 text-white shadow-blue-700/20'
    },
    {
      id: 'land',
      label: 'Land / Plots',
      icon: MapPin,
      colorClass: 'text-amber-700',
      activeBg: 'bg-amber-700 text-white shadow-amber-700/20'
    },
    {
      id: 'resort',
      label: 'Resorts',
      icon: Home,
      colorClass: 'text-brand-terracotta',
      activeBg: 'bg-brand-terracotta text-white shadow-brand-terracotta/20'
    },
    {
      id: 'tea_estate',
      label: 'Tea Estates',
      icon: Leaf,
      colorClass: 'text-emerald-700',
      activeBg: 'bg-emerald-700 text-white shadow-emerald-700/20'
    }
  ];

  return (
    <div 
      className={`flex items-center space-x-2 py-1 overflow-x-auto no-scrollbar max-w-full pointer-events-auto ${className}`}
      id="filter-row-scroller"
    >
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = selectedCategory === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onSelectCategory(filter.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-display font-semibold border shadow-md transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-green/40 ${
              isActive
                ? `${filter.activeBg} border-transparent scale-102`
                : 'bg-white text-brand-charcoal border-gray-100 hover:bg-gray-50 hover:border-gray-200'
            }`}
            title={`Show ${filter.label}`}
            id={`filter-chip-${filter.id}`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : filter.colorClass}`} />
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}
