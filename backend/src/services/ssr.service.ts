import { 
  SSRAvailability, 
  SeatMap, 
  Seat, 
  SeatType, 
  SeatClass, 
  SeatAvailability as SeatAvail,
  MealOption, 
  MealType, 
  BaggageAllowance, 
  ExtraBaggageOption, 
  BaggageType,
  AssistanceOption,
  AssistanceType,
  SSRRequest,
  SSRSummary,
  calculateSSRTotal,
} from '../../../shared/src/ssrTypes';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * SSR Service
 * Handles Special Service Requests: Seats, Meals, Baggage, Special Assistance
 * 
 * Note: This is a comprehensive implementation. In production, you would:
 * 1. Integrate with Amadeus Seat Map API (GET /v1/shopping/seatmaps)
 * 2. Integrate with airline APIs for real-time meal/baggage availability
 * 3. Cache seat maps and availability data
 * 4. Implement real-time synchronization with GDS
 */

class SSRService {
  /**
   * Get all SSR availability for a flight offer
   * In production: Call Amadeus /v1/shopping/seatmaps API
   */
  async getSSRAvailability(flightOfferId: string): Promise<SSRAvailability> {
    try {
      // Mock implementation - In production, call Amadeus API
      logger.info(`Fetching SSR availability for flight offer: ${flightOfferId}`);

      // For now, return mock data based on flight offer structure
      const availability: SSRAvailability = {
        flightOfferId,
        segments: await this.generateMockSegments(flightOfferId),
      };

      return availability;
    } catch (error) {
      logger.error('Error fetching SSR availability:', error);
      throw new Error('Failed to fetch SSR availability');
    }
  }

  /**
   * Get seat map for a specific flight segment
   * In production: Call Amadeus Seat Map API
   */
  async getSeatMap(flightSegmentId: string, aircraftType: string = 'Boeing 777-300ER'): Promise<SeatMap> {
    try {
      logger.info(`Fetching seat map for segment: ${flightSegmentId}, aircraft: ${aircraftType}`);

      // Generate mock seat map based on aircraft type
      return this.generateMockSeatMap(flightSegmentId, aircraftType);
    } catch (error) {
      logger.error('Error fetching seat map:', error);
      throw new Error('Failed to fetch seat map');
    }
  }

  /**
   * Get available meals for a flight segment
   */
  async getAvailableMeals(flightSegmentId: string, travelClass: string = 'ECONOMY'): Promise<MealOption[]> {
    try {
      logger.info(`Fetching meals for segment: ${flightSegmentId}, class: ${travelClass}`);

      // In production, fetch from airline API
      return this.generateMockMeals(travelClass);
    } catch (error) {
      logger.error('Error fetching meals:', error);
      throw new Error('Failed to fetch meal options');
    }
  }

  /**
   * Get baggage options for a booking
   */
  async getBaggageOptions(flightOfferId: string, travelClass: string = 'ECONOMY'): Promise<{
    included: BaggageAllowance[];
    extra: ExtraBaggageOption[];
  }> {
    try {
      logger.info(`Fetching baggage options for flight: ${flightOfferId}, class: ${travelClass}`);

      // In production, parse from flight offer or airline policy
      return this.generateMockBaggageOptions(travelClass);
    } catch (error) {
      logger.error('Error fetching baggage options:', error);
      throw new Error('Failed to fetch baggage options');
    }
  }

  /**
   * Get available special assistance options
   */
  async getAssistanceOptions(flightOfferId: string): Promise<AssistanceOption[]> {
    try {
      logger.info(`Fetching assistance options for flight: ${flightOfferId}`);

      // In production, fetch from airline capabilities
      return this.generateMockAssistanceOptions();
    } catch (error) {
      logger.error('Error fetching assistance options:', error);
      throw new Error('Failed to fetch assistance options');
    }
  }

