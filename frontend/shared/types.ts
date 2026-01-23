// User Roles
export enum UserRole {
	SUPER_ADMIN = 'SUPER_ADMIN',
	FINANCE_ADMIN = 'FINANCE_ADMIN',
	OPERATIONS_TEAM = 'OPERATIONS_TEAM',
	B2B_AGENT = 'B2B_AGENT',
	B2C_CUSTOMER = 'B2C_CUSTOMER',
}

// Role display names for UI
export const RoleDisplayNames: Record<UserRole, string> = {
	[UserRole.SUPER_ADMIN]: 'Super Admin',
	[UserRole.FINANCE_ADMIN]: 'Finance Admin',
	[UserRole.OPERATIONS_TEAM]: 'Operations Team',
	[UserRole.B2B_AGENT]: 'B2B Agent',
	[UserRole.B2C_CUSTOMER]: 'B2C Customer',
};

// Helper to check if role is admin
export const isAdminRole = (role: UserRole): boolean => {
	return [
		UserRole.SUPER_ADMIN,
		UserRole.FINANCE_ADMIN,
		UserRole.OPERATIONS_TEAM
	].includes(role);
};

// Helper to check if role has financial access
export const hasFinancialAccess = (role: UserRole): boolean => {
	return [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN].includes(role);
};

// Helper to check if role can manage bookings
export const canManageBookings = (role: UserRole): boolean => {
	return [
		UserRole.SUPER_ADMIN,
		UserRole.OPERATIONS_TEAM,
		UserRole.B2B_AGENT
	].includes(role);
};

// Agent Status
export enum AgentStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	SUSPENDED = 'SUSPENDED',
}

// Wallet Status
export enum WalletStatus {
	ACTIVE = 'ACTIVE',
	FROZEN = 'FROZEN',
	SUSPENDED = 'SUSPENDED',
}

// Transaction Types
export enum TransactionType {
	CREDIT = 'CREDIT',
	DEBIT = 'DEBIT',
}

// Transaction Reasons
export enum TransactionReason {
	FUND_LOAD = 'FUND_LOAD',
	BOOKING_DEDUCTION = 'BOOKING_DEDUCTION',
	BOOKING_REFUND = 'BOOKING_REFUND',
	ADMIN_CREDIT = 'ADMIN_CREDIT',
	ADMIN_DEBIT = 'ADMIN_DEBIT',
	CANCELLATION_REFUND = 'CANCELLATION_REFUND',
}

// Fund Request Status
export enum FundRequestStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

// Booking Status
export enum BookingStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	TICKETED = 'TICKETED',
	CANCELLED = 'CANCELLED',
	REFUNDED = 'REFUNDED',
	FAILED = 'FAILED',
}

