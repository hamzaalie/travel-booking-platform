import { amadeusService } from './amadeus.service';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { toNPR } from '../utils/currencyConverter';
import {
  InsuranceType,
  AddOnType,
  AddOnOption,
  InsuranceComparison,
  getInsuranceTypeDisplayName,
  getAddOnTypeDisplayName,
} from '../../../shared/src/carRentalEnhancedTypes';
import voucherService from './voucher.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CarRentalSearchParams {
  pickupLocationCode: string;
  pickupDate: string;
  pickupTime: string;
  dropoffLocationCode?: string;
  dropoffDate: string;
  dropoffTime: string;
  currency?: string;
  providerCodes?: string[];
  rateClass?: string;
}

export interface CarRentalOffer {
  id: string;
  provider: {
    code: string;
    name: string;
    logoUrl?: string;
  };
  vehicle: {
    category: string;
    type: string;
    make?: string;
    model?: string;
    description?: string;
    seats: number;
    doors: number;
    transmission: 'MANUAL' | 'AUTOMATIC';
    fuelType?: string;
    airConditioning: boolean;
    imageUrl?: string;
  };
  pickup: {
    locationCode: string;
    address?: string;
    date: string;
    time: string;
  };
  dropoff: {
    locationCode: string;
    address?: string;
    date: string;
    time: string;
  };
  price: {
    currency: string;
    total: number;
    base: number;
    taxes?: number;
    extraFees?: Array<{
      name: string;
      amount: number;
    }>;
  };
  mileage?: {
    unlimited: boolean;
    allowance?: number;
    unit?: string;
  };
  cancellation?: {
    allowed: boolean;
    deadline?: string;
    fee?: number;
  };
  policies?: {
    deposit?: string;
    insurance?: string;
    fuelPolicy?: string;
  };
}

