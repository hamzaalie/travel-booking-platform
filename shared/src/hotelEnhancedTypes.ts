/**
 * Enhanced Hotel Types
 * Advanced filtering, amenities, and voucher generation
 */

// ============================================================================
// Advanced Hotel Filters
// ============================================================================

export interface HotelFilters {
  // Price range
  priceMin?: number;
  priceMax?: number;
  
  // Star rating
  starRatings?: number[]; // [3, 4, 5]
  
  // Guest rating
  guestRatingMin?: number; // 0-10
  
  // Property types
  propertyTypes?: PropertyType[];
  
  // Amenities
  amenities?: HotelAmenity[];
  
  // Meal plans
  mealPlans?: MealPlan[];
  
  // Accommodation types
  accommodationTypes?: AccommodationType[];
  
  // Accessibility features
  accessibilityFeatures?: AccessibilityFeature[];
  
  // Location preferences
  distanceFromCenter?: number; // km
  distanceFromAirport?: number; // km
  nearLandmarks?: string[];
  neighborhoods?: string[];
  
  // Room features
  roomAmenities?: RoomAmenity[];
  bedTypes?: BedType[];
  
  // Policies
  freeCancellation?: boolean;
  payAtProperty?: boolean;
  
  // Chain/Brand
  hotelChains?: string[];
  
  // Special offers
  dealsOnly?: boolean;
  lastMinuteDeals?: boolean;
}

export enum PropertyType {
  HOTEL = 'HOTEL',
  RESORT = 'RESORT',
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  GUEST_HOUSE = 'GUEST_HOUSE',
  HOSTEL = 'HOSTEL',
  BED_AND_BREAKFAST = 'BED_AND_BREAKFAST',
  BOUTIQUE = 'BOUTIQUE',
  CAPSULE = 'CAPSULE',
  MOTEL = 'MOTEL',
  RYOKAN = 'RYOKAN',
}

export enum HotelAmenity {
  // Essential
  FREE_WIFI = 'FREE_WIFI',
  FREE_PARKING = 'FREE_PARKING',
  AIRPORT_SHUTTLE = 'AIRPORT_SHUTTLE',
  
  // Recreation
  SWIMMING_POOL = 'SWIMMING_POOL',
  FITNESS_CENTER = 'FITNESS_CENTER',
  SPA = 'SPA',
  SAUNA = 'SAUNA',
  HOT_TUB = 'HOT_TUB',
  
  // Dining
  RESTAURANT = 'RESTAURANT',
  BAR = 'BAR',
  ROOM_SERVICE = 'ROOM_SERVICE',
  BREAKFAST_INCLUDED = 'BREAKFAST_INCLUDED',
  
  // Business
  BUSINESS_CENTER = 'BUSINESS_CENTER',
  MEETING_ROOMS = 'MEETING_ROOMS',
  
  // Family
  KIDS_CLUB = 'KIDS_CLUB',
  PLAYGROUND = 'PLAYGROUND',
  BABYSITTING = 'BABYSITTING',
  
  // Services
  CONCIERGE = 'CONCIERGE',
  LAUNDRY = 'LAUNDRY',
  DRY_CLEANING = 'DRY_CLEANING',
  CURRENCY_EXCHANGE = 'CURRENCY_EXCHANGE',
  TOUR_DESK = 'TOUR_DESK',
  
  // Entertainment
  CASINO = 'CASINO',
  NIGHTCLUB = 'NIGHTCLUB',
  GAME_ROOM = 'GAME_ROOM',
  
  // Pet-friendly
  PETS_ALLOWED = 'PETS_ALLOWED',
}

export enum MealPlan {
  ROOM_ONLY = 'ROOM_ONLY',
  BREAKFAST_INCLUDED = 'BREAKFAST_INCLUDED',
  HALF_BOARD = 'HALF_BOARD', // Breakfast + Dinner
  FULL_BOARD = 'FULL_BOARD', // All meals
  ALL_INCLUSIVE = 'ALL_INCLUSIVE', // All meals + drinks + activities
}

