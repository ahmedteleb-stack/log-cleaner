import { FlattenedFareEntry } from './faresParser';

export interface ActionMapping {
  icon: string;
  label: string;
  key: string;
}

const ACTION_MAP: { match: (url: string, method: string) => boolean; action: ActionMapping }[] = [
  { match: (u, m) => u.includes('/compare') && m === 'GET', action: { icon: '🔍', label: 'Fare Search', key: 'fare_search' } },
  { match: (u, m) => u.includes('/revalidate') && m === 'GET', action: { icon: '🎫', label: 'Selected Fare Brands', key: 'revalidate' } },
  { match: (u, m) => u.includes('/passenger-info') && m === 'POST', action: { icon: '👤', label: 'Entered Passenger Details', key: 'passenger_info' } },
  { match: (u, m) => u.includes('/seats-availability') && m === 'GET', action: { icon: '💺', label: 'Viewed Seats', key: 'seats_view' } },
  { match: (u, m) => u.includes('/assign-seats') && m === 'POST', action: { icon: '✅', label: 'Selected Seats', key: 'seats_select' } },
  { match: (u, m) => u.includes('/meals/availability') && m === 'GET', action: { icon: '🍽️', label: 'Viewed Meals', key: 'meals_view' } },
  { match: (u, m) => u.includes('/meals/assign') && m === 'POST', action: { icon: '✅', label: 'Selected Meals', key: 'meals_select' } },
  { match: (u, m) => u.includes('/baggages/availability') && m === 'GET', action: { icon: '🧳', label: 'Viewed Baggage', key: 'baggage_view' } },
  { match: (u, m) => u.includes('/baggages/assign') && m === 'POST', action: { icon: '✅', label: 'Added Baggage', key: 'baggage_add' } },
  { match: (u, m) => u.includes('/addons/insurance') && m === 'GET', action: { icon: '🛡️', label: 'Viewed Insurance', key: 'insurance_view' } },
  { match: (u, m) => u.includes('/addons/confirm') && m === 'POST', action: { icon: '✅', label: 'Purchased Insurance', key: 'insurance_confirm' } },
  { match: (u, m) => u.includes('/payments/options') && m === 'GET', action: { icon: '💳', label: 'Viewed Payment Methods', key: 'payment_options' } },
  { match: (u, m) => u.includes('/payments') && m === 'POST' && !u.includes('/options') && !u.includes('/order-data'), action: { icon: '💰', label: 'Initiated Payment', key: 'payment_init' } },
  { match: (u) => u.includes('/ancillaries') && !u.includes('/seats') && !u.includes('/meals') && !u.includes('/baggages') && !u.includes('/assign'), action: { icon: '📦', label: 'Checked Ancillaries', key: 'ancillaries' } },
  { match: (u) => u.includes('/status'), action: { icon: '📊', label: 'Checked Status', key: 'status' } },
  { match: (u) => u.includes('/order-data'), action: { icon: '📋', label: 'Order Data', key: 'order_data' } },
];

export function getAction(entry: FlattenedFareEntry): ActionMapping {
  for (const { match, action } of ACTION_MAP) {
    if (match(entry.endpoint, entry.method)) return action;
  }
  const fallback = entry.endpoint.split('/').pop() || 'Unknown';
  return { icon: '📄', label: fallback, key: fallback };
}

export function getAllActionKeys(): { key: string; label: string; icon: string }[] {
  return ACTION_MAP.map(m => m.action);
}

// ── Structured detail extraction ──

export interface PassengerDetail {
  id?: string;
  type: string;
  titleType?: string;
  gender?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentId: string;
  documentExpiry?: string;
  passengerId?: string;
  frequentFlyers?: string[];
}

export interface ContactDetail {
  phonePrefix: string;
  phoneCountryCode?: string;
  phoneNumber: string;
  email: string;
  fullName: string;
}