class CarRentalService {
  /**
   * Search car rental offers
   * Uses Amadeus Car Rental API (Transfer Search can be used as alternative)
   */
  async searchCarRentals(params: CarRentalSearchParams): Promise<CarRentalOffer[]> {
    try {
      logger.info('Searching car rentals with params:', params);

      const searchParams: any = {
        pickupLocationCode: params.pickupLocationCode,
        pickupDateTime: `${params.pickupDate}T${params.pickupTime}`,
        dropoffLocationCode: params.dropoffLocationCode || params.pickupLocationCode,
        dropoffDateTime: `${params.dropoffDate}T${params.dropoffTime}`,
        currency: params.currency || 'NPR',
        providerCodes: params.providerCodes?.join(','),
        rateClass: params.rateClass,
      };

      // Remove undefined values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === undefined) {
          delete searchParams[key];
        }
      });

      const response = await amadeusService.makeRequest(
        '/v1/shopping/car-rentals',
        searchParams
      );

      if (!response.data || response.data.length === 0) {
        logger.info('No car rentals found for the given criteria');
        return [];
      }

      // Transform Amadeus response to our format
      const offers: CarRentalOffer[] = response.data.map((offer: any) => ({
        id: offer.id,
        provider: {
          code: offer.provider?.code || 'UNKNOWN',
          name: offer.provider?.name || 'Unknown Provider',
          logoUrl: offer.provider?.logoUrl,
        },
        vehicle: {
          category: offer.vehicle?.category || 'STANDARD',
          type: offer.vehicle?.type || 'CAR',
          make: offer.vehicle?.make,
          model: offer.vehicle?.model,
          description: offer.vehicle?.description,
          seats: offer.vehicle?.seats || 5,
          doors: offer.vehicle?.doors || 4,
          transmission: offer.vehicle?.transmission === 'AUTOMATIC' ? 'AUTOMATIC' : 'MANUAL',
          fuelType: offer.vehicle?.fuelType,
          airConditioning: offer.vehicle?.airConditioning !== false,
          imageUrl: offer.vehicle?.imageUrl,
        },
        pickup: {
          locationCode: offer.pickup?.location?.iataCode || params.pickupLocationCode,
          address: offer.pickup?.address?.lines?.join(', '),
          date: params.pickupDate,
          time: params.pickupTime,
        },
        dropoff: {
          locationCode: offer.dropoff?.location?.iataCode || params.dropoffLocationCode || params.pickupLocationCode,
          address: offer.dropoff?.address?.lines?.join(', '),
          date: params.dropoffDate,
          time: params.dropoffTime,
        },
        price: {
          currency: 'NPR',
          total: toNPR(parseFloat(offer.price?.total || '0'), offer.price?.currency || 'USD'),
          base: toNPR(parseFloat(offer.price?.base || '0'), offer.price?.currency || 'USD'),
          taxes: toNPR(offer.price?.taxes?.map((t: any) => parseFloat(t.amount || '0'))
            .reduce((a: number, b: number) => a + b, 0) || 0, offer.price?.currency || 'USD'),
          extraFees: offer.price?.fees?.map((fee: any) => ({
            name: fee.description || 'Additional Fee',
            amount: toNPR(parseFloat(fee.amount || '0'), offer.price?.currency || 'USD'),
          })),
        },
        mileage: {
          unlimited: offer.mileage?.unlimited === true,
          allowance: offer.mileage?.allowance,
          unit: offer.mileage?.unit || 'KM',
        },
        cancellation: offer.policies?.cancellation ? {
          allowed: offer.policies.cancellation.allowed !== false,
          deadline: offer.policies.cancellation.deadline,
          fee: toNPR(parseFloat(offer.policies.cancellation.fee || '0'), offer.price?.currency || 'USD'),
        } : undefined,
        policies: {
          deposit: offer.policies?.deposit?.description,
          insurance: offer.policies?.insurance?.description,
          fuelPolicy: offer.policies?.fuel?.description,
        },
      }));

      logger.info(`Found ${offers.length} car rental offers`);
      return offers;

    } catch (error: any) {
      logger.error('Car rental search error:', error);
      
      // If Amadeus API fails, return mock data for demo
      if (error.statusCode === 404 || error.message?.includes('not found')) {
        logger.warn('Amadeus car rental API not available, returning mock data');
        return this.getMockCarRentals(params);
      }
      
      throw new AppError(
        error.message || 'Failed to search car rentals',
        error.statusCode || 500
      );
    }
  }

  /**
   * Get car rental offer details
   */
  async getCarRentalOffer(offerId: string): Promise<any> {
    try {
      const response = await amadeusService.makeRequest(
        `/v1/shopping/car-rentals/${offerId}`
      );

      return response.data;
    } catch (error: any) {
      logger.error('Get car rental offer error:', error);
      throw new AppError(
        error.message || 'Failed to get car rental offer',
        error.statusCode || 500
      );
    }
  }

  /**
   * Book car rental
   */
  async bookCarRental(offerId: string, driver: any, payment: any): Promise<any> {
    try {
      const bookingData = {
        data: {
          offerId,
          driver: {
            name: {
              firstName: driver.firstName,
              lastName: driver.lastName,
            },
            contact: {
              phone: driver.phone,
              email: driver.email,
            },
            dateOfBirth: driver.dateOfBirth,
            licenseNumber: driver.licenseNumber,
            licenseCountry: driver.licenseCountry,
          },
          payment: {
            method: payment.method || 'CREDIT_CARD',
            card: {
              vendorCode: payment.cardType,
              cardNumber: payment.cardNumber,
              expiryDate: payment.expiryDate,
              holderName: payment.holderName,
            },
          },
        },
      };

      const response = await amadeusService.makeRequest(
        '/v1/booking/car-rentals',
        bookingData,
        'POST'
      );

      logger.info('Car rental booked successfully:', response.data.id);
      return response.data;

    } catch (error: any) {
      logger.error('Car rental booking error:', error);
      throw new AppError(
        error.message || 'Failed to book car rental',
        error.statusCode || 500
      );
    }
  }

  /**
   * Cancel car rental booking
   */
  async cancelCarRentalBooking(bookingId: string): Promise<any> {
    try {
      const response = await amadeusService.makeRequest(
        `/v1/booking/car-rentals/${bookingId}`,
        {},
        'DELETE'
      );

      logger.info('Car rental booking cancelled:', bookingId);
      return response.data;

    } catch (error: any) {
      logger.error('Car rental cancellation error:', error);
      throw new AppError(
        error.message || 'Failed to cancel car rental booking',
        error.statusCode || 500
      );
    }
  }

  /**
   * Get insurance options for a car rental
   */
  async getInsuranceOptions(rentalId: string): Promise<InsuranceComparison> {
    try {
      logger.info(`Getting insurance options for rental ${rentalId}`);

      // @ts-ignore - Unused variable kept for reference
      const _coverageOptions: Record<string, any> = {
        [InsuranceType.CDW]: {
          type: InsuranceType.CDW,
          name: getInsuranceTypeDisplayName(InsuranceType.CDW),
          description: 'Covers damage to the rental vehicle',
          coverage: {
            damageToVehicle: true,
            theft: false,
            thirdPartyLiability: false,
            personalAccident: false,
          } as any,
          excess: 1000,
          pricePerDay: 15,
          currency: 'NPR',
          recommended: true,
        },
        [InsuranceType.TP]: {
          type: InsuranceType.TP,
          name: getInsuranceTypeDisplayName(InsuranceType.TP),
          description: 'Covers theft of the rental vehicle',
          coverage: {
            damageToVehicle: false,
            theft: true,
            thirdPartyLiability: false,
            personalAccident: false,
          },
          excess: 1500,
          pricePerDay: 10,
          currency: 'NPR',
          recommended: true,
        },
        [InsuranceType.SLI]: {
          type: InsuranceType.SLI,
          name: getInsuranceTypeDisplayName(InsuranceType.SLI),
          description: 'Additional third-party liability coverage',
          coverage: {
            damageToVehicle: false,
            theft: false,
            thirdPartyLiability: true,
            personalAccident: false,
          },
          excess: 0,
          pricePerDay: 12,
          currency: 'NPR',
          recommended: true,
        },
        [InsuranceType.PAI]: {
          type: InsuranceType.PAI,
          name: getInsuranceTypeDisplayName(InsuranceType.PAI),
          description: 'Personal accident insurance for driver and passengers',
          coverage: {
            damageToVehicle: false,
            theft: false,
            thirdPartyLiability: false,
            personalAccident: true,
          },
          excess: 0,
          pricePerDay: 8,
          currency: 'NPR',
        },
        [InsuranceType.SCDW]: {
          type: InsuranceType.SCDW,
          name: getInsuranceTypeDisplayName(InsuranceType.SCDW),
          description: 'Reduces excess to zero or near-zero',
          coverage: {
            damageToVehicle: true,
            theft: false,
            thirdPartyLiability: false,
            personalAccident: false,
          },
          excess: 0,
          pricePerDay: 20,
          currency: 'NPR',
        },
        [InsuranceType.WINDSCREEN]: {
          type: InsuranceType.WINDSCREEN,
          name: getInsuranceTypeDisplayName(InsuranceType.WINDSCREEN),
          description: 'Covers windscreen, windows, and mirrors',
          coverage: {
            damageToVehicle: false,
            theft: false,
            thirdPartyLiability: false,
            personalAccident: false,
          },
          excess: 0,
          pricePerDay: 5,
          currency: 'NPR',
        },
        [InsuranceType.TIRE]: {
          type: InsuranceType.TIRE,
          name: getInsuranceTypeDisplayName(InsuranceType.TIRE),
          description: 'Covers tire punctures and wheel damage',
          coverage: {
            damageToVehicle: false,
            theft: false,
            thirdPartyLiability: false,
            personalAccident: false,
          },
          excess: 0,
          pricePerDay: 5,
          currency: 'NPR',
        },
        [InsuranceType.ROADSIDE]: {
          type: InsuranceType.ROADSIDE,
          name: getInsuranceTypeDisplayName(InsuranceType.ROADSIDE),
          description: '24/7 roadside assistance with towing',
          coverage: {
            damageToVehicle: false,
            theft: false,
            thirdPartyLiability: false,
            personalAccident: false,
          },
          excess: 0,
          pricePerDay: 7,
          currency: 'NPR',
        },
      };

      // @ts-ignore - Unused variable kept for reference
      const _packages: any[] = [
        {
          id: 'basic',
          name: 'Basic Protection',
          includedCoverage: [InsuranceType.CDW, InsuranceType.TP],
          pricePerDay: 20,
          savings: 5,
          currency: 'NPR',
          excess: 1000,
          recommended: false,
        },
        {
          id: 'standard',
          name: 'Standard Protection',
          includedCoverage: [InsuranceType.CDW, InsuranceType.TP, InsuranceType.SLI],
          pricePerDay: 30,
          savings: 7,
          currency: 'NPR',
          excess: 500,
          recommended: true,
        },
        {
          id: 'premium',
          name: 'Premium Protection',
          includedCoverage: [
            InsuranceType.CDW,
            InsuranceType.TP,
            InsuranceType.SLI,
            InsuranceType.PAI,
            InsuranceType.SCDW,
            InsuranceType.WINDSCREEN,
            InsuranceType.TIRE,
            InsuranceType.ROADSIDE,
          ],
          pricePerDay: 45,
          savings: 15,
          currency: 'NPR',
          excess: 0,
          recommended: false,
        },
      ];

      const comparison: any = {
        options: {
          none: {
            excess: 2000,
            coverage: {} as any,
          },
          basic: {
            includedCoverage: [InsuranceType.CDW, InsuranceType.TP],
            excess: 1000,
            pricePerDay: 20,
            savings: 5,
          },
          standard: {
            includedCoverage: [InsuranceType.CDW, InsuranceType.TP, InsuranceType.SLI],
            excess: 500,
            pricePerDay: 30,
            savings: 7,
            recommended: true,
          },
          premium: {
            includedCoverage: [
              InsuranceType.CDW,
              InsuranceType.TP,
              InsuranceType.SLI,
              InsuranceType.PAI,
              InsuranceType.SCDW,
              InsuranceType.WINDSCREEN,
              InsuranceType.TIRE,
              InsuranceType.ROADSIDE,
            ],
            excess: 0,
            pricePerDay: 45,
            savings: 15,
          },
        },
      };

      return comparison;
    } catch (error: any) {
      logger.error('Get insurance options error:', error);
      throw new AppError(
        error.message || 'Failed to get insurance options',
        error.statusCode || 500
      );
    }
  }

  /**
   * Get available add-ons
   */
  async getAvailableAddOns(rentalId: string): Promise<AddOnOption[]> {
    try {
      logger.info(`Getting add-ons for rental ${rentalId}`);

      const addOns: any[] = [
        {
          type: AddOnType.GPS,
          name: getAddOnTypeDisplayName(AddOnType.GPS),
          description: 'GPS Navigation system with turn-by-turn directions',
          available: true,
          pricing: {
            pricePerDay: 10,
            pricePerRental: undefined,
            priceTotal: 0,
            currency: 'NPR',
          },
          specifications: {
            brand: 'Garmin',
            features: ['Offline maps', 'Traffic updates', 'Voice guidance'],
          },
        },
        {
          type: 'WIFI_HOTSPOT' as any,
          name: 'WiFi Hotspot',
          description: 'Portable WiFi hotspot with unlimited data',
          available: true,
          pricing: {
            pricePerDay: 8,
            currency: 'NPR',
          },
          specifications: {
            features: ['4G/5G connectivity', 'Connect up to 5 devices', 'Unlimited data'],
          },
        },
        {
          type: AddOnType.CHILD_SEAT_INFANT,
          name: getAddOnTypeDisplayName(AddOnType.CHILD_SEAT_INFANT),
          description: 'Rear-facing child seat for infants 0-1 years',
          available: true,
          pricing: {
            pricePerDay: 10,
            currency: 'NPR',
          },
          specifications: {
            ageRange: '0-1 years',
            weightLimit: '0-13kg',
            features: ['Safety certified', 'Rear-facing', 'Easy installation'],
          },
        },
        {
          type: AddOnType.CHILD_SEAT_TODDLER,
          name: getAddOnTypeDisplayName(AddOnType.CHILD_SEAT_TODDLER),
          description: 'Forward-facing child seat for toddlers 1-4 years',
          available: true,
          pricing: {
            pricePerDay: 10,
            currency: 'NPR',
          },
          specifications: {
            ageRange: '1-4 years',
            weightLimit: '9-18kg',
            features: ['5-point harness', 'Forward-facing', 'Adjustable'],
          },
        },
        {
          type: 'BOOSTER_SEAT' as any,
          name: 'Booster Seat',
          description: 'Booster seat for children 4-12 years',
          available: true,
          pricing: {
            pricePerDay: 8,
            currency: 'NPR',
          },
          specifications: {
            ageRange: '4-12 years',
            weightLimit: '15-36kg',
            features: ['Seat belt positioning', 'Comfortable', 'Portable'],
          },
        },
        {
          type: AddOnType.ADDITIONAL_DRIVER,
          name: getAddOnTypeDisplayName(AddOnType.ADDITIONAL_DRIVER),
          description: 'Add an additional authorized driver',
          available: true,
          pricing: {
            pricePerDay: 10,
            currency: 'NPR',
          },
          requirements: ['Valid driver license', 'Minimum age 25', 'Present at pickup'],
        },
        {
          type: AddOnType.SNOW_CHAINS,
          name: getAddOnTypeDisplayName(AddOnType.SNOW_CHAINS),
          description: 'Snow chains for winter driving conditions',
          available: true,
          pricing: {
            pricePerRental: 15,
            currency: 'NPR',
          },
          specifications: {
            features: ['Installation assistance', 'Required in some areas'],
          },
        },
        {
          type: AddOnType.SKI_RACK,
          name: getAddOnTypeDisplayName(AddOnType.SKI_RACK),
          description: 'Roof-mounted ski rack for 4-6 pairs',
          available: true,
          pricing: {
            pricePerDay: 12,
            currency: 'NPR',
          },
          specifications: {
            capacity: '4-6 pairs of skis',
            features: ['Lockable', 'Weather-resistant'],
          },
        },
        {
          type: AddOnType.BIKE_RACK,
          name: getAddOnTypeDisplayName(AddOnType.BIKE_RACK),
          description: 'Bike rack for 2-4 bicycles',
          available: true,
          pricing: {
            pricePerDay: 15,
            currency: 'NPR',
          },
          specifications: {
            capacity: '2-4 bikes',
            features: ['Universal fit', 'Easy installation'],
          },
        },
        {
          type: AddOnType.ROOF_BOX,
          name: getAddOnTypeDisplayName(AddOnType.ROOF_BOX),
          description: 'Large roof box for extra storage (400L)',
          available: true,
          pricing: {
            pricePerDay: 20,
            currency: 'NPR',
          },
          specifications: {
            capacity: '400 liters',
            features: ['Lockable', 'Weatherproof', 'Aerodynamic'],
          },
        },
        {
          type: AddOnType.PHONE_HOLDER,
          name: getAddOnTypeDisplayName(AddOnType.PHONE_HOLDER),
          description: 'Universal phone holder with 360° rotation',
          available: true,
          pricing: {
            pricePerRental: 5,
            currency: 'NPR',
          },
        },
        {
          type: AddOnType.USB_CHARGER,
          name: getAddOnTypeDisplayName(AddOnType.USB_CHARGER),
          description: 'Multi-port USB charger for devices',
          available: true,
          pricing: {
            pricePerRental: 3,
            currency: 'NPR',
          },
          specifications: {
            features: ['Multiple ports', 'Fast charging'],
          },
        },
        {
          type: AddOnType.DASHCAM,
          name: getAddOnTypeDisplayName(AddOnType.DASHCAM),
          description: 'HD dashcam for recording your journey',
          available: true,
          pricing: {
            pricePerDay: 15,
            currency: 'NPR',
          },
          specifications: {
            features: ['HD recording', 'Loop recording', 'Accident evidence'],
          },
        },
        {
          type: AddOnType.PREPAID_FUEL,
          name: getAddOnTypeDisplayName(AddOnType.PREPAID_FUEL),
          description: 'Prepay for fuel and return empty',
          available: true,
          pricing: {
            pricePerRental: undefined,
            currency: 'NPR',
          },
          specifications: {
            features: ['Convenience fee applies', 'Return with empty tank'],
          },
        },
        {
          type: AddOnType.TOLL_PASS,
          name: getAddOnTypeDisplayName(AddOnType.TOLL_PASS),
          description: 'Electronic toll pass for automatic payment',
          available: true,
          pricing: {
            pricePerRental: 10,
            currency: 'NPR',
          },
          specifications: {
            features: ['Automatic toll payment', 'No stopping required'],
          },
        },
      ];

      return addOns;
    } catch (error: any) {
      logger.error('Get add-ons error:', error);
      throw new AppError(
        error.message || 'Failed to get add-ons',
        error.statusCode || 500
      );
    }
  }

  /**
   * Generate car rental voucher PDF
   */
  async generateCarRentalVoucher(bookingId: string): Promise<Buffer> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: true },
      });

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      if ((booking as any).bookingType !== 'CAR_RENTAL') {
        throw new AppError('Not a car rental booking', 400);
      }

      const details = (booking as any).bookingDetails as any;

      const voucherData: any = {
        voucherId: `CR-${booking.id.slice(0, 8).toUpperCase()}`,
        bookingReference: booking.bookingReference,
        generatedAt: new Date(),
        vehicle: {
          category: details.category || 'STANDARD',
          make: details.make || 'Toyota',
          model: details.model || 'Camry',
          year: 2024,
          transmission: details.transmission || 'AUTOMATIC',
          fuelType: details.fuelType || 'PETROL',
          seats: details.seats || 5,
          doors: details.doors || 4,
        },
        rental: {
          pickupDate: new Date(details.pickupDate),
          pickupTime: details.pickupTime || '10:00',
          pickupLocation: {
            name: details.pickupLocation || 'Airport',
            address: details.pickupAddress || '',
            phone: details.pickupPhone || '',
          },
          dropoffDate: new Date(details.dropoffDate),
          dropoffTime: details.dropoffTime || '10:00',
          dropoffLocation: {
            name: details.dropoffLocation || 'Airport',
            address: details.dropoffAddress || '',
            phone: details.dropoffPhone || '',
          },
          totalDays: Math.ceil(
            (new Date(details.dropoffDate).getTime() - new Date(details.pickupDate).getTime()) /
            (1000 * 60 * 60 * 24)
          ),
        },
        driver: {
          firstName: booking.user.email.split('@')[0],
          lastName: 'Driver',
          email: booking.user.email,
          phone: booking.user.phone || '',
          licenseNumber: details.licenseNumber || 'XXXXX',
          licenseCountry: details.licenseCountry || 'US',
          age: 30,
        },
        insurance: details.insurance || { selectedCoverage: [] },
        addOns: details.addOns || [],
        pricing: {
          baseRate: Number(booking.totalAmount) * 0.7,
          insuranceTotal: Number(booking.totalAmount) * 0.15,
          addOnsTotal: Number(booking.totalAmount) * 0.05,
          taxes: Number(booking.totalAmount) * 0.1,
          total: Number(booking.totalAmount),
          currency: 'NPR',
          depositRequired: 500,
          paymentStatus: (booking as any).paymentStatus,
        },
        whatToBring: [
          'Valid driver license',
          'Credit card in driver name',
          'Proof of insurance (if applicable)',
          'Booking confirmation',
        ],
        pickupInstructions: [
          'Present this voucher at pickup counter',
          'Vehicle inspection will be done before departure',
          'Fuel policy: Full to Full',
        ],
        emergencyContact: {
          phone: '+1-800-RENTAL',
          email: 'support@rental.com',
          available24x7: true,
        },
      };

      const pdfBuffer = await voucherService.generateCarRentalVoucher(voucherData);
      
      logger.info(`Generated car rental voucher for booking ${bookingId}`);
      return pdfBuffer;
    } catch (error: any) {
      logger.error('Car rental voucher generation error:', error);
      throw new AppError(
        error.message || 'Failed to generate car rental voucher',
        error.statusCode || 500
      );
    }
  }

  /**
   * Get mock car rentals for demo (fallback when API not available)
   */
  private getMockCarRentals(params: CarRentalSearchParams): CarRentalOffer[] {
    const providers = [
      { code: 'HERTZ', name: 'Hertz' },
      { code: 'AVIS', name: 'Avis' },
      { code: 'ENTERPRISE', name: 'Enterprise' },
      { code: 'BUDGET', name: 'Budget' },
    ];

    const vehicleTypes = [
      { category: 'ECONOMY', type: 'SEDAN', make: 'Toyota', model: 'Corolla', seats: 5, doors: 4, basePrice: 35 },
      { category: 'COMPACT', type: 'HATCHBACK', make: 'Honda', model: 'Civic', seats: 5, doors: 4, basePrice: 40 },
      { category: 'STANDARD', type: 'SEDAN', make: 'Toyota', model: 'Camry', seats: 5, doors: 4, basePrice: 50 },
      { category: 'FULL_SIZE', type: 'SEDAN', make: 'Nissan', model: 'Altima', seats: 5, doors: 4, basePrice: 60 },
      { category: 'SUV', type: 'SUV', make: 'Toyota', model: 'RAV4', seats: 7, doors: 5, basePrice: 75 },
      { category: 'LUXURY', type: 'SEDAN', make: 'BMW', model: '3 Series', seats: 5, doors: 4, basePrice: 120 },
    ];

    // Calculate rental days
    const pickupDate = new Date(`${params.pickupDate}T${params.pickupTime}`);
    const dropoffDate = new Date(`${params.dropoffDate}T${params.dropoffTime}`);
    const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));

    const offers: CarRentalOffer[] = [];

    providers.forEach((provider, pIndex) => {
      vehicleTypes.forEach((vehicle, vIndex) => {
        const dailyRate = vehicle.basePrice * (1 + pIndex * 0.05); // Slight variation by provider
        const basePrice = dailyRate * days;
        const taxes = basePrice * 0.15;
        const total = basePrice + taxes;

        offers.push({
          id: `CAR-${provider.code}-${vehicle.category}-${Date.now()}-${pIndex}-${vIndex}`,
          provider: {
            code: provider.code,
            name: provider.name,
          },
          vehicle: {
            category: vehicle.category,
            type: vehicle.type,
            make: vehicle.make,
            model: vehicle.model,
            description: `${vehicle.make} ${vehicle.model} or similar`,
            seats: vehicle.seats,
            doors: vehicle.doors,
            transmission: vehicle.category === 'LUXURY' ? 'AUTOMATIC' : (Math.random() > 0.5 ? 'AUTOMATIC' : 'MANUAL'),
            fuelType: 'PETROL',
            airConditioning: true,
          },
          pickup: {
            locationCode: params.pickupLocationCode,
            address: `${params.pickupLocationCode} Airport`,
            date: params.pickupDate,
            time: params.pickupTime,
          },
          dropoff: {
            locationCode: params.dropoffLocationCode || params.pickupLocationCode,
            address: `${params.dropoffLocationCode || params.pickupLocationCode} Airport`,
            date: params.dropoffDate,
            time: params.dropoffTime,
          },
          price: {
            currency: params.currency || 'NPR',
            total: Math.round(total * 100) / 100,
            base: Math.round(basePrice * 100) / 100,
            taxes: Math.round(taxes * 100) / 100,
            extraFees: [
              { name: 'Airport Fee', amount: 15 },
              { name: 'Additional Driver', amount: 10 * days },
            ],
          },
          mileage: {
            unlimited: vehicle.category !== 'ECONOMY',
            allowance: vehicle.category === 'ECONOMY' ? 200 * days : undefined,
            unit: 'KM',
          },
          cancellation: {
            allowed: true,
            deadline: new Date(pickupDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            fee: vehicle.category === 'LUXURY' ? 50 : 25,
          },
          policies: {
            deposit: 'A security deposit may be required at pickup',
            insurance: 'Basic insurance included. Additional coverage available',
            fuelPolicy: 'Full to Full - Return with same fuel level',
          },
        });
      });
    });

    return offers;
  }
}

export const carRentalService = new CarRentalService();
export default carRentalService;
