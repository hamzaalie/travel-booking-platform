/**
 * SSR (Special Service Request) Types
 * Comprehensive type definitions for seat selection, meals, baggage, and special assistance
 */

// ============================================================================
// Seat Selection Types
// ============================================================================

export enum SeatType {
	WINDOW = 'WINDOW',
	AISLE = 'AISLE',
	MIDDLE = 'MIDDLE',
}

export enum SeatClass {
	ECONOMY = 'ECONOMY',
	PREMIUM_ECONOMY = 'PREMIUM_ECONOMY',
	BUSINESS = 'BUSINESS',
	FIRST = 'FIRST',
}

export enum SeatAvailability {
	AVAILABLE = 'AVAILABLE',
	OCCUPIED = 'OCCUPIED',
	BLOCKED = 'BLOCKED',
	EXTRA_LEGROOM = 'EXTRA_LEGROOM',
	EXIT_ROW = 'EXIT_ROW',
}

export interface SeatPosition {
	row: number;
	column: string; // A, B, C, D, E, F, etc.
	deck?: 'MAIN' | 'UPPER'; // For aircraft with multiple decks (e.g., A380)
}

export interface Seat extends SeatPosition {
	id: string;
	type: SeatType;
	seatClass: SeatClass;
	availability: SeatAvailability;
	price: number; // Additional cost for this seat
	currency: string;
	features: SeatFeature[];
	restrictions?: string[]; // e.g., "Exit row - must be 18+", "No infants"
}

export interface SeatFeature {
	type: 'EXTRA_LEGROOM' | 'RECLINE' | 'POWER_OUTLET' | 'USB' | 'WIFI' | 'ENTERTAINMENT';
	available: boolean;
}

export interface SeatMap {
	flightSegmentId: string;
	aircraftType: string; // e.g., "Boeing 777-300ER"
	totalRows: number;
	columnsPerRow: string[]; // e.g., ['A', 'B', 'C', 'D', 'E', 'F']
	exitRows: number[];
	seats: Seat[];
	configuration: string; // e.g., "3-3-3" for economy layout
}

export interface SeatSelection {
	passengerId: string;
	passengerName: string;
	flightSegmentId: string;
	segmentIndex: number; // For multi-segment flights
	seat: Seat;
	price: number;
	currency: string;
}

// ============================================================================
// Meal Preference Types
// ============================================================================

export enum MealType {
	// Standard meals
	STANDARD = 'STANDARD',
  
	// Dietary preferences
	VEGETARIAN = 'VEGETARIAN',
	VEGAN = 'VEGAN',
	HINDU = 'HINDU',
	KOSHER = 'KOSHER',
	HALAL = 'HALAL',
	JAIN = 'JAIN',
  
	// Special dietary requirements
	DIABETIC = 'DIABETIC',
	LOW_CALORIE = 'LOW_CALORIE',
	LOW_SALT = 'LOW_SALT',
	GLUTEN_FREE = 'GLUTEN_FREE',
	LACTOSE_FREE = 'LACTOSE_FREE',
	NUT_FREE = 'NUT_FREE',
  
	// Age-specific
	CHILD_MEAL = 'CHILD_MEAL',
	INFANT_MEAL = 'INFANT_MEAL',
  
	// Allergies
	SEAFOOD_FREE = 'SEAFOOD_FREE',
  
	// Other
	FRUIT_PLATTER = 'FRUIT_PLATTER',
	RAW_VEGETABLE = 'RAW_VEGETABLE',
	NO_MEAL = 'NO_MEAL',
}

export interface MealOption {
	code: string; // IATA meal code (e.g., VGML, AVML, KSML)
	type: MealType;
	name: string;
	description: string;
	ingredients?: string[];
	allergens?: string[];
	available: boolean;
	price: number; // Additional cost if any
	currency: string;
	imageUrl?: string;
	advanceOrderRequired: boolean; // Some meals need to be ordered 24-48h in advance
	minimumNoticeHours?: number;
}