  /**
   * Submit SSR requests for a booking
   */
  async submitSSRRequest(bookingId: string, ssrRequest: SSRRequest): Promise<void> {
    try {
      logger.info(`Submitting SSR request for booking: ${bookingId}`);

      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Calculate summary
      const summary = calculateSSRTotal(ssrRequest);

      // Store SSR data for each passenger
      for (const passenger of ssrRequest.passengers) {
        const passengerSSRPrice = this.calculatePassengerSSRTotal(passenger);

        await prisma.sSR.create({
          data: {
            bookingId,
            passengerId: passenger.passengerId,
            passengerName: passenger.seats?.[0]?.passengerName || 
                          passenger.meals?.[0]?.passengerName || 
                          'Unknown',
            seatSelections: passenger.seats ? JSON.parse(JSON.stringify(passenger.seats)) : null,
            seatTotalPrice: passenger.seats 
              ? passenger.seats.reduce((sum: number, s: any) => sum + s.price, 0) 
              : 0,
            mealSelections: passenger.meals ? JSON.parse(JSON.stringify(passenger.meals)) : null,
            mealTotalPrice: passenger.meals 
              ? passenger.meals.reduce((sum: number, m: any) => sum + m.price, 0) 
              : 0,
            baggageSelection: passenger.baggage ? JSON.parse(JSON.stringify(passenger.baggage)) : null,
            baggageTotalPrice: passenger.baggage?.totalPrice || 0,
            assistanceRequest: passenger.assistance ? JSON.parse(JSON.stringify(passenger.assistance)) : null,
            assistanceTotalPrice: passenger.assistance?.totalPrice || 0,
            totalPrice: passengerSSRPrice,
            currency: ssrRequest.currency,
            status: 'PENDING', // Would be confirmed after payment
          },
        });
      }

      logger.info(`SSR request submitted successfully. Total: ${summary.totalPrice} ${ssrRequest.currency}`);
    } catch (error) {
      logger.error('Error submitting SSR request:', error);
      throw error;
    }
  }

  /**
   * Get SSR summary for a booking
   */
  async getBookingSSRSummary(bookingId: string): Promise<SSRSummary> {
    try {
      const ssrs = await prisma.sSR.findMany({
        where: { bookingId },
      });

      const summary: SSRSummary = {
        seats: { count: 0, price: 0 },
        meals: { count: 0, price: 0 },
        baggage: { totalWeight: 0, price: 0 },
        assistance: { count: 0, price: 0 },
        totalPrice: 0,
        currency: ssrs[0]?.currency || 'NPR',
      };

      for (const ssr of ssrs) {
        summary.seats.price += Number(ssr.seatTotalPrice);
        summary.meals.price += Number(ssr.mealTotalPrice);
        summary.baggage.price += Number(ssr.baggageTotalPrice);
        summary.assistance.price += Number(ssr.assistanceTotalPrice);
        summary.totalPrice += Number(ssr.totalPrice);

        // Count selections
        if (ssr.seatSelections) {
          const seats = ssr.seatSelections as any[];
          summary.seats.count += Array.isArray(seats) ? seats.length : 0;
        }
        if (ssr.mealSelections) {
          const meals = ssr.mealSelections as any[];
          summary.meals.count += Array.isArray(meals) ? meals.length : 0;
        }
        if (ssr.baggageSelection) {
          const baggage = ssr.baggageSelection as any;
          summary.baggage.totalWeight += baggage.totalWeight || 0;
        }
        if (ssr.assistanceRequest) {
          const assistance = ssr.assistanceRequest as any;
          summary.assistance.count += Array.isArray(assistance.assistance) 
            ? assistance.assistance.length 
            : 0;
        }
      }

      return summary;
    } catch (error) {
      logger.error('Error getting booking SSR summary:', error);
      throw error;
    }
  }