export interface SegmentDetail {
  id?: string;
  airlineRef?: string;
  marketingAirlineCode: string;
  marketingFlightNumber: string;
  marketingAirlineName?: string;
  cabin?: string;
  designatorCode?: string;
  departureAirportCode: string;
  departureAirportName?: string;
  departureCityName?: string;
  departureCountryCode?: string;
  arrivalAirportCode: string;
  arrivalAirportName?: string;
  arrivalCityName?: string;
  arrivalCountryCode?: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
  departureTime?: string;
  duration?: string;
  durationMinutes?: number;
  overnight?: boolean;
  stopoverDurationMinutes?: number;
  brandedFare?: any;
  seatDetails?: any;
  mealDetails?: any;
  baggageDetails?: any;
  eticketViews?: any[];
}

export interface LegDetail {
  legId?: number | string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  durationMinutes?: number;
  stopoversCount?: number;
  airlineCodes?: string[];
  status?: string;
  segments: SegmentDetail[];
  scheduleChangeType?: string;
}

export interface PriceDetail {
  userCurrencyCode?: string;
  currencyCode: string;
  totalAmount: number;
  totalOriginalAmount?: number;
  totalTaxAmount?: number;
  totalBookingFee?: number;
  totalInsuranceAmount?: number;
  totalSeatAmount?: number;
  totalMealAmount?: number;
  totalBaggageAmount?: number;
  totalAmountUsd?: number;
  totalOriginalAmountUsd?: number;
  totalTaxAmountUsd?: number;
  totalBookingFeeUsd?: number;
  taxes?: TaxDetail[];
}

export interface TaxDetail {
  code?: string;
  description: string;
  amount: number;
  amountUsd?: number;
  currencyCode: string;
}

export interface PaymentDetail {
  paymentMethodCode: string;
  paymentMethodName?: string;
  cardType?: string;
  amountInCents?: number;
  amount?: number;
  amountInUsd?: number;
  chargedAmount?: number;
  currencyCode: string;
  chargedCurrencyCode?: string;
  status?: string;
  paymentFeeAmount?: number;
  paymentFeeAmountInUsd?: number;
  createdAt?: string;
  scheme?: string;
  threeDsEnabled?: boolean;
}

export interface PaymentMethodOption {
  channel?: string;
  name: string;
  code: string;
  cardType: string;
  feeAmount: number;
  feePercentage: number;
  feeCurrency: string;
  feeAmountInUsd?: number;
  imageUrl?: string;
}

export interface InsuranceDetail {
  uuid?: string;
  type: string;
  title: string;
  supplier?: string;
  supplierProvider?: string;
  amount: number;
  taxAmount?: number;
  currency: string;
  amountUsd?: number;
  pdfUrl?: string;
}

export interface BaggageDescDetail {
  id?: number;
  type: string;
  weight?: number;
  unit?: string;
  pieceCount?: number;
  weightText?: string;
  dimensionText?: string;
  included?: boolean;
}

export interface FeeDescDetail {
  id?: number;
  type: string;
  amount: number;
}

export interface BrandedFareDetail {
  id: string;
  legId: number | string;
  brandName: string;
  refundType?: string;
  totalAmount: number;
  currencyCode: string;
  totalAmountUsd?: number;
  penalties?: { type: string; amount: number; currencyCode: string }[];
  passengerInfos?: { type: string; amount: number; taxAmount: number; currencyCode: string }[];
  baggages?: BaggageDescDetail[];
}

export interface SeatAssignment {
  segmentId: string;
  passengerId: string;
  seatNumber: string;
}

export interface PolicyDetail {
  baggageDescs?: BaggageDescDetail[];
  feeDescs?: FeeDescDetail[];
  hasFlightFareRules?: boolean;
  fareRulesCount?: number;
  hasTermsAndConditions?: boolean;
  hasAirlineDisclaimers?: boolean;
}

export interface PartnerSegmentStatus {
  departureAirportCode: string;
  arrivalAirportCode: string;
  marketingAirlineCode: string;
  marketingFlightNumber: string;
  statusLabel?: string;
  segmentTicketStatus?: string;
  hasScheduleChange?: boolean;
  changeType?: string;
}

export interface PartnerPnrStatus {
  overallBookingStatus?: string;
  overallTicketStatus?: string;
  hasScheduleChange?: boolean;
  lastSyncedAt?: string;
  segments: PartnerSegmentStatus[];
}