export interface MealSelection {
	passengerId: string;
	passengerName: string;
	flightSegmentId: string;
	segmentIndex: number;
	meal: MealOption;
	specialInstructions?: string;
	price: number;
	currency: string;
}

// ============================================================================
// Baggage Types
// ============================================================================

export enum BaggageType {
	CABIN = 'CABIN',
	CHECKED = 'CHECKED',
	SPORTS_EQUIPMENT = 'SPORTS_EQUIPMENT',
	MUSICAL_INSTRUMENT = 'MUSICAL_INSTRUMENT',
	PET = 'PET',
}

export interface BaggageDimensions {
	length: number; // cm
	width: number; // cm
	height: number; // cm
	maxWeight: number; // kg
}

export interface BaggageAllowance {
	type: BaggageType;
	quantity: number; // Number of pieces allowed
	weight: number; // kg per piece
	dimensions?: BaggageDimensions;
	included: boolean; // Is this included in the fare or needs to be purchased?
}

export interface ExtraBaggageOption {
	id: string;
	type: BaggageType;
	weight: number; // kg
	description: string;
	price: number;
	currency: string;
	dimensions?: BaggageDimensions;
	restrictions?: string[];
}

export interface BaggageSelection {
	passengerId: string;
	passengerName: string;
	flightSegmentId: string;
	includedBaggage: BaggageAllowance[];
	extraBaggage: ExtraBaggageOption[];
	totalWeight: number; // kg
	totalPrice: number;
	currency: string;
	specialInstructions?: string; // For sports equipment, musical instruments, etc.
}

// ============================================================================
// Special Assistance Types
// ============================================================================

export enum AssistanceType {
	// Mobility assistance
	WHEELCHAIR_FULLY_IMMOBILE = 'WCHC', // Passenger completely immobile, needs wheelchair
	WHEELCHAIR_CANNOT_CLIMB_STAIRS = 'WCHS', // Can walk on level surfaces but not stairs
	WHEELCHAIR_LONG_DISTANCES = 'WCHR', // Can walk short distances and climb stairs
  
	// Visual impairment
	BLIND = 'BLND',
	DEAF = 'DEAF',
	DEAF_BLIND = 'DBLD',
  
	// Medical
	MEDICAL_OXYGEN = 'MEDA',
	STRETCHER = 'STCR',
	MEDICAL_CLEARANCE = 'MEDC',
  
	// Accompanied travel
	UNACCOMPANIED_MINOR = 'UMNR',
  
	// Other
	GUIDE_DOG = 'GDGD',
	EMOTIONAL_SUPPORT_ANIMAL = 'ESAN',
	SERVICE_ANIMAL = 'SVAN',
}

export interface AssistanceOption {
	type: AssistanceType;
	code: string; // IATA code
	name: string;
	description: string;
	requirements: string[];
	documents: string[]; // Required documents (e.g., medical certificate)
	advanceNoticeHours: number; // Minimum hours in advance to request
	price: number;
	currency: string;
	availabilityDepends?: string[]; // e.g., "Aircraft type", "Route"
}

export interface SpecialAssistanceRequest {
	passengerId: string;
	passengerName: string;
	assistance: AssistanceOption[];
	medicalCertificate?: File | string; // File upload or URL
	additionalDetails: string;
	emergencyContact?: {
		name: string;
		relationship: string;
		phone: string;
	};
	totalPrice: number;
	currency: string;
}

// ============================================================================
// Combined SSR Types
// ============================================================================

export interface SSRAvailability {
	flightOfferId: string;
	segments: {
		segmentId: string;
		segmentIndex: number;
		departure: string; // Airport code
		arrival: string; // Airport code
		seatMap?: SeatMap;
		meals: MealOption[];
		baggage: {
			included: BaggageAllowance[];
			extra: ExtraBaggageOption[];
		};
		assistance: AssistanceOption[];
	}[];
}

