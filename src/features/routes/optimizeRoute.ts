// Route optimization utility for vending operations
export interface Stop {
  id: string;
  lat: number;
  lng: number;
  windowStart?: string;
  windowEnd?: string;
  priority?: number;
  estimatedDuration?: number; // minutes
}

export interface OptimizedRoute {
  stops: Stop[];
  totalDistance: number;
  estimatedTime: number; // minutes
}

export function optimizeRoute(
  stops: Stop[], 
  startLat: number, 
  startLng: number
): OptimizedRoute {
  if (stops.length === 0) {
    return { stops: [], totalDistance: 0, estimatedTime: 0 };
  }

  const remaining = [...stops];
  const ordered: Stop[] = [];
  let currentPos = { lat: startLat, lng: startLng };
  let totalDistance = 0;
  let totalTime = 0;

  // Simple nearest neighbor algorithm with time window consideration
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const stop = remaining[i];
      const distance = calculateDistance(
        currentPos.lat, 
        currentPos.lng, 
        stop.lat, 
        stop.lng
      );
      
      // Factor in priority (lower number = higher priority)
      const priorityWeight = (stop.priority || 5) * 0.1;
      const score = distance + priorityWeight;
      
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const nextStop = remaining.splice(bestIdx, 1)[0];
    const distance = calculateDistance(
      currentPos.lat, 
      currentPos.lng, 
      nextStop.lat, 
      nextStop.lng
    );
    
    totalDistance += distance;
    totalTime += estimateTimeForDistance(distance);
    totalTime += nextStop.estimatedDuration || 15; // Default 15 min per stop
    
    ordered.push(nextStop);
    currentPos = { lat: nextStop.lat, lng: nextStop.lng };
  }

  return {
    stops: ordered,
    totalDistance,
    estimatedTime: totalTime
  };
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for calculating distance between two points
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function estimateTimeForDistance(miles: number): number {
  // Estimate time based on average city driving speed (25 mph)
  return (miles / 25) * 60; // Convert to minutes
}

export function validateTimeWindows(stops: Stop[]): string[] {
  const warnings: string[] = [];
  
  stops.forEach((stop, index) => {
    if (stop.windowStart && stop.windowEnd) {
      const start = new Date(`2000-01-01 ${stop.windowStart}`);
      const end = new Date(`2000-01-01 ${stop.windowEnd}`);
      
      if (start >= end) {
        warnings.push(`Stop ${index + 1}: Invalid time window (start >= end)`);
      }
    }
  });
  
  return warnings;
}