import ootyBoundary from '../ooty-boundary.json';
import { Property } from '../types';

/**
 * Checks if a coordinate [longitude, latitude] is inside the Ooty administrative boundary.
 * Uses the ray-casting algorithm to evaluate inclusion in the primary boundary polygon.
 */
export function isPointInOoty(lng: number, lat: number): boolean {
  try {
    const polygon = ootyBoundary.features[0].geometry.coordinates[0] as [number, number][];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  } catch (error) {
    console.error('Error in isPointInOoty boundary calculation:', error);
    return false;
  }
}