export interface SSRRequest {
	bookingId: string;
	passengers: {
		passengerId: string;
		seats?: SeatSelection[];
		meals?: MealSelection[];
		baggage?: BaggageSelection;
		assistance?: SpecialAssistanceRequest;
	}[];
	totalPrice: number;
	currency: string;
}

export interface SSRSummary {
	seats: {
		count: number;
		price: number;
	};
	meals: {
		count: number;
		price: number;
	};
	baggage: {
		totalWeight: number; // kg
		price: number;
	};
	assistance: {
		count: number;
		price: number;
	};
	totalPrice: number;
	currency: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface SSRValidationResult {
	valid: boolean;
	errors: {
		field: string;
		message: string;
		code: string;
	}[];
	warnings: {
		field: string;
		message: string;
		code: string;
	}[];
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getSeatLabel(seat: SeatPosition): string {
	return `${seat.row}${seat.column}`;
}

export function isSeatAdjacent(seat1: SeatPosition, seat2: SeatPosition): boolean {
	if (seat1.row !== seat2.row) return false;
	const col1 = seat1.column.charCodeAt(0);
	const col2 = seat2.column.charCodeAt(0);
	return Math.abs(col1 - col2) === 1;
}

export function calculateSSRTotal(ssr: SSRRequest): SSRSummary {
	const summary: SSRSummary = {
		seats: { count: 0, price: 0 },
		meals: { count: 0, price: 0 },
		baggage: { totalWeight: 0, price: 0 },
		assistance: { count: 0, price: 0 },
		totalPrice: 0,
		currency: ssr.currency,
	};

	ssr.passengers.forEach((passenger) => {
		// Calculate seat costs
		if (passenger.seats) {
			summary.seats.count += passenger.seats.length;
			summary.seats.price += passenger.seats.reduce((sum, s) => sum + s.price, 0);
		}

		// Calculate meal costs
		if (passenger.meals) {
			summary.meals.count += passenger.meals.length;
			summary.meals.price += passenger.meals.reduce((sum, m) => sum + m.price, 0);
		}

		// Calculate baggage costs
		if (passenger.baggage) {
			summary.baggage.totalWeight += passenger.baggage.totalWeight;
			summary.baggage.price += passenger.baggage.totalPrice;
		}

		// Calculate assistance costs
		if (passenger.assistance) {
			summary.assistance.count += passenger.assistance.assistance.length;
			summary.assistance.price += passenger.assistance.totalPrice;
		}
	});

	summary.totalPrice = 
		summary.seats.price + 
		summary.meals.price + 
		summary.baggage.price + 
		summary.assistance.price;

	return summary;
}

export function validateSeatSelection(
	seat: Seat,
	passengerType: 'adult' | 'child' | 'infant'
): SSRValidationResult {
	const result: SSRValidationResult = {
		valid: true,
		errors: [],
		warnings: [],
	};

	// Check availability
	if (seat.availability !== SeatAvailability.AVAILABLE && 
			seat.availability !== SeatAvailability.EXTRA_LEGROOM &&
			seat.availability !== SeatAvailability.EXIT_ROW) {
		result.valid = false;
		result.errors.push({
			field: 'seat',
			message: 'This seat is not available',
			code: 'SEAT_NOT_AVAILABLE',
		});
	}

	// Check exit row restrictions
	if (seat.availability === SeatAvailability.EXIT_ROW) {
		if (passengerType !== 'adult') {
			result.valid = false;
			result.errors.push({
				field: 'seat',
				message: 'Exit row seats are only available for adults (18+)',
				code: 'EXIT_ROW_AGE_RESTRICTION',
			});
		}

		result.warnings.push({
			field: 'seat',
			message: 'Exit row passengers must be able to assist in emergency evacuation',
			code: 'EXIT_ROW_RESPONSIBILITY',
		});
	}

	// Check infant restrictions
	if (passengerType === 'infant') {
		const hasRestriction = seat.restrictions?.some(r => 
			r.toLowerCase().includes('infant') || r.toLowerCase().includes('baby')
		);
    
		if (hasRestriction) {
			result.valid = false;
			result.errors.push({
				field: 'seat',
				message: 'This seat cannot accommodate infants',
				code: 'INFANT_SEAT_RESTRICTION',
			});
		}
	}

	return result;
}

export function validateMealSelection(
	meal: MealOption,
	departureTime: Date
): SSRValidationResult {
	const result: SSRValidationResult = {
		valid: true,
		errors: [],
		warnings: [],
	};

	if (!meal.available) {
		result.valid = false;
		result.errors.push({
			field: 'meal',
			message: 'This meal option is not available',
			code: 'MEAL_NOT_AVAILABLE',
		});
	}

	// Check advance order requirement
	if (meal.advanceOrderRequired && meal.minimumNoticeHours) {
		const now = new Date();
		const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

		if (hoursUntilDeparture < meal.minimumNoticeHours) {
			result.valid = false;
			result.errors.push({
				field: 'meal',
				message: `This meal requires ${meal.minimumNoticeHours} hours advance notice`,
				code: 'MEAL_ADVANCE_NOTICE_REQUIRED',
			});
		}
	}

	return result;
}

export function formatBaggageDimensions(dimensions: BaggageDimensions): string {
	return `${dimensions.length}x${dimensions.width}x${dimensions.height}cm, max ${dimensions.maxWeight}kg`;
}

export function getMealTypeDisplayName(type: MealType): string {
	const names: Record<MealType, string> = {
		[MealType.STANDARD]: 'Standard Meal',
		[MealType.VEGETARIAN]: 'Vegetarian',
		[MealType.VEGAN]: 'Vegan',
		[MealType.HINDU]: 'Hindu Meal',
		[MealType.KOSHER]: 'Kosher',
		[MealType.HALAL]: 'Halal',
		[MealType.JAIN]: 'Jain Meal',
		[MealType.DIABETIC]: 'Diabetic Meal',
		[MealType.LOW_CALORIE]: 'Low Calorie',
		[MealType.LOW_SALT]: 'Low Salt',
		[MealType.GLUTEN_FREE]: 'Gluten Free',
		[MealType.LACTOSE_FREE]: 'Lactose Free',
		[MealType.NUT_FREE]: 'Nut Free',
		[MealType.CHILD_MEAL]: 'Child Meal',
		[MealType.INFANT_MEAL]: 'Infant Meal',
		[MealType.SEAFOOD_FREE]: 'Seafood Free',
		[MealType.FRUIT_PLATTER]: 'Fruit Platter',
		[MealType.RAW_VEGETABLE]: 'Raw Vegetable',
		[MealType.NO_MEAL]: 'No Meal',
	};

	return names[type] || type;
}

export function getAssistanceTypeDisplayName(type: AssistanceType): string {
	const names: Record<AssistanceType, string> = {
		[AssistanceType.WHEELCHAIR_FULLY_IMMOBILE]: 'Wheelchair - Fully Immobile',
		[AssistanceType.WHEELCHAIR_CANNOT_CLIMB_STAIRS]: 'Wheelchair - Cannot Climb Stairs',
		[AssistanceType.WHEELCHAIR_LONG_DISTANCES]: 'Wheelchair - Long Distances Only',
		[AssistanceType.BLIND]: 'Visual Impairment',
		[AssistanceType.DEAF]: 'Hearing Impairment',
		[AssistanceType.DEAF_BLIND]: 'Deaf and Blind',
		[AssistanceType.MEDICAL_OXYGEN]: 'Medical Oxygen Required',
		[AssistanceType.STRETCHER]: 'Stretcher Required',
		[AssistanceType.MEDICAL_CLEARANCE]: 'Medical Clearance Required',
		[AssistanceType.UNACCOMPANIED_MINOR]: 'Unaccompanied Minor',
		[AssistanceType.GUIDE_DOG]: 'Guide Dog',
		[AssistanceType.EMOTIONAL_SUPPORT_ANIMAL]: 'Emotional Support Animal',
		[AssistanceType.SERVICE_ANIMAL]: 'Service Animal',
	};

	return names[type] || type;
}
