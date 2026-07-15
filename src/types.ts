export type MapStyleId = 'standard' | 'dark' | 'satellite';

export interface MapStyleOption {
  id: MapStyleId;
  name: string;
  url: string;
  thumbnail: string;
}

export interface SearchResultStub {
  id: string;
  name: string;
  type: string;
  coords: [number, number];
}

export type PropertyType = 'flat' | 'land' | 'resort' | 'tea_estate';
export type PropertyStatus = 'available' | 'booked' | 'sold';

export interface DocumentInfo {
  name: string;
  url: string;
  isPublic: boolean;
}

export interface Property {
  id: string;
  type: PropertyType;
  title: string;
  description: string;
  price: number;
  locality: string;
  latitude: number;
  longitude: number;
  plotAreaSqft?: number;
  builtUpAreaSqft?: number;
  bhk?: number;
  floorNumber?: number;
  amenities: string[];
  images: string[];
  documents: DocumentInfo[];
  status: PropertyStatus;
  distanceFromTownKm: number;
  pinCategory: PropertyType;
  pinIcon: string;
  videoUrl?: string;
  is_published?: boolean;
}