  /**
   * Cancel SSR for a passenger
   */
  async cancelSSR(ssrId: string, reason?: string): Promise<void> {
    try {
      await prisma.sSR.update({
        where: { id: ssrId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      logger.info(`SSR ${ssrId} cancelled`);
    } catch (error) {
      logger.error('Error cancelling SSR:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS (Mock Data Generation)
  // In production, these would call real APIs
  // ============================================================================

  private calculatePassengerSSRTotal(passenger: SSRRequest['passengers'][0]): number {
    let total = 0;

    if (passenger.seats) {
      total += passenger.seats.reduce((sum: number, s: any) => sum + s.price, 0);
    }
    if (passenger.meals) {
      total += passenger.meals.reduce((sum: number, m: any) => sum + m.price, 0);
    }
    if (passenger.baggage) {
      total += passenger.baggage.totalPrice;
    }
    if (passenger.assistance) {
      total += passenger.assistance.totalPrice;
    }

    return total;
  }

  private async generateMockSegments(flightOfferId: string): Promise<SSRAvailability['segments']> {
    // Mock: Generate 1-2 segments
    const segments: SSRAvailability['segments'] = [
      {
        segmentId: `${flightOfferId}-seg-1`,
        segmentIndex: 0,
        departure: 'DEL',
        arrival: 'BKK',
        seatMap: this.generateMockSeatMap(`${flightOfferId}-seg-1`, 'Boeing 777-300ER'),
        meals: this.generateMockMeals('ECONOMY'),
        baggage: this.generateMockBaggageOptions('ECONOMY'),
        assistance: this.generateMockAssistanceOptions(),
      },
    ];

    return segments;
  }

  private generateMockSeatMap(flightSegmentId: string, aircraftType: string): SeatMap {
    const seatMap: SeatMap = {
      flightSegmentId,
      aircraftType,
      totalRows: 40,
      columnsPerRow: ['A', 'B', 'C', 'D', 'E', 'F'],
      exitRows: [12, 28],
      seats: [],
      configuration: '3-3',
    };

    // Generate seats
    for (let row = 1; row <= 40; row++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
        const isExitRow = seatMap.exitRows.includes(row);
        const isOccupied = Math.random() > 0.7; // 30% occupied
        
        const seat: Seat = {
          id: `${flightSegmentId}-${row}${col}`,
          row,
          column: col,
          type: col === 'A' || col === 'F' ? SeatType.WINDOW : 
                col === 'C' || col === 'D' ? SeatType.AISLE : 
                SeatType.MIDDLE,
          seatClass: row <= 10 ? SeatClass.BUSINESS : SeatClass.ECONOMY,
          availability: isOccupied ? SeatAvail.OCCUPIED : 
                       isExitRow ? SeatAvail.EXIT_ROW : 
                       SeatAvail.AVAILABLE,
          price: row <= 10 ? 5000 : // Business class
                 isExitRow ? 2000 : // Exit row
                 col === 'A' || col === 'F' ? 1500 : // Window
                 col === 'C' || col === 'D' ? 1000 : // Aisle
                 500, // Middle
          currency: 'NPR',
          features: [
            { type: 'RECLINE', available: row <= 10 || !isExitRow },
            { type: 'POWER_OUTLET', available: row <= 10 },
            { type: 'ENTERTAINMENT', available: true },
            { type: 'EXTRA_LEGROOM', available: isExitRow },
          ],
          restrictions: isExitRow ? ['Exit row - must be 18+', 'No infants'] : undefined,
        };

        seatMap.seats.push(seat);
      }
    }

    return seatMap;
  }

  private generateMockMeals(_travelClass: string): MealOption[] {
    const baseMeals: MealOption[] = [
      {
        code: 'STND',
        type: MealType.STANDARD,
        name: 'Standard Meal',
        description: 'Regular meal with chicken or fish',
        available: true,
        price: 0,
        currency: 'NPR',
        advanceOrderRequired: false,
      },
      {
        code: 'VGML',
        type: MealType.VEGETARIAN,
        name: 'Vegetarian Meal',
        description: 'Fresh vegetarian meal with seasonal vegetables',
        ingredients: ['Vegetables', 'Rice', 'Lentils'],
        available: true,
        price: 0,
        currency: 'NPR',
        advanceOrderRequired: false,
      },
      {
        code: 'AVML',
        type: MealType.VEGAN,
        name: 'Vegan Meal',
        description: 'Plant-based meal without any animal products',
        ingredients: ['Vegetables', 'Grains', 'Fruits'],
        allergens: [],
        available: true,
        price: 500,
        currency: 'NPR',
        advanceOrderRequired: true,
        minimumNoticeHours: 24,
      },
      {
        code: 'HNML',
        type: MealType.HINDU,
        name: 'Hindu Meal',
        description: 'Traditional Hindu vegetarian meal',
        available: true,
        price: 300,
        currency: 'NPR',
        advanceOrderRequired: true,
        minimumNoticeHours: 24,
      },
      {
        code: 'MOML',
        type: MealType.HALAL,
        name: 'Halal Meal',
        description: 'Muslim meal prepared according to Islamic law',
        available: true,
        price: 500,
        currency: 'NPR',
        advanceOrderRequired: true,
        minimumNoticeHours: 24,
      },
      {
        code: 'KSML',
        type: MealType.KOSHER,
        name: 'Kosher Meal',
        description: 'Jewish meal prepared according to kosher dietary laws',
        available: true,
        price: 800,
        currency: 'NPR',
        advanceOrderRequired: true,
        minimumNoticeHours: 48,
      },
      {
        code: 'DBML',
        type: MealType.DIABETIC,
        name: 'Diabetic Meal',
        description: 'Low sugar meal suitable for diabetics',
        available: true,
        price: 600,
        currency: 'NPR',
        advanceOrderRequired: true,
        minimumNoticeHours: 24,
      },
      {
        code: 'GFML',
        type: MealType.GLUTEN_FREE,
        name: 'Gluten-Free Meal',
        description: 'Meal without wheat, rye, or barley',
        allergens: [],
        available: true,
        price: 700,
        currency: 'NPR',
        advanceOrderRequired: true,
        minimumNoticeHours: 24,
      },
      {
        code: 'CHML',
        type: MealType.CHILD_MEAL,
        name: 'Child Meal',
        description: 'Kid-friendly meal with popular foods',
        available: true,
        price: 0,
        currency: 'NPR',
        advanceOrderRequired: false,
      },
    ];

    return baseMeals;
  }

  private generateMockBaggageOptions(travelClass: string): {
    included: BaggageAllowance[];
    extra: ExtraBaggageOption[];
  } {
    const included: BaggageAllowance[] = [
      {
        type: BaggageType.CABIN,
        quantity: 1,
        weight: 7,
        dimensions: {
          length: 56,
          width: 36,
          height: 23,
          maxWeight: 7,
        },
        included: true,
      },
      {
        type: BaggageType.CHECKED,
        quantity: travelClass === 'BUSINESS' || travelClass === 'FIRST' ? 2 : 1,
        weight: travelClass === 'BUSINESS' || travelClass === 'FIRST' ? 30 : 23,
        dimensions: {
          length: 158,
          width: 0,
          height: 0,
          maxWeight: travelClass === 'BUSINESS' || travelClass === 'FIRST' ? 30 : 23,
        },
        included: true,
      },
    ];

    const extra: ExtraBaggageOption[] = [
      {
        id: 'extra-checked-23kg',
        type: BaggageType.CHECKED,
        weight: 23,
        description: 'Additional 23kg checked bag',
        price: 3500,
        currency: 'NPR',
        dimensions: {
          length: 158,
          width: 0,
          height: 0,
          maxWeight: 23,
        },
      },
      {
        id: 'extra-checked-32kg',
        type: BaggageType.CHECKED,
        weight: 32,
        description: 'Heavy bag (32kg)',
        price: 5500,
        currency: 'NPR',
        dimensions: {
          length: 158,
          width: 0,
          height: 0,
          maxWeight: 32,
        },
      },
      {
        id: 'sports-equipment',
        type: BaggageType.SPORTS_EQUIPMENT,
        weight: 23,
        description: 'Sports equipment (golf clubs, skis, etc.)',
        price: 4000,
        currency: 'NPR',
        restrictions: ['Must be properly packed', 'Size restrictions apply'],
      },
      {
        id: 'musical-instrument',
        type: BaggageType.MUSICAL_INSTRUMENT,
        weight: 15,
        description: 'Musical instrument (guitar, violin, etc.)',
        price: 3000,
        currency: 'NPR',
        restrictions: ['Must fit in overhead compartment or require seat purchase'],
      },
    ];

    return { included, extra };
  }

  private generateMockAssistanceOptions(): AssistanceOption[] {
    return [
      {
        type: AssistanceType.WHEELCHAIR_FULLY_IMMOBILE,
        code: 'WCHC',
        name: 'Wheelchair - Fully Immobile',
        description: 'Passenger is completely immobile and requires wheelchair throughout journey',
        requirements: ['Medical certificate may be required', 'Advance notice of 48 hours'],
        documents: ['Medical clearance (if required)'],
        advanceNoticeHours: 48,
        price: 0,
        currency: 'NPR',
      },
      {
        type: AssistanceType.WHEELCHAIR_CANNOT_CLIMB_STAIRS,
        code: 'WCHS',
        name: 'Wheelchair - Cannot Climb Stairs',
        description: 'Passenger can walk on level surfaces but cannot climb stairs',
        requirements: ['Advance notice of 48 hours'],
        documents: [],
        advanceNoticeHours: 48,
        price: 0,
        currency: 'NPR',
      },
      {
        type: AssistanceType.WHEELCHAIR_LONG_DISTANCES,
        code: 'WCHR',
        name: 'Wheelchair - Long Distances',
        description: 'Passenger can walk short distances and climb stairs but needs wheelchair for long distances',
        requirements: ['Advance notice of 48 hours'],
        documents: [],
        advanceNoticeHours: 48,
        price: 0,
        currency: 'NPR',
      },
      {
        type: AssistanceType.BLIND,
        code: 'BLND',
        name: 'Visual Impairment',
        description: 'Passenger is blind or has severe visual impairment',
        requirements: ['Escort may be required', 'Advance notice of 48 hours'],
        documents: [],
        advanceNoticeHours: 48,
        price: 0,
        currency: 'NPR',
      },
      {
        type: AssistanceType.DEAF,
        code: 'DEAF',
        name: 'Hearing Impairment',
        description: 'Passenger is deaf or has severe hearing impairment',
        requirements: ['Visual safety briefing will be provided', 'Advance notice of 24 hours'],
        documents: [],
        advanceNoticeHours: 24,
        price: 0,
        currency: 'NPR',
      },
      {
        type: AssistanceType.MEDICAL_OXYGEN,
        code: 'MEDA',
        name: 'Medical Oxygen',
        description: 'Passenger requires medical oxygen during flight',
        requirements: ['Medical certificate required', 'Airline approval required', 'Advance notice of 72 hours'],
        documents: ['Medical certificate from physician', 'Oxygen equipment specifications'],
        advanceNoticeHours: 72,
        price: 8000,
        currency: 'NPR',
        availabilityDepends: ['Aircraft type', 'Flight duration'],
      },
      {
        type: AssistanceType.UNACCOMPANIED_MINOR,
        code: 'UMNR',
        name: 'Unaccompanied Minor',
        description: 'Child traveling alone (typically 5-15 years old)',
        requirements: [
          'Parent/guardian consent form required',
          'Meet and greet service at both airports',
          'Advance notice of 24 hours',
        ],
        documents: ['Parental consent form', 'Emergency contact information'],
        advanceNoticeHours: 24,
        price: 5000,
        currency: 'NPR',
      },
      {
        type: AssistanceType.GUIDE_DOG,
        code: 'GDGD',
        name: 'Guide Dog',
        description: 'Passenger traveling with a guide dog',
        requirements: [
          'Valid guide dog certificate',
          'Health certificate for the dog',
          'Advance notice of 48 hours',
        ],
        documents: ['Guide dog certificate', 'Veterinary health certificate', 'Vaccination records'],
        advanceNoticeHours: 48,
        price: 0,
        currency: 'NPR',
      },
      {
        type: AssistanceType.EMOTIONAL_SUPPORT_ANIMAL,
        code: 'ESAN',
        name: 'Emotional Support Animal',
        description: 'Passenger traveling with an emotional support animal',
        requirements: [
          'Mental health professional letter',
          'Animal health certificate',
          'Advance notice of 48 hours',
          'Subject to airline approval',
        ],
        documents: [
          'Mental health professional letter (within 1 year)',
          'Veterinary health certificate',
          'Animal training certificate',
        ],
        advanceNoticeHours: 48,
        price: 2000,
        currency: 'NPR',
      },
    ];
  }
}

export default new SSRService();
