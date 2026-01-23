/**
 * Car Rental Enhancement Types
 * Insurance coverage and add-ons
 */

// ============================================================================
// Insurance Types
// ============================================================================

export enum InsuranceType {
	CDW = 'CDW', // Collision Damage Waiver
	TP = 'TP',   // Theft Protection
	SLI = 'SLI', // Supplementary Liability Insurance
	PAI = 'PAI', // Personal Accident Insurance
	SCDW = 'SCDW', // Super Collision Damage Waiver (reduces excess)
	WINDSCREEN = 'WINDSCREEN', // Windscreen & Glass Protection
	TIRE = 'TIRE', // Tire & Wheel Protection
	ROADSIDE = 'ROADSIDE', // Roadside Assistance Plus
}

export interface InsuranceCoverage {
	type: InsuranceType;
	name: string;
	description: string;
  
	coverage: {
		covers: string[];
		doesNotCover: string[];
		excessAmount: number; // Deductible/Excess in local currency
		reducedExcess?: number; // If SCDW reduces excess
	};
  
	pricing: {
		pricePerDay: number;
		priceTotal: number; // For rental duration
		currency: string;
	};
  
	recommended: boolean;
	required: boolean; // Some countries require certain insurance
  
	eligibility?: {
		minimumAge?: number;
		driverLicenseYears?: number;
		restrictions?: string[];
	};
}

export interface InsurancePackage {
	id: string;
	name: string;
	description: string;
	includedCoverage: InsuranceType[];
  
	pricing: {
		pricePerDay: number;
		priceTotal: number;
		savings: number; // vs buying individually
		currency: string;
	};
  
	popular: boolean;
	recommended: boolean;
}

// ============================================================================
// Add-ons Types
// ============================================================================

export enum AddOnType {
	GPS = 'GPS',
	CHILD_SEAT_INFANT = 'CHILD_SEAT_INFANT', // 0-1 years
	CHILD_SEAT_TODDLER = 'CHILD_SEAT_TODDLER', // 1-4 years
	CHILD_SEAT_BOOSTER = 'CHILD_SEAT_BOOSTER', // 4-12 years
	WIFI = 'WIFI',
	ADDITIONAL_DRIVER = 'ADDITIONAL_DRIVER',
	PHONE_HOLDER = 'PHONE_HOLDER',
	USB_CHARGER = 'USB_CHARGER',
	DASHCAM = 'DASHCAM',
	SNOW_CHAINS = 'SNOW_CHAINS',
	SKI_RACK = 'SKI_RACK',
	BIKE_RACK = 'BIKE_RACK',
	ROOF_BOX = 'ROOF_BOX',
	PREPAID_FUEL = 'PREPAID_FUEL',
	TOLL_PASS = 'TOLL_PASS',
}

export interface AddOnOption {
	type: AddOnType;
	name: string;
	description: string;
	imageUrl?: string;
  
	pricing: {
		pricePerDay?: number; // For daily rental items
		pricePerRental?: number; // One-time fee items
		priceTotal: number; // For the rental duration
		currency: string;
	};
  
	availability: {
		available: boolean;
		quantityAvailable?: number;
		requiresAdvanceBooking?: boolean;
	};
  
	specifications?: {
		brand?: string;
		model?: string;
		features?: string[];
		dimensions?: string;
		weight?: string;
	};
  
	ageRestrictions?: {
		minimum?: number;
		maximum?: number;
	};
  
	notes?: string[];
}

// ============================================================================
// Enhanced Car Rental Search/Booking
// ============================================================================

export interface EnhancedCarRentalBooking {
	// Basic rental info
	bookingId: string;
	confirmationNumber: string;
  
	vehicle: {
		id: string;
		category: string;
		model: string;
		transmission: string;
		seats: number;
		doors: number;
		fuelType: string;
		imageUrl: string;
	};
  
	rental: {
		pickupLocation: string;
		dropoffLocation: string;
		pickupDate: Date;
		dropoffDate: Date;
		numberOfDays: number;
	};
  
	driver: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		age: number;
		licenseNumber: string;
		licenseCountry: string;
		licenseYears: number;
	};
  
	// Insurance selections
	insurance: {
		selectedCoverage: InsuranceCoverage[];
		selectedPackage?: InsurancePackage;
		totalPrice: number;
		currency: string;
	};
  
	// Add-ons selections
	addOns: {
		selectedAddOns: (AddOnOption & { quantity: number })[];
		totalPrice: number;
		currency: string;
	};
  
	// Pricing breakdown
	pricing: {
		baseRate: number;
		insuranceTotal: number;
		addOnsTotal: number;
		taxes: number;
		fees: number;
		total: number;
		currency: string;
		deposit: number;
	};
  
	// Policies
	policies: {
		fuelPolicy: string;
		mileagePolicy: string;
		cancellationPolicy: string;
		lateFee: number;
	};
}

export interface CarRentalVoucher {
	voucherId: string;
	bookingReference: string;
	confirmationNumber: string;
  
	rentalCompany: {
		name: string;
		logo: string;
		address: string;
		phone: string;
		email: string;
	};
  
	booking: EnhancedCarRentalBooking;
  
	importantInfo: {
		whatToBring: string[];
		pickupInstructions: string[];
		dropoffInstructions: string[];
		emergencyContact: string;
	};
  
	qrCodeData: string;
	generatedAt: Date;
}

// ============================================================================
// Comparison Types
// ============================================================================

export interface InsuranceComparison {
	coverageTypes: InsuranceType[];
  
