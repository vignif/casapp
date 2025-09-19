import { Property } from "./types";

// Memoization cache for expensive calculations
const cache = new Map<string, any>();

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Clear cache after 5 minutes to prevent memory leaks
    setTimeout(() => cache.delete(key), 5 * 60 * 1000);
    
    return result;
  }) as T;
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Optimized property search
export function searchProperties(properties: Property[], query: string): Property[] {
  if (!query.trim()) return properties;
  
  const lowercaseQuery = query.toLowerCase();
  
  return properties.filter(property => 
    property.name.toLowerCase().includes(lowercaseQuery) ||
    property.address.toLowerCase().includes(lowercaseQuery) ||
    property.city.toLowerCase().includes(lowercaseQuery) ||
    property.country.toLowerCase().includes(lowercaseQuery) ||
    property.propertyType.toLowerCase().includes(lowercaseQuery) ||
    (property.tenant?.tenantName.toLowerCase().includes(lowercaseQuery)) ||
    (property.notes?.toLowerCase().includes(lowercaseQuery))
  );
}

// Optimized property sorting
export function sortProperties(properties: Property[], sortBy: string, direction: 'asc' | 'desc' = 'asc'): Property[] {
  const sorted = [...properties].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'value':
        aValue = a.value || 0;
        bValue = b.value || 0;
        break;
      case 'rent':
        aValue = a.tenant?.monthlyRent || 0;
        bValue = b.tenant?.monthlyRent || 0;
        break;
      case 'city':
        aValue = a.city;
        bValue = b.city;
        break;
      case 'type':
        aValue = a.propertyType;
        bValue = b.propertyType;
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return direction === 'asc' 
      ? aValue - bValue
      : bValue - aValue;
  });
  
  return sorted;
}