export enum AccommodationType {
  STANDARD_ROOM = 'STANDARD_ROOM',
  DELUXE_ROOM = 'DELUXE_ROOM',
  SUITE = 'SUITE',
  STUDIO = 'STUDIO',
  APARTMENT = 'APARTMENT',
  VILLA = 'VILLA',
  BUNGALOW = 'BUNGALOW',
  DORMITORY = 'DORMITORY',
}

export enum AccessibilityFeature {
  WHEELCHAIR_ACCESSIBLE = 'WHEELCHAIR_ACCESSIBLE',
  ELEVATOR = 'ELEVATOR',
  ACCESSIBLE_PARKING = 'ACCESSIBLE_PARKING',
  ACCESSIBLE_BATHROOM = 'ACCESSIBLE_BATHROOM',
  BRAILLE_SIGNAGE = 'BRAILLE_SIGNAGE',
  HEARING_ACCESSIBLE = 'HEARING_ACCESSIBLE',
}

export enum RoomAmenity {
  AIR_CONDITIONING = 'AIR_CONDITIONING',
  HEATING = 'HEATING',
  TV = 'TV',
  CABLE_TV = 'CABLE_TV',
  MINI_BAR = 'MINI_BAR',
  SAFE = 'SAFE',
  COFFEE_MAKER = 'COFFEE_MAKER',
  KETTLE = 'KETTLE',
  BALCONY = 'BALCONY',
  CITY_VIEW = 'CITY_VIEW',
  SEA_VIEW = 'SEA_VIEW',
  MOUNTAIN_VIEW = 'MOUNTAIN_VIEW',
  BATHTUB = 'BATHTUB',
  SHOWER = 'SHOWER',
  HAIRDRYER = 'HAIRDRYER',
  IRON = 'IRON',
  DESK = 'DESK',
  SOFA = 'SOFA',
  KITCHENETTE = 'KITCHENETTE',
}

export enum BedType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN = 'TWIN',
  SOFA_BED = 'SOFA_BED',
  BUNK_BED = 'BUNK_BED',
}

// ============================================================================
// Voucher Types
// ============================================================================

export interface HotelVoucher {
  // Booking information
  voucherId: string;
  bookingReference: string;
  confirmationNumber: string;
  
  // Hotel details
  hotel: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    starRating: number;
    imageUrl?: string;
    logoUrl?: string;
  };
  
  // Reservation details
  reservation: {
    checkInDate: Date;
    checkOutDate: Date;
    numberOfNights: number;
    roomType: string;
    mealPlan: MealPlan;
    numberOfRooms: number;
    numberOfGuests: {
      adults: number;
      children: number;
    };
  };
  
  // Guest details
  primaryGuest: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  
  // Pricing
  pricing: {
    roomRate: number;
    taxes: number;
    serviceFee: number;
    total: number;
    currency: string;
    paymentStatus: 'PAID' | 'PAY_AT_PROPERTY' | 'PENDING';
  };
  
  // Special requests
  specialRequests?: string[];
  
  // Cancellation policy
  cancellationPolicy: {
    freeCancellationUntil?: Date;
    cancellationFee?: number;
    refundable: boolean;
    terms: string;
  };
  
  // Important information
  importantInfo: {
    checkInTime: string;
    checkOutTime: string;
    childPolicy?: string;
    petPolicy?: string;
    additionalNotes?: string[];
  };
  
  // QR Code data
  qrCodeData: string; // URL or JSON string for verification
  
  // Generation metadata
  generatedAt: Date;
  validUntil: Date;
}

export interface VoucherGenerationOptions {
  includeHotelLogo?: boolean;
  includeBranding?: boolean;
  language?: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
  format?: 'A4' | 'Letter';
}

// ============================================================================
// Enhanced Search Types
// ============================================================================

export interface EnhancedHotelSearchParams {
  // Basic search
  destination: string;
  checkIn: Date;
  checkOut: Date;
  rooms: {
    adults: number;
    children: number;
    childAges?: number[];
  }[];
  
  // Filters
  filters?: HotelFilters;
  
