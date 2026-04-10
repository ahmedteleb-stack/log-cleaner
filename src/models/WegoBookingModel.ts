import { z } from "zod";

// --- Base Types ---

export const CurrencyDescSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
}).passthrough();
export type CurrencyDesc = z.infer<typeof CurrencyDescSchema>;

export const ContactSchema = z.object({
  email: z.string().email().or(z.string()).optional(),
  phonePrefix: z.number().or(z.string()).optional(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.number().or(z.string()).optional(),
  fullName: z.string().optional(),
}).passthrough();
export type Contact = z.infer<typeof ContactSchema>;

export const PassengerSchema = z.object({
  id: z.number().or(z.string()),
  passengerId: z.string().optional(),
  documentType: z.string().optional(),
  documentId: z.string().optional(), // Passport number
  type: z.string().nullable().optional(),
  titleType: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  frequentFlyers: z.record(z.any()).optional(),
}).passthrough();
export type Passenger = z.infer<typeof PassengerSchema>;

export const InsurancePackageSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  supplier: z.string().optional(),
  amount: z.number().or(z.string()).optional(),
  currency: z.string().optional(),
  price: z.object({
    amount: z.number().or(z.string()).optional(),
    currencyCode: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();
export type InsurancePackage = z.infer<typeof InsurancePackageSchema>;

export const PaymentSchema = z.object({
  paymentMethodCode: z.string().optional(),
  paymentMethodName: z.string().optional(),
  cardType: z.string().optional(),
  amountInCents: z.number().optional(),
  amount: z.number().optional(),
  amountInUsd: z.number().optional(),
  chargedAmount: z.number().optional(),
  currencyCode: z.string().optional(),
  chargedCurrencyCode: z.string().optional(),
  status: z.string().optional(),
  paymentFeeAmount: z.number().optional(),
  paymentFeeAmountInUsd: z.number().optional(),
  createdAt: z.string().optional(),
}).passthrough();
export type Payment = z.infer<typeof PaymentSchema>;

export const PromoSchema = z.object({
  code: z.string(),
  discountAmount: z.number().optional(),
  currencyCode: z.string().optional(),
}).passthrough();
export type Promo = z.infer<typeof PromoSchema>;

export const PartnerPnrStatusSchema = z.object({
  pnr: z.string(),
  status: z.string(),
  overallTicketStatus: z.string().optional(),
  overallBookingStatus: z.string().optional(),
  lastSyncedAt: z.string().optional(),
}).passthrough();
export type PartnerPnrStatus = z.infer<typeof PartnerPnrStatusSchema>;

export const RefundSchema = z.object({
  amount: z.number(),
  currencyCode: z.string(),
  status: z.string(),
  type: z.string().optional(),
}).passthrough();
export type Refund = z.infer<typeof RefundSchema>;

// --- Flight Specific Types ---

export const BrandedFareSchema = z.object({
  code: z.string(),
  name: z.string(),
  uuid: z.string().optional(),
  calculatedPenalties: z.array(z.any()).optional(), // from prompts "calculated maximum penalties"
}).passthrough();
export type BrandedFare = z.infer<typeof BrandedFareSchema>;

export const PolicySchema = z.object({
  cancellationAllowed: z.boolean().optional(),
  modificationAllowed: z.boolean().optional(),
  cancellationFee: z.number().optional(),
  modificationFee: z.number().optional(),
  currencyCode: z.string().optional(),
  fareRulesSummary: z.string().optional(),
}).passthrough();
export type Policy = z.infer<typeof PolicySchema>;

export const AirlineScheduleChangeSchema = z.object({
  // usually maps to new departure/arrival etc
}).passthrough();

export const SegmentSchema = z.object({
  departureAirportCode: z.string(),
  arrivalAirportCode: z.string(),
  departureAirportName: z.string().optional(),
  arrivalAirportName: z.string().optional(),
  departureCityName: z.string().optional(),
  arrivalCityName: z.string().optional(),
  departureCountryName: z.string().optional(),
  arrivalCountryName: z.string().optional(),
  marketingAirlineCode: z.string().optional(),
  marketingFlightNumber: z.number().or(z.string()).optional(),
  marketingAirlineName: z.string().optional(),
  airlineRef: z.string().optional(), // Airline PNR
  statusLabel: z.string().optional(),
  segmentTicketStatus: z.string().optional(),
  hasScheduleChange: z.boolean().optional(),
  scheduleChanges: z.record(AirlineScheduleChangeSchema).optional(),
  changeType: z.string().optional(),
  departureDateTime: z.string().optional(),
  arrivalDateTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  stopoverDurationMinutes: z.number().optional(),
  cabin: z.string().optional(),
}).passthrough();
export type Segment = z.infer<typeof SegmentSchema>;

export const ItinerarySchema = z.object({
  segments: z.array(SegmentSchema).optional(),
  durationMinutes: z.number().optional(),
  departureAirportCode: z.string().optional(),
  arrivalAirportCode: z.string().optional(),
}).passthrough();
export type Itinerary = z.infer<typeof ItinerarySchema>;

export const TripSchema = z.object({
  id: z.string().nullable().optional(),
  providerCode: z.string().optional(),
  cabinCode: z.string().optional(),
  legs: z.array(z.any()).optional(),
}).passthrough();
export type Trip = z.infer<typeof TripSchema>;

export const BaggageRuleSchema = z.object({
  type: z.string(), // "CHECK_IN" or "CABIN"
  weight: z.number().optional(),
  unit: z.string().optional(),
  pieceCount: z.number().optional(),
  weightDescription: z.string().optional(),
  dimensionDescription: z.string().optional(),
}).passthrough();
export type BaggageRule = z.infer<typeof BaggageRuleSchema>;

export const TaxSchema = z.object({
  amount: z.number(),
  code: z.string(),
  description: z.string(),
  currencyCode: z.string(),
  amountUsd: z.number().optional(),
}).passthrough();

export const PriceSummarySchema = z.object({
  userBaseAmount: z.number().optional(),
  userTaxAmount: z.number().optional(),
  userTotalBookingFee: z.number().optional(),
  userTotalAmount: z.number().optional(),
  userCurrencyCode: z.string().optional(),
}).passthrough();

export const PriceSchema = z.object({
  summary: PriceSummarySchema.optional(),
  taxes: z.array(TaxSchema).optional(),
  payment: PaymentSchema.optional(),
}).passthrough();

export const FeeSchema = z.object({
  amount: z.number(),
  type: z.string(), // REFUND | EXCHANGE
  amountInUsd: z.number().optional(),
}).passthrough();
export type Fee = z.infer<typeof FeeSchema>;

export const PenaltiesSchema = z.object({
  fees: z.array(FeeSchema).optional(),
  calculated_penalties: z.array(z.any()).optional(),
}).passthrough();

// --- Main Response Model ---
export const BookingResponseSchema = z.object({
  responseCode: z.number(),
  bookingRef: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  itineraries: z.array(ItinerarySchema).optional(), // making optional to handle anomalies
  refunds: z.array(RefundSchema).nullable().optional(),
  policy: PolicySchema.optional(),
  trip: TripSchema.optional(),
  brandedFares: z.array(BrandedFareSchema).optional(),
  currencyDescs: z.array(CurrencyDescSchema).optional(),
  refundType: z.string().nullable().optional(),
  passengers: z.array(PassengerSchema).optional(),
  insurancePackages: z.array(InsurancePackageSchema).nullable().optional(),
  payments: z.array(PaymentSchema).optional(),
  promos: z.array(PromoSchema).nullable().optional(),
  contact: ContactSchema.optional(),
  isFlightPortalBooking: z.boolean().optional(),
  partnerPnrStatuses: z.array(PartnerPnrStatusSchema).nullable().optional(),
  isModifiedOffline: z.boolean().optional(),
  
  // Extended fields for logging/UI
  paymentExtension: z.any().optional(),
  price: PriceSchema.optional(),
  penalties: PenaltiesSchema.optional(),
  flightFareRules: z.string().optional(), // massive fare rules text
  fare_rules_summary: z.string().optional(),
  baggage: z.array(BaggageRuleSchema).optional(),
  baggage_mapping: z.array(z.array(z.array(BaggageRuleSchema))).optional(), // Handles nested passenger/leg mapping
  flights: z.any().optional(), // from raw python logs occasionally nested here
  expiredAt: z.string().optional(),
  bookingMetadata: z.any().optional(),
  pnr_status: z.any().optional(), // top level mapping fallback
}).passthrough();

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

// Utility to parse raw json
export function parseBookingResponse(jsonString: string): BookingResponse {
  const data = JSON.parse(jsonString);
  return BookingResponseSchema.parse(data);
}

export function safeParseBookingResponse(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    return BookingResponseSchema.safeParse(data);
  } catch (e) {
    return { success: false, error: e };
  }
}