	options: {
		none: {
			name: 'No Additional Insurance';
			price: 0;
			excess: number; // Base excess
			coverage: Record<InsuranceType, boolean>;
		};
    
		basic: {
			name: 'Basic Protection';
			includedCoverage: InsuranceType[];
			price: number;
			excess: number;
			coverage: Record<InsuranceType, boolean>;
		};
    
		standard: {
			name: 'Standard Protection';
			includedCoverage: InsuranceType[];
			price: number;
			excess: number;
			coverage: Record<InsuranceType, boolean>;
			popular?: boolean;
		};
    
		premium: {
			name: 'Premium Protection';
			includedCoverage: InsuranceType[];
			price: number;
			excess: number;
			coverage: Record<InsuranceType, boolean>;
			recommended?: boolean;
		};
	};
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getInsuranceTypeDisplayName(type: InsuranceType): string {
	const names: Record<InsuranceType, string> = {
		[InsuranceType.CDW]: 'Collision Damage Waiver',
		[InsuranceType.TP]: 'Theft Protection',
		[InsuranceType.SLI]: 'Supplementary Liability Insurance',
		[InsuranceType.PAI]: 'Personal Accident Insurance',
		[InsuranceType.SCDW]: 'Super CDW (Reduced Excess)',
		[InsuranceType.WINDSCREEN]: 'Windscreen Protection',
		[InsuranceType.TIRE]: 'Tire & Wheel Protection',
		[InsuranceType.ROADSIDE]: 'Roadside Assistance',
	};
	return names[type];
}

export function getAddOnTypeDisplayName(type: AddOnType): string {
	const names: Record<AddOnType, string> = {
		[AddOnType.GPS]: 'GPS Navigation System',
		[AddOnType.CHILD_SEAT_INFANT]: 'Child Seat (Infant 0-1 years)',
		[AddOnType.CHILD_SEAT_TODDLER]: 'Child Seat (Toddler 1-4 years)',
		[AddOnType.CHILD_SEAT_BOOSTER]: 'Booster Seat (4-12 years)',
		[AddOnType.WIFI]: 'Portable WiFi Hotspot',
		[AddOnType.ADDITIONAL_DRIVER]: 'Additional Driver',
		[AddOnType.PHONE_HOLDER]: 'Phone Holder',
		[AddOnType.USB_CHARGER]: 'USB Charger',
		[AddOnType.DASHCAM]: 'Dashcam',
		[AddOnType.SNOW_CHAINS]: 'Snow Chains',
		[AddOnType.SKI_RACK]: 'Ski Rack',
		[AddOnType.BIKE_RACK]: 'Bike Rack',
		[AddOnType.ROOF_BOX]: 'Roof Box',
		[AddOnType.PREPAID_FUEL]: 'Prepaid Fuel',
		[AddOnType.TOLL_PASS]: 'Toll Pass',
	};
	return names[type];
}

export function calculateInsuranceSavings(
	individualPrices: number[],
	packagePrice: number
): number {
	const totalIndividual = individualPrices.reduce((sum, price) => sum + price, 0);
	return Math.max(0, totalIndividual - packagePrice);
}

export function calculateAddOnsTotal(
	addOns: (AddOnOption & { quantity: number })[],
	rentalDays: number
): number {
	return addOns.reduce((total, addon) => {
		const itemPrice = addon.pricing.pricePerDay
			? addon.pricing.pricePerDay * rentalDays * addon.quantity
			: (addon.pricing.pricePerRental || 0) * addon.quantity;
		return total + itemPrice;
	}, 0);
}

export function getRecommendedInsurance(
	driverAge: number,
	licenseYears: number,
	vehicleValue: number
): InsuranceType[] {
	const recommended: InsuranceType[] = [];

	// Always recommend CDW and TP
	recommended.push(InsuranceType.CDW, InsuranceType.TP);

	// Young or inexperienced drivers should get PAI
	if (driverAge < 25 || licenseYears < 2) {
		recommended.push(InsuranceType.PAI);
	}

	// High-value vehicles should get SCDW
	if (vehicleValue > 50000) {
		recommended.push(InsuranceType.SCDW);
	}

	// Always good to have
	recommended.push(InsuranceType.SLI);

	return recommended;
}

export function validateDriverEligibility(
	driver: {
		age: number;
		licenseYears: number;
	},
	insurance: InsuranceCoverage
): { eligible: boolean; reasons: string[] } {
	const reasons: string[] = [];
	let eligible = true;

	if (insurance.eligibility) {
		if (insurance.eligibility.minimumAge && driver.age < insurance.eligibility.minimumAge) {
			eligible = false;
			reasons.push(`Driver must be at least ${insurance.eligibility.minimumAge} years old`);
		}

		if (insurance.eligibility.driverLicenseYears && 
				driver.licenseYears < insurance.eligibility.driverLicenseYears) {
			eligible = false;
			reasons.push(`Driver must have ${insurance.eligibility.driverLicenseYears} years of driving experience`);
		}
	}

	return { eligible, reasons };
}

export function formatChildSeatAge(type: AddOnType): string {
	switch (type) {
		case AddOnType.CHILD_SEAT_INFANT:
			return '0-1 years (up to 13kg)';
		case AddOnType.CHILD_SEAT_TODDLER:
			return '1-4 years (9-18kg)';
		case AddOnType.CHILD_SEAT_BOOSTER:
			return '4-12 years (15-36kg)';
		default:
			return '';
	}
}
