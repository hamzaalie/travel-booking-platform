/**
 * Multi-City Flight Search Types
 * Comprehensive type definitions for complex flight itineraries
 */

export interface FlightSegment {
  id: string;
  origin: string; // IATA code (e.g., "LAX")
  destination: string; // IATA code (e.g., "JFK")
  departureDate: string; // ISO date string (YYYY-MM-DD)
  originCity?: string; // Full city name for display
  destinationCity?: string; // Full city name for display
}

export interface MultiCitySearchParams {
  segments: FlightSegment[];
  adults: number;
  children?: number;
  infants?: number;
  travelClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  flexibleDates?: boolean; // ±3 days per segment
  directFlightsOnly?: boolean;
  maxStops?: number;
  preferredAirlines?: string[];
  excludedAirlines?: string[];
}

export interface FlightSegmentResult {
  segmentIndex: number; // Which segment of the multi-city itinerary
  departure: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO datetime
  };
  carrierCode: string; // Airline code (e.g., "AA")
  carrierName: string; // Airline name (e.g., "American Airlines")
  number: string; // Flight number
  aircraft?: {
    code: string;
    name?: string;
  };
  duration: string; // ISO 8601 duration (e.g., "PT2H30M")
  stops: number;
  operatingCarrier?: string;
}

export interface MultiCityFlightOffer {
  id: string;
  segments: FlightSegmentResult[][]; // Array of segments, each segment can have multiple flights (layovers)
  price: {
    currency: string;
    total: number;
    base: number;
    fees: number;
    taxes: number;
    perPassenger: {
      adult: number;
      child?: number;
      infant?: number;
    };
  };
  fareDetails: {
    cabinClass: string;
    fareBasis: string;
    fareFamily?: string;
    includedCheckedBags?: number;
    includedCabinBags?: number;
    refundable: boolean;
    changeable: boolean;
    changeFee?: number;
  };
  totalDuration: string; // Total journey time including layovers
  validatingAirline: string;
  bookingClass: string;
  availableSeats?: number;
  lastTicketingDate?: string;
}

export interface MultiCitySearchResponse {
  searchId: string;
  segments: FlightSegment[]; // Original search segments
  offers: MultiCityFlightOffer[];
  meta: {
    count: number;
    currency: string;
    searchedAt: string;
  };
}

export interface FlightValidationError {
  segmentIndex: number;
  field: 'origin' | 'destination' | 'departureDate';
  message: string;
}

export interface MultiCityValidationResult {
  isValid: boolean;
  errors: FlightValidationError[];
  warnings?: string[];
}

/**
 * Helper: Check if route is circular (returns to starting point before end)
 */
export function hasCircularRoute(segments: FlightSegment[]): boolean {
  if (segments.length < 3) return false;
  
  const visitedCities = new Set<string>();
  for (let i = 0; i < segments.length - 1; i++) {
    if (visitedCities.has(segments[i].destination)) {
      return true; // Circular route detected
    }
    visitedCities.add(segments[i].origin);
    visitedCities.add(segments[i].destination);
  }
  return false;
}

/**
 * Helper: Validate date sequence (each segment date must be after previous)
 */
export function hasValidDateSequence(segments: FlightSegment[]): boolean {
  for (let i = 1; i < segments.length; i++) {
    const prevDate = new Date(segments[i - 1].departureDate);
    const currentDate = new Date(segments[i].departureDate);
    
    if (currentDate <= prevDate) {
      return false; // Current date must be after previous
    }
  }
  return true;
}

/**
 * Helper: Validate segment connection (destination of segment N must match origin of segment N+1)
 */
export function hasValidSegmentConnections(segments: FlightSegment[]): boolean {
  for (let i = 1; i < segments.length; i++) {
    if (segments[i - 1].destination !== segments[i].origin) {
      return false; // Segments must connect
    }
  }
  return true;
}

/**
 * Helper: Validate all multi-city search parameters
 */