export interface ExtractedDetails {
  passengers?: PassengerDetail[];
  contact?: ContactDetail;
  legs?: LegDetail[];
  price?: PriceDetail;
  payment?: PaymentDetail;
  paymentMethods?: PaymentMethodOption[];
  insurances?: InsuranceDetail[];
  brandedFares?: BrandedFareDetail[];
  seatAssignments?: SeatAssignment[];
  policy?: PolicyDetail;
  partnerPnrStatus?: PartnerPnrStatus;
  bookingRef?: string;
  paymentOrderId?: string;
  expiredAt?: string;
  responseCode?: string;
  priceChanged?: boolean;
  oldPrice?: number;
  newPrice?: number;
  orderItems?: { name: string; type: string; price: number; currency: string }[];
  summaryLines?: string[]; // fallback text lines
}

export function extractDetails(entry: FlattenedFareEntry): ExtractedDetails {
  const action = getAction(entry);
  const reqData = tryParse(entry._rawRequestBody);
  const respData = tryParse(entry._rawResponseBody);
  const details: ExtractedDetails = {};

  switch (action.key) {
    case 'revalidate':
    case 'fare_search':
      extractRevalidateDetails(respData, details);
      break;
    case 'passenger_info':
      extractPassengerInfoDetails(reqData, respData, details);
      break;
    case 'seats_view':
      extractSeatsViewDetails(respData, details);
      break;
    case 'seats_select':
      extractSeatsSelectDetails(reqData, respData, details);
      break;
    case 'meals_view':
      extractMealsViewDetails(respData, details);
      break;
    case 'meals_select':
      extractMealsSelectDetails(reqData, respData, details);
      break;
    case 'baggage_view':
      extractBaggageViewDetails(respData, details);
      break;
    case 'baggage_add':
      extractBaggageAddDetails(reqData, respData, details);
      break;
    case 'insurance_view':
      extractInsuranceViewDetails(respData, details);
      break;
    case 'insurance_confirm':
      extractInsuranceConfirmDetails(reqData, respData, details);
      break;
    case 'payment_options':
      extractPaymentOptionsDetails(respData, details);
      break;
    case 'payment_init':
      extractPaymentInitDetails(respData, details);
      break;
    case 'status':
      extractStatusDetails(respData, details);
      break;
    case 'order_data':
      extractOrderDataDetails(respData, details);
      break;
    case 'ancillaries':
      extractAncillariesDetails(respData, entry, details);
      break;
  }

  return details;
}

// ── Helpers ──

function tryParse(s: string): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function parseLegs(rawLegs: any[]): LegDetail[] {
  return (rawLegs || []).map((l: any) => ({
    legId: l.id ?? l.legId ?? '',
    departureAirportCode: l.departureAirportCode || '',
    arrivalAirportCode: l.arrivalAirportCode || '',
    departureDateTime: l.departureDateTime || '',
    arrivalDateTime: l.arrivalDateTime || '',
    departureTime: l.departureTime || '',
    arrivalTime: l.arrivalTime || '',
    duration: l.duration || '',
    durationMinutes: l.durationMinutes,
    stopoversCount: l.stopoversCount || 0,
    airlineCodes: l.airlineCodes || [],
    status: l.status || '',
    scheduleChangeType: l.scheduleChangeType || '',
    segments: (l.segments || []).map((s: any) => ({
      id: s.id || '',
      airlineRef: s.airlineRef || '',
      marketingAirlineCode: s.airlineCode || s.marketingAirlineCode || '',
      marketingFlightNumber: s.flightNumber || s.marketingFlightNumber || '',
      marketingAirlineName: s.airlineName || s.marketingAirlineName || '',
      cabin: s.cabinClass || s.cabin || '',
      designatorCode: s.designatorCode || '',
      departureAirportCode: s.departureAirportCode || '',
      departureAirportName: s.departureAirportName || '',
      departureCityName: s.departureCityName || '',
      departureCountryCode: s.departureCountryCode || '',
      arrivalAirportCode: s.arrivalAirportCode || '',
      arrivalAirportName: s.arrivalAirportName || '',
      arrivalCityName: s.arrivalCityName || '',
      arrivalCountryCode: s.arrivalCountryCode || '',
      departureDateTime: s.departureDateTime || '',
      arrivalDateTime: s.arrivalDateTime || '',
      departureTime: s.departureTime || '',
      duration: s.duration || '',
      durationMinutes: s.durationMinutes,
      overnight: s.overnight,
      stopoverDurationMinutes: s.stopoverDurationMinutes,
      brandedFare: s.brandedFare || null,
      seatDetails: s.seatDetails || null,
      mealDetails: s.mealDetails || null,
      baggageDetails: s.baggageDetails || null,
      eticketViews: s.eticketViews || [],
    })),
  }));
}