// Payment Status
export enum PaymentStatus {
	PENDING = 'PENDING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED',
	PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

// Payment Gateway
export enum PaymentGateway {
	ESEWA = 'ESEWA',
	KHALTI = 'KHALTI',
	STRIPE = 'STRIPE',
	PAYPAL = 'PAYPAL',
	WALLET = 'WALLET',
}

// Refund Status
export enum RefundStatus {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
}

// Markup Type
export enum MarkupType {
	FIXED = 'FIXED',
	PERCENTAGE = 'PERCENTAGE',
}

// Flight Class
export enum FlightClass {
	ECONOMY = 'ECONOMY',
	PREMIUM_ECONOMY = 'PREMIUM_ECONOMY',
	BUSINESS = 'BUSINESS',
	FIRST_CLASS = 'FIRST_CLASS',
}

// Trip Type
export enum TripType {
	ONE_WAY = 'ONE_WAY',
	ROUND_TRIP = 'ROUND_TRIP',
	MULTI_CITY = 'MULTI_CITY',
}

// User Interfaces
export interface IUser {
	id: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
	role: UserRole;
	isActive: boolean;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface IAgent {
	id: string;
	userId: string;
	agencyName: string;
	agencyLicense?: string;
	address?: string;
	city?: string;
	country?: string;
	status: AgentStatus;
	approvedBy?: string;
	approvedAt?: Date;
	rejectionReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

// Wallet Interfaces
export interface IWallet {
	id: string;
	agentId: string;
	balance: number;
	status: WalletStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface IWalletTransaction {
	id: string;
	walletId: string;
	type: TransactionType;
	amount: number;
	balanceBefore: number;
	balanceAfter: number;
	reason: TransactionReason;
	referenceId?: string;
	description?: string;
	createdBy: string;
	createdAt: Date;
}

export interface IFundRequest {
	id: string;
	agentId: string;
	amount: number;
	paymentProofUrl?: string;
	paymentMethod?: string;
	status: FundRequestStatus;
	requestedAt: Date;
	processedBy?: string;
	processedAt?: Date;
	rejectionReason?: string;
}

// Booking Interfaces
export interface IBooking {
	id: string;
	userId: string;
	agentId?: string;
	bookingReference: string;
	pnr?: string;
	tripType: TripType;
	origin: string;
	destination: string;
	departureDate: Date;
	returnDate?: Date;
	passengers: IPassenger[];
	baseFare: number;
	taxes: number;
	markup: number;
	agentMarkup: number;
	totalAmount: number;
	commissionAmount: number;
	status: BookingStatus;
	ticketUrls?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface IPassenger {
	firstName: string;
	lastName: string;
	dateOfBirth: Date;
	gender: string;
	passportNumber?: string;
	passportExpiry?: Date;
	nationality?: string;
	ticketNumber?: string;
}

// Payment Interfaces
export interface IPayment {
	id: string;
	bookingId: string;
	userId: string;
	amount: number;
	gateway: PaymentGateway;
	transactionId?: string;
	status: PaymentStatus;
	paymentData?: any;
	createdAt: Date;
	updatedAt: Date;
}

export interface IRefund {
	id: string;
	bookingId: string;
	paymentId?: string;
	walletTransactionId?: string;
	amount: number;
	penaltyAmount: number;
	refundAmount: number;
	status: RefundStatus;
	reason?: string;
	processedBy?: string;
	processedAt?: Date;
	createdAt: Date;
}

// Markup Interfaces
export interface IMarkup {
	id: string;
	name: string;
	type: MarkupType;
	value: number;
	isGlobal: boolean;
	agentId?: string;
	airlineCode?: string;
	routeCode?: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Audit Log Interface
export interface IAuditLog {
	id: string;
	userId: string;
	action: string;
	entity: string;
	entityId?: string;
	changes?: any;
	ipAddress?: string;
	userAgent?: string;
	createdAt: Date;
}

// Flight Search Interfaces
export interface IFlightSearchRequest {
	origin: string;
	destination: string;
	departureDate: string;
	returnDate?: string;
	adults: number;
	children?: number;
	infants?: number;
	class: FlightClass;
	tripType: TripType;
	multiCitySegments?: IMultiCitySegment[];
}

export interface IMultiCitySegment {
	origin: string;
	destination: string;
	departureDate: string;
}

export interface IFlightSearchResponse {
	flights: IFlight[];
	searchId: string;
}

export interface IFlight {
	id: string;
	segments: IFlightSegment[];
	totalDuration: number;
	baseFare: number;
	taxes: number;
	totalFare: number;
	fareRules?: IFareRule[];
	availableSeats: number;
}

export interface IFlightSegment {
	departureAirport: string;
	arrivalAirport: string;
	departureTime: Date;
	arrivalTime: Date;
	duration: number;
	airline: string;
	flightNumber: string;
	aircraft?: string;
	class: FlightClass;
	baggageAllowance?: IBaggage;
}

export interface IBaggage {
	cabin?: string;
	checked?: string;
}

export interface IFareRule {
	category: string;
	rules: string;
}

// API Response Types
export interface IApiResponse<T = any> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
}

export interface IPaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// Authentication Types
export interface ILoginRequest {
	email: string;
	password: string;
}

export interface IRegisterRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone?: string;
	role: UserRole;
	agencyName?: string;
	agencyLicense?: string;
}

export interface IAuthResponse {
	user: Omit<IUser, 'password'>;
	agent?: IAgent;
	accessToken: string;
	refreshToken: string;
}

// Wallet Operations
export interface IWalletDeductRequest {
	walletId: string;
	amount: number;
	reason: TransactionReason;
	referenceId?: string;
	description?: string;
}

export interface IWalletCreditRequest {
	walletId: string;
	amount: number;
	reason: TransactionReason;
	referenceId?: string;
	description?: string;
}

// Pricing
export interface IPriceCalculation {
	baseFare: number;
	taxes: number;
	globalMarkup: number;
	agentMarkup: number;
	totalPrice: number;
	commission: number;
}

// Reports
export interface IBookingReport {
	totalBookings: number;
	totalRevenue: number;
	totalCommission: number;
	bookingsByStatus: Record<BookingStatus, number>;
	revenueByMonth: IMonthlyRevenue[];
}

export interface IMonthlyRevenue {
	month: string;
	revenue: number;
	bookings: number;
}

export interface IAgentReport {
	agentId: string;
	agencyName: string;
	totalBookings: number;
	totalRevenue: number;
	totalCommission: number;
	walletBalance: number;
}

export interface IWalletReport {
	totalBalance: number;
	totalCredits: number;
	totalDebits: number;
	transactions: IWalletTransaction[];
}