export function validateMultiCitySearch(params: MultiCitySearchParams): MultiCityValidationResult {
  const errors: FlightValidationError[] = [];
  const warnings: string[] = [];

  // Minimum 2 segments required
  if (params.segments.length < 2) {
    return {
      isValid: false,
      errors: [{ segmentIndex: 0, field: 'origin', message: 'Multi-city search requires at least 2 segments' }],
    };
  }

  // Maximum 6 segments
  if (params.segments.length > 6) {
    return {
      isValid: false,
      errors: [{ segmentIndex: 0, field: 'origin', message: 'Multi-city search supports maximum 6 segments' }],
    };
  }

  // Validate each segment
  params.segments.forEach((segment, index) => {
    if (!segment.origin || segment.origin.length !== 3) {
      errors.push({
        segmentIndex: index,
        field: 'origin',
        message: 'Valid IATA code required (e.g., LAX)',
      });
    }

    if (!segment.destination || segment.destination.length !== 3) {
      errors.push({
        segmentIndex: index,
        field: 'destination',
        message: 'Valid IATA code required (e.g., JFK)',
      });
    }

    if (segment.origin === segment.destination) {
      errors.push({
        segmentIndex: index,
        field: 'destination',
        message: 'Origin and destination cannot be the same',
      });
    }

    if (!segment.departureDate) {
      errors.push({
        segmentIndex: index,
        field: 'departureDate',
        message: 'Departure date is required',
      });
    } else {
      const date = new Date(segment.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        errors.push({
          segmentIndex: index,
          field: 'departureDate',
          message: 'Departure date cannot be in the past',
        });
      }

      // Warn if date is more than 330 days in future (common booking limit)
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 330);
      if (date > maxDate) {
        warnings.push(`Segment ${index + 1}: Date is more than 330 days in future. Availability may be limited.`);
      }
    }
  });

  // Validate date sequence
  if (!hasValidDateSequence(params.segments)) {
    errors.push({
      segmentIndex: 1,
      field: 'departureDate',
      message: 'Each segment must depart after the previous segment',
    });
  }

  // Check for circular routes
  if (hasCircularRoute(params.segments)) {
    warnings.push('Circular route detected. Consider breaking this into separate bookings for better pricing.');
  }

  // Validate passenger counts
  if (params.adults < 1 || params.adults > 9) {
    errors.push({
      segmentIndex: 0,
      field: 'origin',
      message: 'Adult passengers must be between 1 and 9',
    });
  }

  if (params.children && params.children > 8) {
    errors.push({
      segmentIndex: 0,
      field: 'origin',
      message: 'Maximum 8 children allowed',
    });
  }

  if (params.infants && params.infants > params.adults) {
    errors.push({
      segmentIndex: 0,
      field: 'origin',
      message: 'Number of infants cannot exceed number of adults',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Helper: Calculate total journey duration across all segments
 */
export function calculateTotalDuration(offer: MultiCityFlightOffer): number {
  let totalMinutes = 0;
  
  offer.segments.forEach(segmentGroup => {
    segmentGroup.forEach(flight => {
      // Parse ISO 8601 duration (e.g., "PT2H30M")
      const match = flight.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (match) {
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        totalMinutes += hours * 60 + minutes;
      }
    });
  });
  
  return totalMinutes;
}

/**
 * Helper: Format duration in human-readable format
 */
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Helper: Get airline combinations for display
 */
export function getAirlineCombinations(offer: MultiCityFlightOffer): string[] {
  const airlines = new Set<string>();
  
  offer.segments.forEach(segmentGroup => {
    segmentGroup.forEach(flight => {
      airlines.add(flight.carrierName);
    });
  });
  
  return Array.from(airlines);
}

/**
 * Helper: Count total stops across entire journey
 */
export function getTotalStops(offer: MultiCityFlightOffer): number {
  let totalStops = 0;
  
  offer.segments.forEach(segmentGroup => {
    // Each segment group represents one leg of the journey
    // If it has multiple flights, those are layovers
    totalStops += segmentGroup.length - 1;
    
    // Add stops within each flight
    segmentGroup.forEach(flight => {
      totalStops += flight.stops;
    });
  });
  
  return totalStops;
}