  // Sorting
  sortBy?: HotelSortOption;
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export enum HotelSortOption {
  PRICE_LOW_TO_HIGH = 'PRICE_LOW_TO_HIGH',
  PRICE_HIGH_TO_LOW = 'PRICE_HIGH_TO_LOW',
  STAR_RATING = 'STAR_RATING',
  GUEST_RATING = 'GUEST_RATING',
  DISTANCE_FROM_CENTER = 'DISTANCE_FROM_CENTER',
  POPULARITY = 'POPULARITY',
  RECOMMENDED = 'RECOMMENDED',
}

export interface EnhancedHotelResult {
  id: string;
  name: string;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    distanceFromCenter: number;
    distanceFromAirport?: number;
    nearbyLandmarks: {
      name: string;
      distance: number;
    }[];
  };
  
  propertyType: PropertyType;
  amenities: HotelAmenity[];
  
  rooms: {
    id: string;
    name: string;
    description: string;
    accommodationType: AccommodationType;
    maxOccupancy: number;
    bedConfiguration: {
      type: BedType;
      count: number;
    }[];
    roomAmenities: RoomAmenity[];
    size: number; // square meters
    images: string[];
    
    pricing: {
      baseRate: number;
      taxes: number;
      serviceFee: number;
      total: number;
      currency: string;
      mealPlan: MealPlan;
    };
    
    availability: {
      available: boolean;
      roomsLeft?: number;
    };
    
    cancellationPolicy: {
      freeCancellationUntil?: Date;
      refundable: boolean;
    };
  }[];
  
  images: string[];
  description: string;
  
  policies: {
    checkIn: string;
    checkOut: string;
    childPolicy: string;
    petPolicy: string;
    cancellationPolicy: string;
  };
  
  // Badges
  badges?: ('POPULAR' | 'GREAT_VALUE' | 'NEWLY_OPENED' | 'ECO_FRIENDLY' | 'BOUTIQUE')[];
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getPropertyTypeDisplayName(type: PropertyType): string {
  const names: Record<PropertyType, string> = {
    [PropertyType.HOTEL]: 'Hotel',
    [PropertyType.RESORT]: 'Resort',
    [PropertyType.APARTMENT]: 'Apartment',
    [PropertyType.VILLA]: 'Villa',
    [PropertyType.GUEST_HOUSE]: 'Guest House',
    [PropertyType.HOSTEL]: 'Hostel',
    [PropertyType.BED_AND_BREAKFAST]: 'Bed & Breakfast',
    [PropertyType.BOUTIQUE]: 'Boutique Hotel',
    [PropertyType.CAPSULE]: 'Capsule Hotel',
    [PropertyType.MOTEL]: 'Motel',
    [PropertyType.RYOKAN]: 'Ryokan',
  };
  return names[type];
}

export function getAmenityDisplayName(amenity: HotelAmenity): string {
  return amenity.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getMealPlanDisplayName(plan: MealPlan): string {
  const names: Record<MealPlan, string> = {
    [MealPlan.ROOM_ONLY]: 'Room Only',
    [MealPlan.BREAKFAST_INCLUDED]: 'Breakfast Included',
    [MealPlan.HALF_BOARD]: 'Half Board (Breakfast + Dinner)',
    [MealPlan.FULL_BOARD]: 'Full Board (All Meals)',
    [MealPlan.ALL_INCLUSIVE]: 'All Inclusive',
  };
  return names[plan];
}

export function calculateNumberOfNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isFreeCancellationAvailable(freeCancellationUntil?: Date): boolean {
  if (!freeCancellationUntil) return false;
  return new Date() < freeCancellationUntil;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function getStarRatingDisplay(rating: number): string {
  return '⭐'.repeat(Math.floor(rating));
}

export function getRatingCategory(rating: number): string {
  if (rating >= 9) return 'Exceptional';
  if (rating >= 8) return 'Excellent';
  if (rating >= 7) return 'Very Good';
  if (rating >= 6) return 'Good';
  if (rating >= 5) return 'Average';
  return 'Below Average';
}
