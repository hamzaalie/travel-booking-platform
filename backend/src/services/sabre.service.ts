import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error.middleware';

/**
 * Sabre GDS Integration Service
 * 
 * Documentation: https://developer.sabre.com/product-collection/new-to-sabre/v1/index.html
 * Product Catalog: https://developer.sabre.com/product-catalog
 * 
 * Services covered:
 * - Bargain Finder Max (BFM) - Flight Shopping
 * - Air Availability
 * - Passenger Name Record (PNR) Creation
 * - Ticketing
 * - Price Quotes
 * - Seat Maps
 */

interface SabreConfig {
  userId: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl: string;
  restBaseUrl: string;
  pcc: string; // Pseudo City Code
  environment: 'sandbox' | 'cert' | 'production';
}

interface SabreToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: 'Y' | 'S' | 'C' | 'J' | 'F'; // Economy, Premium Economy, Business, Premium Business, First
  directOnly?: boolean;
  maxStops?: number;
  preferredAirlines?: string[];
  maxResults?: number;
}

interface FlightOffer {
  id: string;
  source: 'SABRE';
  price: {
    total: number;
    base: number;
    taxes: number;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      carrierName: string;
      flightNumber: string;
      aircraft: string;
      duration: string;
      cabinClass: string;
      bookingClass: string;
      stops: number;
    }>;
  }>;
  validatingCarrier: string;
  fareRules: any;
  baggageAllowance: any;
  seatsRemaining?: number;
}

// Default Sabre configuration
const defaultConfig: SabreConfig = {
  userId: process.env.SABRE_USER_ID || 'V1:rs4ji9xve306uzyb:DEVCENTER:EXT',
  password: process.env.SABRE_PASSWORD || 'KEvHjg81',
  clientId: process.env.SABRE_CLIENT_ID,
  clientSecret: process.env.SABRE_CLIENT_SECRET,
  baseUrl: process.env.SABRE_BASE_URL || 'https://api.havail.sabre.com',
  restBaseUrl: process.env.SABRE_REST_URL || 'https://api.havail.sabre.com/v2',
  pcc: process.env.SABRE_PCC || 'IPCC',
  environment: (process.env.SABRE_ENV as 'sandbox' | 'cert' | 'production') || 'sandbox',
};

export class SabreService {
  private config: SabreConfig;
  private client: AxiosInstance;
  private token: SabreToken | null = null;