function parsePrice(p: any): PriceDetail | undefined {
  if (!p) return undefined;
  return {
    currencyCode: p.currencyCode || p.userCurrencyCode || '',
    userCurrencyCode: p.userCurrencyCode || '',
    totalAmount: p.totalAmount ?? p.userTotalAmount ?? 0,
    totalOriginalAmount: p.totalOriginalAmount ?? p.userBaseAmount,
    totalTaxAmount: p.totalTaxAmount ?? p.userTaxAmount,
    totalBookingFee: p.totalBookingFee ?? p.userTotalBookingFee,
    totalInsuranceAmount: p.totalInsuranceAmount,
    totalSeatAmount: p.totalSeatAmount,
    totalMealAmount: p.totalMealAmount,
    totalBaggageAmount: p.totalBaggageAmount,
    totalAmountUsd: p.totalAmountUsd ?? p.totalAmountInUsd,
    totalOriginalAmountUsd: p.totalOriginalAmountUsd ?? p.baseAmountInUsd,
    totalTaxAmountUsd: p.totalTaxAmountUsd ?? p.taxAmountInUsd,
    totalBookingFeeUsd: p.totalBookingFeeUsd ?? p.totalBookingFeeInUsd,
  };
}

function parsePassengers(passengers: any[]): PassengerDetail[] {
  return (passengers || []).map((p: any) => ({
    id: p.id || '',
    type: p.type || p.gender || '',
    titleType: p.titleType || '',
    gender: p.gender || '',
    firstName: p.firstName || p.fullName?.split(' ').slice(0, -1).join(' ') || '',
    middleName: p.middleName || '',
    lastName: p.lastName || p.fullName?.split(' ').pop() || '',
    dateOfBirth: p.dateOfBirth || '',
    nationality: p.nationalityCountryCode || p.nationality || '',
    documentType: p.passengerDocument?.type || p.documentType || '',
    documentId: p.passengerDocument?.number || p.documentId || '',
    documentExpiry: p.passengerDocument?.expiryDate || p.documentExpiryDate || '',
    passengerId: p.passengerId || '',
    frequentFlyers: p.frequentFlyers || [],
  }));
}

function parseContact(c: any): ContactDetail | undefined {
  if (!c) return undefined;
  return {
    phonePrefix: String(c.phonePrefix || ''),
    phoneCountryCode: c.phoneCountryCode || c.countryCode || '',
    phoneNumber: String(c.phoneNumber || ''),
    email: c.email || '',
    fullName: c.fullName || '',
  };
}

function parseBrandedFares(fares: any[], baggageDescs?: any[]): BrandedFareDetail[] {
  return (fares || []).map((f: any) => {
    const bf: BrandedFareDetail = {
      id: f.id || '',
      legId: f.legId ?? '',
      brandName: f.brandName || '',
      refundType: f.refundType || '',
      totalAmount: f.price?.totalAmount ?? 0,
      currencyCode: f.price?.currencyCode || '',
      totalAmountUsd: f.price?.totalAmountUsd,
      penalties: (f.penalties || []).map((p: any) => ({
        type: p.type || '',
        amount: p.amount ?? 0,
        currencyCode: p.currencyCode || '',
      })),
      passengerInfos: (f.passengerInfos || []).map((pi: any) => ({
        type: pi.type || '',
        amount: pi.price?.amount ?? 0,
        taxAmount: pi.price?.taxAmount ?? 0,
        currencyCode: pi.price?.currencyCode || '',
      })),
    };
    // Resolve baggage references if baggageDescs available
    if (baggageDescs && f.passengerInfos?.[0]?.baggages) {
      const bagIds = new Set<number>();
      const extractIds = (arr: any) => {
        if (Array.isArray(arr)) arr.forEach((a: any) => extractIds(a));
        else if (typeof arr === 'number') bagIds.add(arr);
      };
      extractIds(f.passengerInfos[0].baggages);
      bf.baggages = Array.from(bagIds).map(id => {
        const bd = baggageDescs.find((b: any) => b.id === id);
        return bd ? { id: bd.id, type: bd.type || '', weight: bd.weight, unit: bd.unit || '', pieceCount: bd.pieceCount, weightText: bd.weightText || '', dimensionText: bd.dimensionText || '', included: bd.included } : { type: 'unknown', weight: 0, unit: '' };
      }).filter(b => b.type !== 'unknown');
    }
    return bf;
  });
}

