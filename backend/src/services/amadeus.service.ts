import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';

interface AmadeusAuth {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  max?: number;
}

/**
 * Amadeus GDS Integration Service
 * Handles all interactions with Amadeus API for flight operations
 */
export class AmadeusService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.amadeus.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get Amadeus access token (with caching)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${config.amadeus.baseUrl}/v1/security/oauth2/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.amadeus.apiKey,
          client_secret: config.amadeus.apiSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const auth: AmadeusAuth = response.data;
      this.accessToken = auth.access_token;
      this.tokenExpiry = new Date(Date.now() + (auth.expires_in - 60) * 1000);

      logger.info('Amadeus access token obtained');
      return this.accessToken;
    } catch (error: any) {
      logger.error('Amadeus authentication error:', error.response?.data || error.message);
      throw new AppError('Failed to authenticate with Amadeus', 500);
    }
  }

  /**
   * Search flights (one-way or round-trip)
   */
  async searchFlights(params: FlightSearchParams) {
    try {
      const token = await this.getAccessToken();

      const searchParams: any = {
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        adults: params.adults,
        max: params.max || 50,
      };

      if (params.returnDate) {
        searchParams.returnDate = params.returnDate;
      }

      if (params.children) {
        searchParams.children = params.children;
      }

      if (params.infants) {
        searchParams.infants = params.infants;
      }

      if (params.travelClass) {
        searchParams.travelClass = params.travelClass;
      }

      const response = await this.client.get('/v2/shopping/flight-offers', {
        params: searchParams,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logger.info(
        `Flight search completed: ${params.originLocationCode} -> ${params.destinationLocationCode}`
      );

      return this.formatFlightOffers(response.data);
    } catch (error: any) {
      logger.error('Flight search error:', error.response?.data || error.message);

      if (error.response?.status === 400) {
        throw new AppError(
          error.response.data?.errors?.[0]?.detail || 'Invalid search parameters',
          400
        );
      }

      throw new AppError('Flight search failed', 500);
    }
  }

  /**
   * Get flight price (revalidation before booking)
   */
  async priceFlightOffer(flightOffer: any) {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        '/v1/shopping/flight-offers/pricing',
        {
          data: {
            type: 'flight-offers-pricing',
            flightOffers: [flightOffer],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info('Flight price revalidated');

      return response.data;
    } catch (error: any) {
      logger.error('Price revalidation error:', error.response?.data || error.message);
      throw new AppError('Price revalidation failed', 500);
    }
  }

  /**
   * Create flight order (booking)
   */
  async createFlightOrder(flightOffer: any, travelers: any[]) {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        '/v1/booking/flight-orders',
        {
          data: {
            type: 'flight-order',
            flightOffers: [flightOffer],
            travelers: travelers,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info(`Flight order created: ${response.data.data.id}`);

      return response.data;
    } catch (error: any) {
      logger.error('Flight order creation error:', error.response?.data || error.message);

      if (error.response?.status === 400) {
        throw new AppError(
          error.response.data?.errors?.[0]?.detail || 'Invalid booking data',
          400
        );
      }

      throw new AppError('Flight booking failed', 500);
    }
  }

  /**
   * Get flight order details
   */
  async getFlightOrder(orderId: string) {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.get(`/v1/booking/flight-orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Get flight order error:', error.response?.data || error.message);
      throw new AppError('Failed to retrieve flight order', 500);
    }
  }

  /**
   * Cancel flight order
   */
  async cancelFlightOrder(orderId: string) {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.delete(`/v1/booking/flight-orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logger.info(`Flight order cancelled: ${orderId}`);

      return response.data;
    } catch (error: any) {
      logger.error('Cancel flight order error:', error.response?.data || error.message);
      throw new AppError('Flight cancellation failed', 500);
    }
  }

  /**
   * Get seat map
   */
  async getSeatMap(flightOffer: any) {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        '/v1/shopping/seatmaps',
        {
          data: [flightOffer],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Get seat map error:', error.response?.data || error.message);
      // Not critical, return null
      return null;
    }
  }

  /**
   * Format Amadeus flight offers to our schema
   */
  private formatFlightOffers(amadeusResponse: any) {
    if (!amadeusResponse.data || !Array.isArray(amadeusResponse.data)) {
      return [];
    }

    return amadeusResponse.data.map((offer: any) => ({
      id: offer.id,
      source: offer.source,
      instantTicketingRequired: offer.instantTicketingRequired,
      nonHomogeneous: offer.nonHomogeneous,
      oneWay: offer.oneWay,
      lastTicketingDate: offer.lastTicketingDate,
      numberOfBookableSeats: offer.numberOfBookableSeats,
      itineraries: offer.itineraries.map((itinerary: any) => ({
        duration: itinerary.duration,
        segments: itinerary.segments.map((segment: any) => ({
          departure: {
            iataCode: segment.departure.iataCode,
            terminal: segment.departure.terminal,
            at: segment.departure.at,
          },
          arrival: {
            iataCode: segment.arrival.iataCode,
            terminal: segment.arrival.terminal,
            at: segment.arrival.at,
          },
          carrierCode: segment.carrierCode,
          number: segment.number,
          aircraft: segment.aircraft,
          operating: segment.operating,
          duration: segment.duration,
          id: segment.id,
          numberOfStops: segment.numberOfStops,
          blacklistedInEU: segment.blacklistedInEU,
        })),
      })),
      price: {
        currency: offer.price.currency,
        total: offer.price.total,
        base: offer.price.base,
        fees: offer.price.fees,
        grandTotal: offer.price.grandTotal,
      },
      pricingOptions: offer.pricingOptions,
      validatingAirlineCodes: offer.validatingAirlineCodes,
      travelerPricings: offer.travelerPricings,
    }));
  }

  /**
   * Format traveler data for Amadeus
   */
  formatTravelerData(passengers: any[]): any[] {
    return passengers.map((passenger, index) => ({
      id: `${index + 1}`,
      dateOfBirth: passenger.dateOfBirth,
      name: {
        firstName: passenger.firstName,
        lastName: passenger.lastName,
      },
      gender: passenger.gender === 'M' ? 'MALE' : passenger.gender === 'F' ? 'FEMALE' : passenger.gender,
      contact: {
        emailAddress: passenger.email,
        phones: passenger.phone
          ? [
              {
                deviceType: 'MOBILE',
                countryCallingCode: passenger.countryCode || '977',
                number: passenger.phone,
              },
            ]
          : [],
      },
      documents: passenger.passportNumber
        ? [
            {
              documentType: 'PASSPORT',
              number: passenger.passportNumber,
              expiryDate: passenger.passportExpiry,
              issuanceCountry: passenger.nationality,
              nationality: passenger.nationality,
              holder: true,
            },
          ]
        : [],
    }));
  }

  /**
   * Search multi-city flights
   * Amadeus doesn't have dedicated multi-city endpoint, so we use flight-offers-search with originDestinations
   */
  async searchMultiCityFlights(segments: Array<{
    origin: string;
    destination: string;
    departureDate: string;
  }>, passengers: {
    adults: number;
    children?: number;
    infants?: number;
  }, travelClass?: string, max?: number) {
    try {
      const token = await this.getAccessToken();

      // Format origin-destinations for Amadeus API
      const originDestinations = segments.map((segment, index) => ({
        id: `${index + 1}`,
        originLocationCode: segment.origin,
        destinationLocationCode: segment.destination,
        departureDateTimeRange: {
          date: segment.departureDate,
        },
      }));

      const requestBody: any = {
        originDestinations,
        travelers: [],
        sources: ['GDS'],
        searchCriteria: {
          maxFlightOffers: max || 50,
          flightFilters: {
            cabinRestrictions: travelClass
              ? [
                  {
                    cabin: travelClass,
                    coverage: 'MOST_SEGMENTS',
                    originDestinationIds: originDestinations.map(od => od.id),
                  },
                ]
              : undefined,
          },
        },
      };

      // Add travelers
      for (let i = 1; i <= passengers.adults; i++) {
        requestBody.travelers.push({
          id: `${i}`,
          travelerType: 'ADULT',
        });
      }

      if (passengers.children) {
        for (let i = 1; i <= passengers.children; i++) {
          requestBody.travelers.push({
            id: `${passengers.adults + i}`,
            travelerType: 'CHILD',
          });
        }
      }

      if (passengers.infants) {
        for (let i = 1; i <= passengers.infants; i++) {
          requestBody.travelers.push({
            id: `${passengers.adults + (passengers.children || 0) + i}`,
            travelerType: 'HELD_INFANT',
          });
        }
      }

      const response = await this.client.post(
        '/v2/shopping/flight-offers',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      logger.info(
        `Multi-city flight search completed: ${segments.length} segments`
      );

      return this.formatMultiCityFlightOffers(response.data, segments.length);
    } catch (error: any) {
      logger.error('Multi-city flight search error:', error.response?.data || error.message);

      if (error.response?.status === 400) {
        throw new AppError(
          error.response.data?.errors?.[0]?.detail || 'Invalid multi-city search parameters',
          400
        );
      }

      throw new AppError('Multi-city flight search failed', 500);
    }
  }

  /**
   * Format multi-city flight offers response
   */
  private formatMultiCityFlightOffers(data: any, _segmentCount: number) {
    const offers = data.data || [];
    const dictionaries = data.dictionaries || {};

    return {
      searchId: Date.now().toString(),
      offers: offers.map((offer: any) => {
        const itineraries = offer.itineraries || [];
        
        // Group segments by their leg (multi-city leg)
        const groupedSegments: any[][] = [];
        itineraries.forEach((itinerary: any) => {
          const segments = itinerary.segments || [];
          groupedSegments.push(
            segments.map((segment: any) => ({
              departure: {
                iataCode: segment.departure.iataCode,
                terminal: segment.departure.terminal,
                at: segment.departure.at,
              },
              arrival: {
                iataCode: segment.arrival.iataCode,
                terminal: segment.arrival.terminal,
                at: segment.arrival.at,
              },
              carrierCode: segment.carrierCode,
              carrierName: dictionaries.carriers?.[segment.carrierCode] || segment.carrierCode,
              number: segment.number,
              aircraft: segment.aircraft ? {
                code: segment.aircraft.code,
                name: dictionaries.aircraft?.[segment.aircraft.code],
              } : undefined,
              duration: segment.duration,
              stops: segment.numberOfStops || 0,
              operatingCarrier: segment.operating?.carrierCode,
            }))
          );
        });

        const price = offer.price;
        const travelerPricings = offer.travelerPricings || [];

        return {
          id: offer.id,
          segments: groupedSegments,
          price: {
            currency: price.currency,
            total: parseFloat(price.total),
            base: parseFloat(price.base),
            fees: price.fees?.reduce((sum: number, fee: any) => sum + parseFloat(fee.amount), 0) || 0,
            taxes: price.taxes?.reduce((sum: number, tax: any) => sum + parseFloat(tax.amount), 0) || 0,
            perPassenger: this.extractPerPassengerPricing(travelerPricings),
          },
          fareDetails: {
            cabinClass: travelerPricings[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
            fareBasis: travelerPricings[0]?.fareDetailsBySegment?.[0]?.fareBasis,
            fareFamily: travelerPricings[0]?.fareDetailsBySegment?.[0]?.brandedFare,
            includedCheckedBags: travelerPricings[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity,
            includedCabinBags: 1, // Standard cabin bag
            refundable: offer.pricingOptions?.refundableFare || false,
            changeable: offer.pricingOptions?.changeable !== false,
            changeFee: offer.pricingOptions?.changeFee ? parseFloat(offer.pricingOptions.changeFee) : undefined,
          },
          totalDuration: itineraries.reduce((total: string, itin: any) => {
            // Sum up durations (simplified)
            return itin.duration || total;
          }, 'PT0M'),
          validatingAirline: offer.validatingAirlineCodes?.[0],
          bookingClass: travelerPricings[0]?.fareDetailsBySegment?.[0]?.class,
          availableSeats: offer.numberOfBookableSeats,
          lastTicketingDate: offer.lastTicketingDate,
        };
      }),
      meta: {
        count: offers.length,
        currency: offers[0]?.price?.currency || 'USD',
        searchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Extract per-passenger pricing from traveler pricings
   */
  private extractPerPassengerPricing(travelerPricings: any[]) {
    const pricing: any = {};

    travelerPricings.forEach((tp: any) => {
      const type = tp.travelerType?.toLowerCase() || 'adult';
      const total = parseFloat(tp.price?.total || '0');

      if (type.includes('adult')) {
        pricing.adult = total;
      } else if (type.includes('child')) {
        pricing.child = total;
      } else if (type.includes('infant')) {
        pricing.infant = total;
      }
    });

    return pricing;
  }

  /**
   * Generic method to make authenticated requests to Amadeus API
   */
  async makeRequest(endpoint: string, params?: any, method: 'GET' | 'POST' | 'DELETE' = 'GET', retry = true): Promise<any> {
    try {
      const token = await this.getAccessToken();

      const config: any = {
        method,
        url: endpoint,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (method === 'GET' && params) {
        config.params = params;
      } else if ((method === 'POST' || method === 'DELETE') && params) {
        config.data = params;
      }

      const response = await this.client.request(config);
      return response.data;
    } catch (error: any) {
      // If 401 error and retry is true, force refresh token and retry once
      if (error.response?.status === 401 && retry) {
        logger.warn('Amadeus token expired, refreshing and retrying...');
        // Clear the cached token to force refresh
        this.accessToken = null;
        this.tokenExpiry = null;
        // Retry the request with a fresh token
        return this.makeRequest(endpoint, params, method, false);
      }

      logger.error(`Amadeus API request error (${endpoint}):`, error.response?.data || error.message);
      throw new AppError(
        error.response?.data?.errors?.[0]?.detail || 'Amadeus API request failed',
        error.response?.status || 500
      );
    }
  }
}

export const amadeusService = new AmadeusService();