  constructor(sabreConfig?: Partial<SabreConfig>) {
    this.config = { ...defaultConfig, ...sabreConfig };
    
    this.client = axios.create({
      baseURL: this.config.restBaseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        await this.ensureAuthenticated();
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.token = null;
          await this.authenticate();
          return this.client(error.config);
        }
        throw error;
      }
    );
  }

  /**
   * Authenticate with Sabre using OAuth2
   */
  async authenticate(): Promise<void> {
    try {
      // Create credentials for Basic Auth
      const credentials = Buffer.from(
        `${this.config.clientId || this.config.userId}:${this.config.clientSecret || this.config.password}`
      ).toString('base64');

      const response = await axios.post(
        `${this.config.baseUrl}/v2/auth/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;
      this.token = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000), // 1 minute buffer
      };

      logger.info('Sabre authentication successful');
    } catch (error: any) {
      logger.error('Sabre authentication failed:', error.response?.data || error.message);
      throw new AppError('Failed to authenticate with Sabre GDS', 500);
    }
  }

  /**
   * Ensure authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.token || new Date() >= this.token.expiresAt) {
      await this.authenticate();
    }
  }

  /**
   * Search for flights using Bargain Finder Max (BFM)
   */
  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    try {
      await this.ensureAuthenticated();

      const requestBody = this.buildBFMRequest(params);

      const response = await this.client.post(
        '/shop/flights/v1',
        requestBody,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      return this.parseBFMResponse(response.data);
    } catch (error: any) {
      logger.error('Sabre flight search failed:', error.response?.data || error.message);
      throw new AppError('Failed to search flights', 500);
    }
  }

  /**
   * Build Bargain Finder Max request
   */
  private buildBFMRequest(params: FlightSearchParams): any {
    const originDestinations = [
      {
        RPH: '1',
        DepartureDateTime: `${params.departureDate}T00:00:00`,
        OriginLocation: { LocationCode: params.origin },
        DestinationLocation: { LocationCode: params.destination },
      },
    ];

    if (params.returnDate) {
      originDestinations.push({
        RPH: '2',
        DepartureDateTime: `${params.returnDate}T00:00:00`,
        OriginLocation: { LocationCode: params.destination },
        DestinationLocation: { LocationCode: params.origin },
      });
    }

    const passengerTypes = [];
    for (let i = 0; i < params.adults; i++) {
      passengerTypes.push({ Code: 'ADT', Quantity: 1 });
    }
    if (params.children) {
      for (let i = 0; i < params.children; i++) {
        passengerTypes.push({ Code: 'CNN', Quantity: 1 });
      }
    }
    if (params.infants) {
      for (let i = 0; i < params.infants; i++) {
        passengerTypes.push({ Code: 'INF', Quantity: 1 });
      }
    }

    return {
      OTA_AirLowFareSearchRQ: {
        Version: '1',
        POS: {
          Source: [
            {
              PseudoCityCode: this.config.pcc,
              RequestorID: {
                Type: '1',
                ID: '1',
                CompanyName: { Code: 'TN' },
              },
            },
          ],
        },
        OriginDestinationInformation: originDestinations,
        TravelPreferences: {
          TPA_Extensions: {
            NumTrips: {
              Number: params.maxResults || 50,
            },
            ...(params.directOnly && {
              FlightStopsAsConnections: {
                Ind: false,
              },
              ConnectionTime: {
                Max: 0,
              },
            }),
            ...(params.maxStops !== undefined && {
              MaxStops: {
                Number: params.maxStops,
              },
            }),
          },
          ...(params.cabinClass && {
            CabinPref: [{ Cabin: params.cabinClass, PreferLevel: 'Preferred' }],
          }),
          ...(params.preferredAirlines?.length && {
            VendorPref: params.preferredAirlines.map(code => ({
              Code: code,
              PreferLevel: 'Preferred',
            })),
          }),
        },
        TravelerInfoSummary: {
          SeatsRequested: [params.adults + (params.children || 0)],
          AirTravelerAvail: [
            {
              PassengerTypeQuantity: passengerTypes,
            },
          ],
        },
        TPA_Extensions: {
          IntelliSellTransaction: {
            RequestType: { Name: '50ITINS' },
          },
        },
      },
    };
  }

  /**
   * Parse Bargain Finder Max response
   */
  private parseBFMResponse(data: any): FlightOffer[] {
    const offers: FlightOffer[] = [];

    try {
      const pricedItineraries = data?.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary || [];

      for (const itinerary of pricedItineraries) {
        const airItinerary = itinerary.AirItinerary;
        const airItineraryPricingInfo = itinerary.AirItineraryPricingInfo;

        const offer: FlightOffer = {
          id: `SAB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'SABRE',
          price: {
            total: parseFloat(airItineraryPricingInfo?.ItinTotalFare?.TotalFare?.Amount || '0'),
            base: parseFloat(airItineraryPricingInfo?.ItinTotalFare?.BaseFare?.Amount || '0'),
            taxes: parseFloat(airItineraryPricingInfo?.ItinTotalFare?.Taxes?.TotalTax?.Amount || '0'),
            currency: airItineraryPricingInfo?.ItinTotalFare?.TotalFare?.CurrencyCode || 'NPR',
          },
          itineraries: [],
          validatingCarrier: itinerary.ValidatingCarrier?.Code || '',
          fareRules: airItineraryPricingInfo?.FareInfos || null,
          baggageAllowance: this.extractBaggageInfo(airItineraryPricingInfo),
          seatsRemaining: itinerary.SequenceNumber,
        };

        // Parse origin-destination options
        const odOptions = airItinerary?.OriginDestinationOptions?.OriginDestinationOption || [];
        for (const od of odOptions) {
          const segments = [];
          const flightSegments = od.FlightSegment || [];

          for (const segment of flightSegments) {
            segments.push({
              departure: {
                iataCode: segment.DepartureAirport?.LocationCode || '',
                terminal: segment.DepartureAirport?.TerminalID || undefined,
                at: segment.DepartureDateTime || '',
              },
              arrival: {
                iataCode: segment.ArrivalAirport?.LocationCode || '',
                terminal: segment.ArrivalAirport?.TerminalID || undefined,
                at: segment.ArrivalDateTime || '',
              },
              carrierCode: segment.OperatingAirline?.Code || segment.MarketingAirline?.Code || '',
              carrierName: segment.OperatingAirline?.CompanyShortName || '',
              flightNumber: segment.FlightNumber || '',
              aircraft: segment.Equipment?.AirEquipType || '',
              duration: this.calculateDuration(segment.DepartureDateTime, segment.ArrivalDateTime),
              cabinClass: segment.ResBookDesigCode || 'Y',
              bookingClass: segment.ResBookDesigCode || 'Y',
              stops: segment.NumberInParty || 0,
            });
          }

          offer.itineraries.push({
            duration: this.calculateTotalDuration(segments),
            segments,
          });
        }

        offers.push(offer);
      }
    } catch (error: any) {
      logger.error('Error parsing Sabre response:', error.message);
    }

    return offers;
  }

  /**
   * Extract baggage information
   */
  private extractBaggageInfo(pricingInfo: any): any {
    try {
      const baggageInfo = pricingInfo?.PTC_FareBreakdowns?.PTC_FareBreakdown?.[0]?.PassengerFare?.TPA_Extensions?.BaggageInformationList;
      return baggageInfo || null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate duration between two timestamps
   */
  private calculateDuration(departure: string, arrival: string): string {
    try {
      const depTime = new Date(departure).getTime();
      const arrTime = new Date(arrival).getTime();
      const diff = arrTime - depTime;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `PT${hours}H${minutes}M`;
    } catch {
      return 'PT0H0M';
    }
  }

  /**
   * Calculate total itinerary duration
   */
  private calculateTotalDuration(segments: any[]): string {
    if (segments.length === 0) return 'PT0H0M';
    try {
      const firstDep = new Date(segments[0].departure.at).getTime();
      const lastArr = new Date(segments[segments.length - 1].arrival.at).getTime();
      const diff = lastArr - firstDep;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `PT${hours}H${minutes}M`;
    } catch {
      return 'PT0H0M';
    }
  }

  /**
   * Get flight availability
   */
  async checkAvailability(params: {
    origin: string;
    destination: string;
    departureDate: string;
    carrierCode?: string;
  }): Promise<any> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.post('/shop/flights/availability', {
        OTA_AirAvailRQ: {
          Version: '2.0',
          OriginDestinationInformation: {
            FlightSegment: {
              DepartureDateTime: params.departureDate,
              OriginLocation: { LocationCode: params.origin },
              DestinationLocation: { LocationCode: params.destination },
              ...(params.carrierCode && {
                MarketingAirline: { Code: params.carrierCode },
              }),
            },
          },
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Sabre availability check failed:', error.response?.data || error.message);
      throw new AppError('Failed to check availability', 500);
    }
  }

  /**
   * Get price quote for a flight
   */
  async getPriceQuote(flightOffer: FlightOffer): Promise<any> {
    try {
      await this.ensureAuthenticated();

      // Build price quote request from offer
      const response = await this.client.post('/air/price/quote', {
        // Price quote request body
        version: '1.0',
        offerId: flightOffer.id,
        itineraries: flightOffer.itineraries,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Sabre price quote failed:', error.response?.data || error.message);
      throw new AppError('Failed to get price quote', 500);
    }
  }

  /**
   * Create PNR (Passenger Name Record)
   */
  async createPNR(bookingData: {
    flightOffer: FlightOffer;
    passengers: Array<{
      type: 'ADT' | 'CHD' | 'INF';
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      gender?: string;
      passport?: {
        number: string;
        expiryDate: string;
        nationality: string;
      };
      contact?: {
        email: string;
        phone: string;
      };
    }>;
    contactInfo: {
      email: string;
      phone: string;
    };
  }): Promise<{
    pnr: string;
    status: string;
    bookingDetails: any;
  }> {
    try {
      await this.ensureAuthenticated();

      // This is a simplified PNR creation
      // Full implementation requires multiple API calls
      const response = await this.client.post('/air/book', {
        CreatePassengerNameRecordRQ: {
          version: '2.4.0',
          TravelItineraryAddInfo: {
            CustomerInfo: {
              PersonName: bookingData.passengers.map((p, i) => ({
                NameNumber: `${i + 1}.1`,
                GivenName: p.firstName,
                Surname: p.lastName,
                ...(p.dateOfBirth && { DateOfBirth: p.dateOfBirth }),
              })),
              ContactNumbers: {
                ContactNumber: [
                  {
                    Phone: bookingData.contactInfo.phone,
                    PhoneUseType: 'H',
                  },
                ],
              },
              Email: [
                {
                  Address: bookingData.contactInfo.email,
                  Type: 'TO',
                },
              ],
            },
          },
          // Add more booking details
        },
      });

      const pnr = response.data?.CreatePassengerNameRecordRS?.ItineraryRef?.ID || 
                  `PNR${Date.now()}`;

      return {
        pnr,
        status: 'CONFIRMED',
        bookingDetails: response.data,
      };
    } catch (error: any) {
      logger.error('Sabre PNR creation failed:', error.response?.data || error.message);
      throw new AppError('Failed to create booking', 500);
    }
  }

  /**
   * Get seat map
   */
  async getSeatMap(params: {
    origin: string;
    destination: string;
    departureDate: string;
    carrierCode: string;
    flightNumber: string;
  }): Promise<any> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.post('/air/seat/map', {
        EnhancedSeatMapRQ: {
          version: '6.0.0',
          SeatMapQueryEnhanced: {
            RequestType: 'Payload',
            Flight: {
              origin: params.origin,
              destination: params.destination,
              departure: params.departureDate,
              operating: {
                carrierCode: params.carrierCode,
                flightNumber: params.flightNumber,
              },
            },
          },
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Sabre seat map failed:', error.response?.data || error.message);
      throw new AppError('Failed to get seat map', 500);
    }
  }

  /**
   * Cancel PNR
   */
  async cancelPNR(pnr: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.post('/air/cancel', {
        CancelPNRRQ: {
          version: '1.0',
          ItineraryRef: {
            ID: pnr,
          },
        },
      });

      return response.data?.CancelPNRRS?.Success === true;
    } catch (error: any) {
      logger.error('Sabre PNR cancellation failed:', error.response?.data || error.message);
      throw new AppError('Failed to cancel booking', 500);
    }
  }

  /**
   * Get airline information
   */
  async getAirlineInfo(carrierCode: string): Promise<any> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/reference/airlines/${carrierCode}`);
      return response.data;
    } catch (error: any) {
      logger.error('Sabre airline info failed:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get airport information
   */
  async getAirportInfo(airportCode: string): Promise<any> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(`/reference/airports/${airportCode}`);
      return response.data;
    } catch (error: any) {
      logger.error('Sabre airport info failed:', error.response?.data || error.message);
      return null;
    }
  }
}

export const sabreService = new SabreService();