function parseInsurances(ins: any[]): InsuranceDetail[] {
  return (ins || []).map((i: any) => ({
    uuid: i.uuid || '',
    type: i.type || '',
    title: i.title || '',
    supplier: i.supplier || '',
    supplierProvider: i.supplierProvider || '',
    amount: i.price?.totalAmount ?? i.amount ?? 0,
    taxAmount: i.price?.totalTaxAmount,
    currency: i.price?.currencyCode || i.currencyCode || '',
    amountUsd: i.price?.totalAmountUsd,
    pdfUrl: i.policies?.[0]?.pdfUrl || '',
  }));
}

function parsePolicy(data: any): PolicyDetail | undefined {
  const has = data.baggageDescs || data.feeDescs || data.termsAndConditionViews || data.airlineDisclaimerDescs || data.flightFareRules;
  if (!has) return undefined;
  return {
    baggageDescs: (data.baggageDescs || []).map((b: any) => ({
      id: b.id,
      type: b.type || '',
      weight: b.weight,
      unit: b.unit || '',
      pieceCount: b.pieceCount,
      weightText: b.weightText || '',
      dimensionText: b.dimensionText || '',
      included: b.included,
    })),
    feeDescs: (data.feeDescs || []).map((f: any) => ({
      id: f.id,
      type: f.type || '',
      amount: f.amount ?? 0,
    })),
    hasFlightFareRules: !!(data.flightFareRules?.length),
    fareRulesCount: data.flightFareRules?.length || 0,
    hasTermsAndConditions: !!(data.termsAndConditionViews?.length),
    hasAirlineDisclaimers: !!(data.airlineDisclaimerDescs?.length || data.airlineDisclaimerViews?.length),
  };
}

// ── Endpoint-specific extractors ──

function extractRevalidateDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  if (data.trip?.legs) d.legs = parseLegs(data.trip.legs);
  if (data.priceInfo) {
    d.priceChanged = data.priceInfo.priceChanged;
    d.oldPrice = data.priceInfo.oldTotalAmount;
    d.newPrice = data.priceInfo.newTotalAmount;
    d.price = {
      currencyCode: data.priceInfo.currencyCode || '',
      totalAmount: data.priceInfo.newTotalAmount ?? data.priceInfo.oldTotalAmount ?? 0,
      totalAmountUsd: data.priceInfo.newTotalAmountInUsd,
    };
  }
  if (data.brandedFares) d.brandedFares = parseBrandedFares(data.brandedFares, data.baggageDescs);
  d.policy = parsePolicy(data);
}

function extractPassengerInfoDetails(reqData: any, respData: any, d: ExtractedDetails) {
  if (reqData?.passengers) d.passengers = parsePassengers(reqData.passengers);
  if (reqData?.contact) d.contact = parseContact(reqData.contact);
  if (reqData?.brandedFareIds) {
    d.summaryLines = [`Selected fare IDs: ${reqData.brandedFareIds.join(', ')}`];
  }
  if (respData) {
    d.bookingRef = respData.bookingRef;
    d.paymentOrderId = respData.paymentOrderId;
    d.expiredAt = respData.expiredAt;
    if (respData.price) d.price = parsePrice(respData.price);
    if (respData.insurancePackages) d.insurances = parseInsurances(respData.insurancePackages);
  }
}

function extractSeatsViewDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  if (data.passengers) d.passengers = parsePassengers(data.passengers);
  const lines: string[] = [];
  if (data.seatInfo) {
    for (const seg of data.seatInfo) {
      const count = seg.seats?.length || 0;
      lines.push(`${seg.segmentId}: ${count} seats available`);
    }
  }
  d.summaryLines = lines;
}

function extractSeatsSelectDetails(reqData: any, respData: any, d: ExtractedDetails) {
  const assignments: SeatAssignment[] = [];
  if (reqData?.seatInfo) {
    for (const seg of reqData.seatInfo) {
      for (const s of seg.seats || []) {
        assignments.push({
          segmentId: seg.segmentId || '',
          passengerId: s.passengerId || '',
          seatNumber: s.seatNumber || '',
        });
      }
    }
  }
  d.seatAssignments = assignments;
  d.bookingRef = reqData?.bookingRef;
  if (respData) {
    d.price = { currencyCode: respData.currencyCode || '', totalAmount: respData.totalAmount ?? 0, totalAmountUsd: respData.totalAmountUsd };
  }
}

function extractMealsViewDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  const lines: string[] = [];
  const segments = data.segmentsMealInfo || data.mealInfo || [];
  for (const seg of segments) {
    const count = seg.meals?.length || seg.passengerMealInfo?.reduce((s: number, p: any) => s + (p.meals?.length || 0), 0) || 0;
    lines.push(`${seg.segmentId}: ${count} meal options`);
  }
  d.summaryLines = lines;
}

function extractMealsSelectDetails(reqData: any, respData: any, d: ExtractedDetails) {
  const lines: string[] = [];
  if (reqData?.segmentsMealInfo) {
    for (const seg of reqData.segmentsMealInfo) {
      for (const pax of seg.passengerMealInfo || []) {
        const name = formatPassengerId(pax.passengerId);
        const meals = (pax.meals || []).map((m: any) => m.mealCode || m.code).join(', ');
        lines.push(`${seg.segmentId}: ${name} → ${meals}`);
      }
    }
  }
  d.summaryLines = lines;
  d.bookingRef = reqData?.bookingRef;
  if (respData) {
    d.price = { currencyCode: respData.currencyCode || '', totalAmount: respData.totalAmount ?? 0, totalAmountUsd: respData.totalAmountUsd };
  }
}

function extractBaggageViewDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  const lines: string[] = [];
  for (const leg of data.legBaggageInfo || []) {
    const opts = leg.baggageOptions?.length || leg.passengerBaggageInfos?.length || 0;
    lines.push(`${leg.legId}: ${opts} baggage options`);
  }
  d.summaryLines = lines;
}

function extractBaggageAddDetails(reqData: any, respData: any, d: ExtractedDetails) {
  const lines: string[] = [];
  if (reqData?.legBaggageInfo) {
    for (const leg of reqData.legBaggageInfo) {
      for (const pax of leg.passengerBaggageInfos || []) {
        const name = formatPassengerId(pax.passengerId);
        for (const b of pax.baggages || []) {
          lines.push(`${leg.legId}: ${name} added ${b.weight}${b.unit} ${b.baggageType || 'baggage'}`);
        }
      }
    }
  }
  d.summaryLines = lines;
  d.bookingRef = reqData?.bookingRef;
  if (respData) {
    d.price = { currencyCode: respData.currencyCode || '', totalAmount: respData.totalAmount ?? 0, totalAmountUsd: respData.totalAmountUsd };
  }
}

function extractInsuranceViewDetails(data: any, d: ExtractedDetails) {
  if (Array.isArray(data)) d.insurances = parseInsurances(data);
}

function extractInsuranceConfirmDetails(reqData: any, respData: any, d: ExtractedDetails) {
  d.paymentOrderId = reqData?.orderId;
  const lines: string[] = [];
  if (reqData?.insurances) {
    lines.push(`Confirmed ${reqData.insurances.length} insurance package(s)`);
  }
  if (respData) {
    d.bookingRef = respData.bookingRef;
    if (respData.insurancePackages) d.insurances = parseInsurances(respData.insurancePackages);
    d.price = { currencyCode: respData.currencyCode || 'SAR', totalAmount: respData.totalAmount ?? 0 };
  }
  d.summaryLines = lines;
}

function extractPaymentOptionsDetails(data: any, d: ExtractedDetails) {
  if (!data?.paymentMethods) return;
  d.paymentMethods = data.paymentMethods.map((m: any) => ({
    channel: m.channel || '',
    name: m.name || '',
    code: m.code || '',
    cardType: m.cardType || '',
    feeAmount: m.fee?.amount ?? 0,
    feePercentage: m.fee?.percentage ?? 0,
    feeCurrency: m.fee?.currencyCode || '',
    feeAmountInUsd: m.fee?.amountInUsd,
    imageUrl: m.imageUrl || '',
  }));
}

function extractPaymentInitDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  d.payment = {
    paymentMethodCode: data.paymentMethodCode || '',
    paymentMethodName: data.paymentMethodName || '',
    cardType: data.cardType || '',
    amountInCents: data.totalAmountInCents,
    amount: data.totalAmountInCents ? data.totalAmountInCents / 100 : undefined,
    amountInUsd: data.amountInUsd,
    currencyCode: data.currencyCode || '',
    chargedCurrencyCode: data.chargedCurrencyCode || '',
    status: data.statusCode?.toString() || '',
    scheme: data.scheme || '',
    threeDsEnabled: data.threeDsEnabled,
    createdAt: data.createdAt || '',
  };
  d.bookingRef = data.bookingRef;
  d.expiredAt = data.bookingExpiredAt;
}

function extractStatusDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  d.bookingRef = data.bookingRef;
  d.responseCode = data.responseCode?.toString();
  d.expiredAt = data.expiredAt;
  if (data.itinerary?.legs) d.legs = parseLegs(data.itinerary.legs);
  if (data.partnerPnrStatus) {
    d.partnerPnrStatus = {
      overallBookingStatus: data.partnerPnrStatus.overallBookingStatus,
      overallTicketStatus: data.partnerPnrStatus.overallTicketStatus,
      hasScheduleChange: data.partnerPnrStatus.hasScheduleChange,
      lastSyncedAt: data.partnerPnrStatus.lastSyncedAt,
      segments: (data.partnerPnrStatus.segments || []).map((s: any) => ({
        departureAirportCode: s.departureAirportCode || '',
        arrivalAirportCode: s.arrivalAirportCode || '',
        marketingAirlineCode: s.marketingAirlineCode || '',
        marketingFlightNumber: s.marketingFlightNumber || '',
        statusLabel: s.statusLabel,
        segmentTicketStatus: s.segmentTicketStatus,
        hasScheduleChange: s.hasScheduleChange,
        changeType: s.changeType,
      })),
    };
  }
}

function extractOrderDataDetails(data: any, d: ExtractedDetails) {
  if (!data) return;
  // Extract passengers from flightReservation
  const flightItem = data.items?.find((i: any) => i.type === 'Flight');
  if (flightItem?.flightReservation) {
    const fr = flightItem.flightReservation;
    if (fr.passengers) d.passengers = parsePassengers(fr.passengers);
    if (fr.legs) d.legs = parseLegs(fr.legs);
  }
  // Order items
  d.orderItems = (data.items || []).map((i: any) => ({
    name: i.name || '',
    type: i.type || '',
    price: i.price ?? 0,
    currency: i.currencyCode || '',
  }));
}

function extractAncillariesDetails(data: any, entry: FlattenedFareEntry, d: ExtractedDetails) {
  const lines: string[] = [];
  if (entry.ancillarySupport.length) {
    for (const a of entry.ancillarySupport) {
      const supported = [a.seatSupported && 'Seats', a.mealSupported && 'Meals', a.baggageSupported && 'Baggage'].filter(Boolean).join(', ');
      lines.push(`${a.legId}: ${supported || 'None'}`);
    }
  }
  d.summaryLines = lines;
}

function formatPassengerId(id: string): string {
  if (!id) return 'Unknown';
  const parts = id.split(':');
  const raw = parts[0] || '';
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)/g, ' $1').trim();
}

// Keep legacy extractSummary for backward compat
export function extractSummary(entry: FlattenedFareEntry): string[] {
  const details = extractDetails(entry);
  return details.summaryLines || [];
}
